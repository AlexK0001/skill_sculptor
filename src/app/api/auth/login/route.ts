import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  name: string;
  skills?: Skill[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  progress: number;
  userId: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Тут має бути логіка перевірки користувача в базі даних
    // Для прикладу використовуємо mock дані
    if (email === 'test@example.com' && password === 'password') {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return NextResponse.json({ token, user });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Експорт всіх типів для використання в компонентах
// export type { User, Skill, AuthResponse };