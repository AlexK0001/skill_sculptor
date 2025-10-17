"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User, Skill } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiContextType {
  get: (endpoint: string) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const makeRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  const api: ApiContextType = {
    get: (endpoint: string) => makeRequest(endpoint, { method: 'GET' }),
    post: (endpoint: string, data?: any) =>
      makeRequest(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    put: (endpoint: string, data?: any) =>
      makeRequest(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    delete: (endpoint: string) =>
      makeRequest(endpoint, { method: 'DELETE' }),
  };

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) localStorage.setItem("auth_token", token);
      else localStorage.removeItem("auth_token");
    } catch {}
  }

  getToken(): string | null {
    if (this.token) return this.token;
    try {
      const t = localStorage.getItem("auth_token");
      if (t) {
        this.token = t;
        return t;
      }
    } catch {}
    return null;
  }

  private buildUrl(path: string) {
    if (!path.startsWith("/")) path = "/" + path;
    return API_BASE ? `${API_BASE}${path}` : path;
  }

  async request<T = any>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(`/api${path}`);
    const headers: Record<string, string> = {};

    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== "string") {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method: opts.method || "GET",
      credentials: "include",
      headers: { ...headers, ...(opts.headers || {}) },
      body: opts.body
        ? opts.body instanceof FormData || typeof opts.body === "string"
          ? opts.body
          : JSON.stringify(opts.body)
        : undefined,
    };

    try {
      const res = await fetch(url, init);
      const status = res.status;
      let json: any = null;
      try {
        json = await res.json();
      } catch {}

      if (!res.ok) {
        return { error: (json && json.error) || res.statusText || "Request failed", status };
      }
      return { data: json, status };
    } catch (err: any) {
      return { error: err?.message || "Network error" };
    }
  }

  /* --------------------
     Auth
  -------------------- */
  async login(email: string, password: string): Promise<ApiResponse<User>> {
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

  async register(email: string, name: string, password: string): Promise<ApiResponse<User>> {
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

  async getCurrentUser(): Promise<User | null> {
    const res = await this.request<{ user?: User }>(`/auth/verify`, { method: "GET" });
    return res.data?.user || null;
  }

  /* --------------------
     Skills
  -------------------- */
  async getSkills(userId?: string): Promise<ApiResponse<Skill[]>> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return this.request<Skill[]>(`/skills${q}`, { method: "GET" });
  }

  async createSkill(userId: string | null, skillData: Partial<Skill>): Promise<ApiResponse<Skill>> {
    const body = userId ? { userId, ...skillData } : skillData;
    return this.request<Skill>(`/skills`, { method: "POST", body });
  }

  async updateSkill(id: string, skillData: Partial<Skill>): Promise<ApiResponse<Skill>> {
    return this.request<Skill>(`/skills/${encodeURIComponent(id)}`, { method: "PUT", body: skillData });
  }

  async deleteSkill(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/skills/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear local state
        this.token = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  }
}

export const apiClient = new ApiClient();

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
  if (!apiClient.getToken()) return; // якщо токена нема — не викликаємо verify
  const u = await apiClient.getCurrentUser();
  setUser(u);
};

  useEffect(() => {
    try {
      const tok = localStorage.getItem("auth_token");
      if (tok) apiClient.setToken(tok);
    } catch {}

    refreshUser();

    const handler = () => refreshUser();
    window.addEventListener("auth:refresh", handler);
    return () => window.removeEventListener("auth:refresh", handler);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.login(email, password);
    if (res.data) setUser(res.data);
    return res;
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await apiClient.register(email, name, password);
    if (res.data) setUser(res.data);
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

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
