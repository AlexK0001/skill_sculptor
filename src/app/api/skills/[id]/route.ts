import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill, type UpdateSkillRequest, type SkillDocument } from '@/lib/types';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: { id: string };
}

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

// GET /api/skills/[id] - Get specific skill
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, error } = await verifyToken(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid skill ID' },
        { status: 400 }
      );
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await getSkillsCollection();
    const skill = await skills.findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user.id)
    }) as SkillDocument | null;

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ skill: skillDocumentToSkill(skill) });
  } catch (error) {
    console.error('Get skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/skills/[id] - Update skill
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, error } = await verifyToken(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid skill ID' },
        { status: 400 }
      );
    }

    const updateData: UpdateSkillRequest = await request.json();
    
    // Validate progress if provided
    if (updateData.progress !== undefined && (updateData.progress < 0 || updateData.progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await getSkillsCollection();
    
    // Check if skill exists and belongs to user
    const existingSkill = await skills.findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user.id)
    });

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateObj: Partial<SkillDocument> = {
      updatedAt: new Date()
    };

    if (updateData.name !== undefined) {
      if (!updateData.name.trim()) {
        return NextResponse.json(
          { error: 'Skill name cannot be empty' },
          { status: 400 }
        );
      }
      updateObj.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      updateObj.description = updateData.description?.trim() || undefined;
    }

    if (updateData.category !== undefined) {
      updateObj.category = updateData.category?.trim() || undefined;
    }

    if (updateData.progress !== undefined) {
      updateObj.progress = updateData.progress;
      updateObj.level = calculateSkillLevel(updateData.progress);
    }

    if (updateData.level !== undefined) {
      updateObj.level = updateData.level;
    }

    if (updateData.targetDate !== undefined) {
      updateObj.targetDate = updateData.targetDate;
    }

    if (updateData.isActive !== undefined) {
      updateObj.isActive = updateData.isActive;
    }

    const result = await skills.updateOne(
      { _id: new ObjectId(params.id), userId: new ObjectId(user.id) },
      { $set: updateObj }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const updatedSkill = await skills.findOne({ _id: new ObjectId(params.id) }) as SkillDocument;
    return NextResponse.json({ skill: skillDocumentToSkill(updatedSkill) });
  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[id] - Delete skill
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, error } = await verifyToken(request);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid skill ID' },
        { status: 400 }
      );
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await getSkillsCollection();
    const result = await skills.deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user.id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}