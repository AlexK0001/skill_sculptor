import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkAIRateLimit } from '@/lib/rate-limiter';
import { withErrorHandler } from '@/lib/error-handler';
import { DailyCheckinSchema } from '@/lib/validation';
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan';
import { APIError, ErrorCode } from '@/lib/error-handler';

// Тип для відповіді з AI
interface LearningPlanResponse {
  learningPlan: string[];
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Перевірка токена
  const { user, error } = await verifyToken(request);
  if (error || !user) {
    throw new APIError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401);
  }

  // Ліміт на AI-запити
  await checkAIRateLimit(user.id, 'daily-plan');

  // Валідація даних
  const body = await request.json();
  const validatedData = DailyCheckinSchema.parse(body);

  // Отримання плану
  const plan: LearningPlanResponse = await suggestLearningPlan({
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
  });

  // Перевірка коректності відповіді
  if (!plan || !plan.learningPlan || !Array.isArray(plan.learningPlan)) {
    return NextResponse.json({ error: "Invalid plan response" }, { status: 500 });
  }

  // Повертаємо результат з обмеженням довжини завдань
  return NextResponse.json({
    success: true,
    learningPlan: plan.learningPlan
      .filter((task: string) => typeof task === 'string' && task.length > 0)
      .map((task: string) => task.trim().substring(0, 200))
  });
});
