import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, level } = body;

    // Hardcode a full plan since we want a fast full plan. 
    // Usually we would hit an AI flow here.
    const steps = [
      {
        phase: 'Фаза 1: Основи',
        items: [
          { title: 'Вивчення базових концепцій', link: 'https://youtube.com' },
          { title: 'Розуміння термінології', link: 'https://wikipedia.org' }
        ]
      },
      {
        phase: 'Фаза 2: Практика',
        items: [
          { title: 'Створення першого тестового проекту', link: 'https://github.com' },
          { title: 'Повторення пройденого', link: 'https://notion.so' }
        ]
      },
      {
        phase: 'Фаза 3: Просунутий рівень',
        items: [
          { title: 'Вивчення складних паттернів', link: 'https://medium.com' },
          { title: 'Оптимізація та рефакторинг', link: 'https://youtube.com' }
        ]
      }
    ];

    return NextResponse.json({ success: true, plan: steps });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate plan', details: error.message },
      { status: 500 }
    );
  }
}
