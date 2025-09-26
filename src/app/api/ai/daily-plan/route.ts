// src/app/api/ai/daily-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { checkAIRateLimit, getRateLimitStatus } from "@/lib/rate-limiter";
import { withErrorHandler, APIError, ErrorCode } from "@/lib/error-handler";
import { DailyCheckinSchema } from "@/lib/validation";
import { suggestLearningPlan } from "@/ai/flows/suggest-learning-plan";

/**
 * POST /api/ai/daily-plan
 * Body: validated by DailyCheckinSchema
 * Returns: { success: true, learningPlan: string[], generatedAt, rateLimitRemaining }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify token -> get user
  const { user, error } = await verifyToken(request);
  if (error || !user) {
    throw new APIError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  // Rate limit check for AI endpoints
  await checkAIRateLimit(user.id, "daily-plan");

  // Validate request body
  const body = await request.json();
  const validatedData = DailyCheckinSchema.parse(body);

  // Build AI input
  const aiInput = {
    name: user.name || "",
    mood: validatedData.mood,
    dailyPlans: validatedData.dailyPlans,
    learningGoal: (validatedData as any).learningGoal ?? "",
    age: (validatedData as any).age ?? 0,
    gender: (validatedData as any).gender ?? "",
    strengths: (validatedData as any).strengths ?? "",
    weaknesses: (validatedData as any).weaknesses ?? "",
    preferences: (validatedData as any).preferences ?? "",
  };

  // Call AI with a timeout guard
  const planPromise = suggestLearningPlan(aiInput);
  const timeoutMs = 30_000;
  const timeoutPromise = new Promise<null>((res) =>
    setTimeout(() => res(null), timeoutMs)
  );

  const planAny = (await Promise.race([planPromise, timeoutPromise])) as any;

  // Validate shape
  if (!planAny || !Array.isArray(planAny.learningPlan)) {
    throw new APIError(
      ErrorCode.AI_SERVICE_ERROR,
      "Invalid AI response format",
      500
    );
  }

  // Sanitize: keep only meaningful short strings
  const cleanPlan: string[] = planAny.learningPlan
    .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
    .slice(0, 10)
    .map((t: string) => t.trim().substring(0, 200));

  // Provide rate limit remaining info (helper from rate-limiter)
  const rateStatus = await getRateLimitStatus(user.id, "daily-plan");

  return NextResponse.json({
    success: true,
    learningPlan: cleanPlan,
    generatedAt: new Date().toISOString(),
    rateLimitRemaining: rateStatus?.remaining ?? 0,
  });
});
