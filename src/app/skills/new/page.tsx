'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NewSkillPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Додати нову навичку</h1>
      <form className="space-y-4 max-w-md">
        {/* Тут буде ваша форма */}
        <p className="text-muted-foreground">Форма в розробці...</p>
        
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Скасувати
          </Button>
          <Button type="submit">Зберегти</Button>
        </div>
      </form>
    </div>
  );
}