'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User, Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/language-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HeaderContent() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          SkillSculptor
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Change language">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ua')}>Українська</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <div className="flex items-center gap-2 pl-4 border-l border-border/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium max-w-[150px] truncate">
                      {user.name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Мій профіль</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t('register')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
