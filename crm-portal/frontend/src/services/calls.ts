import { api } from './api';

export interface CallRecord {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  opportunityId: string | null;
  userId: string | null;
  metadata: {
    telefone: string;
    nome_contato: string;
    duracao_segundos: number;
    tipo_chamada: string;
    data_hora_ms: number;
    origem: string;
    entidade_tipo: string;
    contato_nome: string | null;
  } | null;
  opportunity: {
    id: string;
    name: string;
    phone: string | null;
    type: string;
    stage: string;
  } | null;
  user: {
    id: string;
    name: string;
  } | null;
}

export interface CallStats {
  total: number;
  completed: number;
  missed: number;
  attempted: number;
}

export interface CallRegisterPayload {
  telefone: string;
  nome_contato: string;
  duracao_segundos: number;
  data_hora_ms: number;
  tipo_chamada?: 'RECEBIDA' | 'REALIZADA' | 'PERDIDA';
  user_id?: string;
}

export interface CallRegisterResponse {
  success: boolean;
  message: string;
  activity: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
  };
  opportunity: {
    id: string;
    name: string;
    phone: string | null;
    type: string;
    stage: string;
    city: string | null;
    state: string | null;
    assignedTo: { id: string; name: string } | null;
  } | null;
}

export interface CallsListResponse {
  calls: CallRecord[];
  stats: CallStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CallStatsResponse {
  periodo: number;
  total: number;
  completed: number;
  missed: number;
  attempted: number;
  avgDurationSeconds: number;
  avgDurationFormatted: string;
  conversionRate: number;
}

export const callsService = {
  // Listar chamadas registradas
  getCalls: async (params?: {
    opportunityId?: string;
    userId?: string;
    tipo?: string;
    periodo?: number;
    page?: number;
    limit?: number;
  }): Promise<CallsListResponse> => {
    const query = new URLSearchParams();
    if (params?.opportunityId) query.append('opportunityId', params.opportunityId);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.tipo) query.append('tipo', params.tipo);
    if (params?.periodo) query.append('periodo', String(params.periodo));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await api.get(`/calls?${query.toString()}`);
    return response.data;
  },

  // Estatisticas de chamadas
  getStats: async (periodo?: number): Promise<CallStatsResponse> => {
    const query = periodo ? `?periodo=${periodo}` : '';
    const response = await api.get(`/calls/stats${query}`);
    return response.data;
  },

  // Registrar chamada (usado pelo app Android)
  register: async (payload: CallRegisterPayload): Promise<CallRegisterResponse> => {
    const response = await api.post('/calls/register', payload);
    return response.data;
  },

  // Excluir registro de chamada
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/calls/${id}`);
    return response.data;
  },
};
