// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { createSuccessResponse } from '@/lib/validation-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Clear JWT cookie
  const response = createSuccessResponse({ message: 'Logged out successfully' });
  
  // Remove token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Clear OAuth state if exists
  response.cookies.set('oauth_state', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
});

// Support GET for convenience
export const GET = POST;