import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/mongodb';
import { JWT_SECRET} from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Store learning plan data in database (you might want to create a separate collection)
    const db = await getDatabase();
    const learningPlansCollection = db.collection('learning_plans');
    
    const learningPlan = {
      userId: decoded.userId,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await learningPlansCollection.insertOne(learningPlan);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...learningPlan,
    });

  } catch (error) {
    console.error('Error saving learning plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/learning-plans - Get user's learning plans
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const learningPlansCollection = db.collection('learning_plans');
    
    const plans = await learningPlansCollection
      .find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(plans);

  } catch (error) {
    console.error('Error fetching learning plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}