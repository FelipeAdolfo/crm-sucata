import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

// ============================================
// FUNIL DE VENDAS - INDIVIDUAL E CONSOLIDADO
// ============================================

export const useFunnel = () => {
  const { user } = useAuthStore();
  
  // Funil individual do comprador logado
  const individualFunnel = useQuery({
    queryKey: ['funnel', 'individual', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await api.get(`/dashboard/funnel/individual?userId=${user.id}`);
      return response.data;
    },
    enabled: !!user && (user.role === 'PARTNER' || user.role === 'BUYER'),
  });

  // Funil consolidado (para gerentes, coordenadores, diretores)
  const consolidatedFunnel = useQuery({
    queryKey: ['funnel', 'consolidated'],
    queryFn: async () => {
      const response = await api.get('/dashboard/funnel/consolidated');
      return response.data;
    },
    enabled: !!user && ['MANAGER', 'INTEL_COORDINATOR', 'DIRECTOR', 'ADMIN'].includes(user.role),
  });

  return {
    individual: individualFunnel.data,
    isLoadingIndividual: individualFunnel.isLoading,
    consolidated: consolidatedFunnel.data,
    isLoadingConsolidated: consolidatedFunnel.isLoading,
  };
};

// ============================================
// BAIXA GERACAO - OPORTUNIDADES A DIRECIONAR
// ============================================

export const useLowGenOpportunities = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['opportunities', 'low-gen'],
    queryFn: async () => {
      const response = await api.get('/opportunities/low-generation');
      return response.data;
    },
    enabled: !!user,
  });
};

// ============================================
// CLASSIFICACAO AUTOMATICA
// ============================================

export const getAutoClassification = (
  type: string,
  quantityGenerated?: number,
  hasVisit?: boolean,
  visitResult?: string
): { stage: string; reason: string } | null => {
  // Fora de Perfil: quando nao tem geracao
  if (type === 'FONTE' && (!quantityGenerated || quantityGenerated === 0)) {
    return {
      stage: 'FORA_DE_PERFIL',
      reason: 'Fonte sem geracao de sucata',
    };
  }

  // Baixa Geracao: menos de 5 toneladas/mes
  if (type === 'FONTE' && quantityGenerated && quantityGenerated < 5000) {
    return {
      stage: 'BAIXA_GERACAO_DIR',
      reason: `Geracao de ${quantityGenerated}kg (${(quantityGenerated / 1000).toFixed(1)} ton) inferior a 5 ton/mes`,
    };
  }

  return null;
};

// Labels das fases do funil
export const stageLabels: Record<string, { label: string; color: string; description: string }> = {
  PRIMEIRO_CONTATO: { label: 'Primeiro Contato', color: '#94a3b8', description: 'Contato inicial com a fonte' },
  SEGUNDO_CONTATO: { label: 'Segundo Contato', color: '#60a5fa', description: 'Segundo contato, apresentacao de proposta' },
  VISITA: { label: 'Visita', color: '#8b5cf6', description: 'Visita tecnica ao local' },
  EM_NEGOCIACAO: { label: 'Em Negociacao', color: '#f59e0b', description: 'Negociacao de precos e condicoes' },
  CONTRA_PROPOSTA: { label: 'Contra Proposta', color: '#f97316', description: 'Contra proposta enviada' },
  EM_FECHAMENTO: { label: 'Em Fechamento', color: '#10b981', description: 'Fechamento do negocio' },
  CONCLUIDA_SUCESSO: { label: 'Concluida com Sucesso', color: '#059669', description: 'Negocio fechado com sucesso' },
  FORA_DE_PERFIL: { label: 'Fora de Perfil', color: '#6b7280', description: 'Fonte sem geracao de sucata' },
  BAIXA_GERACAO_DIR: { label: 'Baixa Geracao - Direcionar', color: '#ec4899', description: 'Menos de 5 ton/mes - direcionar a parceiro' },
  BAIXA_GERACAO_ENT: { label: 'Baixa Geracao - Entrega', color: '#d946ef', description: 'Menos de 5 ton/mes - condicao de entrega' },
};
