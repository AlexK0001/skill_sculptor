import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';
// TODO: Перевірте чи вірний у вас шлях до функції suggestLearningPlan
import { suggestLearningPlan } from '@/ai/flows/suggest-learning-plan'; 

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Фоллбек плани, якщо AI не відповідає (зменшуємо залежність від 100% аптайму AI)
const FALLBACK_PLANS: Record<string, string[]> = {
  motivated: [
    'Start with a 25-minute focused learning session',
    'Take notes on key concepts you discover',
    'Practice what you learned with a small project',
    'Review and organize your notes'
  ],
  tired: [
    'Begin with light reading or watching tutorial videos',
    'Take frequent 5-minute breaks',
    'Focus on review rather than new material'
  ],
  default: [
    'Review previous learning materials',
    'Work on practical exercises',
    'Reflect on your progress'
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

    // Валідація токену та ідентифікація юзера
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET!) as { userId: string, name?: string };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { mood, dailyPlans, learningGoal, preferences, strengths, weaknesses, age, gender } = body;

    if (!mood || !dailyPlans) {
      return NextResponse.json({ error: 'Mood and daily plans are required' }, { status: 400 });
    }

    let aiPlan;

    try {
      console.log('[API] Запит до Genkit / Gemini...');
      
      // Додаємо Timeout (через Promise.race). 
      // Vercel може обірвати запит, якщо AI думає довше 10с. Тому ми вручну даємо йому 8с.
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
      ])) as any;
      
      aiPlan = aiResponse.learningPlan;
      console.log('[API] AI успішно згенерував план');
      
    } catch (err: unknown) {
      const aiError = err as Error;
      console.error('[API] AI помилка або таймаут, використовуємо Fallback:', aiError.message);
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

  } catch (error: any) {
    console.error('[API] Критична помилка у daily-plan route:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate plan', details: error.message },
      { status: 500 }
    );
  }
}