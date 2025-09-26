// src/lib/validation-utils.ts - SECURITY FIX
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Secure ObjectId validation
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

// Secure ObjectId creation with validation
export function createObjectId(id: string): ObjectId | null {
  if (!isValidObjectId(id)) {
    return null;
  }
  return new ObjectId(id);
}

// Error response utility
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

// Success response utility
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(
    { ...data, timestamp: new Date().toISOString() },
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
export function withRequestValidation(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Basic rate limiting
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const rateLimit = checkRateLimit(ip, 100, 15 * 60 * 1000);
      
      if (!rateLimit.allowed) {
        return createErrorResponse('Too many requests. Please try again later.', 429);
      }
      
      // Add security headers to response
      const response = await handler(request, ...args);
      
      // Security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    } catch (error) {
      console.error('Request validation error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  };
}