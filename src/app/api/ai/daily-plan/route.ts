// src/app/api/ai/daily-plan/route.ts - OPTIMIZED WITH CACHE
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkAIRateLimit, getRateLimitStatusAsync } from '@/lib/rate-limiter';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse } from '@/lib/validation-utils';
import { DailyCheckinSchema } from '@/lib/validation';
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan';
import { getFromCache, saveToCache } from '@/lib/ai-cache';

export const POST = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth()(request);
  
  // Validate request body
  const body = await request.json();
  const validatedData = DailyCheckinSchema.parse(body);
  
  // Create cache key input (normalized)
  const cacheInput = {
    mood: validatedData.mood.toLowerCase().trim(),
    dailyPlans: validatedData.dailyPlans.toLowerCase().trim(),
    learningGoal: (validatedData.learningGoal || "").toLowerCase().trim(),
    // Don't include personal data in cache key to enable cross-user cache hits
  };
  
  // Check cache first
  const cachedPlan = getFromCache<{ learningPlan: string[] }>('daily-plan', cacheInput);
  
  if (cachedPlan) {
    console.log('[AI] Using cached plan - no API call made');
    const rateStatus = await getRateLimitStatusAsync(user.id, 'daily-plan');
    
    return createSuccessResponse({ 
      plan: cachedPlan,
      generatedAt: new Date().toISOString(),
      rateLimitRemaining: rateStatus.remaining,
      cached: true
    });
  }
  
  // Not in cache - check rate limit
  await checkAIRateLimit(user.id, 'daily-plan');
  
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
    
    // Sanitize AI response
    const sanitizedPlan = {
      learningPlan: plan.learningPlan
        .filter(task => typeof task === 'string' && task.length > 0)
        .slice(0, 10)
        .map(task => task.trim().substring(0, 200))
    };
    
    // Save to cache
    saveToCache('daily-plan', cacheInput, sanitizedPlan);
    
    // Get remaining rate limit
    const rateStatus = await getRateLimitStatusAsync(user.id, 'daily-plan');
    
    console.log('[AI] Generated new plan - API call made');
    
    return createSuccessResponse({ 
      plan: sanitizedPlan,
      generatedAt: new Date().toISOString(),
      rateLimitRemaining: rateStatus.remaining,
      cached: false
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