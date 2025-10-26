// src/components/dashboard.tsx - UPDATED with progress persistence
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LearningCalendar } from '@/components/LearningCalendar';
import { useProgress } from '@/hooks/use-progress';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingData } from '@/lib/types';
import type { DailyTask } from '@/lib/types-progress';

interface DashboardProps {
  userData: OnboardingData;
}

export default function Dashboard({ userData }: DashboardProps) {
  const { toast } = useToast();
  const {
    progress,
    stats,
    loading,
    updateDayProgress,
    getDayProgress,
    getTodayDate,
    hasTodayCheckin,
  } = useProgress();

  // States
  const [showCheckin, setShowCheckin] = useState(false);
  const [mood, setMood] = useState('');
  const [dailyPlans, setDailyPlans] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);

  // Load today's tasks on mount
  useEffect(() => {
    const today = getTodayDate();
    const dayProgress = getDayProgress(today);
    
    if (dayProgress && dayProgress.tasks) {
      setTodayTasks(dayProgress.tasks);
      // If tasks exist, also restore mood and plans
      if (dayProgress.mood) setMood(dayProgress.mood);
      if (dayProgress.dailyPlans) setDailyPlans(dayProgress.dailyPlans);
    }
    
    // Determine if there are saved tasks for today from the fetched dayProgress
    const hasTasks = !!(dayProgress && dayProgress.tasks && dayProgress.tasks.length > 0);
    // Show check-in only if not done today AND no tasks exist (based on fetched progress, not state)
    const shouldShowCheckin = !hasTodayCheckin() && !loading && !hasTasks;
    setShowCheckin(shouldShowCheckin);
  }, [getDayProgress, getTodayDate, hasTodayCheckin, loading]);

  // Auto-save tasks when they change (debounced)
  useEffect(() => {
    if (todayTasks.length === 0) return;
    
    const timeout = setTimeout(async () => {
      const today = getTodayDate();
      await updateDayProgress(today, todayTasks, mood, dailyPlans);
    }, 1000); // Save after 1 second of inactivity
    
    return () => clearTimeout(timeout);
  }, [todayTasks, mood, dailyPlans, getTodayDate, updateDayProgress]);

  // Generate daily plan
  const handleGeneratePlan = async () => {
    if (!mood.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please tell us how you&apos;re feeling',
      });
      return;
    }

    setGeneratingPlan(true);

    try {
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mood,
          dailyPlans: dailyPlans || 'Regular day',
          learningGoal: userData.learningGoal,
          age: userData.age,
          gender: userData.gender,
          strengths: userData.strengths,
          weaknesses: userData.weaknesses,
          preferences: userData.preferences,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      const plan = data.plan?.learningPlan || [];

      // Convert to tasks
      const newTasks: DailyTask[] = plan.map((text: string, index: number) => ({
        id: `task-${Date.now()}-${index}`,
        text,
        completed: false,
        createdAt: new Date(),
      }));

      setTodayTasks(newTasks);

      // Save immediately
      const today = getTodayDate();
      await updateDayProgress(today, newTasks, mood, dailyPlans);

      setShowCheckin(false);

      toast({
        title: 'Success!',
        description: `Your personalized plan is ready! ${data.cached ? '(cached)' : ''}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate plan',
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    setTodayTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Get completed tasks only
  const completedTasks = todayTasks.filter(t => t.completed);

  // Calculate progress percentage
  const progressPercentage = todayTasks.length > 0
    ? Math.round((completedTasks.length / todayTasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Dashboard</h1>
            <Button
              variant="default"
              className="mt-2"
              onClick={() => setShowCheckin(true)}
            >
              <Target className="mr-2 h-4 w-4" />
              Today&apos;s Goal
            </Button>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-headline font-semibold mb-2">
                Welcome Back, {userData.name}!
              </h2>
              <p className="text-muted-foreground">
                Ready to master{' '}
                <span className="text-primary font-semibold">{userData.learningGoal}</span>?
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Day {stats?.totalDays || 0} / {userData.learningDuration}</p>
              <Progress value={(((stats?.totalDays || 0) / userData.learningDuration) * 100)} className="mt-2 w-32" />
            </div>
          </div>
        </Card>

        {/* Today's Tasks (All tasks with checkboxes) */}
        {todayTasks.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-headline font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Today&apos;s Goals
              </h3>
              <div className="text-sm text-muted-foreground">
                {completedTasks.length} / {todayTasks.length} completed
              </div>
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <p className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Progress Overview */}
        <Card className="p-6">
          <h3 className="text-xl font-headline font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progress Overview
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your task completion over the last weeks.
          </p>
          {stats && stats.weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Start completing tasks to see your progress!</p>
            </div>
          )}
        </Card>

        {/* Learning Calendar */}
        <Card className="p-6">
          <h3 className="text-xl font-headline font-semibold mb-2 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Learning Calendar
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Track your learning journey. Completed days show in green, partial in yellow, missed in red.
          </p>
          <LearningCalendar />
        </Card>
      </div>

      {/* Daily Check-in Dialog */}
      <Dialog open={showCheckin} onOpenChange={setShowCheckin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How are you today?</DialogTitle>
            <DialogDescription>
              Let&apos;s tailor a plan for your day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mood">How are you feeling?</Label>
              <Input
                id="mood"
                placeholder="e.g., Energized and ready to learn!"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plans">What are your other plans for today?</Label>
              <Textarea
                id="plans"
                placeholder="e.g., Morning jog, team meeting at 2 PM..."
                value={dailyPlans}
                onChange={(e) => setDailyPlans(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="w-full"
            >
              {generatingPlan ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate My Plan'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}