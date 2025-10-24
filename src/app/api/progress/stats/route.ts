// src/app/api/progress/stats/route.ts - Progress statistics
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse } from '@/lib/validation-utils';
import type { UserProgress, DayProgress, ProgressStats } from '@/lib/types-progress';
import { startOfWeek, format, subWeeks } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/progress/stats - Get progress statistics
export const GET = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()(request);
  
  const db = await getDatabase();
  const progressCollection = db.collection<UserProgress>('user_progress');
  
  const userProgress = await progressCollection.findOne({ 
    userId: new ObjectId(user.id) 
  });
  
  if (!userProgress || !userProgress.days) {
    return createSuccessResponse({ 
      stats: {
        totalDays: 0,
        completedDays: 0,
        partialDays: 0,
        missedDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageCompletion: 0,
        weeklyData: [],
      } as ProgressStats
    });
  }
  
  const daysMap = userProgress.days as Record<string, DayProgress>;
  const days = Object.values(daysMap);
  
  // Calculate basic stats
  const completedDays = days.filter(d => d.status === 'completed').length;
  const partialDays = days.filter(d => d.status === 'partial').length;
  const missedDays = days.filter(d => d.status === 'missed').length;
  
  const totalCompletion = days.reduce((sum, d) => sum + d.completionRate, 0);
  const averageCompletion = days.length > 0 ? Math.round(totalCompletion / days.length) : 0;
  
  // Calculate weekly data for last 5 weeks
  const weeklyData = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekLabel = format(weekStart, 'MMM d');
    
    const weekDays = days.filter(d => {
      const dayDate = new Date(d.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return dayDate >= weekStart && dayDate < weekEnd;
    });
    
    const completed = weekDays.filter(d => d.status === 'completed').length;
    
    weeklyData.unshift({
      week: weekLabel,
      completed,
    });
  }
  
  const stats: ProgressStats = {
    totalDays: days.length,
    completedDays,
    partialDays,
    missedDays,
    currentStreak: userProgress.currentStreak || 0,
    longestStreak: userProgress.longestStreak || 0,
    averageCompletion,
    weeklyData,
  };
  
  return createSuccessResponse({ stats });
}));