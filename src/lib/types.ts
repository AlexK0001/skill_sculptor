import { z } from "zod";

export const OnboardingSchema = z.object({
  gender: z.string().min(1, "Gender is required."),
  age: z.coerce.number().min(1, "Age is required.").max(120),
  learningGoal: z.string().min(3, "Learning goal is required."),
  preferences: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  learningDuration: z.coerce.number().min(25, "Minimum duration is 25 days.").max(365, "Maximum duration is 365 days."),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;
