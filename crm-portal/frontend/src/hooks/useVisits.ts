import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Visit } from '@/types';

interface GetVisitsParams {
  opportunityId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const useVisits = (params?: GetVisitsParams) => {
  return useQuery({
    queryKey: ['visits', params],
    queryFn: async () => {
      const response = await api.get('/visits', { params });
      return response.data.visits as Visit[];
    },
  });
};

export const useUpcomingVisits = () => {
  return useQuery({
    queryKey: ['visits', 'upcoming'],
    queryFn: async () => {
      const response = await api.get('/visits/upcoming');
      return response.data as Visit[];
    },
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/visits', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.opportunityId] });
    },
  });
};

export const useCompleteVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/visits/${id}/complete`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'upcoming'] });
    },
  });
};

export const useCancelVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/visits/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};

export const useUpdateVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/visits/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits', 'upcoming'] });
    },
  });
};
