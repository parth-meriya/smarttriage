'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role } from '@/types/triage';
import { authApi, DEMO_CREDENTIALS } from '@/lib/api/auth';
import { UserProfile, UserRole } from '@/lib/api/types';

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>('Doctor');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authApi.getStoredToken();
      const storedUser = authApi.getStoredUser();

      if (storedToken && storedUser) {
        setUser(storedUser);
        setRole(storedUser.role);
        setIsLoading(false);
      } else {
        // Automatically sign in as default demo role (Doctor)
        try {
          const creds = DEMO_CREDENTIALS['Doctor'];
          const resp = await authApi.login(creds);
          setUser(resp.user);
          setRole('Doctor');
        } catch (err) {
          console.warn('[SmartTriage Auth] Initial demo login fallback:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await authApi.login({ username, password });
      setUser(resp.user);
      setRole(resp.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: Role) => {
    setIsLoading(true);
    try {
      const creds = DEMO_CREDENTIALS[newRole];
      if (creds) {
        const resp = await authApi.login(creds);
        setUser(resp.user);
        setRole(newRole);
      } else {
        setRole(newRole);
      }
    } catch (err) {
      console.warn(`[SmartTriage Auth] Failed to authenticate as ${newRole}, switching locally:`, err);
      setRole(newRole);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setRole('Doctor');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
