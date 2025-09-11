import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type LoginRequest, type AuthResponse, type UserDocument } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();
    
    // Find user by email
    const userDoc = await usersCollection.findOne({ email });
    if (!userDoc) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: userDoc._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = userDocumentToUser(userDoc);

    return NextResponse.json({
      token,
      user,
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}