'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Skill } from '@/lib/types';
import { SkillList } from '@/components/skills/SkillList';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/skills');
      
      if (!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ВАЖЛИВО: Наше API тепер повертає об'єкт { skills: [] }, 
      // тому беремо дані саме з поля skills
      if (data && Array.isArray(data.skills)) {
        setSkills(data.skills);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error('Помилка при завантаженні навичок:', err);
      setError('Не вдалося завантажити навички. Перевірте з’єднання з базою даних.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Заголовок та кнопка створення */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мої навички</h1>
          <p className="text-muted-foreground">Керуйте своїм розвитком та відстежуйте прогрес.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSkills} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/skills/new">
              <Plus className="w-4 h-4 mr-2" />
              Додати навичку
            </Link>
          </Button>
        </div>
      </div>

      {/* Стан помилки */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Помилка</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="link" onClick={fetchSkills} className="p-0 h-auto text-destructive underline">
              Спробувати знову
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Стан завантаження */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground animate-pulse">Завантаження ваших навичок...</p>
        </div>
      ) : (
        /* Список навичок */
        <SkillList skills={skills} />
      )}
    </div>
  );
}