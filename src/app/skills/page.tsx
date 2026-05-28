'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Target, ArrowRight, Loader2, Calendar as CalendarIcon, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Progress } from "@/components/ui/progress"
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SkillsPage() {
  const { user, token } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Compute modifiers dynamically
  const modifiers = {
    green: [] as Date[],
    yellow: [] as Date[],
    red: [] as Date[]
  };

  // Aggregate activity logs from all skills
  const aggregatedDates: Record<string, { completed: number, total: number }> = {};
  skills.forEach(skill => {
    if (skill.activityLog) {
      Object.keys(skill.activityLog).forEach(dateStr => {
        if (!aggregatedDates[dateStr]) {
          aggregatedDates[dateStr] = { completed: 0, total: 0 };
        }
        aggregatedDates[dateStr].completed += skill.activityLog[dateStr].completed || 0;
        aggregatedDates[dateStr].total += skill.activityLog[dateStr].total || 0;
      });
    }
  });

  Object.keys(aggregatedDates).forEach(dateStr => {
    const { completed, total } = aggregatedDates[dateStr];
    const d = new Date(dateStr);
    // adding timezone offset logic could be needed but generic mapping fits local standard
    const adjustedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000); 

    if (total > 0 && completed === total) {
      modifiers.green.push(adjustedDate);
    } else if (completed > 0 && completed < total) {
      modifiers.yellow.push(adjustedDate);
    } else if (total > 0 && completed === 0) {
      modifiers.red.push(adjustedDate);
    }
  });
  
  useEffect(() => {
    if (!token) return;
    
    const tokenStr = token;
    async function fetchSkillsList() {
      try {
        const response = await fetch('/api/skills', {
          headers: { Authorization: `Bearer ${tokenStr}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch skills');
        const data = await response.json();
        setSkills(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSkillsList();
  }, [token]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch skills');
      const data = await response.json();
      setSkills(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    if (confirm("Ви впевнені, що хочете видалити цю навичку?")) {
      try {
        const response = await fetch(`/api/skills/${skillId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          fetchSkills();
        } else {
          setError('Не вдалося видалити навичку');
        }
      } catch (err) {
        setError('Помилка сервера');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ваші Навички</h1>
          <p className="text-muted-foreground mt-1">Оберіть навичку для того щоб побачити свій прогрес та плани.</p>
        </div>
        <Button asChild>
          <Link href="/skills/new">
            <Plus className="mr-2 h-4 w-4" /> Додати Навичку
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-8 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {skills.length === 0 && !error ? (
        <Card className="text-center py-20 bg-muted/20 border-dashed">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ваш шлях скульптора починається тут</CardTitle>
            <CardDescription className="text-lg">Ви ще не додали жодної навички.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="mt-4">
              <Link href="/skills/new">
                <Plus className="mr-2 h-4 w-4" /> Створити першу навичку
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {skills.map(skill => (
              <Card key={skill._id || skill.id} className="hover:border-primary/50 transition-colors flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate pr-4">{skill.name}</span>
                    <div className="flex gap-2">
                       <div className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                         {skill.category || 'Загальне'}
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(skill._id || skill.id)} className="h-6 w-6">
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10 mt-2">
                    {skill.description || 'Немає опису.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground font-medium">Прогрес рівня</span>
                    <span className="font-bold">{skill.progress || 0}%</span>
                  </div>
                  <Progress value={skill.progress || 0} className="h-2 mb-6" />
                  
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/skills/${skill._id || skill.id}`}>
                        Деталі
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href={`/skills/${skill._id || skill.id}/plan`}>
                        План
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="md:col-span-1 border-l pl-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-primary" /> Календар Навчання
              </h3>
              <div className="bg-card border rounded-xl p-4 shadow-sm w-full flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rdp-custom"
                  modifiers={modifiers}
                  modifiersClassNames={{
                    selected: 'my-selected',
                    today: 'my-today',
                    green: 'calendar-green',
                    yellow: 'calendar-yellow',
                    red: 'calendar-red'
                  }}
                />
              </div>
              {selectedDate && (
                <div className="mt-4 text-sm text-center">
                  Обрано: <span className="font-medium text-primary">{format(selectedDate, 'PPP')}</span>
                </div>
              )}
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Ресурси
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Оберіть навичку і перейдіть в &quot;Деталі&quot;, щоб згенерувати персоналізований план навчання та знайти корисні ресурси.
                </p>
                <Button variant="link" className="px-0 h-auto font-semibold">
                  Дізнатись більше <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
