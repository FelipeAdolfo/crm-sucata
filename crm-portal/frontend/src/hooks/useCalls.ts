import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callsService, type CallRegisterPayload } from '@/services/calls';
import toast from 'react-hot-toast';

export const useCalls = (params?: {
  opportunityId?: string;
  userId?: string;
  tipo?: string;
  periodo?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['calls', params],
    queryFn: () => callsService.getCalls(params),
  });
};

export const useCallStats = (periodo?: number) => {
  return useQuery({
    queryKey: ['calls-stats', periodo],
    queryFn: () => callsService.getStats(periodo),
  });
};

export const useRegisterCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CallRegisterPayload) => callsService.register(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      if (data.opportunity) {
        toast.success(
          `Chamada registrada em "${data.opportunity.name}"`,
          { duration: 4000 }
        );
      } else {
        toast.success(data.message);
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        toast.error(
          'Numero nao vinculado a nenhuma oportunidade. Cadastre a empresa primeiro.',
          { duration: 5000 }
        );
      } else {
        toast.error(error.response?.data?.error || 'Erro ao registrar chamada');
      }
    },
  });
};

export const useDeleteCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => callsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['calls-stats'] });
      toast.success('Registro de chamada removido');
    },
    onError: () => {
      toast.error('Erro ao remover registro');
    },
  });
};
