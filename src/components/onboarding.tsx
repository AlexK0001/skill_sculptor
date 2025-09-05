'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Rocket } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-blue-50">
      <Card className="w-full max-w-2xl shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-3 mb-2">
                <Logo className="size-12 text-primary" />
                <h1 className="font-headline text-4xl font-bold">SkillSculptor</h1>
              </div>
              <CardTitle className="font-headline text-2xl">Shape Your Future</CardTitle>
              <CardDescription>Tell us a bit about yourself to create your personalized learning path.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Name or Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex" {...field} />
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
                      <Input placeholder="e.g., Advanced React, Public Speaking, Python for Data Science" {...field} />
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
                      <Input type="number" placeholder="25" {...field} />
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
                        <SelectTrigger>
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
                      <Textarea placeholder="e.g., Quick learner, good at problem-solving" {...field} />
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
                      <Textarea placeholder="e.g., Procrastination, get distracted easily" {...field} />
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
                      <Textarea placeholder="e.g., I prefer hands-on projects, video tutorials, short lessons." {...field} />
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
                      <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
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
  );
}
