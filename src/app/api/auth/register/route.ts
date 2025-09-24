import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/validation';
import { validateRequest } from '@/lib/api-middleware';
import { getUsersCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST = validateRequest(RegisterSchema)(async (data, req) => {
  try {
    const users = await getUsersCollection();
    
    // Check if user exists
    const existingUser = await users.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(data.password, 12);
    const newUser = {
      ...data,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);
    const createdUser = await users.findOne({ _id: result.insertedId });

    const token = jwt.sign(
      { userId: createdUser!._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ token, user: createdUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});