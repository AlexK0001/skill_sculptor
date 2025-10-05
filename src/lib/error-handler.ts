// src/lib/error-handler.ts - IMPROVED ERROR HANDLING
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_SERVER_ERROR'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
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
      details: error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
    status = 400;
  } else {
    const message = typeof error === 'string' ? error : error.message || 'Unknown error';
    response = {
      error: message,
      code: ErrorCode.INTERNAL_ERROR,
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

// Safe error messages for production
const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Invalid request data',
  [ErrorCode.AUTHENTICATION_ERROR]: 'Authentication failed',
  [ErrorCode.AUTHORIZATION_ERROR]: 'Access denied',
  [ErrorCode.DATABASE_ERROR]: 'Service temporarily unavailable',
  [ErrorCode.AI_SERVICE_ERROR]: 'AI service unavailable',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
};

export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Log full error in development and production (for monitoring)
      console.error('[API Error]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      if (error instanceof APIError) {
        // Production: use safe generic messages
        const clientMessage = isDevelopment 
          ? error.message 
          : SAFE_ERROR_MESSAGES[error.code];

        return NextResponse.json(
          {
            success: false,
            error: clientMessage,
            code: error.code,
            // Only include details in development
            ...(isDevelopment && error.details && { details: error.details }),
          },
          { status: error.statusCode }
        );
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
      
      // Unknown errors - never expose to client
      return NextResponse.json(
        {
          success: false,
          error: isDevelopment 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Internal server error',
          code: ErrorCode.INTERNAL_ERROR,
        },
        { status: 500 }
      );
    }
  };
}