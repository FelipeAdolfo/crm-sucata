import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tempToken: string | null;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  pendingApproval: boolean;
  approvalMessage: string | null;
  
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setTempToken: (token: string) => void;
  clearTempToken: () => void;
  setPendingApproval: (message: string) => void;
  clearPendingApproval: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tempToken: null,
      isAuthenticated: false,
      requiresTwoFactor: false,
      pendingApproval: false,
      approvalMessage: null,

      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ 
          user, 
          token, 
          refreshToken,
          isAuthenticated: true, 
          requiresTwoFactor: false,
          pendingApproval: false,
          approvalMessage: null,
        });
      },

      setTempToken: (tempToken) => {
        set({ tempToken, requiresTwoFactor: true });
      },

      clearTempToken: () => {
        set({ tempToken: null, requiresTwoFactor: false });
      },

      setPendingApproval: (message) => {
        set({ 
          pendingApproval: true, 
          approvalMessage: message,
          isAuthenticated: false,
        });
      },

      clearPendingApproval: () => {
        set({ 
          pendingApproval: false, 
          approvalMessage: null,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ 
          user: null, 
          token: null, 
          refreshToken: null,
          tempToken: null,
          isAuthenticated: false, 
          requiresTwoFactor: false,
          pendingApproval: false,
          approvalMessage: null,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
