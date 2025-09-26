// src/lib/auth.ts - SECURED VERSION
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '@/lib/mongodb';
import { userDocumentToUser, type User, type UserDocument } from '@/lib/types';
import { JWT_SECRET } from '@/lib/constants';
import { isValidObjectId } from '@/lib/validation-utils';
import { APIError, ErrorCode } from '@/lib/error-handler';

export interface AuthResult {
  user: User | null;
  error?: string;
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token from multiple sources
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookie = request.cookies.get("token");
      if (cookie?.value) token = cookie.value;
    }

    if (!token) {
      return { user: null, error: 'Authorization token required' };
    }

    // Verify JWT token with proper error handling
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET!);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return { user: null, error: 'Token has expired' };
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return { user: null, error: 'Invalid token format' };
      }
      return { user: null, error: 'Token verification failed' };
    }

    const userId = payload?.userId || payload?.id;
    if (!userId) {
      return { user: null, error: 'Invalid token payload' };
    }

    // Validate ObjectId format
    if (!isValidObjectId(userId)) {
      return { user: null, error: 'Invalid user ID format' };
    }

    // Get user from database with error handling
    const users = await getUsersCollection();
    const userDoc = (await users.findOne({ 
      _id: new ObjectId(userId) 
    })) as UserDocument | null;

    if (!userDoc) {
      return { user: null, error: 'User not found' };
    }

    // Check if user is still active (optional)
    if (userDoc.isActive === false) {
      return { user: null, error: 'User account is disabled' };
    }

    const user = userDocumentToUser(userDoc);
    return { user, error: undefined };

  } catch (error) {
    console.error('[Auth Error]', error);
    return { user: null, error: 'Authentication service error' };
  }
}

// Enhanced token creation with expiration tracking
export function createAuthToken(userId: string): string {
  if (!isValidObjectId(userId)) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid user ID');
  }

  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000),
      iss: 'skillsculptor'
    },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// Middleware for protecting routes
export function requireAuth() {
  return async (request: NextRequest) => {
    const { user, error } = await verifyToken(request);
    
    if (!user) {
      throw new APIError(
        ErrorCode.AUTHENTICATION_ERROR,
        error || 'Authentication required',
        401
      );
    }
    
    return user;
  };
}