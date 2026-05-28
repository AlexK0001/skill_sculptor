import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();
    
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      name: name || '',
      createdAt: new Date()
    });

    const user = { id: result.insertedId.toString(), email, name };
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
