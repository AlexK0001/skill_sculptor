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
  const [plan, setPlan] = useState<string[]>([]);
  const [error, setError] = useState('');

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First get the skill to know what the user wants to learn
      const skillRes = await fetch(`/api/skills/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!skillRes.ok) throw new Error('Skill not found');
      const skill = await skillRes.json();
      
      const payload = {
        mood,
        dailyPlans,
        learningGoal: skill.name,
        preferences: skill.description || 'General approach',
        strengths: '',
        weaknesses: '',
        age: 25,
        gender: 'Not specified'
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href={`/skills/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад до навички
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" /> AI План Навчання
        </h1>
        <p className="text-muted-foreground mt-2">
          Згенеруйте персоналізований план на сьогодні в залежності від вашого стану.
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
            <CardTitle>Ваш план на сьогодні</CardTitle>
            <CardDescription>Ось що запропонував AI:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
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