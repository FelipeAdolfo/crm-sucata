import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardService.getMetrics,
  });
};

export const usePipeline = () => {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: dashboardService.getPipeline,
  });
};

export const useTeamPerformance = () => {
  return useQuery({
    queryKey: ['dashboard', 'team-performance'],
    queryFn: dashboardService.getTeamPerformance,
  });
};

export const useTrends = (months?: number) => {
  return useQuery({
    queryKey: ['dashboard', 'trends', months],
    queryFn: () => dashboardService.getTrends(months),
  });
};
