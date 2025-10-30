'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  Target,
  BookOpen,
  Clock,
  Award,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OnboardingData } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardProps {
  userData: OnboardingData;
}

interface DayData {
  date: string;
  tasks: Task[];
  mood?: string;
  dailyPlans?: string;
  completionRate: number;
  status: 'completed' | 'partial' | 'missed' | 'pending';
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface ProgressData {
  days: Record<string, DayData>;
  lastCheckinDate: string;
  totalCompletedDays: number;
  currentStreak: number;
  longestStreak: number;
}

interface ProgressStats {
  totalDays: number;
  completedDays: number;
  partialDays: number;
  missedDays: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletion: number;
  weeklyData: { week: string; completed: number }[];
}

export default function Dashboard({ userData }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCheckin, setShowCheckin] = useState(false);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [mood, setMood] = useState('');
  const [dailyPlans, setDailyPlans] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressData, setProgressData] = useState<ProgressData>({
    days: {},
    lastCheckinDate: '',
    totalCompletedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load progress data
  useEffect(() => {
    loadProgressData();
    loadStatsData();
  }, []);

  const loadProgressData = async () => {
  try {
    setIsLoadingProgress(true);
    // FIXED: credentials: 'include' for cookies
    const response = await fetch('/api/progress', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      setProgressData(data.progress || {
        days: {},
        lastCheckinDate: '',
        totalCompletedDays: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  } finally {
    setIsLoadingProgress(false);
  }
};

const loadStatsData = async () => {
  try {
    setIsLoadingStats(true);
    // FIXED: credentials: 'include' for cookies
    const response = await fetch('/api/progress/stats', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      setStats(data.stats);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  } finally {
    setIsLoadingStats(false);
  }
};

  const handleGeneratePlan = async () => {
  if (!mood || !dailyPlans) {
    alert('Please fill in both mood and daily plans');
    return;
  }

  setIsGenerating(true);
  try {
    // FIXED: credentials: 'include' for cookies
    const response = await fetch('/api/ai/daily-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
      body: JSON.stringify({
        mood,
        dailyPlans,
        learningGoal: userData.learningGoal,
        age: userData.age,
        gender: userData.gender,
        preferences: userData.preferences,
        strengths: userData.strengths,
        weaknesses: userData.weaknesses,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate plan');
    }

    const data = await response.json();
    const plan = data.plan?.learningPlan || data.learningPlan || [];
    
    if (!Array.isArray(plan) || plan.length === 0) {
      throw new Error('No tasks were generated');
    }

    setGeneratedPlan(plan);

    // Save to progress
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const tasks: Task[] = plan.map((task, index) => ({
      id: `task-${index}`,
      text: task,
      completed: false,
    }));

    await saveProgress(dateStr, tasks, mood, dailyPlans);
    await loadProgressData();
    
  } catch (error) {
    console.error('Generate plan error:', error);
    alert('Failed to generate plan. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};

  const saveProgress = async (date: string, tasks: Task[], mood?: string, dailyPlans?: string) => {
  try {
    // FIXED: credentials: 'include' for cookies
    await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        date,
        tasks,
        mood,
        dailyPlans,
      }),
    });
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

  const handleTaskToggle = async (taskId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayData = progressData.days[dateStr];
    
    if (!dayData) return;

    const updatedTasks = dayData.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    await saveProgress(dateStr, updatedTasks, dayData.mood, dayData.dailyPlans);
    await loadProgressData();
    await loadStatsData();
  };

  const getTodayData = (): DayData | null => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return progressData.days[today] || null;
  };

  const getSelectedDayData = (): DayData | null => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return progressData.days[dateStr] || null;
  };

  const modifiers = {
    completed: Object.entries(progressData.days)
      .filter(([_, day]) => day.status === 'completed')
      .map(([date]) => parseISO(date)),
    partial: Object.entries(progressData.days)
      .filter(([_, day]) => day.status === 'partial')
      .map(([date]) => parseISO(date)),
    missed: Object.entries(progressData.days)
      .filter(([_, day]) => day.status === 'missed')
      .map(([date]) => parseISO(date)),
  };

  const modifiersClassNames = {
    completed: 'rdp-day_completed',
    partial: 'rdp-day_partial',
    missed: 'rdp-day_off',
  };

  const todayData = getTodayData();
  const selectedDayData = getSelectedDayData();
  const completionRate = todayData?.completionRate || 0;

  // Mock data for charts (replace with real data later)
  const weeklyProgressData = stats?.weeklyData || [
    { week: 'Week 1', completed: 0 },
    { week: 'Week 2', completed: 0 },
    { week: 'Week 3', completed: 0 },
    { week: 'Week 4', completed: 0 },
    { week: 'Week 5', completed: 0 },
  ];

  const skillsData = [
    { skill: 'Focus', level: 7 },
    { skill: 'Consistency', level: 6 },
    { skill: 'Time Mgmt', level: 5 },
    { skill: 'Motivation', level: 8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-headline font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {userData.name}! Track your learning journey.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCheckin(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Daily Check-in
            </Button>
            <Button
              onClick={() => setShowStudyPlan(true)}
              variant="outline"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Study Plan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoadingProgress ? '...' : progressData.currentStreak}
                </span>
                <Award className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">days in a row</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {completionRate}%
                </span>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoadingStats ? '...' : stats?.totalDays || 0}
                </span>
                <CalendarIcon className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">of learning</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Learning Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userData.learningDuration}
                </span>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">days goal</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar & Today's Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Learning Calendar
                </CardTitle>
                <CardDescription>
                  Track your daily progress and maintain your streak
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md"
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                />
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span>Partial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>Missed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isSameDay(selectedDate, new Date()) 
                    ? "Today's Tasks" 
                    : `Tasks for ${format(selectedDate, 'MMM d, yyyy')}`}
                </CardTitle>
                <CardDescription>
                  {selectedDayData 
                    ? `${selectedDayData.completionRate}% complete`
                    : 'No tasks for this day'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDayData && selectedDayData.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                          className="mt-1"
                        />
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            task.completed && "line-through text-gray-500"
                          )}
                        >
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks for this day</p>
                    {isSameDay(selectedDate, new Date()) && (
                      <Button
                        onClick={() => setShowCheckin(true)}
                        variant="link"
                        className="mt-2"
                      >
                        Create today&apos;s plan
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress Charts */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress Overview
                </CardTitle>
                <CardDescription>
                  Your task completion over the last weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center items-center h-[200px]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Skills Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Development</CardTitle>
                <CardDescription>
                  Your skill levels across different areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillsData.map((skill) => (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <span className="text-sm text-gray-500">{skill.level}/10</span>
                    </div>
                    <Progress value={skill.level * 10} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Daily Check-in Dialog */}
      <Dialog open={showCheckin} onOpenChange={setShowCheckin}>
        <DialogContent className="max-w-md">
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
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., energetic, tired, motivated"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plans">What are your other plans for today?</Label>
              <Textarea
                id="plans"
                value={dailyPlans}
                onChange={(e) => setDailyPlans(e.target.value)}
                placeholder="e.g., meetings, gym, family time"
                className="mt-1"
                rows={3}
              />
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={isGenerating || !mood || !dailyPlans}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate My Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Study Plan Dialog */}
      <Dialog open={showStudyPlan} onOpenChange={setShowStudyPlan}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Complete Study Plan</DialogTitle>
            <DialogDescription>
              {userData.learningDuration}-day roadmap to master {userData.learningGoal}
            </DialogDescription>
          </DialogHeader>
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Generating your personalized study plan...</p>
            </div>
          ) : generatedPlan.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Today&apos;s Learning Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Based on your mood: <Badge variant="secondary">{mood}</Badge>
                </p>
              </div>
              
              <div className="space-y-3">
                {generatedPlan.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm">{task}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => {
                  setShowStudyPlan(false);
                  setShowCheckin(false);
                }}
                className="w-full"
              >
                Start Learning
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete your daily check-in to see your personalized study plan
              </p>
              <Button
                onClick={() => {
                  setShowStudyPlan(false);
                  setShowCheckin(true);
                }}
              >
                Do Daily Check-in
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}