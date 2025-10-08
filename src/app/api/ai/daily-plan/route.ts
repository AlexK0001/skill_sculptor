// src/app/api/ai/daily-plan/route.ts - WITH FALLBACK SUPPORT
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkAIRateLimit, getRateLimitStatusAsync } from '@/lib/rate-limiter';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse } from '@/lib/validation-utils';
import { DailyCheckinSchema } from '@/lib/validation';
import { suggestLearningPlan, type SuggestLearningPlanOutput } from '@/ai/flows/suggest-learning-plan';
import { getFromCache, saveToCache } from '@/lib/ai-cache';
import { getFallbackPlan, isQuotaError } from '@/lib/ai-fallback-templates';

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
  };

  // Check cache first
  const cachedPlan = getFromCache<SuggestLearningPlanOutput>('daily-plan', cacheInput);
  if (cachedPlan) {
    console.log('[AI] Using cached plan - no API call made');
    const rateStatus = await getRateLimitStatusAsync(user.id, 'daily-plan');
    return createSuccessResponse({
      plan: cachedPlan,
      generatedAt: new Date().toISOString(),
      rateLimitRemaining: rateStatus.remaining,
      cached: true,
      fallback: false
    });
  }

  // Not in cache - check rate limit
  await checkAIRateLimit(user.id, 'daily-plan');

  // Try AI generation with fallback support
  let plan: SuggestLearningPlanOutput;
  let usedFallback = false;

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
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 30000)
    );

    plan = await Promise.race([planPromise, timeoutPromise]);

    // Validate AI response
    if (!plan || !plan.learningPlan || !Array.isArray(plan.learningPlan)) {
      throw new Error('Invalid AI response format');
    }

    // Sanitize AI response
    plan = {
      learningPlan: plan.learningPlan
        .filter((task: string) => typeof task === 'string' && task.length > 0)
        .slice(0, 10)
        .map((task: string) => task.trim().substring(0, 200))
    };

    console.log('[AI] Generated new plan - API call made');

  } catch (error: any) {
    console.warn('[AI] Primary generation failed, using fallback:', error.message);

    // Check if it's a quota error (don't retry)
    if (isQuotaError(error)) {
      console.error('[AI] QUOTA EXCEEDED - Using fallback templates');
    }

    // Use fallback template
    const fallbackTasks = getFallbackPlan(
      validatedData.mood,
      validatedData.learningGoal || "General learning"
    );

    plan = {
      learningPlan: fallbackTasks
    };

    usedFallback = true;
  }

  // Save to cache (even fallback plans to reduce load)
  saveToCache('daily-plan', cacheInput, plan);

  // Get remaining rate limit
  const rateStatus = await getRateLimitStatusAsync(user.id, 'daily-plan');

  return createSuccessResponse({
    plan: plan,
    generatedAt: new Date().toISOString(),
    rateLimitRemaining: rateStatus.remaining,
    cached: false,
    fallback: usedFallback,
    ...(usedFallback && {
      message: 'Using curated learning plan. AI service will be available soon.'
    })
  });
}));