import { api } from './api';
import type { Opportunity } from '../types';

export const opportunitiesService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; type?: string; stage?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.stage) query.append('stage', params.stage);
    const res = await api.get(`/opportunities?${query.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<Opportunity> => {
    const res = await api.get(`/opportunities/${id}`);
    return res.data;
  },

  create: async (data: Partial<Opportunity>) => {
    const res = await api.post('/opportunities', data);
    return res.data;
  },

  updateStage: async (id: string, stage: string, notes?: string) => {
    const res = await api.put(`/opportunities/${id}/stage`, { stage, notes });
    return res.data;
  },
};
