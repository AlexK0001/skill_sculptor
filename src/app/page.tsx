'use client';

import { useState } from 'react';
import type { OnboardingData } from '@/lib/types';
import Onboarding from '@/components/onboarding';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userData, setUserData] = useState<OnboardingData | null>(null);

  const handleOnboardingComplete = (data: OnboardingData) => {
    setUserData(data);
    setOnboardingComplete(true);
  };

  return (
    <main>
      {!onboardingComplete || !userData ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard userData={userData} />
      )}
    </main>
  );
}
