'use client';

import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/lib/auth-context';

export default function HeaderContent() {
  return (
    <header className="w-full border-b border-border/50 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/" className="font-semibold text-lg">
            Skill Sculptor
          </a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}

function AuthButtons() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <LogoutButton />;
  }

  // Перевірка чи ми на сторінці логіну
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return null;
  }

  return <GoogleSignInButton />;
}