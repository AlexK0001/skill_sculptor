// src/lib/api.ts
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Skill } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (options.headers) {
        const provided = new Headers(options.headers as HeadersInit);
        provided.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers,
      });

      // try parse JSON, but tolerate non-json responses
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { error: (data && (data as any).error) || 'An error occurred' };
      }

      return { data: data as T };
    } catch (err) {
      console.error('Request error', err);
      return { error: 'Network error' };
    }
  }

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const res = await this.request<{ token: string; user: any }>(`/users/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data) {
      this.token = res.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    }
    return res;
  }

  async register(email: string, name: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const res = await this.request<{ token: string; user: any }>(`/users`, {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    if (res.data) {
      this.token = res.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    }
    return res;
  }

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Skill CRUD

  /**
   * Get skills. If userId provided, backend should filter by userId (or provide your own endpoint).
   */
  async getSkills(userId?: string): Promise<ApiResponse<Skill[]>> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request<Skill[]>(`/skills${qs}`, { method: 'GET' });
  }

  async createSkill(userId: string, skillData: Partial<Skill>): Promise<ApiResponse<Skill>> {
    const payload = { ...skillData, userId };
    return this.request<Skill>(`/skills`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSkill(id: string, skillData: Partial<Skill>): Promise<ApiResponse<Skill>> {
    return this.request<Skill>(`/skills/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
  }

  async deleteSkill(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/skills/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

// singleton instance
export const apiClient = new ApiClient();

// hook helper
export function useApi() {
  return apiClient;
}

// Auth context
interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<ApiResponse<any>>;
  register: (email: string, name: string, password: string) => Promise<ApiResponse<any>>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = apiClient.getCurrentUser();
    if (savedUser && apiClient.isAuthenticated()) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    if (response.data) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const register = async (email: string, name: string, password: string) => {
    const response = await apiClient.register(email, name, password);
    if (response.data) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
    value={{ user, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
