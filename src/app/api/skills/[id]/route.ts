import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSkillsCollection } from '@/lib/mongodb';
import { skillDocumentToSkill, type SkillDocument } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/error-handler';
import { createSuccessResponse } from '@/lib/validation-utils';

/**
 * GET /api/skills/[id]
 * Отримати конкретну навичку за ID
 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  //requireAuth зазвичай бере токен з кукі або заголовків автоматично в межах запиту
  const user = await requireAuth() as any; 
  const collection = await getSkillsCollection();

  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Некоректний ID навички');
  }

  const skillDoc = await collection.findOne({
    _id: new ObjectId(params.id),
    userId: user.id || user._id // Перевіряємо обидва варіанти
  });

  if (!skillDoc) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено');
  }

  return createSuccessResponse({ skill: skillDocumentToSkill(skillDoc as SkillDocument) });
});

/**
 * PATCH /api/skills/[id]
 * Оновити дані навички
 */
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth() as any;
  const body = await req.json();
  const collection = await getSkillsCollection();

  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Некоректний ID навички');
  }

  const updateData: any = {};
  const allowedFields = ['name', 'description', 'category', 'level', 'xp', 'tags', 'lastPracticed'];
  
  allowedFields.forEach(field => {
    if (body[field] !== undefined) updateData[field] = body[field];
  });

  updateData.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(params.id), userId: user.id || user._id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено або доступу немає');
  }

  return createSuccessResponse({ skill: skillDocumentToSkill(result as SkillDocument) });
});

/**
 * DELETE /api/skills/[id]
 * Видалити навичку
 */
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireAuth() as any;
  const collection = await getSkillsCollection();

  if (!ObjectId.isValid(params.id)) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Некоректний ID навички');
  }

  const result = await collection.deleteOne({
    _id: new ObjectId(params.id),
    userId: user.id || user._id
  });

  if (result.deletedCount === 0) {
    throw new APIError(ErrorCode.NOT_FOUND, 'Навичку не знайдено');
  }

  return createSuccessResponse({ message: 'Навичку видалено успішно' });
});