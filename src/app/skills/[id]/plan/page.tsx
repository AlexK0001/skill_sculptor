'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Play, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function AIPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('Вмотивований');
  const [dailyPlans, setDailyPlans] = useState('Маю 2 години вільного часу ввечері');
  const [plan, setPlan] = useState<{title: string, description: string, link: string}[]>([]);
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const [skill, setSkill] = useState<any>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    setCompletedItems({});
    
    try {
      // First get the skill to know what the user wants to learn
      const skillRes = await fetch(`/api/skills/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!skillRes.ok) throw new Error('Skill not found');
      const fetchedSkill = await skillRes.json();
      setSkill(fetchedSkill);
      
      const payload = {
        mood,
        dailyPlans,
        learningGoal: fetchedSkill.name,
        preferences: fetchedSkill.description || 'General approach',
        strengths: '',
        weaknesses: '',
        age: Number(user?.age) || 25,
        gender: user?.gender || 'Not specified',
        level: fetchedSkill.level,
        fullPlanContext: fetchedSkill.fullPlan ? JSON.stringify(fetchedSkill.fullPlan, null, 2) : '',
        completedTasksSummary: fetchedSkill.activityLog ? JSON.stringify(fetchedSkill.activityLog, null, 2) : ''
      };

      const res = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      if (data.data?.plan?.learningPlan) {
        setPlan(data.data.plan.learningPlan);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (index: number) => {
    const newCompleted = { ...completedItems, [index]: !completedItems[index] };
    setCompletedItems(newCompleted);

    // Calc today's progress
    const total = plan.length;
    const completedCount = Object.values(newCompleted).filter(Boolean).length;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const activityLog = skill?.activityLog || {};
      activityLog[todayStr] = { completed: completedCount, total };
      
      await fetch(`/api/skills/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activityLog })
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href={`/skills/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад до навички
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" /> AI План Навчання (На Сьогодні)
        </h1>
        <p className="text-muted-foreground mt-2">
          Згенеруйте обсяг задач на сьогодні, який буде спиратися на ваш Глобальний план та ваш поточний стан.
        </p>
      </div>

      {plan.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Параметри</CardTitle>
            <CardDescription>Розкажіть про ваш поточний стан, щоб AI підібрав найкращий план.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Як ви себе почуваєте?</Label>
              <Input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Напр. Втомився, Вмотивований..." />
            </div>
            <div className="space-y-2">
              <Label>Які плани на день? (Скільки часу є?)</Label>
              <Textarea value={dailyPlans} onChange={(e) => setDailyPlans(e.target.value)} />
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={generatePlan} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Генеруємо...</> : <><Play className="w-4 h-4 mr-2" /> Створити план</>}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader>
            <CardTitle>Ваш щоденний план</CardTitle>
            <CardDescription>Відмічайте виконані пункти для заповнення вашого календаря.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.map((item, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${completedItems[i] ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-muted/50'}`}>
                <div className="mt-1 cursor-pointer" onClick={() => toggleTask(i)}>
                  {completedItems[i] ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${completedItems[i] ? 'line-through opacity-70 text-muted-foreground' : ''}`}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                      Корисний глибокий ресурс (відкрити) 
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setPlan([])} variant="outline" className="w-full">
              Згенерувати інший
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}