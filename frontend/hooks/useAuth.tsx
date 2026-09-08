'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role } from '@/types/triage';
import { authApi, DEMO_CREDENTIALS } from '@/lib/api/auth';
import { UserProfile, UserRole } from '@/lib/api/types';
import { findStaffAccountByUsername } from '@/lib/api/staff';

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
    phone_number?: string;
  }) => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>('Doctor');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authApi.getStoredToken();
      const storedUser = authApi.getStoredUser();

      if (storedToken && storedUser) {
        setUser(storedUser);
        setRole(storedUser.role);
      }
      setIsInitializing(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    // 1. Check if username matches built-in demo credentials
    const matchingRole = (Object.keys(DEMO_CREDENTIALS) as UserRole[]).find(
      r => DEMO_CREDENTIALS[r].username.toLowerCase() === username.toLowerCase()
    );

    if (matchingRole && DEMO_CREDENTIALS[matchingRole].password === password) {
      const demoUser: UserProfile = {
        id: matchingRole === 'Doctor' ? '1' : matchingRole === 'Nurse' ? '2' : matchingRole === 'Admin' ? '3' : '4',
        username: username,
        first_name: matchingRole === 'Doctor' ? 'Alex' : matchingRole === 'Nurse' ? 'Jordan' : matchingRole === 'Admin' ? 'Sam' : 'Jamie',
        last_name: matchingRole === 'Doctor' ? 'Rivera' : matchingRole === 'Nurse' ? 'Lee' : matchingRole === 'Admin' ? 'Morgan' : 'Smith',
        role: matchingRole,
        display_name: matchingRole === 'Doctor' ? 'Dr. Alex Rivera' : matchingRole === 'Nurse' ? 'Jordan Lee' : matchingRole === 'Admin' ? 'Sam Morgan' : 'Jamie Smith',
        initials: matchingRole === 'Doctor' ? 'AR' : matchingRole === 'Nurse' ? 'JL' : matchingRole === 'Admin' ? 'SM' : 'JS'
      };
      setUser(demoUser);
      setRole(matchingRole);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smarttriage_user', JSON.stringify(demoUser));
        localStorage.setItem('smarttriage_access_token', 'demo_token');
      }
      setIsLoading(false);
      authApi.login({ username, password }).catch(() => {});
      return;
    }

    // 2. Check if username matches custom staff account (created by Admin or Doctor)
    const customStaff = findStaffAccountByUsername(username);
    if (customStaff) {
      if (customStaff.password !== password) {
        setIsLoading(false);
        throw new Error('Invalid username or password');
      }
      const staffUser: UserProfile = {
        id: customStaff.id,
        username: customStaff.username,
        first_name: customStaff.name.split(' ')[0],
        last_name: customStaff.name.split(' ').slice(1).join(' ') || '',
        role: customStaff.role as UserRole,
        display_name: customStaff.name,
        initials: customStaff.name.slice(0, 2).toUpperCase()
      };
      setUser(staffUser);
      setRole(customStaff.role as Role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smarttriage_user', JSON.stringify(staffUser));
        localStorage.setItem('smarttriage_access_token', 'staff_token_' + customStaff.id);
      }
      setIsLoading(false);
      return;
    }

    // 3. Fallback to API login
    try {
      const resp = await authApi.login({ username, password });
      setUser(resp.user);
      setRole(resp.user.role);
    } catch (err) {
      if (matchingRole) {
        const fallbackUser: UserProfile = {
          id: matchingRole === 'Doctor' ? '1' : matchingRole === 'Nurse' ? '2' : matchingRole === 'Admin' ? '3' : '4',
          username: username,
          first_name: matchingRole === 'Doctor' ? 'Alex' : matchingRole === 'Nurse' ? 'Jordan' : matchingRole === 'Admin' ? 'Sam' : 'Jamie',
          last_name: matchingRole === 'Doctor' ? 'Rivera' : matchingRole === 'Nurse' ? 'Lee' : matchingRole === 'Admin' ? 'Morgan' : 'Smith',
          role: matchingRole,
          display_name: matchingRole === 'Doctor' ? 'Dr. Alex Rivera' : matchingRole === 'Nurse' ? 'Jordan Lee' : matchingRole === 'Admin' ? 'Sam Morgan' : 'Jamie Smith',
          initials: matchingRole === 'Doctor' ? 'AR' : matchingRole === 'Nurse' ? 'JL' : matchingRole === 'Admin' ? 'SM' : 'JS'
        };
        setUser(fallbackUser);
        setRole(matchingRole);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smarttriage_user', JSON.stringify(fallbackUser));
          localStorage.setItem('smarttriage_access_token', 'demo_token');
        }
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
    phone_number?: string;
  }) => {
    setIsLoading(true);
    try {
      const resp = await authApi.register(data);
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
      setRole(newRole);
      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          role: newRole as UserRole,
          display_name: newRole === 'Doctor' ? 'Dr. Alex Rivera' : newRole === 'Nurse' ? 'Jordan Lee' : newRole === 'Admin' ? 'Sam Morgan' : 'Jamie Smith',
          initials: newRole === 'Doctor' ? 'AR' : newRole === 'Nurse' ? 'JL' : newRole === 'Admin' ? 'SM' : 'JS'
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smarttriage_user', JSON.stringify(updatedUser));
        }
      }
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
        isInitializing,
        login,
        register,
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
