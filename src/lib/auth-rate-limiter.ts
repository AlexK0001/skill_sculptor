
import { NextRequest } from 'next/server';
import { APIError, ErrorCode } from './error-handler';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkAuthRateLimit(identifier: string): void {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const existing = loginAttempts.get(identifier);
  
  if (existing && existing.resetAt > now) {
    if (existing.count >= maxAttempts) {
      throw new APIError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        `Too many login attempts. Try again in ${Math.ceil((existing.resetAt - now) / 60000)} minutes`,
        429
      );
    }
    existing.count++;
  } else {
    loginAttempts.set(identifier, { count: 1, resetAt: now + window });
  }
}

export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}