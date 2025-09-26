// src/app/api/skills/route.ts - SECURED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill, type CreateSkillRequest, type SkillDocument } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse, sanitizeString } from '@/lib/validation-utils';
import { z } from 'zod';

// Validation schema for creating skills
const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
  description: z.string().max(500).optional().transform(s => s?.trim()),
  category: z.string().max(50).optional().transform(s => s?.trim()),
  progress: z.number().min(0).max(100).default(0)
});

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
export const GET = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()(request);
  
  const skills = await getSkillsCollection();
  const userSkills = await skills
    .find({ userId: new ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .limit(100) // Prevent large data dumps
    .toArray() as SkillDocument[];

  const skillsResponse = userSkills.map(skillDocumentToSkill);
  return createSuccessResponse({ skills: skillsResponse });
}));

// POST /api/skills - Create new skill
export const POST = withRequestValidation(withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()(request);
  
  // Parse and validate request body
  const body = await request.json();
  const validatedData = CreateSkillSchema.parse(body);

  // Additional business logic validation
  if (!validatedData.name || validatedData.name.length === 0) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Skill name is required',
      400
    );
  }

  const skills = await getSkillsCollection();
  
  // Check if user already has a skill with this name (case-insensitive)
  const existingSkill = await skills.findOne({
    userId: new ObjectId(user.id),
    name: { $regex: new RegExp(`^${validatedData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });

  if (existingSkill) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'You already have a skill with this name',
      409
    );
  }

  // Check user's skill limit (prevent spam)
  const userSkillCount = await skills.countDocuments({ userId: new ObjectId(user.id) });
  if (userSkillCount >= 50) { // Reasonable limit
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'You have reached the maximum number of skills (50)',
      400
    );
  }

  // Create new skill document
  const newSkillDoc: Omit<SkillDocument, '_id'> = {
    userId: new ObjectId(user.id),
    name: validatedData.name,
    description: validatedData.description || undefined,
    category: validatedData.category || undefined,
    level: calculateSkillLevel(validatedData.progress),
    progress: validatedData.progress,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await skills.insertOne(newSkillDoc);
    const createdSkill = await skills.findOne({ _id: result.insertedId }) as SkillDocument;
    
    return createSuccessResponse(
      { skill: skillDocumentToSkill(createdSkill) },
      201
    );
  } catch (dbError) {
    console.error('Database error creating skill:', dbError);
    throw new APIError(
      ErrorCode.DATABASE_ERROR,
      'Failed to create skill',
      500
    );
  }
}));