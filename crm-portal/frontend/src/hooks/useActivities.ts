import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Activity, CreateActivityData, ActivityFilters } from '@/types';

const ACTIVITIES_KEY = 'activities';

export const useActivities = (filters?: ActivityFilters) => {
  return useQuery({
    queryKey: [ACTIVITIES_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.opportunityId) {
        params.append('opportunityId', filters.opportunityId);
      }
      if (filters?.userId) {
        params.append('userId', filters.userId);
      }
      if (filters?.type) {
        params.append('type', filters.type);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const { data } = await api.get<Activity[]>(`/activities?${params.toString()}`);
      return data;
    },
    enabled: !!filters?.opportunityId || !!filters?.userId,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityData: CreateActivityData) => {
      const { data } = await api.post<Activity>('/activities', activityData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_KEY] });
      if (variables.opportunityId) {
        queryClient.invalidateQueries({ 
          queryKey: [ACTIVITIES_KEY, { opportunityId: variables.opportunityId }] 
        });
      }
    },
  });
};

export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: [ACTIVITIES_KEY, 'recent', limit],
    queryFn: async () => {
      const { data } = await api.get<Activity[]>(`/activities/recent?limit=${limit}`);
      return data;
    },
  });
};
