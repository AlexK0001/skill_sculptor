'use client';

import * as React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  Check,
} from 'lucide-react';
import type { OnboardingData } from '@/lib/types';
import { PageLoader, LoadingOverlay } from '@/components/LoadingStates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './icons';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Checkbox } from './ui/checkbox';
import { addDays, startOfDay } from 'date-fns';

type DashboardProps = {
  userData: OnboardingData;
};

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

const progressData = [
  { name: 'Week 1', tasks: 4 },
  { name: 'Week 2', tasks: 8 },
  { name: 'Week 3', tasks: 6 },
  { name: 'Week 4', tasks: 10 },
  { name: 'Week 5', tasks: 7 },
];

export default function Dashboard({ userData }: DashboardProps) {
  const [daysOff, setDaysOff] = React.useState<Date[]>([]);
  const [completedDays, setCompletedDays] = React.useState<Date[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isPlanLoading, setIsPlanLoading] = React.useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = React.useState(false);
  const [isDailyPlanOpen, setIsDailyPlanOpen] = React.useState(false);
  const [lastCheckinDate, setLastCheckinDate] = React.useState<Date | null>(null);
  const { toast } = useToast();

  const handleDayClick = (day: Date) => {
    setDaysOff((prev) =>
      prev.some((d) => d.getTime() === day.getTime())
        ? prev.filter((d) => d.getTime() !== day.getTime())
        : [...prev, day]
    );
  };

  const handleCheckinSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const mood = formData.get('mood') as string;
    const dailyPlans = formData.get('dailyPlans') as string;

    setIsPlanLoading(true);
    setIsCheckinOpen(false);
    setIsDailyPlanOpen(true);
    setLastCheckinDate(startOfDay(new Date()));

    try {
      // Call API endpoint instead of direct AI call
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood,
          dailyPlans,
          learningGoal: userData.learningGoal,
          age: userData.age,
          gender: userData.gender,
          strengths: userData.strengths || 'Eager to learn',
          weaknesses: userData.weaknesses || 'Need more practice',
          preferences: userData.preferences || 'Interactive learning',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const result = await response.json();
      
      if (result.success && result.data?.plan?.learningPlan) {
        const planTasks = result.data.plan.learningPlan.map((task: string, index: number) => ({
          id: index,
          text: task,
          completed: false,
        }));
        setTasks(planTasks);

        // Show cache status in toast
        if (result.data.cached) {
          toast({
            title: 'Plan loaded from cache',
            description: 'This saved an API call! ♻️',
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error generating plan',
        description: 'Could not generate a learning plan. Please try again later.',
      });
      setIsDailyPlanOpen(false);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleTaskToggle = (taskId: number) => {
    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);

    const allCompleted = newTasks.every((t) => t.completed);
    if (allCompleted) {
      const today = startOfDay(new Date());
      if (!completedDays.some((d) => d.getTime() === today.getTime())) {
        setCompletedDays((prev) => [...prev, today]);
      }
    }
  };

  const allTasksCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
  const hasCheckedInToday =
    lastCheckinDate?.getTime() === startOfDay(new Date()).getTime();

  const handleDailyButtonClick = () => {
    if (hasCheckedInToday) {
      setIsDailyPlanOpen(true);
    } else {
      setIsCheckinOpen(true);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="size-8 text-primary" />
              <span className="text-lg font-semibold font-headline">
                SkillSculptor
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <a href="#dashboard">
                  <SidebarMenuButton isActive>
                    <BarChart3 />
                    Dashboard
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a href="#progress">
                  <SidebarMenuButton>
                    <BookOpen />
                    My Progress
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a href="#calendar">
                  <SidebarMenuButton>
                    <CalendarDays />
                    Calendar
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage
                  src={`https://i.pravatar.cc/150?u=${userData.gender}`}
                  alt="User"
                />
                <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Welcome, {userData.name}!
                </span>
                <span className="text-xs text-muted-foreground">
                  Age: {userData.age}
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger className="md:hidden" />
            <h1 id="dashboard" className="text-2xl font-bold font-headline">
              Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <Button onClick={handleDailyButtonClick}>
                {hasCheckedInToday ? (
                  <Target className="mr-2 size-4" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                {hasCheckedInToday ? "Today{'\u2019'}s Goal" : 'Daily Check-in'}
              </Button>

              <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-headline">
                      How are you today?
                    </DialogTitle>
                    <DialogDescription>
                      Let&apos;s tailor a plan for your day.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCheckinSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mood">How are you feeling?</Label>
                      <Textarea
                        id="mood"
                        name="mood"
                        placeholder="e.g., Energized and ready to learn!"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dailyPlans">
                        What are your other plans for today?
                      </Label>
                      <Textarea
                        id="dailyPlans"
                        name="dailyPlans"
                        placeholder="e.g., Morning jog, team meeting at 2 PM..."
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPlanLoading}
                    >
                      {isPlanLoading && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Generate My Plan
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="p-4 md:p-6 lg:p-8 grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-3 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="font-headline">
                    Welcome Back, {userData.name}!
                  </CardTitle>
                  <CardDescription>
                    Ready to master{' '}
                    <span className="font-semibold text-primary">
                      {userData.learningGoal}
                    </span>
                    ?
                  </CardDescription>
                </div>
                {isPlanLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin size-5" />
                    <span>Generating...</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress
                    value={(completedDays.length / userData.learningDuration) * 100}
                    className="h-3"
                  />
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Day {completedDays.length} / {userData.learningDuration}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card id="progress" className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <BarChart3 /> Progress Overview
                </CardTitle>
                <CardDescription>
                  Your task completion over the last weeks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={progressData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Bar
                      dataKey="tasks"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Target />
                    Today{'\u2019'}s Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasCheckedInToday && tasks.length > 0 ? (
                    tasks.slice(0, 2).map((task, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2
                          className={`mt-1 size-5 shrink-0 ${
                            task.completed
                              ? 'text-green-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <div>
                          <h4 className="font-semibold">{task.text}</h4>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">
                      <p>No plan generated for today.</p>
                      <p>Click on &quot;Daily Check-in&quot; to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card id="calendar" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <CalendarDays /> Learning Calendar
                </CardTitle>
                <CardDescription>
                  Select your days off. Your plan will adapt. Completed days are
                  marked in green.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={[...daysOff, ...completedDays]}
                  onSelect={(dates) => {
                    if (dates) {
                      // Filter out completed days (they can't be unselected)
                      const newDaysOff = dates.filter(
                      (date) => !completedDays.some((d) => d.getTime() === date.getTime())
                      );
                      setDaysOff(newDaysOff);
                    }
                  }}
                  disabled={(date) => {
                      // Disable past dates and completed days
                    const today = startOfDay(new Date());
                    return date < today || completedDays.some((d) => d.getTime() === date.getTime());
                  }}
                  onDayClick={handleDayClick}
                  className="rounded-md border"
                  modifiers={{
                    off: daysOff,
                    completed: completedDays,
                  }}
                  modifiersClassNames={{
                    completed: 'rdp-day_completed',
                    off: 'rdp-day_off',
                  }}
                  modifiersStyles={{
                    off: {
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                    },
                    completed: {
                      color: 'hsl(var(--primary-foreground))',
                      backgroundColor: 'hsl(140, 80%, 40%)',
                    },
                  }}
                  components={{
                    DayContent: (props: any) => {
                      const isCompleted = completedDays.some(
                        (d) => d.getTime() === props.date.getTime()
                      );
                      return (
                        <div className="relative flex items-center justify-center h-full w-full">
                          {props.date.getDate()}
                          {isCompleted && (
                            <Check className="absolute size-4 text-white" />
                          )}
                        </div>
                      );
                    },
                  } as any}
                />
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      <Dialog open={isDailyPlanOpen} onOpenChange={setIsDailyPlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Sparkles className="text-primary" /> Your Plan for Today
            </DialogTitle>
            <DialogDescription>
              Here is a personalized learning plan. Check off tasks as you complete
              them.
            </DialogDescription>
          </DialogHeader>

          {isPlanLoading ? (
            <LoadingOverlay message="Generating your plan..." />
          ) : (
            <>
              <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-sm font-medium leading-none ${
                        task.completed
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {task.text}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsDailyPlanOpen(false)}
                >
                  Close
                </Button>
                {allTasksCompleted ? (
                  <Button onClick={() => setIsDailyPlanOpen(false)}>
                    <CheckCircle2 className="mr-2 size-4" />
                    You did it!
                  </Button>
                ) : (
                  <Button onClick={() => setIsDailyPlanOpen(false)}>
                    Done for Today
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}