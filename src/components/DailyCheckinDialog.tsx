// src/components/DailyCheckinDialog.tsx - FIXED VERSION
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanGenerated: (plan: string[]) => void;
  userData: {
    name: string;
    age: number;
    gender: string;
    preferences: string;
    strengths: string;
    weaknesses: string;
    learningGoal: string;
  };
}

export function DailyCheckinDialog({
  open,
  onOpenChange,
  onPlanGenerated,
  userData,
}: DailyCheckinDialogProps) {
  const [mood, setMood] = useState('');
  const [dailyPlans, setDailyPlans] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!mood.trim() || !dailyPlans.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in both fields',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[DailyCheckin] Sending request to API...');
      console.log('[DailyCheckin] Mood:', mood);
      console.log('[DailyCheckin] Daily plans:', dailyPlans);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare request body
      const requestBody = {
        mood: mood.trim(),
        dailyPlans: dailyPlans.trim(),
        learningGoal: userData.learningGoal,
        age: userData.age,
        gender: userData.gender,
        preferences: userData.preferences,
        strengths: userData.strengths,
        weaknesses: userData.weaknesses,
      };

      console.log('[DailyCheckin] Request body:', requestBody);

      // Make API request
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[DailyCheckin] Response status:', response.status);

      // Parse response
      const data = await response.json();
      console.log('[DailyCheckin] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // Extract plan from nested response
      let plan: string[] | undefined;
      
      // Try different response structures
      if (data.data?.plan?.learningPlan) {
        plan = data.data.plan.learningPlan;
      } else if (data.plan?.learningPlan) {
        plan = data.plan.learningPlan;
      } else if (data.learningPlan) {
        plan = data.learningPlan;
      }

      console.log('[DailyCheckin] Extracted plan:', plan);

      if (!plan || !Array.isArray(plan) || plan.length === 0) {
        console.error('[DailyCheckin] Invalid plan structure:', data);
        throw new Error('No tasks were generated. Please try again.');
      }

      console.log('[DailyCheckin] Generated plan:', plan);

      // Show success message
      toast({
        title: 'Plan Generated! ✨',
        description: data.data?.fallback 
          ? 'Using curated learning plan'
          : 'Your personalized plan is ready',
      });

      // Pass plan to parent
      onPlanGenerated(plan);

      // Close dialog
      onOpenChange(false);

      // Reset form
      setMood('');
      setDailyPlans('');

    } catch (error: any) {
      console.error('[DailyCheckin] Error:', error);
      
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            How are you today?
            <Sparkles className="h-5 w-5 text-primary" />
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Let&apos;s tailor a plan for your day.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Mood Input */}
          <div className="space-y-2">
            <Label htmlFor="mood" className="text-base font-medium">
              How are you feeling?
            </Label>
            <Input
              id="mood"
              type="text"
              placeholder="e.g., motivated, tired, curious..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              disabled={isGenerating}
              className="text-base"
              required
            />
          </div>

          {/* Daily Plans Input */}
          <div className="space-y-2">
            <Label htmlFor="dailyPlans" className="text-base font-medium">
              What are your other plans for today?
            </Label>
            <Input
              id="dailyPlans"
              type="text"
              placeholder="e.g., work meeting, gym, reading..."
              value={dailyPlans}
              onChange={(e) => setDailyPlans(e.target.value)}
              disabled={isGenerating}
              className="text-base"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isGenerating || !mood.trim() || !dailyPlans.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate My Plan
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}