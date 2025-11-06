// src/components/DailyCheckinDialog.tsx - FIXED VERSION
'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface DailyCheckinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (plan: string[]) => void;
}

export default function DailyCheckinDialog({
  isOpen,
  onClose,
  onPlanGenerated,
}: DailyCheckinDialogProps) {
  const { token } = useAuth(); // Get token from auth context
  const [mood, setMood] = useState('');
  const [dailyPlans, setDailyPlans] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    console.log('[DailyCheckin] Submitting:', { mood, dailyPlans });
    console.log('[DailyCheckin] Token available:', !!token);

    try {
      // Validation
      if (!mood.trim() || !dailyPlans.trim()) {
        throw new Error('Please fill in all fields');
      }

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare request
      const requestBody = {
        mood: mood.trim(),
        dailyPlans: dailyPlans.trim(),
        learningGoal: 'General learning', // Can be enhanced later
      };

      console.log('[DailyCheckin] Sending request to API:', requestBody);

      // Call API with proper authentication
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // FIXED: Properly pass token
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Include cookies
      });

      console.log('[DailyCheckin] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[DailyCheckin] Error response:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(errorData.error || `Failed to generate plan (${response.status})`);
      }

      const data = await response.json();
      console.log('[DailyCheckin] Success response:', data);

      if (!data.success || !data.data?.plan?.learningPlan) {
        throw new Error('Invalid response format from server');
      }

      const plan = data.data.plan.learningPlan;
      
      if (!Array.isArray(plan) || plan.length === 0) {
        throw new Error('Generated plan is empty');
      }

      // Success!
      console.log('[DailyCheckin] Plan generated:', plan);
      onPlanGenerated(plan);
      
      // Reset form
      setMood('');
      setDailyPlans('');
      onClose();

    } catch (err: any) {
      console.error('[DailyCheckin] Error:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isGenerating}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">How are you today?</h2>
          <p className="text-muted-foreground text-sm">
            Let&apos;s tailor a plan for your day.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood input */}
          <div>
            <label
              htmlFor="mood"
              className="block text-sm font-medium mb-2"
            >
              How are you feeling?
            </label>
            <input
              id="mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g., motivated, tired, curious..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              disabled={isGenerating}
              required
            />
          </div>

          {/* Daily plans input */}
          <div>
            <label
              htmlFor="dailyPlans"
              className="block text-sm font-medium mb-2"
            >
              What are your other plans for today?
            </label>
            <textarea
              id="dailyPlans"
              value={dailyPlans}
              onChange={(e) => setDailyPlans(e.target.value)}
              placeholder="e.g., work meeting at 2pm, gym in evening..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
              disabled={isGenerating}
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isGenerating || !mood.trim() || !dailyPlans.trim()}
            className="w-full py-6 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Plan
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}