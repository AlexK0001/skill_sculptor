import "./globals.css";
import 'react-day-picker/dist/style.css';
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/language-context";

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
  themeColor: '#3399FF',
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <ReactQueryProvider>
              <LanguageProvider>
                <AuthProvider>
                  <React.Suspense fallback={<HeaderSkeleton />}>
                    <DynamicHeader />
                  </React.Suspense>
                  <main className="pt-16">{children}</main>
                  <Toaster />
                </AuthProvider>
              </LanguageProvider>
            </ReactQueryProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

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
