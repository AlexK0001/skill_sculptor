import { NextRequest, NextResponse } from 'next/server';
import { getSkillsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/constants';

function getUserId(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const skillsCollection = await getSkillsCollection();
    const skills = await skillsCollection.find({ userId: new ObjectId(userId) }).toArray();
    return NextResponse.json(skills);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, category, level } = body;
  
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  try {
    const skillsCollection = await getSkillsCollection();
    const result = await skillsCollection.insertOne({
      userId: new ObjectId(userId),
      name,
      description: description || '',
      category: category || '',
      level: level || 'Новачок (0-6міс)',
      progress: 0,
      createdAt: new Date()
    });
    
    return NextResponse.json({ id: result.insertedId.toString(), name, description, category, level, progress: 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
