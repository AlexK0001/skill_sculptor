
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { AuthProvider } from "@/lib/auth-context";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LogoutButton from '@/components/LogoutButton';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'SkillSculptor',
  description: 'Shape Your Future - AI-powered personalized learning',
  manifest: '/manifest.json',
  themeColor: '#3399FF',

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
  };

function HeaderContent() {
  return (
    <header className="w-full border-b border-border/50 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/" className="font-semibold text-lg">Skill Sculptor</a>
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
  // We need to use dynamic import to avoid SSR issues
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AuthButtonsClient />;
}

function AuthButtonsClient() {
  // This will be rendered only on client side
  const { isAuthenticated, isLoading } = require('@/lib/auth-context').useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <LogoutButton />;
  }

  // Only show on login page
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return null;
  }

  return <GoogleSignInButton />;
}

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
              <HeaderContent />
              <main className="pt-16">{children}</main>
              <Toaster />
            </AuthProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}