"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop } from "lucide-react";

/**
 * ThemeToggle — циклічний перемикач між "light" | "dark" | "system"
 * Записує вибір у localStorage ("theme") і встановлює/знімає class "dark" на document.documentElement
 */

type ThemeMode = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    // init from localStorage or system
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
    } else {
      setMode("system");
    }
  }, []);

  useEffect(() => {
    function apply(m: ThemeMode) {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const useDark = m === "dark" || (m === "system" && prefersDark);

      if (useDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem("theme", m);
      } catch {
        /* ignore */
      }
    }

    apply(mode);

    // also update on system change if mode === 'system'
    let mq: MediaQueryList | null = null;
    if (mode === "system" && window.matchMedia) {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
      return () => {
        mq && (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
      };
    }
    // no cleanup needed otherwise
  }, [mode]);

  const cycle = () => {
    setMode((m) => (m === "light" ? "dark" : m === "dark" ? "system" : "light"));
  };

  return (
    <Button variant="outline" size="sm" onClick={cycle} aria-label="Toggle theme" title={`Theme: ${mode}`}>
      {mode === "dark" ? <Moon className="h-4 w-4" /> : mode === "light" ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
      <span className="sr-only">Theme</span>
    </Button>
  );
}
