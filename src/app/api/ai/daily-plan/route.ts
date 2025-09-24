import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkAIRateLimit } from '@/lib/rate-limiter';
import { withErrorHandler } from '@/lib/error-handler';
import { DailyCheckinSchema } from '@/lib/validation';
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify authentication
  const { user, error } = await verifyToken(request);
  if (error || !user) {
    throw new APIError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401);
  }

  // Check rate limit
  await checkAIRateLimit(user.id, 'daily-plan');

  // Validate request
  const body = await request.json();
  const validatedData = DailyCheckinSchema.parse(body);

  // Generate AI plan
  const plan = await suggestLearningPlan({
    ...validatedData,
    name: user.name,
    // Get user profile data from database
  });

  return NextResponse.json({ success: true, plan });
});