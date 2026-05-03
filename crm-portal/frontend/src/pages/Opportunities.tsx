import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Grid3X3, List, MapPin, Phone } from 'lucide-react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';
import { ModalNewOpportunity } from '@/components/opportunities/ModalNewOpportunity';
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
  PRIMEIRO_CONTATO: 'bg-slate-100 text-slate-800 border-slate-200',
  SEGUNDO_CONTATO: 'bg-blue-100 text-blue-800 border-blue-200',
  VISITA: 'bg-purple-100 text-purple-800 border-purple-200',
  EM_NEGOCIACAO: 'bg-amber-100 text-amber-800 border-amber-200',
  CONTRA_PROPOSTA: 'bg-orange-100 text-orange-800 border-orange-200',
  EM_FECHAMENTO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CONCLUIDA_SUCESSO: 'bg-green-100 text-green-800 border-green-200',
  FORA_DE_PERFIL: 'bg-gray-100 text-gray-500 border-gray-200',
  BAIXA_GERACAO_DIR: 'bg-pink-100 text-pink-800 border-pink-200',
  BAIXA_GERACAO_ENT: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
};

const typeLabels: Record<string, string> = {
  LEILAO_LOTE_SPOT: 'Leilão Lote Spot',
  LEILAO_GERACAO_CONTINUA: 'Leilão Geração Contínua',
  FONTE: 'Fonte Geradora',
  SUCATEIRO: 'Sucateiro',
  LOTE_SPOT: 'Lote Spot',
};

export const Opportunities: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<OpportunityStage | ''>('');

  const { data, isLoading } = useOpportunities({
    search: searchTerm,
    stage: selectedStage || undefined,
    limit: 50,
  });

  const opportunities = data?.opportunities || [];

  // Agrupar por estágio para kanban
  const groupedByStage = opportunities.reduce((acc, opp) => {
    if (!acc[opp.stage]) acc[opp.stage] = [];
    acc[opp.stage].push(opp);
    return acc;
  }, {} as Record<OpportunityStage, typeof opportunities>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-gray-500">Gerencie seus fornecedores de sucata</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Nova Oportunidade
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as OpportunityStage | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">Todas as fases</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : viewMode === 'list' ? (
        // Visualização em Lista
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Card
              key={opp.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/opportunities/${opp.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{opp.name}</h3>
                      <Badge className={stageColors[opp.stage]}>
                        {stageLabels[opp.stage]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>{typeLabels[opp.type]}</span>
                      <span>•</span>
                      <span className="font-mono">{opp.documentNumber}</span>
                      {opp.city && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {opp.city}, {opp.state}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {opp.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {opp.phone}
                      </span>
                    )}
                    {opp._count && (
                      <div className="flex gap-3">
                        <span title="Contatos">👤 {opp._count.contacts}</span>
                        <span title="Visitas">📅 {opp._count.visits}</span>
                        <span title="Fotos">📷 {opp._count.photos}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {opportunities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma oportunidade encontrada
            </div>
          )}
        </div>
      ) : (
        // Visualização Kanban
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {Object.entries(stageLabels).map(([stage, label]) => {
              const stageOpps = groupedByStage[stage as OpportunityStage] || [];
              return (
                <div key={stage} className="w-80 flex-shrink-0">
                  <div className={`p-3 rounded-t-lg border ${stageColors[stage as OpportunityStage]}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{label}</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                        {stageOpps.length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                    {stageOpps.map((opp) => (
                      <Card
                        key={opp.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                      >
                        <CardContent className="p-3">
                          <h4 className="font-medium text-gray-900 text-sm">{opp.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{typeLabels[opp.type]}</p>
                          {opp.city && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {opp.city}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Nova Oportunidade */}
      <ModalNewOpportunity
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
