// src/lib/types-progress.ts - Types for progress tracking

import { ObjectId } from 'mongodb';

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD format
  tasks: DailyTask[];
  mood?: string;
  dailyPlans?: string;
  completionRate: number; // 0-100
  status: 'completed' | 'partial' | 'missed' | 'pending';
}

export interface UserProgress {
  _id?: ObjectId;
  userId: ObjectId;
  days: Record<string, DayProgress>;
  lastCheckinDate: string; // YYYY-MM-DD
  totalCompletedDays: number;
  currentStreak: number;
  longestStreak: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface UpdateProgressRequest {
  date: string;
  tasks: DailyTask[];
  mood?: string;
  dailyPlans?: string;
}

export interface ProgressStats {
  totalDays: number;
  completedDays: number;
  partialDays: number;
  missedDays: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletion: number;
  weeklyData: {
    week: string;
    completed: number;
  }[];
}