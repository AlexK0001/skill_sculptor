'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ArrowRight, 
  BarChart2, 
  Zap, 
  Target, 
  Trophy 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const { token, user } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    
    async function fetchSkills() {
      try {
        const response = await fetch('/api/skills', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSkills(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    fetchSkills();
  }, [token]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            Скульптуруйте свої <span className="text-primary">Навички</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Відстежуйте свій прогрес, гейміфікуйте навчання та ставайте кращою версією себе кожного дня.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="px-8">
              <Link href={user ? "/skills" : "/login"}>
                До моїх навичок <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={user ? "/skills/new" : "/login"}>
                <Plus className="mr-2 w-4 h-4" /> Додати нову
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Features Preview */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle>Швидкий старт</CardTitle>
              <CardDescription>Створюйте навички за лічені секунди та починайте тренування.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart2 className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Аналітика</CardTitle>
              <CardDescription>Візуалізуйте свій ріст за допомогою графіків прогресу та XP.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>Досягнення</CardTitle>
              <CardDescription>Отримуйте рівні та винагороди за регулярну практику.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Quick Action Dashboard Preview */}
      <section className="py-12 bg-secondary/10 flex-1">
        <div className="container mx-auto px-4">
          <div className="bg-background rounded-2xl border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-primary" /> Поточний фокус
              </h2>
              <Link href="/skills" className="text-sm text-primary hover:underline font-medium">
                Дивитися всі навички
              </Link>
            </div>
            
            {!user ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">Увійдіть, щоб бачити свій прогрес.</p>
                <Button asChild variant="secondary">
                  <Link href="/login">Увійти</Link>
                </Button>
              </div>
            ) : skills.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">Ви ще не додали жодної навички. Готові розпочати?</p>
                <Button asChild variant="secondary">
                  <Link href="/skills/new">Додати першу навичку</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.slice(0, 4).map((skill) => (
                  <Card key={skill._id || skill.id} className="p-4 flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                       <span className="font-semibold text-lg">{skill.name}</span>
                       <span className="text-sm font-bold text-primary">{skill.progress || 0}%</span>
                     </div>
                     <Progress value={skill.progress || 0} className="h-2" />
                     <Button asChild variant="outline" size="sm" className="mt-2 text-xs">
                        <Link href={`/skills/${skill._id || skill.id}/plan`}>Продовжити план</Link>
                     </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
