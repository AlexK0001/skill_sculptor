// src/lib/error-handler.ts - IMPROVED ERROR HANDLING
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any,
    public meta?: any
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  details?: any;
}

export function createErrorResponse(
  error: APIError | Error | string,
  statusCode?: number
): NextResponse<ErrorResponse> {
  let response: ErrorResponse;
  let status: number;

  if (error instanceof APIError) {
    response = {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      details: error.details
    };
    status = error.statusCode;
  } else if (error instanceof ZodError) {
    response = {
      error: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      timestamp: new Date().toISOString(),
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
    status = 400;
  } else {
    const message = typeof error === 'string' ? error : error.message || 'Unknown error';
    response = {
      error: message,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString()
    };
    status = statusCode || 500;
  }

  // Log errors for monitoring
  if (status >= 500) {
    console.error('[API Error]', {
      error: response,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  return NextResponse.json(response, { status });
}

export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Handle specific error types
      if (error instanceof APIError) {
        return createErrorResponse(error);
      }
      
      if (error instanceof ZodError) {
        return createErrorResponse(error);
      }
      
      // Handle MongoDB errors
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 11000) {
          return createErrorResponse(
            new APIError(
              ErrorCode.VALIDATION_ERROR,
              'Resource already exists',
              409,
              error
            )
          );
        }
      }
      
      // Handle AI service errors
      if (error instanceof Error && error.message.includes('AI')) {
        return createErrorResponse(
          new APIError(
            ErrorCode.AI_SERVICE_ERROR,
            'AI service temporarily unavailable',
            503
          )
        );
      }
      
      // Handle rate limit errors
      if (error instanceof Error && error.message.includes('Too many')) {
        return createErrorResponse(
          new APIError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            error.message,
            429
          )
        );
      }
      
      // Unknown error
      console.error('[Unhandled API Error]', error);
      return createErrorResponse(
        new APIError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred',
          500
        )
      );
    }
  };
}