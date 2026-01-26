// src/app/api/skills/[id]/route.ts
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { createSuccessResponse, sanitizeString } from '@/lib/validation-utils';
import { z } from 'zod';

// Схема для оновлення навички (всі поля опціональні)
const UpdateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional().transform(s => s ? sanitizeString(s) : undefined),
  description: z.string().max(500).optional().transform(s => s ? sanitizeString(s) : undefined),
  category: z.string().max(50).optional().transform(s => s ? sanitizeString(s) : undefined),
  tags: z.array(z.string()).optional(),
  level: z.number().min(1).optional(),
  xp: z.number().min(0).optional(),
});

/**
 * GET: Отримання однієї навички за її ID
 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth(req);
  const collection = await getSkillsCollection();

  // Перевірка формату ID перед запитом до бази
  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.BAD_REQUEST, 'Некоректний ID навички');
  }

  const skillDoc = await collection.findOne({
    _id: new ObjectId(params.id),
    userId: user.id // Гарантуємо, що користувач бачить тільки свою навичку
  });

  if (!skillDoc) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено');
  }

  // Трансформуємо документ MongoDB у чистий об'єкт Skill
  return createSuccessResponse({ skill: skillDocumentToSkill(skillDoc) });
});

/**
 * PUT: Оновлення існуючої навички
 */
export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth(req);
  const body = await req.json();
  
  // Валідуємо вхідні дані через Zod
  const validation = UpdateSkillSchema.safeParse(body);
  if (!validation.success) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Некоректні дані для оновлення');
  }

  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.BAD_REQUEST, 'Некоректний ID навички');
  }

  const collection = await getSkillsCollection();
  
  const updateData = {
    ...validation.data,
    updatedAt: new Date()
  };

  // Видаляємо undefined поля, щоб не затерти існуючі дані в базі
  Object.keys(updateData).forEach(key => 
    (updateData as any)[key] === undefined && delete (updateData as any)[key]
  );

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(params.id), userId: user.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено або у вас немає прав на її зміну');
  }

  return createSuccessResponse({ skill: skillDocumentToSkill(result) });
});

/**
 * DELETE: Видалення навички
 */
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth(req);
  const collection = await getSkillsCollection();

  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.BAD_REQUEST, 'Некоректний ID навички');
  }

  const result = await collection.deleteOne({
    _id: new ObjectId(params.id),
    userId: user.id
  });

  if (result.deletedCount === 0) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено');
  }

  return createSuccessResponse({ message: 'Навичку видалено успішно' });
});