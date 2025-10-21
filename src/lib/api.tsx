// src/lib/api.tsx - COMPLETE API CLIENT (NO EXPORT CONFLICTS)
'use client';

import React, { createContext, useContext } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiContextType {
  get: (endpoint: string) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
  // Skill methods
  getSkills: (userId: string) => Promise<{ error?: string; data?: any[] }>;
  createSkill: (userId: string, skill: any) => Promise<{ error?: string; data?: any }>;
  updateSkill: (skillId: string, skill: any) => Promise<{ error?: string; data?: any }>;
  deleteSkill: (skillId: string) => Promise<{ error?: string }>;
  getCurrentUser: () => any;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const makeRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
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
    
    // Skill CRUD methods
    getSkills: async (userId: string) => {
      try {
        const response = await makeRequest('/skills', { method: 'GET' });
        return { data: response.skills || [] };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    
    createSkill: async (userId: string, skill: any) => {
      try {
        const response = await makeRequest('/skills', {
          method: 'POST',
          body: JSON.stringify(skill),
        });
        return { data: response.skill };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    
    updateSkill: async (skillId: string, skill: any) => {
      try {
        const response = await makeRequest(`/skills/${skillId}`, {
          method: 'PUT',
          body: JSON.stringify(skill),
        });
        return { data: response.skill };
      } catch (error: any) {
        return { error: error.message };
      }
    },
    
    deleteSkill: async (skillId: string) => {
      try {
        await makeRequest(`/skills/${skillId}`, { method: 'DELETE' });
        return {};
      } catch (error: any) {
        return { error: error.message };
      }
    },
    
    getCurrentUser: () => {
      // Use auth context to get current user
      if (typeof window !== 'undefined') {
        // This is a workaround - ideally use useAuth hook directly in components
        return null;
      }
      return null;
    },
  };

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}