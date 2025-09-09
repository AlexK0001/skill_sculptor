'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Rocket, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { OnboardingSchema, OnboardingData } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from './icons';

type OnboardingProps = {
  onComplete: (data: OnboardingData) => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [darkMode, setDarkMode] = useState(false);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      name: '',
      gender: '',
      age: 25,
      learningGoal: '',
      learningDuration: 30,
      preferences: '',
      strengths: '',
      weaknesses: '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit: SubmitHandler<OnboardingData> = (data) => {
    onComplete(data);
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <Card className="w-full max-w-2xl shadow-2xl bg-white dark:bg-gray-900">
          {/* Перемикач теми у правому верхньому куті */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-2">
                  <Logo className="w-12 h-12 text-primary" />
                  <h1 className="font-headline text-3xl font-bold">SkillSculptor</h1>
                </div>
                <CardTitle className="font-headline text-xl">Shape Your Future</CardTitle>
                <CardDescription>
                  Tell us a bit about yourself to create your personalized learning path.
                </CardDescription>
              </CardHeader>

              {/* Контент з інпутами */}
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Інпути розтягуються на всю ширину своїх колонок */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Name or Nickname</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="e.g., Alex" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="learningGoal"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>What do you want to learn?</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="e.g., Advanced React, Public Speaking, Python for Data Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" className="w-full" placeholder="25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="strengths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strengths</FormLabel>
                      <FormControl>
                        <Textarea className="w-full" placeholder="e.g., Quick learner, good at problem-solving" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weaknesses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weaknesses</FormLabel>
                      <FormControl>
                        <Textarea className="w-full" placeholder="e.g., Procrastination, get distracted easily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Learning Preferences</FormLabel>
                      <FormControl>
                        <Textarea className="w-full" placeholder="e.g., I prefer hands-on projects, video tutorials, short lessons." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="learningDuration"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Learning Duration (25-365 days)</FormLabel>
                      <FormControl>
                        <Input type="number" className="w-full" placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              {/* Кнопка */}
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  Start My Journey
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
