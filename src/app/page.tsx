// src/app/page.tsx - PROTECTED HOME PAGE
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <PageLoader message="Loading your workspace..." />;
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Convert user to OnboardingData if available
  useEffect(() => {
    if (user && !userData) {
      // Try to load saved onboarding data from user profile
      // For now, use basic user data
      setUserData({
        name: user.name,
        email: user.email,
        age: 25, // Default, can be updated later
        gender: 'not specified',
        preferences: 'Interactive learning',
        strengths: 'Eager to learn',
        weaknesses: 'Need more practice',
        learningGoal: 'General learning',
      });
    }
  }, [user, userData]);

  return userData ? (
    <Dashboard userData={userData} />
  ) : (
    <Onboarding onComplete={setUserData} />
  );
}