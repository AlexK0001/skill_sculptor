import { z } from 'zod';

// User validation schemas
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Daily checkin validation
export const DailyCheckinSchema = z.object({
  mood: z.string().min(5, 'Please describe your mood').max(200),
  dailyPlans: z.string().min(5, 'Please describe your plans').max(300)
});

// Skill validation schemas
export const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  progress: z.number().min(0).max(100).default(0)
});

export const UpdateSkillSchema = CreateSkillSchema.partial().extend({
  isActive: z.boolean().optional(),
  targetDate: z.string().datetime().optional()
});

// Onboarding validation
export const OnboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  learningGoal: z.string().min(5, 'Learning goal must be descriptive').max(200),
  age: z.number().min(13, 'Must be at least 13').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  strengths: z.string().max(500).optional(),
  weaknesses: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
  learningDuration: z.number().min(25, 'Minimum 25 days').max(365, 'Maximum 365 days')
});