// src/app/api/skills/route.ts
import { NextRequest } from 'next/server';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { withRequestValidation, createSuccessResponse, sanitizeString } from '@/lib/validation-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Схема валідації для створення нової навички
const CreateSkillSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова").max(100).transform(s => sanitizeString(s)),
  description: z.string().max(500).optional().default('').transform(s => sanitizeString(s)),
  category: z.string().max(50).optional().default('General').transform(s => sanitizeString(s)),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * GET: Отримання всіх навичок користувача
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const collection = await getSkillsCollection();

  // Знаходимо документи, що належать користувачу
  const skillsData = await collection
    .find({ userId: user.id })
    .sort({ updatedAt: -1 }) // Новіші навички зверху
    .toArray();

  // ВАЖЛИВО: Перетворюємо MongoDB документи (з ObjectId/Date) 
  // у чисті об'єкти (Skill) перед відправкою клієнту
  const skills = skillsData.map(skillDocumentToSkill);

  return createSuccessResponse({ skills });
});

/**
 * POST: Створення нової навички
 */
export const POST = withErrorHandler(
  withRequestValidation(CreateSkillSchema, async (req: NextRequest, data) => {
    const user = await requireAuth(req);
    const collection = await getSkillsCollection();

    const now = new Date();
    
    // Формуємо об'єкт для бази даних
    const newSkillDoc = {
      userId: user.id,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags,
      level: 1,
      xp: 0,
      lastPracticed: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newSkillDoc as any);

    if (!result.insertedId) {
      throw new APIError(ErrorCode.INTERNAL_ERROR, 'Не вдалося створити навичку в базі даних');
    }

    // Повертаємо створений об'єкт клієнту через мапер
    const createdSkill = skillDocumentToSkill({
      ...newSkillDoc,
      _id: result.insertedId,
    });

    return createSuccessResponse({ skill: createdSkill }, 201);
  })
);