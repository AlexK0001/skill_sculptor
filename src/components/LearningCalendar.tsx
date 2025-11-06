// src/components/ProgressCalendar.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';
import { useAuth } from '@/lib/auth-context';

interface DayProgress {
  date: string;
  status: 'completed' | 'partial' | 'missed' | 'pending';
  completionRate: number;
  tasks?: Array<{ text: string; completed: boolean }>;
}

interface UserProgress {
  days: Record<string, DayProgress>; // Changed from array to object
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
}

export default function ProgressCalendar() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      if (!token) {
        console.log('[Calendar] No token, skipping fetch');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Calendar] Fetching progress...');
        const response = await fetch('/api/progress', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch progress: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Calendar] Progress data:', data);

        if (data.success && data.data?.progress) {
          setProgress(data.data.progress);
        }
      } catch (error) {
        console.error('[Calendar] Error fetching progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [token]);

  // Get day status from progress data
  const getDayStatus = (date: Date): DayProgress['status'] => {
    if (!progress?.days) return 'pending';
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = progress.days[dateStr];
    
    return dayData?.status || 'pending';
  };

  // Get completed days for DayPicker
  const getCompletedDays = (): Date[] => {
    if (!progress?.days) return [];
    
    return Object.entries(progress.days)
      .filter(([_, day]) => day.status === 'completed')
      .map(([dateStr]) => new Date(dateStr));
  };

  // Get missed days for DayPicker
  const getMissedDays = (): Date[] => {
    if (!progress?.days) return [];
    
    return Object.entries(progress.days)
      .filter(([_, day]) => day.status === 'missed')
      .map(([dateStr]) => new Date(dateStr));
  };

  // Custom day content renderer
  const renderDay = (date: Date) => {
    const status = getDayStatus(date);
    const dayNum = date.getDate();

    // Add custom classes based on status
    let className = 'rdp-day_custom';
    
    if (status === 'completed') {
      className += ' rdp-day_completed';
    } else if (status === 'missed') {
      className += ' rdp-day_off';
    } else if (status === 'partial') {
      className += ' rdp-day_partial';
    }

    return (
      <div className={className}>
        {dayNum}
      </div>
    );
  };

  // Handle day click
  const handleDayClick = (day: Date | undefined) => {
    setSelectedDay(day);
    
    if (day && progress?.days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = progress.days[dateStr];
      
      if (dayData) {
        console.log('[Calendar] Selected day:', dateStr, dayData);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Learning Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Track your daily progress and maintain your streak
        </p>
      </div>

      {/* Stats bar */}
      {progress && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {progress.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">
              Current Streak
            </div>
          </div>
          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-accent-foreground">
              {progress.longestStreak}
            </div>
            <div className="text-xs text-muted-foreground">
              Longest Streak
            </div>
          </div>
          <div className="text-center p-3 bg-secondary/10 rounded-lg">
            <div className="text-2xl font-bold text-secondary-foreground">
              {progress.totalCompletedDays}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Days
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={handleDayClick}
          modifiers={{
            completed: getCompletedDays(),
            missed: getMissedDays(),
          }}
          modifiersClassNames={{
            completed: 'rdp-day_completed',
            missed: 'rdp-day_off',
            selected: 'rdp-day_selected',
            today: 'rdp-day_today',
          }}
          className="rdp-custom"
          disabled={(date) => date > new Date()} // Disable future dates
        />
      </div>

      {/* Selected day info */}
      {selectedDay && progress?.days && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="font-semibold mb-2">
            {format(selectedDay, 'MMMM d, yyyy')}
          </div>
          
          {(() => {
            const dateStr = format(selectedDay, 'yyyy-MM-dd');
            const dayData = progress.days[dateStr];
            
            if (!dayData) {
              return (
                <p className="text-sm text-muted-foreground">
                  No activity recorded for this day.
                </p>
              );
            }
            
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`text-sm font-medium ${
                    dayData.status === 'completed' ? 'text-green-600' :
                    dayData.status === 'missed' ? 'text-red-600' :
                    dayData.status === 'partial' ? 'text-yellow-600' :
                    'text-muted-foreground'
                  }`}>
                    {dayData.status.charAt(0).toUpperCase() + dayData.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <span className="text-sm font-medium">
                    {dayData.completionRate}%
                  </span>
                </div>

                {dayData.tasks && dayData.tasks.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Tasks:</div>
                    <ul className="space-y-1">
                      {dayData.tasks.map((task, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className={task.completed ? 'text-green-600' : 'text-muted-foreground'}>
                            {task.completed ? '✓' : '○'}
                          </span>
                          <span className={task.completed ? 'line-through opacity-70' : ''}>
                            {task.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-500"></div>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted border-2 border-border"></div>
          <span>No data</span>
        </div>
      </div>
    </div>
  );
}