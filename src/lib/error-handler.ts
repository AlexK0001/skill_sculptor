import { NextResponse } from 'next/server';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVER_ERROR = "SERVER_ERROR",
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details })
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // MongoDB errors
    if (error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database operation failed', code: ErrorCode.DATABASE_ERROR },
        { status: 500 }
      );
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: ErrorCode.UNAUTHORIZED },
        { status: 401 }
      );
    }
  }

  // Generic error
  return NextResponse.json(
    { error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR },
    { status: 500 }
  );
}

export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof APIError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status,
        });
      }
      console.error(error);
      return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
}