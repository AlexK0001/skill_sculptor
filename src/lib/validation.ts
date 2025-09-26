// src/lib/validation.ts - MISSING SCHEMAS
import { z } from 'zod';

// Registration validation
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number')
});

// Login validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Daily checkin validation
export const DailyCheckinSchema = z.object({
  mood: z.string()
    .min(3, 'Mood description too short')
    .max(500, 'Mood description too long')
    .transform(s => s.trim()),
  dailyPlans: z.string()
    .min(5, 'Daily plans description too short') 
    .max(1000, 'Daily plans description too long')
    .transform(s => s.trim()),
  learningGoal: z.string()
    .max(200)
    .optional()
    .transform(s => s?.trim()),
  // Optional user profile overrides
  age: z.number().min(13).max(100).optional(),
  gender: z.string().max(50).optional(),
  strengths: z.string().max(500).optional(),
  weaknesses: z.string().max(500).optional(),
  preferences: z.string().max(500).optional()
});

// Skill validation
export const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
  description: z.string().max(500).optional().transform(s => s?.trim()),
  category: z.string().max(50).optional().transform(s => s?.trim()),
  progress: z.number().min(0).max(100).default(0)
});

export const UpdateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional().transform(s => s?.trim()),
  description: z.string().max(500).optional().transform(s => s?.trim()),
  category: z.string().max(50).optional().transform(s => s?.trim()),
  progress: z.number().min(0).max(100).optional(),
  level: z.number().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  targetDate: z.string().datetime().optional()
});

// Export types
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type DailyCheckinRequest = z.infer<typeof DailyCheckinSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillRequest = z.infer<typeof UpdateSkillSchema>;