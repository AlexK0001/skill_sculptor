import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill, type CreateSkillRequest, type SkillDocument } from '@/lib/types';
import { verifyToken } from '@/lib/auth';

// Calculate skill level based on progress
function calculateSkillLevel(progress: number): number {
  if (progress >= 90) return 10;
  if (progress >= 80) return 9;
  if (progress >= 70) return 8;
  if (progress >= 60) return 7;
  if (progress >= 50) return 6;
  if (progress >= 40) return 5;
  if (progress >= 30) return 4;
  if (progress >= 20) return 3;
  if (progress >= 10) return 2;
  return 1;
}

// GET /api/skills - Get all skills for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyToken(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const skills = await getSkillsCollection();
    const userSkills = await skills
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray() as SkillDocument[];

    const skillsResponse = userSkills.map(skillDocumentToSkill);
    return NextResponse.json({ skills: skillsResponse });
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create new skill
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifyToken(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { name, description, category, progress = 0 }: CreateSkillRequest = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    const skills = await getSkillsCollection();
    
    // Check if user already has a skill with this name
    const existingSkill = await skills.findOne({
      userId: new ObjectId(user.id),
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: 'You already have a skill with this name' },
        { status: 409 }
      );
    }

    const newSkillDoc: Omit<SkillDocument, '_id'> = {
      userId: new ObjectId(user.id),
      name: name.trim(),
      description: description?.trim() || undefined,
      category: category?.trim() || undefined,
      level: calculateSkillLevel(progress),
      progress,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await skills.insertOne(newSkillDoc);
    const createdSkill = await skills.findOne({ _id: result.insertedId }) as SkillDocument;

    return NextResponse.json({ skill: skillDocumentToSkill(createdSkill) }, { status: 201 });
  } catch (error) {
    console.error('Create skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}