import { NextRequest } from 'next/server';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill, type SkillDocument } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { createSuccessResponse, sanitizeString } from '@/lib/validation-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100).transform(s => sanitizeString(s) || ''),
  description: z.string().max(500).optional().transform(s => s ? sanitizeString(s) : ''),
  category: z.string().min(1).max(50).default('Загальне'),
  tags: z.array(z.string()).optional().default([]),
});

export const GET = withErrorHandler(async () => {
  const user = await requireAuth() as any;
  const collection = await getSkillsCollection();

  const skillsDocs = await collection
    .find({ userId: user.id || user._id })
    .sort({ updatedAt: -1 })
    .toArray();

  const skills = skillsDocs.map(doc => skillDocumentToSkill(doc as SkillDocument));

  return createSuccessResponse({ skills });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth() as any;
  const body = await req.json();
  
  // Валідація вручну через схему, щоб уникнути помилок з withRequestValidation wrapper
  const validatedData = CreateSkillSchema.parse(body);
  
  const collection = await getSkillsCollection();

  const newSkill: Partial<SkillDocument> = {
    ...validatedData,
    userId: user.id || user._id,
    level: 1,
    xp: 0,
    lastPracticed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newSkill as SkillDocument);
  
  const createdSkill = {
    ...newSkill,
    _id: result.insertedId,
  };

  return createSuccessResponse({ skill: skillDocumentToSkill(createdSkill as SkillDocument) }, 201);
});