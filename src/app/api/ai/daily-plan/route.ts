import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';
// Переконайся, що шлях імпорту правильний до потрібної функції
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan'; 

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Фоллбек плани, якщо AI довго відповідає
const FALLBACK_PLANS: Record<string, string[]> = {
  motivated: [
    'Почніть з 25-хвилинної сесії сфокусованого навчання (Pomodoro)',
    'Зробіть конспект ключових моментів для запам\'ятовування',
    'Застосуйте вивчене на практиці (напишіть код / вирішіть задачу)'
  ],
  tired: [
    'Почніть з легкого читання або перегляду відео на тему',
    'Робіть перерви кожні 15 хвилин',
    'Сфокусуйтеся на повторенні вже пройденого матеріалу'
  ],
  default: [
    'Повторіть попередній матеріал',
    'Виконайте практичні завдання',
    'Проаналізуйте свій прогрес'
  ],
};

async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { mood, dailyPlans, learningGoal, preferences, strengths, weaknesses, age, gender } = body;

    if (!mood || !dailyPlans) {
      return NextResponse.json({ error: 'Mood and daily plans are required' }, { status: 400 });
    }

    let aiPlan: string[];

    try {
      console.log('[API] Запит до Genkit / Gemini...');
      
      const aiResponse = (await Promise.race([
        suggestLearningPlan({
          name: decoded.name || 'Student',
          gender: gender || 'unknown',
          age: age || 25,
          preferences: preferences || 'focused',
          strengths: strengths || 'none',
          weaknesses: weaknesses || 'none',
          learningGoal: learningGoal || 'General Improvement',
          mood,
          dailyPlans
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 8000))
      ])) as { learningPlan: string[] };
      
      aiPlan = aiResponse.learningPlan;
      console.log('[API] AI успішно згенерував план');
      
    } catch (err: unknown) {
      const aiError = err as Error;
      console.error('[API] AI помилка або таймаут, fallback:', aiError.message);
      const normalizedMood = mood.toLowerCase().trim();
      aiPlan = FALLBACK_PLANS[normalizedMood] || FALLBACK_PLANS.default;
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          learningPlan: aiPlan,
        },
        generatedAt: new Date().toISOString(),
        isFallback: !Array.isArray(aiPlan) || aiPlan === FALLBACK_PLANS[mood]
      },
    });

  } catch (error: unknown) {
    const apiError = error as Error;
    console.error('[API] Критична помилка у daily-plan route:', apiError.message);
    return NextResponse.json(
      { error: 'Failed to generate plan', details: apiError.message },
      { status: 500 }
    );
  }
}