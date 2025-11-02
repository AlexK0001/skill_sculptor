// src/app/api/ai/daily-plan/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '@/lib/mongodb';
import { JWT_SECRET } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fallback plans (when AI fails)
const FALLBACK_PLANS: Record<string, string[]> = {
  motivated: [
    'Start with a 25-minute focused learning session',
    'Take notes on key concepts you discover',
    'Practice what you learned with a small project',
    'Review and organize your notes',
    'Set specific goals for tomorrow',
  ],
  tired: [
    'Begin with light reading or watching tutorial videos',
    'Take frequent 5-minute breaks',
    'Focus on review rather than new material',
    'Do some hands-on practice to stay engaged',
    'End early and rest well',
  ],
  curious: [
    'Explore new topics related to your learning goal',
    'Watch an inspiring talk or documentary',
    'Join an online discussion or forum',
    'Experiment with new tools or techniques',
    'Document interesting discoveries',
  ],
  default: [
    'Review previous learning materials',
    'Work on practical exercises',
    'Watch educational content',
    'Practice core concepts',
    'Reflect on your progress',
  ],
};

// Helper function to get token from cookies or headers
async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie (for Google OAuth)
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  if (tokenCookie?.value) {
    return tokenCookie.value;
  }

  return null;
}

// Helper function to verify user from token
async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Get fallback plan based on mood
function getFallbackPlan(mood: string): string[] {
  const normalizedMood = mood.toLowerCase().trim();
  
  // Try exact match
  if (FALLBACK_PLANS[normalizedMood]) {
    return FALLBACK_PLANS[normalizedMood];
  }
  
  // Try partial match
  for (const [key, plan] of Object.entries(FALLBACK_PLANS)) {
    if (normalizedMood.includes(key) || key.includes(normalizedMood)) {
      return plan;
    }
  }
  
  // Default fallback
  return FALLBACK_PLANS.default;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Daily plan generation started');

    // Get and verify token
    const token = await getAuthToken(request);
    if (!token) {
      console.error('[API] No authentication token');
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Verify user
    let user;
    try {
      user = await getUserFromToken(token);
      console.log('[API] User authenticated:', user.email);
    } catch (error: any) {
      console.error('[API] Authentication failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[API] Request body received:', {
        mood: body.mood,
        dailyPlans: body.dailyPlans?.substring(0, 50),
      });
    } catch (error) {
      console.error('[API] Invalid JSON body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { mood, dailyPlans, learningGoal } = body;

    // Validate required fields
    if (!mood || !dailyPlans) {
      console.error('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Mood and daily plans are required' },
        { status: 400 }
      );
    }

    // For now, always use fallback plans (AI integration can be added later)
    console.log('[API] Generating fallback plan for mood:', mood);
    const plan = getFallbackPlan(mood);

    console.log('[API] Plan generated successfully:', plan.length, 'tasks');

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        plan: {
          learningPlan: plan,
        },
        generatedAt: new Date().toISOString(),
        fallback: true,
        message: 'Using curated learning plan',
      },
    });

  } catch (error: any) {
    console.error('[API] Unexpected error:', error.message);
    console.error('[API] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate plan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}