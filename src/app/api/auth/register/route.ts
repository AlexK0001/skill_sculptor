import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/validation';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type UserDocument } from '@/lib/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    const users = await getUsersCollection();
    
    // Check if user exists
    const existingUser = await users.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    const newUserDoc: Omit<UserDocument, '_id'> = {
      email: validatedData.email,
      name: validatedData.name,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUserDoc);
    const createdUser = await users.findOne({ _id: result.insertedId }) as UserDocument;

    const token = jwt.sign(
      { userId: createdUser._id!.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = userDocumentToUser(createdUser);
    return NextResponse.json({ token, user }, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}