'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, ArrowLeft, Loader2, Play, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

export default function SkillDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useAuth();
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullPlan, setFullPlan] = useState<any[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    async function fetchSkill() {
      try {
        const response = await fetch(`/api/skills/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSkill(data);
          if (data.fullPlan) {
            setFullPlan(data.fullPlan);
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    
    fetchSkill();
  }, [token, params.id]);

  const loadFullPlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch('/api/ai/full-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: skill.name, level: skill.level })
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        setFullPlan(data.plan);
        // Save to skill
        await fetch(`/api/skills/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fullPlan: data.plan })
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!skill) {
    return <div className="text-center mt-20 text-muted-foreground">Навичку не знайдено.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href="/skills">
          <ArrowLeft className="mr-2 h-4 w-4" /> До списку
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
              {skill.category || 'Загальне'}
            </span>
            {skill.level && (
              <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-1 rounded border">
                {skill.level}
              </span>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl">{skill.description || 'Опис відсутній.'}</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={`/skills/${params.id}/plan`}>
            <Play className="mr-2 w-4 h-4" /> Згенерувати План (AI)
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Прогрес</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Рівень освоєння</span>
                <span className="font-bold text-primary">{skill.progress || 0}%</span>
              </div>
              <Progress value={skill.progress || 0} className="h-3" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Повний план (Глобальний)</CardTitle>
              <CardDescription>Загальна структура для вивчення навички</CardDescription>
            </CardHeader>
            <CardContent>
              {fullPlan.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Ви ще не створили повний стратегічний план.
                  </p>
                  <Button onClick={loadFullPlan} disabled={generatingPlan} variant="outline">
                    {generatingPlan ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : 'Згенерувати повний план'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {fullPlan.map((phase, i) => (
                    <div key={i} className="mb-4">
                       <h3 className="font-bold text-lg mb-2">{phase.phase}</h3>
                       <div className="space-y-2">
                         {phase.items.map((item: any, j: number) => (
                           <div key={j} className="flex gap-2 items-start text-sm">
                             <Circle className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                             <div>
                               <p className="font-medium">{item.title}</p>
                               {item.link && (
                                 <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Корисне посилання</a>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-secondary/20 border-none">
            <CardHeader>
              <CardTitle className="text-lg">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-background p-3 rounded-lg border">
                <span className="text-muted-foreground">Створено</span>
                <span className="font-medium text-sm">
                  {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : 'Невідомо'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}