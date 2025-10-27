// src/app/api/progress/route.ts - Progress tracking API
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse } from '@/lib/validation-utils';
import type { UserProgress, DayProgress, UpdateProgressRequest, ProgressStats } from '@/lib/types-progress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Calculate day status based on completion rate
function calculateDayStatus(completionRate: number): 'completed' | 'partial' | 'missed' | 'pending' {
  if (completionRate === 100) return 'completed';
  if (completionRate > 0) return 'partial';
  if (completionRate === 0) return 'missed';
  return 'pending';
}

// Calculate completion rate
function calculateCompletionRate(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

// GET /api/progress - Get user's progress
export const GET = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()(request);
  
  const db = await getDatabase();
  const progressCollection = db.collection<UserProgress>('user_progress');
  
  let userProgress = await progressCollection.findOne({ 
    userId: new ObjectId(user.id) 
  });
  
  // Create initial progress if doesn't exist
  if (!userProgress) {
    const newProgress: Omit<UserProgress, '_id'> = {
      userId: new ObjectId(user.id),
      days: {}, // CHANGED: empty object instead of array
      lastCheckinDate: '',
      totalCompletedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await progressCollection.insertOne(newProgress as any);
    userProgress = await progressCollection.findOne({ _id: result.insertedId });
  }
  
  return createSuccessResponse({ progress: userProgress });
}));

// POST /api/progress - Update day progress
export const POST = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()(request);
  const body: UpdateProgressRequest = await request.json();
  
  const { date, tasks, mood, dailyPlans } = body;
  
  if (!date || !tasks) {
    return NextResponse.json(
      { error: 'Date and tasks are required' },
      { status: 400 }
    );
  }
  
  const db = await getDatabase();
  const progressCollection = db.collection<UserProgress>('user_progress');
  
  // Calculate metrics
  const completionRate = calculateCompletionRate(tasks);
  const status = calculateDayStatus(completionRate);
  
  const dayProgress: DayProgress = {
    date,
    tasks,
    mood,
    dailyPlans,
    completionRate,
    status,
  };
  
  // Update or create progress
  const result = await progressCollection.findOneAndUpdate(
    { userId: new ObjectId(user.id) },
    {
      $set: {
        [`days.${date}`]: dayProgress,
        lastCheckinDate: date,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId: new ObjectId(user.id),
        totalCompletedDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date(),
      },
    },
    { 
      upsert: true, 
      returnDocument: 'after',
      projection: { days: 1, lastCheckinDate: 1 }
    }
  );
  
  // Recalculate streaks
  await recalculateStreaks(progressCollection, new ObjectId(user.id));
  
  return createSuccessResponse({ 
    message: 'Progress updated',
    dayProgress 
  });
}));

// Helper: Recalculate streaks
async function recalculateStreaks(collection: any, userId: ObjectId) {
  const progress = await collection.findOne({ userId });
  if (!progress || !progress.days) return;
  
  const daysMap = progress.days; // Already Record<string, DayProgress>
  const sortedDates = Object.keys(daysMap).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalCompleted = 0;
  
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const day = daysMap[date];
    
    if (day.status === 'completed') {
      tempStreak++;
      totalCompleted++;
      
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      
      // Check if this is current streak (up to today)
      if (date === today || i === sortedDates.length - 1) {
        currentStreak = tempStreak;
      }
    } else if (day.status === 'missed') {
      tempStreak = 0;
    }
  }
  
  await collection.updateOne(
    { userId },
    {
      $set: {
        currentStreak,
        longestStreak,
        totalCompletedDays: totalCompleted,
      },
    }
  );
}