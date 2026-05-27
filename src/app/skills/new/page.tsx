'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewSkillPage() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Назва навички обов\'язкова.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Щось пішло не так');
      }
      
      router.push('/skills');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href="/skills">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад до списку
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Додати нову навичку</h1>
        <p className="text-muted-foreground mt-2">
          Введіть інформацію про навичку, яку ви хочете опанувати.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Назва навички <span className="text-destructive">*</span></Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="Напр., Гра на гітарі, Вивчення React, Іспанська мова..." 
            value={formData.name}
            onChange={handleChange}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Категорія</Label>
          <Input 
            id="category" 
            name="category" 
            placeholder="Напр., Програмування, Мистецтво, Мови..." 
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Опис та мотивація (опціонально)</Label>
          <Textarea 
            id="description" 
            name="description" 
            placeholder="Чому ви хочете це вивчити? Яка ваша кінцева мета?" 
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="pt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Потім ми використаємо <Sparkles className="inline w-3 h-3 text-primary mx-0.5" /> AI для створення графіка.
          </p>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Збереження...</>
            ) : (
              'Зберегти Навичку'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
