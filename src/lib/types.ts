import { z } from "zod";

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

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description?: string;
  level: number;
  progress: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type OnboardingData = z.infer<typeof OnboardingSchema>;
