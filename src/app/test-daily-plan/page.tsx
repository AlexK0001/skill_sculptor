// src/app/test-daily-plan/page.tsx - FIXED
'use client';

import { useState } from 'react';
import DailyCheckinDialog from '@/components/DailyCheckinDialog'; // FIXED: default import

export default function TestDailyPlanPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string[]>([]);

  const handlePlanGenerated = (newPlan: string[]) => { // FIXED: typed parameter
    console.log('Plan generated:', newPlan);
    setGeneratedPlan(newPlan);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="max-w-2xl w-full space-y-6">
        <div className="card text-center">
          <h1 className="text-3xl font-bold mb-4">Daily Plan Test Page</h1>
          <p className="text-muted-foreground mb-6">
            Test the daily check-in dialog and plan generation
          </p>
          
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Open Daily Check-in
          </button>
        </div>

        {generatedPlan.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Generated Plan:</h2>
            <ul className="space-y-2">
              {generatedPlan.map((task, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <span className="font-semibold text-primary">{index + 1}.</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DailyCheckinDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />
    </div>
  );
}