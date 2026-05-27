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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const skillsCollection = await getSkillsCollection();
    const skill = await skillsCollection.findOne({ _id: new ObjectId(params.id), userId: new ObjectId(userId) });
    if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(skill);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}