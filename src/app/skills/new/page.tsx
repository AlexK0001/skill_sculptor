'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function NewSkillPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const skillData = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
      level: 1, // Початковий рівень
    };

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Помилка при збереженні');
      }

      router.push('/skills'); // Повертаємось до списку після успіху
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Створити нову навичку</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва навички</label>
              <input
                name="name"
                required
                className="w-full p-2 border rounded-md bg-background"
                placeholder="напр. TypeScript, Гітара, Кулінарія"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Категорія</label>
              <select name="category" className="w-full p-2 border rounded-md bg-background">
                <option value="Programming">Програмування</option>
                <option value="Languages">Мови</option>
                <option value="Sports">Спорт</option>
                <option value="Art">Мистецтво</option>
                <option value="Other">Інше</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Опис</label>
              <textarea
                name="description"
                className="w-full p-2 border rounded-md bg-background h-24"
                placeholder="Чого ви хочете досягти?"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Зберегти навичку'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}