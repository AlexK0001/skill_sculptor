"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

/**
 * Дуже простий компонент — клієнтське посилання на бекенд-ендпоінт
 * /api/auth/google => редірект на Google OAuth
 */

export default function GoogleSignInButton({ className = "" }: { className?: string }) {
  return (
    <a href="/api/auth/google" className={className} aria-label="Sign in with Google">
      <Button variant="default" size="sm" className="inline-flex items-center gap-2">
        <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />
        <span>Sign in with Google</span>
      </Button>
    </a>
  );
}
