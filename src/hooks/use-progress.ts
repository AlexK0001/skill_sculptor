// src/hooks/use-progress.ts - React hook for progress management
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { UserProgress, DayProgress, ProgressStats, DailyTask } from '@/lib/types-progress';

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress from API
  const loadProgress = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/progress', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load progress');
      
      const data = await response.json();
      setProgress(data.progress);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Load progress error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/progress/stats', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Load stats error:', err);
    }
  }, [user]);

  // Update day progress
  const updateDayProgress = useCallback(async (
    date: string,
    tasks: DailyTask[],
    mood?: string,
    dailyPlans?: string
  ) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, tasks, mood, dailyPlans }),
      });
      
      if (!response.ok) throw new Error('Failed to update progress');
      
      // Reload progress and stats
      await Promise.all([loadProgress(), loadStats()]);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Update progress error:', err);
      return false;
    }
  }, [user, loadProgress, loadStats]);

  // Get progress for specific date
  const getDayProgress = useCallback((date: string): DayProgress | null => {
    if (!progress || !progress.days) return null;
    return progress.days[date] || null;
  }, [progress]);

  // Get today's date (YYYY-MM-DD)
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Check if today already has check-in
  const hasTodayCheckin = useCallback(() => {
    const today = getTodayDate();
    return progress?.lastCheckinDate === today;
  }, [progress, getTodayDate]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadProgress();
      loadStats();
    }
  }, [user, loadProgress, loadStats]);

  return {
    progress,
    stats,
    loading,
    error,
    updateDayProgress,
    getDayProgress,
    getTodayDate,
    hasTodayCheckin,
    reload: () => {
      loadProgress();
      loadStats();
    },
  };
}