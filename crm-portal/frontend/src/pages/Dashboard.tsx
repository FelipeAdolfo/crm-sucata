import React from 'react';
import { Users, Calendar, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDashboardMetrics, usePipeline } from '@/hooks/useDashboard';
import { useFunnel } from '@/hooks/useFunnel';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/auth';

// Labels das fases do funil (novas fases conforme solicitado)
const stageLabels: Record<string, string> = {
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  SEGUNDO_CONTATO: 'Segundo Contato',
  VISITA: 'Visita',
  EM_NEGOCIACAO: 'Em Negociação',
  CONTRA_PROPOSTA: 'Contra Proposta',
  EM_FECHAMENTO: 'Em Fechamento',
  CONCLUIDA_SUCESSO: 'Concluídas com Sucesso',
  FORA_DE_PERFIL: 'Fora de Perfil',
  BAIXA_GERACAO_DIR: 'Baixa Geração - Direcionar',
  BAIXA_GERACAO_ENT: 'Baixa Geração - Entrega',
};

const stageColors: Record<string, string> = {
  PRIMEIRO_CONTATO: 'bg-slate-100 text-slate-800',
  SEGUNDO_CONTATO: 'bg-blue-100 text-blue-800',
  VISITA: 'bg-purple-100 text-purple-800',
  EM_NEGOCIACAO: 'bg-amber-100 text-amber-800',
  CONTRA_PROPOSTA: 'bg-orange-100 text-orange-800',
  EM_FECHAMENTO: 'bg-emerald-100 text-emerald-800',
  CONCLUIDA_SUCESSO: 'bg-green-100 text-green-800',
  FORA_DE_PERFIL: 'bg-gray-100 text-gray-600',
  BAIXA_GERACAO_DIR: 'bg-pink-100 text-pink-800',
  BAIXA_GERACAO_ENT: 'bg-fuchsia-100 text-fuchsia-800',
};

const stageOrder = [
  'PRIMEIRO_CONTATO',
  'SEGUNDO_CONTATO',
  'VISITA',
  'EM_NEGOCIACAO',
  'CONTRA_PROPOSTA',
  'EM_FECHAMENTO',
  'CONCLUIDA_SUCESSO',
];

const rejectedStages = ['FORA_DE_PERFIL', 'BAIXA_GERACAO_DIR', 'BAIXA_GERACAO_ENT'];

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline();
  const { 
    individual, 
    consolidated,
    isLoadingIndividual,
    isLoadingConsolidated 
  } = useFunnel();

  const isLoading = metricsLoading || pipelineLoading || isLoadingIndividual || isLoadingConsolidated;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Determinar qual funil mostrar
  const showConsolidated = user && ['MANAGER', 'INTEL_COORDINATOR', 'DIRECTOR', 'ADMIN'].includes(user.role);
  const funnelData = showConsolidated ? consolidated?.byStage : individual?.funnel;

  const stats = [
    {
      title: 'Total de Oportunidades',
      value: metrics?.opportunities.total || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Visitas este Mês',
      value: metrics?.visits.thisMonth || 0,
      icon: Calendar,
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Taxa de Conversão',
      value: `${(metrics?.opportunities.conversionRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      change: '+2.3%',
      changeType: 'positive' as const,
    },
    {
      title: 'Conversões este Mês',
      value: metrics?.conversions.thisMonth || 0,
      icon: Target,
      change: '-3%',
      changeType: 'negative' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        {showConsolidated && (
          <Badge variant="primary" className="mt-2">
            Visão Consolidada - {consolidated?.total || 0} oportunidades
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 text-success-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-danger-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FUNIL DE VENDAS - Principal */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Funil de Vendas</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {showConsolidated 
                ? 'Visão consolidada de todas as oportunidades' 
                : 'Suas oportunidades em andamento'}
            </p>
          </div>
          {user && (
            <Badge variant="outline">
              {user.name} - {user.role === 'PARTNER' ? 'Parceiro' : user.role === 'BUYER' ? 'Comprador' : user.role === 'MANAGER' ? 'Gerente' : user.role}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {/* Fases Ativas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
            {stageOrder.map((stage) => {
              const opportunities = funnelData?.[stage] || [];
              return (
                <div
                  key={stage}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColors[stage]}`}>
                      {stageLabels[stage]}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {opportunities.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {opportunities.slice(0, 2).map((opp: any) => (
                      <div
                        key={opp.id}
                        className="bg-white p-2 rounded border border-gray-200 text-sm"
                      >
                        <p className="font-medium text-gray-900 truncate">{opp.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs text-gray-500">{opp.city}</p>
                          {opp.quantityGenerated && (
                            <span className="text-xs text-blue-600">
                              ({(opp.quantityGenerated / 1000).toFixed(1)}t)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {opportunities.length > 2 && (
                      <p className="text-xs text-center text-gray-400">
                        +{opportunities.length - 2} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fases Rejeitadas / Baixa Geracao */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Classificacoes Especiais</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rejectedStages.map((stage) => {
                const opportunities = funnelData?.[stage] || [];
                if (opportunities.length === 0) return null;
                return (
                  <div
                    key={stage}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${stageColors[stage]}`}>
                        {stageLabels[stage]}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {opportunities.length}
                      </span>
                    </div>
                    {stage === 'BAIXA_GERACAO_DIR' && opportunities.length > 0 && (
                      <p className="text-xs text-pink-600 mt-1">
                        Menos de 5 ton/mes - direcionar a parceiros
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Oportunidades por Fase + Proximas Visitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Oportunidades por Fase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.opportunities.byStage.map((item) => (
                <div key={item.stage} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-primary-500" />
                    <span className="text-sm text-gray-700">{stageLabels[item.stage] || item.stage}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {item._count.stage}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({((item._count.stage / (metrics?.opportunities.total || 1)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proximas Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.visits.upcoming ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Voce tem {metrics.visits.upcoming} visitas agendadas</p>
                <a href="/visits" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                  Ver todas as visitas
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma visita agendada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
