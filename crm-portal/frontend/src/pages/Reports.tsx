import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Target,
  Filter,
  ChevronDown,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OpportunityStage } from '@/types';

const stageLabels: Record<OpportunityStage, string> = {
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  SEGUNDO_CONTATO: 'Segundo Contato',
  VISITA: 'Visita',
  EM_NEGOCIACAO: 'Em Negociação',
  CONTRA_PROPOSTA: 'Contra Proposta',
  EM_FECHAMENTO: 'Em Fechamento',
  CONCLUIDA_SUCESSO: 'Concluída com Sucesso',
  FORA_DE_PERFIL: 'Fora de Perfil',
  BAIXA_GERACAO_DIR: 'Baixa Geração - Direcionar',
  BAIXA_GERACAO_ENT: 'Baixa Geração - Entrega',
};

const stageColors: Record<OpportunityStage, string> = {
  PRIMEIRO_CONTATO: 'bg-slate-100 text-slate-700',
  SEGUNDO_CONTATO: 'bg-blue-100 text-blue-700',
  VISITA: 'bg-purple-100 text-purple-700',
  EM_NEGOCIACAO: 'bg-amber-100 text-amber-700',
  CONTRA_PROPOSTA: 'bg-orange-100 text-orange-700',
  EM_FECHAMENTO: 'bg-emerald-100 text-emerald-700',
  CONCLUIDA_SUCESSO: 'bg-green-100 text-green-700',
  FORA_DE_PERFIL: 'bg-gray-100 text-gray-700',
  BAIXA_GERACAO_DIR: 'bg-pink-100 text-pink-700',
  BAIXA_GERACAO_ENT: 'bg-fuchsia-100 text-fuchsia-700',
};

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'pipeline' | 'conversion' | 'visits' | 'performance'>('pipeline');

  const { data: pipelineData } = useQuery({
    queryKey: ['reports', 'pipeline', dateRange],
    queryFn: async () => {
      const { data } = await api.get(`/reports/pipeline?range=${dateRange}`);
      return data;
    },
  });

  const { data: conversionData } = useQuery({
    queryKey: ['reports', 'conversion', dateRange],
    queryFn: async () => {
      const { data } = await api.get(`/reports/conversion?range=${dateRange}`);
      return data;
    },
  });

  const { data: visitsData } = useQuery({
    queryKey: ['reports', 'visits', dateRange],
    queryFn: async () => {
      const { data } = await api.get(`/reports/visits?range=${dateRange}`);
      return data;
    },
  });

  const { data: performanceData } = useQuery({
    queryKey: ['reports', 'performance', dateRange],
    queryFn: async () => {
      const { data } = await api.get(`/reports/performance?range=${dateRange}`);
      return data;
    },
  });

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    window.open(`${api.defaults.baseURL}/reports/export?type=${reportType}&range=${dateRange}&format=${format}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Análises e métricas do funil de vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <div className="relative group">
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Exportar como PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Exportar como Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Exportar como CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={reportType === 'pipeline' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setReportType('pipeline')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Pipeline
        </Button>
        <Button
          variant={reportType === 'conversion' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setReportType('conversion')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Conversão
        </Button>
        <Button
          variant={reportType === 'visits' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setReportType('visits')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Visitas
        </Button>
        <Button
          variant={reportType === 'performance' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setReportType('performance')}
        >
          <Target className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-2">
            <Button
              variant={dateRange === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Semana
            </Button>
            <Button
              variant={dateRange === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              Mês
            </Button>
            <Button
              variant={dateRange === 'quarter' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('quarter')}
            >
              Trimestre
            </Button>
            <Button
              variant={dateRange === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('year')}
            >
              Ano
            </Button>
          </div>
        </div>
      </Card>

      {/* Pipeline Report */}
      {reportType === 'pipeline' && pipelineData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Oportunidades</p>
                  <p className="text-xl font-bold text-gray-900">{pipelineData.totalOpportunities}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taxa de Conversão</p>
                  <p className="text-xl font-bold text-gray-900">{pipelineData.conversionRate}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor em Negociação</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {pipelineData.totalValue?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Média por Oportunidade</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {pipelineData.averageValue?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Pipeline by Stage */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Oportunidades por Fase</h3>
            <div className="space-y-4">
              {pipelineData.byStage?.map((item: any) => (
                <div key={item.stage} className="flex items-center gap-4">
                  <div className="w-32">
                    <Badge className={stageColors[item.stage]}>
                      {stageLabels[item.stage]}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{
                          width: `${(item.count / pipelineData.totalOpportunities) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-500">
                    {((item.count / pipelineData.totalOpportunities) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pipeline by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Por Tipo</h3>
              <div className="space-y-3">
                {pipelineData.byType?.map((item: any) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {item.type === 'LEILAO_LOTE_SPOT' ? 'Leilão Lote Spot' :
                       item.type === 'LEILAO_GERACAO_CONTINUA' ? 'Leilão Geração Contínua' :
                       item.type === 'FONTE' ? 'Fonte Geradora' :
                       item.type === 'SUCATEIRO' ? 'Sucateiro' :
                       item.type === 'LOTE_SPOT' ? 'Lote Spot' : item.type}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {((item.count / pipelineData.totalOpportunities) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Por Tipo de Sucata</h3>
              <div className="space-y-3">
                {pipelineData.byScrapType?.map((item: any) => (
                  <div key={item.scrapType} className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {item.scrapType === 'FERROUS' ? 'Ferroso' :
                       item.scrapType === 'NON_FERROUS' ? 'Não Ferroso' :
                       item.scrapType === 'MIXED' ? 'Misto' : item.scrapType}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {((item.count / pipelineData.totalOpportunities) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Conversion Report */}
      {reportType === 'conversion' && conversionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taxa de Conversão</p>
                  <p className="text-xl font-bold text-gray-900">{conversionData.rate}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leads Convertidos</p>
                  <p className="text-xl font-bold text-gray-900">{conversionData.converted}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leads Perdidos</p>
                  <p className="text-xl font-bold text-gray-900">{conversionData.lost}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Convertido</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {conversionData.convertedValue?.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
            <div className="space-y-4">
              {conversionData.funnel?.map((item: any, index: number) => (
                <div key={item.stage} className="flex items-center gap-4">
                  <div className="w-40">
                    <span className="text-sm text-gray-700">{stageLabels[item.stage]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${(item.count / conversionData.funnel[0].count) * 100}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-500">
                    {index > 0 && (
                      <span>
                        {((item.count / conversionData.funnel[index - 1].count) * 100).toFixed(1)}% conversão
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Visits Report */}
      {reportType === 'visits' && visitsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Visitas</p>
                  <p className="text-xl font-bold text-gray-900">{visitsData.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taxa de Comparecimento</p>
                  <p className="text-xl font-bold text-gray-900">{visitsData.attendanceRate}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Média de Duração</p>
                  <p className="text-xl font-bold text-gray-900">{visitsData.averageDuration}min</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visitas/Comprador</p>
                  <p className="text-xl font-bold text-gray-900">{visitsData.visitsPerBuyer}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Visitas por Status</h3>
              <div className="space-y-3">
                {visitsData.byStatus?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {item.status === 'SCHEDULED' ? 'Agendada' :
                       item.status === 'CONFIRMED' ? 'Confirmada' :
                       item.status === 'IN_PROGRESS' ? 'Em Andamento' :
                       item.status === 'COMPLETED' ? 'Concluída' :
                       item.status === 'CANCELLED' ? 'Cancelada' :
                       item.status === 'RESCHEDULED' ? 'Reagendada' : item.status}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {((item.count / visitsData.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Compradores</h3>
              <div className="space-y-3">
                {visitsData.topBuyers?.map((item: any) => (
                  <div key={item.buyerId} className="flex items-center justify-between">
                    <span className="text-gray-700">{item.buyerName}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.count} visitas</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Performance Report */}
      {reportType === 'performance' && performanceData && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance da Equipe</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Comprador</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Oportunidades</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Convertidas</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Taxa</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Visitas</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceData.buyers?.map((buyer: any) => (
                    <tr key={buyer.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {buyer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{buyer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{buyer.opportunities}</td>
                      <td className="py-3 px-4 text-right">{buyer.converted}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge className={buyer.conversionRate >= 30 ? 'bg-success-100 text-success-700' : 'bg-yellow-100 text-yellow-700'}>
                          {buyer.conversionRate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{buyer.visits}</td>
                      <td className="py-3 px-4 text-right">
                        R$ {buyer.totalValue?.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
