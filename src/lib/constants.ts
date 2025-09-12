// src/lib/constants.ts
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'skill_sculptor';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_sculptor';