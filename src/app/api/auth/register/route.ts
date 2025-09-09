import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type RegisterRequest, type AuthResponse, type UserDocument } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password }: RegisterRequest = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const users = await getUsersCollection();
    
    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUserDoc: Omit<UserDocument, '_id'> = {
      email,
      name,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUserDoc);
    const createdUserDoc = await users.findOne({ _id: result.insertedId }) as UserDocument;

    const user = userDocumentToUser(createdUserDoc);
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { token, user };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}