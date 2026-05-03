import { api } from './api';
import type { Opportunity, PaginatedResponse, OpportunityStage } from '@/types';

interface CreateOpportunityData {
  name: string;
  type: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  responsibleName?: string;
  responsibleRole?: string;
  responsiblePhone?: string;
  observations?: string;
  source?: string;
  assignedTo?: string;
}

interface UpdateOpportunityData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  responsibleName?: string;
  responsibleRole?: string;
  responsiblePhone?: string;
  observations?: string;
  source?: string;
  scrapType?: string;
  quantityGenerated?: number;
  containerWeight?: number;
  containerType?: string;
  exchangeFrequency?: string;
  currentBuyer?: string;
  competitorPrice?: number;
  competitorName?: string;
  proposedPrice?: number;
  negotiatedVolume?: number;
  paymentTerms?: string;
  collectionFrequency?: string;
  assignedTo?: string;
}

export const opportunityService = {
  getAll: async (params?: {
    stage?: string;
    type?: string;
    status?: string;
    assignedTo?: string;
    city?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Opportunity>> => {
    const response = await api.get('/opportunities', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Opportunity> => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  create: async (data: CreateOpportunityData): Promise<Opportunity> => {
    const response = await api.post('/opportunities', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOpportunityData): Promise<Opportunity> => {
    const response = await api.put(`/opportunities/${id}`, data);
    return response.data;
  },

  changeStage: async (id: string, stage: OpportunityStage, lowGenType?: string, reason?: string): Promise<Opportunity> => {
    const response = await api.patch(`/opportunities/${id}/stage`, { stage, lowGenType, reason });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
  },

  getPipeline: async (): Promise<Record<OpportunityStage, Opportunity[]>> => {
    const response = await api.get('/opportunities/pipeline/overview');
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    converted: number;
    conversionRate: number;
    byStage: Array<{ stage: string; _count: { stage: number } }>;
    byType: Array<{ type: string; _count: { type: number } }>;
    byStatus: Array<{ status: string; _count: { status: number } }>;
  }> => {
    const response = await api.get('/opportunities/stats/summary');
    return response.data;
  },
};
