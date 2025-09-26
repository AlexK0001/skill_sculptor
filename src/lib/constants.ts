// src/lib/constants.ts
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'skill_sculptor';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_sculptor';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// App configuration
export const APP_CONFIG = {
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
  AI_RATE_LIMIT_MAX: 10, // AI requests per window
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    GOOGLE: '/api/auth/google'
  },
  SKILLS: {
    BASE: '/api/skills',
    BY_ID: (id: string) => `/api/skills/${id}`
  },
  AI: {
    DAILY_PLAN: '/api/ai/daily-plan',
    FULL_PLAN: '/api/ai/full-plan',
    RESOURCES: '/api/ai/resources'
  }
} as const;

export const RATE_LIMITS = {
  AI_DAILY_PLAN: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  AI_FULL_PLAN: { requests: 3, windowMs: 60 * 60 * 1000 },  // 3 per hour
  AUTH: { requests: 5, windowMs: 15 * 60 * 1000 }            // 5 per 15 minutes
} as const;