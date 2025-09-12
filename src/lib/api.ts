// src/lib/api.ts
import { OnboardingData } from './types';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
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

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error occurred' };
    }
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async register(email: string, name: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });

    if (response.data) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async saveLearningPlan(planData: OnboardingData & { dailyPlans?: any; fullPlans?: any }) {
    return this.request('/learning-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getLearningPlans() {
    return this.request('/learning-plans', {
      method: 'GET',
    });
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
}

// Create singleton instance
export const apiClient = new ApiClient();

// React hook for using API client
export function useApi() {
  return apiClient;
}

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
    <useAuth.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated,
    }}>
      {children}
    </useAuth.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}