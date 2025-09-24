import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/validation';
import { validateRequest } from '@/lib/api-middleware';
import { getUsersCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const users = await getUsersCollection();
    const existingUser = await users.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const newUser = { ...data, passwordHash, createdAt: new Date(), updatedAt: new Date() };
    const result = await users.insertOne(newUser);
    const createdUser = await users.findOne({ _id: result.insertedId });

    const token = jwt.sign({ userId: createdUser!._id.toString() }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return NextResponse.json({ token, user: createdUser }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};