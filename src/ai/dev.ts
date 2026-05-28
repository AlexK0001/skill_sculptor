'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-full-learning-plan';
import '@/ai/flows/aggregate-learning-resources.ts';
import '@/ai/flows/suggest-full-learning-plan.ts';
