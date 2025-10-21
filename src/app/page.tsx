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

  // Convert user to OnboardingData if available
  // NOTE: This useEffect must run unconditionally alongside other hooks
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

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return userData ? (
    <Dashboard userData={userData} />
  ) : (
    <Onboarding onComplete={setUserData} />
  );
}