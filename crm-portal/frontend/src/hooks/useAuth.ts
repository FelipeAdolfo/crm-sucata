import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import type { LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/types';

// ============================================
// LOGIN
// ============================================
export const useLogin = () => {
  const { setAuth, setPendingApproval } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.token) {
        setAuth(data.user, data.token, data.refreshToken || '');
        queryClient.setQueryData(['user'], data.user);
      }
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.code;
      if (errorCode === 'PENDING_APPROVAL') {
        setPendingApproval(error.response?.data?.error || 'Aguardando aprovacao');
      }
    },
  });
};

// ============================================
// REGISTRO
// ============================================
export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

// ============================================
// LOGOUT
// ============================================
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      logout();
      queryClient.clear();
    },
  });
};

// ============================================
// PERFIL DO USUARIO
// ============================================
export const useMe = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// ALTERAR SENHA
// ============================================
export const useChangePassword = () => {
  return useMutation({
    mutationFn: authService.changePassword,
  });
};

// ============================================
// APROVACAO DE USUARIOS (ADMIN)
// ============================================
export const usePendingUsers = () => {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: authService.getPendingUsers,
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role?: string }) =>
      authService.approveUser(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useRejectUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      authService.rejectUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      authService.suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
