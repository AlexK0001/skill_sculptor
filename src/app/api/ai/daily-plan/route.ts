import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkAIRateLimit } from '@/lib/rate-limiter';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { DailyCheckinSchema } from '@/lib/validation';
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan';

type DailyCheckinData = {
  mood: string;
  dailyPlans: string;
  learningGoal?: string;
  age?: number;
  gender?: string;
  strengths?: string;
  weaknesses?: string;
  preferences?: string;
};

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify authentication
  const { user, error } = await verifyToken(request);
  if (error || !user) {
    throw new APIError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401);
  }

  // Check rate limit
  await checkAIRateLimit(user.id, 'daily-plan');

  // Validate request
  const body = (await request.json()) as DailyCheckinData;
  
  const validatedData = DailyCheckinSchema.parse(body) as DailyCheckinData;
  
  // Generate AI plan
  const plan = await suggestLearningPlan({
    ...validatedData,
    name: user.name,
    mood: validatedData.mood,
    dailyPlans: validatedData.dailyPlans,
    learningGoal: validatedData.learningGoal || "",
    age: validatedData.age || 0,
    gender: validatedData.gender || "",
    strengths: validatedData.strengths || "",
    weaknesses: validatedData.weaknesses || "",
    preferences: validatedData.preferences || ""
    // Get user profile data from database
  });

  return NextResponse.json({ success: true, plan });
});