import { api } from './api';
import type { User } from '../types';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  updateProfile: async (data: Partial<RegisterData>) => {
    const res = await api.patch('/users/profile', data);
    return res.data;
  },
};
