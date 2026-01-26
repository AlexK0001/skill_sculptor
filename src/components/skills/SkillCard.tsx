import React from 'react';
import Link from 'next/link';
import { Skill } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Award, BookOpen } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  // Розрахунок прогресу: припускаємо, що кожен рівень вимагає 100 XP
  const progressValue = skill.xp % 100;

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 border-border/50 overflow-hidden flex flex-col">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="secondary" className="font-medium">
            {skill.category}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            {skill.lastPracticed 
              ? new Date(skill.lastPracticed).toLocaleDateString() 
              : 'Немає дати'}
          </div>
        </div>
        <Link href={`/skills/${skill.id}`} className="group">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
            {skill.name}
          </CardTitle>
        </Link>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {skill.description || 'Опис відсутній для цієї навички.'}
        </p>

        <div className="grid grid-cols-2 gap-2 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
            <Award className="w-4 h-4 text-yellow-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Рівень</span>
              <span className="text-sm font-bold">{skill.level}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Досвід</span>
              <span className="text-sm font-bold">{skill.xp} XP</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-auto">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">Прогрес до наступного рівня</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{skill.tags.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}