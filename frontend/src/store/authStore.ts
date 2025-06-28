import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'teacher' | 'student';
  group_id?: string;
  group?: {
    id: string;
    name: string;
    program?: {
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      disabled_days: string[];
    };
  };
  profile_image?: string;
  is_active: boolean;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

import API_BASE_URL from '../config/api';

console.log('AuthStore: API_BASE_URL is set to:', API_BASE_URL);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        console.log(
          'AuthStore: Starting login request to:',
          `${API_BASE_URL}/auth/login`
        );

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          console.log('AuthStore: Response status:', response.status);

          const data = await response.json();
          console.log('AuthStore: Response data:', data);

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('AuthStore: Login successful');
          return true;
        } catch (error) {
          console.error('AuthStore: Login error:', error);
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token invalid');
          }

          const data = await response.json();
          set({
            user: data.user,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token is invalid, clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
