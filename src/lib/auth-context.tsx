// src/lib/auth-context.tsx - VERIFIED VERSION
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token and get user data
  const verifyToken = useCallback(async (tokenToVerify: string) => {
    try {
      console.log('[Auth] Verifying token...');
      
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('[Auth] Token verification failed:', response.status);
        throw new Error('Invalid token');
      }

      const data = await response.json();
      console.log('[Auth] Token verified, user:', data.data?.user);

      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setToken(tokenToVerify);
        return true;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('[Auth] Verification error:', error);
      // Clear invalid token
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      return false;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Initializing...');
      
      // Try localStorage first
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        console.log('[Auth] Found stored token');
        await verifyToken(storedToken);
      } else {
        console.log('[Auth] No stored token found');
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [verifyToken]);

  // Login function
  const login = useCallback((newToken: string, newUser: User) => {
    console.log('[Auth] Login:', newUser.email);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log('[Auth] Logout');
    
    // Call logout API to clear cookies
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[Auth] Logout API error:', error);
    }
    
    // Clear state
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  // Update user function
  const updateUser = useCallback((updatedUser: User) => {
    console.log('[Auth] Update user:', updatedUser.email);
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}