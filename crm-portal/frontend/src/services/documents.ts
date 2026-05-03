import { api } from './api';

export interface DocumentFile {
  id: string;
  title: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'SIGNED' | 'ARCHIVED';
  signatureData?: string;
  signedAt?: string;
  signedBy?: string;
  opportunity?: { id: string; name: string } | null;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export interface DocumentsResponse {
  documents: DocumentFile[];
  total: number;
  page: number;
  pages: number;
}

export const documentsService = {
  getAll: async (params?: { opportunityId?: string; status?: string; page?: number; limit?: number }): Promise<DocumentsResponse> => {
    const query = new URLSearchParams();
    if (params?.opportunityId) query.append('opportunityId', params.opportunityId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const res = await api.get(`/documents?${query.toString()}`);
    return res.data;
  },

  upload: async (data: { title: string; type: string; opportunityId?: string; file: File }): Promise<DocumentFile> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    if (data.opportunityId) formData.append('opportunityId', data.opportunityId);
    formData.append('file', data.file);

    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  download: async (id: string): Promise<Blob> => {
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return res.data;
  },

  sign: async (id: string, signature: string): Promise<{ message: string; document: DocumentFile }> => {
    const res = await api.post(`/documents/${id}/sign`, { signature });
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};
