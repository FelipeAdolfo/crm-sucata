import { api } from './api';
import type { CallRecord } from '../types';

export const callsService = {
  getAll: async (params?: { periodo?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.periodo) query.append('periodo', String(params.periodo));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const res = await api.get(`/calls?${query.toString()}`);
    return res.data;
  },

  getStats: async (periodo?: number) => {
    const query = periodo ? `?periodo=${periodo}` : '';
    const res = await api.get(`/calls/stats${query}`);
    return res.data;
  },

  register: async (payload: {
    telefone: string;
    nome_contato: string;
    duracao_segundos: number;
    data_hora_ms: number;
    tipo_chamada?: string;
    user_id?: string;
  }) => {
    const res = await api.post('/calls/register', payload);
    return res.data;
  },
};
