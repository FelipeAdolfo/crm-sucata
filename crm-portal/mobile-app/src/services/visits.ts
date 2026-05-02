import { api } from './api';
import type { VisitRecord } from '../types';

export const visitsService = {
  getAll: async (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    const res = await api.get(`/visits?${query.toString()}`);
    return res.data;
  },

  create: async (data: {
    opportunityId: string;
    scheduledDate: string;
    objective?: string;
    notes?: string;
  }) => {
    const res = await api.post('/visits', data);
    return res.data;
  },

  checkIn: async (id: string, lat: number, lng: number) => {
    const res = await api.post(`/visits/${id}/checkin`, { latitude: lat, longitude: lng });
    return res.data;
  },

  complete: async (id: string, data: { notes?: string; outcome?: string }) => {
    const res = await api.post(`/visits/${id}/complete`, data);
    return res.data;
  },
};
