import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type LoginRequest, type AuthResponse, type UserDocument } from '@/lib/types';
import { JWT_SECRET } from '@/lib/constants';
import { checkAuthRateLimit, getClientIP } from '@/lib/auth-rate-limiter';

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  checkAuthRateLimit(clientIP);
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
    const userDoc = (await usersCollection.findOne({ email })) as UserDocument | null;
      
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

    const userId = userDoc._id ? userDoc._id.toString() : null;
      if (!userId) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 500 });
      }

    // Create JWT token
    const token = jwt.sign(
      { userId: userId.toString() },
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