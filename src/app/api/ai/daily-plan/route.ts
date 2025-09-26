// src/app/api/ai/daily-plan/route.ts - SECURED WITH RATE LIMITING
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkAIRateLimit } from '@/lib/rate-limiter';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse } from '@/lib/validation-utils';
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan';
import { z } from 'zod';

// Enhanced validation schema
const DailyCheckinSchema = z.object({
  mood: z.string()
    .min(3, 'Mood description too short')
    .max(500, 'Mood description too long')
    .transform(s => s.trim()),
  dailyPlans: z.string()
    .min(5, 'Daily plans description too short')
    .max(1000, 'Daily plans description too long')
    .transform(s => s.trim()),
  learningGoal: z.string()
    .max(200)
    .optional()
    .transform(s => s?.trim()),
  // Optional user profile overrides
  age: z.number().min(13).max(100).optional(),
  gender: z.string().max(50).optional(),
  strengths: z.string().max(500).optional(),
  weaknesses: z.string().max(500).optional(),
  preferences: z.string().max(500).optional()
});

export const POST = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth()(request);
  
  // Check AI rate limit first
  await checkAIRateLimit(user.id, 'daily-plan');
  
  // Validate request body
  const body = await request.json();
  const validatedData = DailyCheckinSchema.parse(body);
  
  try {
    // Generate AI plan with timeout
    const planPromise = suggestLearningPlan({
      name: user.name,
      mood: validatedData.mood,
      dailyPlans: validatedData.dailyPlans,
      learningGoal: validatedData.learningGoal || "General learning",
      age: validatedData.age || 25,
      gender: validatedData.gender || "not specified",
      strengths: validatedData.strengths || "Eager to learn",
      weaknesses: validatedData.weaknesses || "Need more practice",
      preferences: validatedData.preferences || "Interactive learning"
    });
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 30000)
    );
    
    const plan = await Promise.race([planPromise, timeoutPromise]);
    
    // Validate AI response
    if (!plan || !plan.learningPlan || !Array.isArray(plan.learningPlan)) {
      throw new APIError(
        ErrorCode.AI_SERVICE_ERROR,
        'Invalid AI response format',
        500
      );
    }
    
    // Sanitize AI response (prevent potential XSS)
    const sanitizedPlan = {
      learningPlan: plan.learningPlan
        .filter(task => typeof task === 'string' && task.length > 0)
        .slice(0, 10) // Limit number of tasks
        .map(task => task.trim().substring(0, 200)) // Limit task length
    };
    
    return createSuccessResponse({ 
      plan: sanitizedPlan,
      generatedAt: new Date().toISOString(),
      rateLimitRemaining: await getRemainingAIRequests(user.id, 'daily-plan')
    });
    
  } catch (error: any) {
    // Handle specific AI errors
    if (error.message?.includes('timeout')) {
      throw new APIError(
        ErrorCode.AI_SERVICE_ERROR,
        'AI service is taking too long to respond. Please try again.',
        408
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new APIError(
        ErrorCode.AI_SERVICE_ERROR,
        'AI service is temporarily unavailable due to quota limits.',
        503
      );
    }
    
    // Re-throw known errors
    if (error instanceof APIError) {
      throw error;
    }
    
    // Unknown AI error
    console.error('[AI Service Error]', error);
    throw new APIError(
      ErrorCode.AI_SERVICE_ERROR,
      'AI service encountered an error. Please try again later.',
      500
    );
  }
}));

// Helper function to get remaining AI requests
async function getRemainingAIRequests(userId: string, endpoint: string): Promise<number> {
  try {
    const { getRateLimitStatus } = await import('@/lib/rate-limiter');
    const status = getRateLimitStatus(userId, endpoint);
    return status.remaining;
  } catch {
    return 0;
  }
}