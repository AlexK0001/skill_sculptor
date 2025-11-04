// src/app/test-daily-plan/page.tsx - CREATE NEW FILE
'use client';

import { useState } from 'react';
import { DailyCheckinDialog } from '@/components/DailyCheckinDialog';
import { Button } from '@/components/ui/button';

export default function TestDailyPlanPage() {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string[]>([]);

  // Mock user data
  const mockUserData = {
    name: 'Test User',
    age: 25,
    gender: 'not specified',
    preferences: 'Interactive learning',
    strengths: 'Eager to learn',
    weaknesses: 'Need more practice',
    learningGoal: 'Test learning goal',
  };

  // Mock token for testing
  const setupMockAuth = () => {
    localStorage.setItem('token', 'mock-test-token-for-testing');
    alert('Mock auth setup! Now try Daily Check-in.');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Daily Plan Test Page</h1>
        
        <div className="space-y-4">
          <Button onClick={setupMockAuth}>
            Setup Mock Auth
          </Button>

          <Button onClick={() => setOpen(true)}>
            Open Daily Check-in Dialog
          </Button>
        </div>

        {plan.length > 0 && (
          <div className="mt-8 p-6 bg-card rounded-lg">
            <h2 className="text-xl font-bold mb-4">Generated Plan:</h2>
            <ul className="space-y-2">
              {plan.map((task, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DailyCheckinDialog
          open={open}
          onOpenChange={setOpen}
          onPlanGenerated={(newPlan) => {
            console.log('Plan generated:', newPlan);
            setPlan(newPlan);
          }}
          userData={mockUserData}
        />
      </div>
    </div>
  );
}