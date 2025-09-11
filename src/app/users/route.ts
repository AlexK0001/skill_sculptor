import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type UserDocument } from '@/lib/types';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/users - Create new user (Registration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user document
    const userDoc: UserDocument = {
      email,
      name,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(userDoc);
    
    // Get created user
    const createdUser = await usersCollection.findOne({ _id: result.insertedId });
    if (!createdUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: createdUser._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = userDocumentToUser(createdUser);

    return NextResponse.json({
      token,
      user,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}