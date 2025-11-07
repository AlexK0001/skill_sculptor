// src/app/page.tsx - FIXED (No redirect loop)
'use client';

import "./globals.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Onboarding from '@/components/onboarding';
import Dashboard from '@/components/dashboard';
import { useAuth } from '@/lib/auth-context';
import { PageLoader } from '@/components/LoadingStates';
import type { OnboardingData } from '@/lib/types';

export default function Home() {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Convert user to OnboardingData if available
  useEffect(() => {
    if (user && !userData) {
      setUserData({
        name: user.name,
        age: 25,
        gender: 'not specified',
        preferences: 'Interactive learning',
        strengths: 'Eager to learn',
        weaknesses: 'Need more practice',
        learningGoal: 'General learning',
        learningDuration: 30,
      });
    }
  }, [user, userData]);

  // Show loading while checking auth
  if (isLoading) {
    return <PageLoader message="Loading your workspace..." />;
  }

  // If NOT authenticated, show a welcome/login prompt instead of redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full card text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to SkillSculptor</h1>
          <p className="text-muted-foreground mb-8">
            Your AI-powered personalized learning companion
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors text-lg"
            >
              Sign In
            </button>
            
            <button
              onClick={() => router.push('/register')}
              className="w-full py-4 px-6 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 transition-colors text-lg"
            >
              Create Account
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              ✨ AI-generated learning plans
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              📊 Track your progress
            </p>
            <p className="text-sm text-muted-foreground">
              🎯 Achieve your learning goals
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: show dashboard or onboarding
  return userData ? (
    <Dashboard userData={userData} />
  ) : (
    <Onboarding onComplete={setUserData} />
  );
}