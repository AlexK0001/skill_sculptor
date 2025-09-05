'use client';

import { useState } from 'react';
import Onboarding from '@/components/onboarding';
import Dashboard from '@/components/dashboard';
import type { OnboardingData } from '@/lib/types';

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
//         <h1 className="text-4xl font-bold">Skill Sculptor</h1>
//         <p className="text-xl">Ласкаво просимо до вашого додатку для розвитку навичок!</p>
//       </div>
//     </main>
//   )
// }

export default function Home() {
  const [userData, setUserData] = useState<OnboardingData | null>(null);

  return userData ? (
    <Dashboard userData={userData} />
  ) : (
    <Onboarding onComplete={setUserData} />
  );
}