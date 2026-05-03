import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building2, Calendar, Camera, History, Users, Briefcase } from 'lucide-react';
import { useOpportunity, useChangeStage } from '@/hooks/useOpportunities';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { TabInfo } from '@/components/opportunities/TabInfo';
import { TabContacts } from '@/components/opportunities/TabContacts';
import { TabVisits } from '@/components/opportunities/TabVisits';
import { TabPhotos } from '@/components/opportunities/TabPhotos';
import { TabTimeline } from '@/components/opportunities/TabTimeline';
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
  PRIMEIRO_CONTATO: 'bg-slate-100 text-slate-800',
  SEGUNDO_CONTATO: 'bg-blue-100 text-blue-800',
  VISITA: 'bg-purple-100 text-purple-800',
  EM_NEGOCIACAO: 'bg-amber-100 text-amber-800',
  CONTRA_PROPOSTA: 'bg-orange-100 text-orange-800',
  EM_FECHAMENTO: 'bg-emerald-100 text-emerald-800',
  CONCLUIDA_SUCESSO: 'bg-green-100 text-green-800',
  FORA_DE_PERFIL: 'bg-gray-100 text-gray-500',
  BAIXA_GERACAO_DIR: 'bg-pink-100 text-pink-800',
  BAIXA_GERACAO_ENT: 'bg-fuchsia-100 text-fuchsia-800',
};

const typeLabels: Record<string, string> = {
  LEILAO_LOTE_SPOT: 'Leilão Lote Spot',
  LEILAO_GERACAO_CONTINUA: 'Leilão Geração Contínua',
  FONTE: 'Fonte Geradora',
  SUCATEIRO: 'Sucateiro',
  LOTE_SPOT: 'Lote Spot',
};

type Tab = 'info' | 'contacts' | 'visits' | 'photos' | 'timeline';

export const OpportunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  
  const { data: opportunity, isLoading } = useOpportunity(id!);
  const changeStage = useChangeStage();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Oportunidade não encontrada</p>
        <Button onClick={() => navigate('/opportunities')} className="mt-4">
          Voltar para Oportunidades
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'info' as Tab, label: 'Informações', icon: Briefcase },
    { id: 'contacts' as Tab, label: 'Contatos', icon: Users },
    { id: 'visits' as Tab, label: 'Visitas', icon: Calendar },
    { id: 'photos' as Tab, label: 'Fotos', icon: Camera },
    { id: 'timeline' as Tab, label: 'Timeline', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/opportunities')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{opportunity.name}</h1>
            <Badge className={stageColors[opportunity.stage]}>
              {stageLabels[opportunity.stage]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{typeLabels[opportunity.type]}</span>
            <span>•</span>
            <span className="font-mono">{opportunity.documentNumber}</span>
            {opportunity.city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {opportunity.city}, {opportunity.state}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}>
            Editar
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {opportunity.phone && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Phone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="font-medium">{opportunity.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {opportunity.email && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{opportunity.email}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {opportunity.assignedUser && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Responsável</p>
                <p className="font-medium">{opportunity.assignedUser.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'info' && <TabInfo opportunity={opportunity} />}
        {activeTab === 'contacts' && <TabContacts opportunityId={opportunity.id} />}
        {activeTab === 'visits' && <TabVisits opportunityId={opportunity.id} />}
        {activeTab === 'photos' && <TabPhotos opportunityId={opportunity.id} />}
        {activeTab === 'timeline' && <TabTimeline opportunityId={opportunity.id} />}
      </div>
    </div>
  );
};
