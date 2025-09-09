// src/lib/types.ts
import { z } from "zod";
import { ObjectId } from "mongodb";

export const OnboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z
    .preprocess((val) => Number(val), z.number().min(1, "Age must be positive")),
  learningGoal: z.string().min(1, "Learning goal is required"),
  learningDuration: z
    .preprocess((val) => Number(val), z.number().min(1).max(365)),
  preferences: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;

// MongoDB Document interfaces
export interface UserDocument {
  _id?: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillDocument {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  category?: string;
  level: number;
  progress: number;
  targetDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillGoalDocument {
  _id?: ObjectId;
  skillId: ObjectId;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillProgressDocument {
  _id?: ObjectId;
  skillId: ObjectId;
  progressValue: number;
  notes?: string;
  loggedAt: Date;
}

export interface SkillCategoryDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
}

export interface FileDocument {
  _id?: ObjectId;
  userId: ObjectId;
  skillId?: ObjectId;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
}

// API interfaces (without MongoDB ObjectId)
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  level: number;
  progress: number;
  targetDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SkillGoal {
  id: string;
  skillId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: Date;
  priority: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SkillProgress {
  id: string;
  skillId: string;
  progressValue: number;
  notes?: string;
  loggedAt: Date;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt?: Date;
}

export interface FileRecord {
  id: string;
  userId: string;
  skillId?: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: Date;
}

// Auth interfaces
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

// API Request/Response types
export interface CreateSkillRequest {
  name: string;
  description?: string;
  category?: string;
  progress?: number;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  category?: string;
  level?: number;
  progress?: number;
  targetDate?: Date;
  isActive?: boolean;
}

// Utility functions for converting between MongoDB documents and API interfaces
export function userDocumentToUser(doc: UserDocument): User {
  return {
    id: doc._id!.toString(),
    email: doc.email,
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function skillDocumentToSkill(doc: SkillDocument): Skill {
  return {
    id: doc._id!.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    level: doc.level,
    progress: doc.progress,
    targetDate: doc.targetDate,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function skillGoalDocumentToSkillGoal(doc: SkillGoalDocument): SkillGoal {
  return {
    id: doc._id!.toString(),
    skillId: doc.skillId.toString(),
    title: doc.title,
    description: doc.description,
    isCompleted: doc.isCompleted,
    dueDate: doc.dueDate,
    priority: doc.priority,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function skillProgressDocumentToSkillProgress(doc: SkillProgressDocument): SkillProgress {
  return {
    id: doc._id!.toString(),
    skillId: doc.skillId.toString(),
    progressValue: doc.progressValue,
    notes: doc.notes,
    loggedAt: doc.loggedAt,
  };
}

export function skillCategoryDocumentToSkillCategory(doc: SkillCategoryDocument): SkillCategory {
  return {
    id: doc._id!.toString(),
    name: doc.name,
    description: doc.description,
    color: doc.color,
    icon: doc.icon,
    createdAt: doc.createdAt,
  };
}