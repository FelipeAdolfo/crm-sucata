import { api } from './api';
import type { DashboardMetrics, OpportunityStage, User } from '@/types';

export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getPipeline: async (): Promise<Record<OpportunityStage, any[]>> => {
    const response = await api.get('/dashboard/pipeline');
    return response.data;
  },

  getTeamPerformance: async (): Promise<Array<{
    user: User;
    metrics: {
      totalOpportunities: number;
      convertedOpportunities: number;
      conversionRate: number;
      totalVisits: number;
      visitsThisMonth: number;
    };
  }>> => {
    const response = await api.get('/dashboard/team-performance');
    return response.data;
  },

  getTrends: async (months?: number): Promise<Array<{
    month: string;
    newOpportunities: number;
    convertedOpportunities: number;
    completedVisits: number;
  }>> => {
    const response = await api.get('/dashboard/trends', { params: { months } });
    return response.data;
  },
};
