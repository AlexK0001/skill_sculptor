'use client';

import * as React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Newspaper,
  Sparkles,
  Target,
} from 'lucide-react';
import Image from 'next/image';
import type { OnboardingData } from '@/lib/types';
import { suggestLearningPlan, type SuggestLearningPlanOutput } from '@/ai/flows/suggest-learning-plan';
import { aggregateLearningResources, type AggregateLearningResourcesOutput } from '@/ai/flows/aggregate-learning-resources';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  SidebarSeparator,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './icons';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

type DashboardProps = {
  userData: OnboardingData;
};

const progressData = [
  { name: "Week 1", tasks: 4 },
  { name: "Week 2", tasks: 8 },
  { name: "Week 3", tasks: 6 },
  { name: "Week 4", tasks: 10 },
  { name: "Week 5", tasks: 7 },
];

export default function Dashboard({ userData }: DashboardProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dailyPlan, setDailyPlan] = React.useState<SuggestLearningPlanOutput | null>(null);
  const [resources, setResources] = React.useState<AggregateLearningResourcesOutput | null>(null);
  const [isPlanLoading, setIsPlanLoading] = React.useState(false);
  const [isResourcesLoading, setIsResourcesLoading] = React.useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = React.useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const handleCheckinSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const mood = formData.get('mood') as string;
    const dailyPlans = formData.get('dailyPlans') as string;

    setIsPlanLoading(true);
    setIsCheckinOpen(false);

    try {
      const plan = await suggestLearningPlan({
        ...userData,
        mood,
        dailyPlans,
      });
      setDailyPlan(plan);
      setIsPlanDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error generating plan',
        description: 'Could not generate a learning plan. Please try again later.',
      });
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleFindResources = async () => {
    if (!dailyPlan) return;
    setIsResourcesLoading(true);
    try {
      const result = await aggregateLearningResources({
        learningObjective: userData.learningGoal,
      });
      setResources(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error finding resources',
        description: 'Could not find learning resources. Please try again later.',
      });
    } finally {
      setIsResourcesLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="size-8 text-primary" />
              <span className="text-lg font-semibold font-headline">SkillSculptor</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <BarChart3 />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BookOpen />
                  My Plan
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <CalendarDays />
                  Calendar
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage src={`https://i.pravatar.cc/150?u=${userData.gender}`} alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Welcome!</span>
                <span className="text-xs text-muted-foreground">Age: {userData.age}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
            <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Sparkles className="mr-2 size-4" />
                  Daily Check-in
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-headline">How are you today?</DialogTitle>
                  <DialogDescription>Let's tailor a plan for your day.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCheckinSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mood">How are you feeling?</Label>
                    <Textarea id="mood" name="mood" placeholder="e.g., Energized and ready to learn!" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyPlans">What are your other plans for today?</Label>
                    <Textarea id="dailyPlans" name="dailyPlans" placeholder="e.g., Morning jog, team meeting at 2 PM..." required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPlanLoading}>
                    {isPlanLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Generate My Plan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </header>
          <main className="p-4 md:p-6 lg:p-8 grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-3 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline">Welcome Back!</CardTitle>
                  <CardDescription>
                    Ready to master <span className="font-semibold text-primary">{userData.learningGoal}</span>?
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
                  <Progress value={ (15 / userData.learningDuration) * 100 } className="h-3" />
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Day 15 / {userData.learningDuration}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChart3/> Progress Overview</CardTitle>
                    <CardDescription>Your task completion over the last weeks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={progressData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Target/>Today's Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-500 mt-1 size-5 shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Chapter 3: Advanced React Hooks</h4>
                                <p className="text-sm text-muted-foreground">Complete the exercises on `useMemo`.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-500 mt-1 size-5 shrink-0"/>
                            <div>
                                <h4 className="font-semibold">Practice Project</h4>
                                <p className="text-sm text-muted-foreground">Refactor the state management.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">View Full Plan</Button>
                    </CardFooter>
                </Card>
            </div>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><CalendarDays/> Learning Calendar</CardTitle>
                <CardDescription>Your personalized learning journey.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className="text-primary"/> Your Plan for Today</DialogTitle>
            <DialogDescription>Here is a personalized learning plan based on your input.</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-foreground text-base leading-relaxed">
            <p>{dailyPlan?.learningPlan}</p>
          </div>
          {resources && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold font-headline">Helpful Resources</h4>
              <ul className="list-disc pl-5 space-y-1">
                {resources.resources.map((link, index) => (
                  <li key={index}><a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link}</a></li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsPlanDialogOpen(false)}>Close</Button>
              <Button onClick={handleFindResources} disabled={isResourcesLoading}>
                {isResourcesLoading ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Newspaper className="mr-2 size-4" />}
                Find Resources
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
