'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Rocket } from 'lucide-react';
import type { OnboardingData } from '@/lib/types';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    learningGoal: '',
    age: 25,
    gender: '',
    strengths: '',
    weaknesses: '',
    preferences: '',
    learningDuration: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L12 22M12 2C8 2 5 5 5 9C5 13 8 16 12 16M12 2C16 2 19 5 19 9C19 13 16 16 12 16M12 16C8 16 5 19 5 22H19C19 19 16 16 12 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SkillSculptor
          </h1>
          <p className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
            Shape Your Future
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tell us a bit about yourself to create your personalized learning path.
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name or Nickname
              </Label>
              <Input
                id="name"
                placeholder="e.g., Alex"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningGoal" className="text-sm font-medium">
                What do you want to learn?
              </Label>
              <Input
                id="learningGoal"
                placeholder="e.g., Advanced React, Public Speaking, Python for Data Science"
                value={formData.learningGoal}
                onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  required
                  min="13"
                  max="100"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strengths" className="text-sm font-medium">
                  Strengths
                </Label>
                <Textarea
                  id="strengths"
                  placeholder="e.g., Quick learner, good at problem-solving"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-gray-500">What are you good at?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weaknesses" className="text-sm font-medium">
                  Weaknesses
                </Label>
                <Textarea
                  id="weaknesses"
                  placeholder="e.g., Procrastination, get distracted easily"
                  value={formData.weaknesses}
                  onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-gray-500">Where can you improve?</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferences" className="text-sm font-medium">
                Learning Preferences
              </Label>
              <Textarea
                id="preferences"
                placeholder="e.g., I prefer hands-on projects, video tutorials, short lessons."
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Learning Duration (25-365 days)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.learningDuration}
                onChange={(e) => setFormData({ ...formData, learningDuration: parseInt(e.target.value) })}
                required
                min="25"
                max="365"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mt-6"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Start My Journey
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}