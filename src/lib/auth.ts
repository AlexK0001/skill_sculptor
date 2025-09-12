// src/lib/auth.ts
import { NextRequest } from 'next/server';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type UserDocument } from '@/lib/types';

export async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization header required' };
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return { error: 'Invalid token' };
    }

    const userId = payload.userId || payload.id;
    if (!userId) return { error: 'Invalid token payload' };

    const users = await getUsersCollection();
    const userDoc = (await users.findOne({ _id: new ObjectId(userId) })) as UserDocument | null;
    if (!userDoc) return { error: 'User not found' };

    return { user: userDocumentToUser(userDoc) };
  } catch (err) {
    console.error('verifyToken error', err);
    return { error: 'Token verification failed' };
  }
}
export default verifyToken;
