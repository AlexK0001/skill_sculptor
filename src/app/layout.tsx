// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { AuthProvider } from "@/lib/api";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LogoutButton from '@/components/LogoutButton';

// const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'SkillSculptor',
  description: 'Shape Your Future - AI-powered personalized learning',
  manifest: '/manifest.json', 
  themeColor: '#3399FF',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SkillSculptor',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      {/* <body className={inter.className}> */}
      <body>
        <ErrorBoundary>
        <ReactQueryProvider>
          <AuthProvider>
            <header className="w-full border-b border-border/50 bg-transparent">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <a href="/" className="font-semibold text-lg">Skill Sculptor</a>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <GoogleSignInButton />
                <LogoutButton />
              </div>
            </div>
            </header>

            <main className="pt-16">{children}</main>

            <Toaster />
          </AuthProvider>
        </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
