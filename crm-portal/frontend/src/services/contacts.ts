import { api } from './api';
import type { Contact } from '@/types';

export const contactsService = {
  getByOpportunity: async (opportunityId: string): Promise<Contact[]> => {
    const response = await api.get(`/contacts/opportunity/${opportunityId}`);
    return response.data;
  },

  create: async (data: {
    opportunityId: string;
    name: string;
    role?: string;
    email?: string;
    phoneMobile?: string;
    phoneLandline?: string;
    extension?: string;
    linkedinUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    isMainContact?: boolean;
  }): Promise<Contact> => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },
};
