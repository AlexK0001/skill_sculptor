"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";


export default function GoogleSignInButton({ 
  className = "",
  showIcon = true 
}: { 
  className?: string;
  showIcon?: boolean;
}) {
  const pathname = usePathname();
  
  // Hide on login page (it's already there)
  if (pathname === '/login') {
    return null;
  }
  return (
    <a href="/api/auth/google" className={className} aria-label="Sign in with Google">
      <Button variant="default" size="sm" className="inline-flex items-center gap-2">
        {showIcon && <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />}
        <span>Sign in with Google</span>
      </Button>
    </a>
  );
}
