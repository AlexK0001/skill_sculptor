import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { suggestFullLearningPlan } from '@/ai/flows/suggest-full-learning-plan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value || null;
    }
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    body = await request.json();
    const { name, level, durationMonths = 3 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Skill name required' }, { status: 400 });
    }

    console.log('[API] Zapyt do Genkit / Gemini (Full Plan)...');
    
    const aiResponse = (await Promise.race([
      suggestFullLearningPlan({
        topic: name,
        level: level || 'Спеціаліст',
        durationMonths: Number(durationMonths) || 3
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 25000))
    ])) as any;

    if (!aiResponse || !aiResponse.plan) {
      throw new Error('Invalid AI response structure');
    }

    return NextResponse.json({ success: true, plan: aiResponse.plan, durationMonths });
  } catch (error: any) {
    console.error('[API] Помилка у full-plan route:', error.message);
    
    // Fallback if AI fails
    const fallbackSteps = [
      {
        phase: 'Фаза 1: Основи',
        items: [
          { title: 'Вивчення базових концепцій (Fallback)', link: `https://www.google.com/search?q=${encodeURIComponent(body.name || 'Основи')}+basics` }
        ]
      }
    ];

    return NextResponse.json({ success: true, plan: fallbackSteps, durationMonths: body.durationMonths || 3, isFallback: true });
  }
}