import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest, handler: (data: T, req: NextRequest) => Promise<NextResponse>) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(validatedData, req);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 });
      }
      
      console.error('Request validation error:', error);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
  };
}