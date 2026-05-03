import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '@/services/opportunities';
import type { OpportunityStage } from '@/types';

export const useOpportunities = (params?: {
  stage?: string;
  type?: string;
  status?: string;
  assignedTo?: string;
  city?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () => opportunityService.getAll(params),
  });
};

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunityService.getById(id),
    enabled: !!id,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: opportunityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      opportunityService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
};

export const useChangeStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage, lowGenType, reason }: { 
      id: string; 
      stage: OpportunityStage; 
      lowGenType?: string;
      reason?: string;
    }) => opportunityService.changeStage(id, stage, lowGenType, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: opportunityService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const usePipeline = () => {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: opportunityService.getPipeline,
  });
};

export const useOpportunityStats = () => {
  return useQuery({
    queryKey: ['opportunityStats'],
    queryFn: opportunityService.getStats,
  });
};
