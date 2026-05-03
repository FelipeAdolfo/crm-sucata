import { api } from './api';
import type { LoginRequest, AuthResponse, User, RegisterRequest, ChangePasswordRequest } from '@/types';

export const authService = {
  // ============================================
  // AUTENTICACAO
  // ============================================

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ message: string; user: { id: string; email: string; name: string; status: string } }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  logoutAll: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // ============================================
  // PERFIL DO USUARIO
  // ============================================

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // ============================================
  // APROVACAO DE USUARIOS (ADMIN)
  // ============================================

  getPendingUsers: async (): Promise<Array<{
    id: string;
    email: string;
    name: string;
    cpf: string | null;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
  }>> => {
    const response = await api.get('/auth/pending-users');
    return response.data;
  },

  approveUser: async (userId: string, role?: string): Promise<{ message: string; user: User }> => {
    const response = await api.post(`/auth/approve/${userId}`, { role });
    return response.data;
  },

  rejectUser: async (userId: string, reason?: string): Promise<{ message: string }> => {
    const response = await api.post(`/auth/reject/${userId}`, { reason });
    return response.data;
  },

  suspendUser: async (userId: string, reason?: string): Promise<{ message: string }> => {
    const response = await api.post(`/auth/suspend/${userId}`, { reason });
    return response.data;
  },

  activateUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.post(`/auth/activate/${userId}`);
    return response.data;
  },
};
