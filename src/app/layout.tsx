import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import React, { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] })

interface AuthProviderProps {
  children: ReactNode;
}

export const metadata = {
  title: 'Skill Sculptor',
  description: 'Веб-додаток для розвитку навичок',
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
