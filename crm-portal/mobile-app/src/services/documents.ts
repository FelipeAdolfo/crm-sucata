import { api } from './api';
import type { Document } from '../types';

export const documentsService = {
  getAll: async (params?: { opportunityId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.opportunityId) query.append('opportunityId', params.opportunityId);
    if (params?.status) query.append('status', params.status);
    const res = await api.get(`/documents?${query.toString()}`);
    return res.data;
  },

  upload: async (data: {
    title: string;
    type: string;
    opportunityId?: string;
    file: { uri: string; name: string; type: string };
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    if (data.opportunityId) formData.append('opportunityId', data.opportunityId);
    formData.append('file', {
      uri: data.file.uri,
      name: data.file.name,
      type: data.file.type,
    } as any);

    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  sign: async (id: string, signatureData: string) => {
    const res = await api.post(`/documents/${id}/sign`, { signature: signatureData });
    return res.data;
  },

  download: async (id: string) => {
    const res = await api.get(`/documents/${id}/download`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};
