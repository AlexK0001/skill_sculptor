// src/lib/validation-utils.ts - VALIDATION UTILITIES
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string | undefined): string | undefined {
  if (input === undefined || input === null) return undefined;
  if (input.trim() === '') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate MongoDB ObjectId format (24 hex characters)
 */
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create standardized error response
 */
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
export function handleZodError(error: z.ZodError): NextResponse {
  const errors = error.issues.map((err) => ({
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

/**
 * Wrapper for request validation with error handling
 */
export function withRequestValidation(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error);
      }
      throw error;
    }
  };
}