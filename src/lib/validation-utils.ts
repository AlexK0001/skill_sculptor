// src/lib/validation-utils.ts - SECURITY FIX
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Secure ObjectId validation
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Secure ObjectId creation with validation
export function createObjectId(id: string): ObjectId | null {
  if (!isValidObjectId(id)) {
    return null;
  }
  return new ObjectId(id);
}

// Error response utility
export function createErrorResponse(
  message: string,
  status = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  );
}

// Success response utility
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// Input sanitization
export function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input.trim().replace(/[<>]/g, ''); // Basic XSS protection
}

// Rate limiting storage (in-memory for now, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime
  };
}

// Request validation middleware
export function withRequestValidation(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }
      throw error;
    }
  };
}