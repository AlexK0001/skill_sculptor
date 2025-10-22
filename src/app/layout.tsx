import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { AuthProvider } from "@/lib/auth-context";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'SkillSculptor',
  description: 'Shape Your Future - AI-powered personalized learning',
  manifest: '/manifest.json',
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3399FF', // ← Перенесено сюди з metadata
};

// Динамічний імпорт для компонентів з React hooks
const DynamicHeader = React.lazy(() => import('@/components/HeaderContent'));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ReactQueryProvider>
            <AuthProvider>
              <React.Suspense fallback={<HeaderSkeleton />}>
                <DynamicHeader />
              </React.Suspense>
              <main className="pt-16">{children}</main>
              <Toaster />
            </AuthProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Skeleton для header під час завантаження
function HeaderSkeleton() {
  return (
    <header className="w-full border-b border-border/50 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  );
}