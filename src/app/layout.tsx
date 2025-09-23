// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { AuthProvider } from "@/lib/api"; // використовується локально, не експортується

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Skill Sculptor",
  description: "Веб-додаток для розвитку навичок",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <header className="w-full border-b border-border/50 bg-transparent">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <a href="/" className="font-semibold text-lg">Skill Sculptor</a>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <GoogleSignInButton />
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
