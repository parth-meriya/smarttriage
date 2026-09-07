import { apiClient } from './client';
import { UserProfile, UserRole } from './types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export const DEMO_CREDENTIALS: Record<UserRole, LoginCredentials> = {
  Doctor: { username: 'dr_alex', password: 'DoctorPass123!' },
  Nurse: { username: 'jordan_lee', password: 'NursePass123!' },
  Admin: { username: 'sam_morgan', password: 'AdminPass123!' },
  Patient: { username: 'jamie_smith', password: 'PatientPass123!' },
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/accounts/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (typeof window !== 'undefined' && response.access) {
      localStorage.setItem('smarttriage_access_token', response.access);
      localStorage.setItem('smarttriage_refresh_token', response.refresh);
      localStorage.setItem('smarttriage_user', JSON.stringify(response.user));
    }

    return response;
  },

  register: async (data: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
    phone_number?: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (typeof window !== 'undefined' && response.access) {
      localStorage.setItem('smarttriage_access_token', response.access);
      localStorage.setItem('smarttriage_refresh_token', response.refresh);
      localStorage.setItem('smarttriage_user', JSON.stringify(response.user));
    }

    return response;
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return apiClient<UserProfile>('/accounts/me/');
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      const refresh = localStorage.getItem('smarttriage_refresh_token');
      if (refresh) {
        try {
          await apiClient('/accounts/logout/', {
            method: 'POST',
            body: JSON.stringify({ refresh }),
          });
        } catch {
          // Ignore network errors on logout
        }
      }
      localStorage.removeItem('smarttriage_access_token');
      localStorage.removeItem('smarttriage_refresh_token');
      localStorage.removeItem('smarttriage_user');
    }
  },

  getStoredUser: (): UserProfile | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('smarttriage_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserProfile;
    } catch {
      return null;
    }
  },

  getStoredToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('smarttriage_access_token');
  },
};
