import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const userData = { id: user._id.toString(), email: user.email, name: user.name };
    const token = jwt.sign({ userId: userData.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
