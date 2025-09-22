// src/lib/api.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User, Skill } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch {
      // ignore (e.g. SSR or private mode)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    try {
      const t = localStorage.getItem("auth_token");
      if (t) {
        this.token = t;
        return t;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private buildUrl(path: string) {
    if (!path.startsWith("/")) path = "/" + path;
    if (API_BASE) return `${API_BASE}${path}`;
    return path;
  }

  async request<T = any>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(`/api${path}`);
    // include cookies (for OAuth cookie-based token)
    const init: RequestInit = { credentials: "include", headers: {}, ...opts };

    // If we have a saved token, add Authorization header
    const token = this.getToken();
    if (token) {
      // ensure headers exists
      init.headers = { ...(init.headers as any), Authorization: `Bearer ${token}` };
    }

    if (init.body && typeof init.body !== "string" && !(init.body instanceof FormData)) {
      init.headers = { ...(init.headers as any), "Content-Type": "application/json" };
      init.body = JSON.stringify(init.body);
    }

    try {
      const res = await fetch(url, init);
      const status = res.status;
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // no JSON
      }
      if (!res.ok) {
        return { error: (json && json.error) || res.statusText || "Request failed", status };
      }
      return { data: json, status };
    } catch (err: any) {
      return { error: err?.message || "Network error" };
    }
  }

  // Auth helpers
  async login(email: string, password: string) {
    const res = await this.request<{ token?: string; user?: User }>(`/auth/login`, {
      method: "POST",
      body: { email, password },
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
      return { data: res.data.user };
    }
    return { error: res.error || "Login failed" };
  }

  async register(email: string, name: string, password: string) {
    const res = await this.request<{ token?: string; user?: User }>(`/auth/register`, {
      method: "POST",
      body: { email, name, password },
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
      return { data: res.data.user };
    }
    return { error: res.error || "Register failed" };
  }

  async logout() {
    // If you have a server-side logout endpoint you can call it; otherwise clear local token.
    // Try to call /auth/logout if exists (non-fatal).
    await this.request("/auth/logout", { method: "POST" }).catch(() => void 0);
    this.setToken(null);
  }

  // Example resource methods (extend as needed)
  async getSkills(): Promise<ApiResponse<Skill[]>> {
    return this.request<Skill[]>(`/skills`, { method: "GET" });
  }

  async createSkill(skillData: Partial<Skill>) {
    return this.request<Skill>(`/skills`, { method: "POST", body: skillData });
  }

  async updateSkill(id: string, skillData: Partial<Skill>) {
    return this.request<Skill>(`/skills/${encodeURIComponent(id)}`, { method: "PUT", body: skillData });
  }

  async deleteSkill(id: string) {
    return this.request<{ success: boolean }>(`/skills/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

export function useApi() {
  return apiClient;
}

/* ------------------------------
   Auth context / provider
   ------------------------------ */

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (email: string, name: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    // try to verify with cookie or saved token
    // This endpoint (server) should accept token in cookie or Authorization header
    const res = await apiClient.request<{ user?: User }>(`/auth/verify`, { method: "GET" });
    if (res.data && (res.data as any).user) {
      setUser((res.data as any).user);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // initialize token from localStorage if present
    try {
      const tok = localStorage.getItem("auth_token");
      if (tok) apiClient.setToken(tok);
    } catch {
      // ignore
    }

    // attempt to refresh user on mount (this will pick up cookie-based OAuth tokens)
    refreshUser();

    // allow manual refresh via window event (used by other parts if necessary)
    const handler = () => {
      refreshUser();
    };
    window.addEventListener("auth:refresh", handler);
    return () => window.removeEventListener("auth:refresh", handler);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.login(email, password);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await apiClient.register(email, name, password);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
