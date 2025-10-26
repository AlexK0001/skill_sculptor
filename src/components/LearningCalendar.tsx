// src/components/LearningCalendar.tsx - Custom calendar with colored days
'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/hooks/use-progress';
import type { DayProgress } from '@/lib/types-progress';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function LearningCalendar() {
  const { getDayProgress } = useProgress();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get day status color
  const getDayColor = (date: Date): string => {
    const dateStr = date.toISOString().split('T')[0];
    const dayProgress = getDayProgress(dateStr);
    
    if (!dayProgress) return '';
    
    switch (dayProgress.status) {
      case 'completed':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'partial':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'missed':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return '';
    }
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        day,
        date,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <h3 className="text-xl font-headline font-semibold">
          {MONTHS[month]} {year}
        </h3>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((item, index) => {
          const dayColor = item.isCurrentMonth ? getDayColor(item.date) : '';
          const todayBorder = isToday(item.date) ? 'ring-2 ring-primary ring-offset-2' : '';
          
          return (
            <button
              key={index}
              className={`
                h-12 rounded-lg flex items-center justify-center
                text-sm font-medium transition-all
                ${item.isCurrentMonth ? 'hover:bg-muted' : 'text-muted-foreground/40'}
                ${dayColor}
                ${todayBorder}
                ${!item.isCurrentMonth && 'cursor-default'}
              `}
              disabled={!item.isCurrentMonth}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-muted-foreground">All tasks completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-muted-foreground">Partially completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-muted-foreground">No tasks completed</span>
        </div>
      </div>
    </div>
  );
}