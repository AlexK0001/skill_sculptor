import React from 'react';
import { Skill } from '@/lib/types';
import { SkillCard } from './SkillCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SkillListProps {
  skills: Skill[];
}

export function SkillList({ skills }: SkillListProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-xl bg-muted/30">
        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Навичок не знайдено</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Ви ще не додали жодної навички. Почніть свій шлях розвитку прямо зараз!
        </p>
        <Button asChild>
          <Link href="/skills/new">Додати першу навичку</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {skills.map((skill) => (
        // Використовуємо рядок skill.id як стабільний ключ для React
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}