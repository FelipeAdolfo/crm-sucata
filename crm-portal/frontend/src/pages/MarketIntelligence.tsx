import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MapPin, 
  Building2, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  BarChart3,
  Target,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MarketIntelligence, IntelType, ScrapType } from '@/types';

const intelTypeLabels: Record<IntelType, string> = {
  COMPETITOR_PRICE: 'Preço de Concorrente',
  MARKET_TREND: 'Tendência de Mercado',
  SUPPLIER_CHANGE: 'Mudança de Fornecedor',
  PRICE_VARIATION: 'Variação de Preço',
  NEW_COMPETITOR: 'Novo Concorrente',
  OTHER: 'Outro',
};

const intelTypeColors: Record<IntelType, string> = {
  COMPETITOR_PRICE: 'bg-blue-100 text-blue-700',
  MARKET_TREND: 'bg-purple-100 text-purple-700',
  SUPPLIER_CHANGE: 'bg-orange-100 text-orange-700',
  PRICE_VARIATION: 'bg-yellow-100 text-yellow-700',
  NEW_COMPETITOR: 'bg-red-100 text-red-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const scrapTypeLabels: Record<ScrapType, string> = {
  FERROUS: 'Ferroso',
  NON_FERROUS: 'Não Ferroso',
  MIXED: 'Misto',
};

export const MarketIntelligence: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<IntelType | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntel, setSelectedIntel] = useState<MarketIntelligence | null>(null);

  const { data: intelData, isLoading } = useQuery({
    queryKey: ['market-intel', typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      const { data } = await api.get<MarketIntelligence[]>(`/market-intel?${params.toString()}`);
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['market-intel-stats'],
    queryFn: async () => {
      const { data } = await api.get('/market-intel/stats');
      return data;
    },
  });

  const filteredData = intelData?.filter(intel => {
    const matchesSearch = searchTerm === '' || 
      intel.competitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intel.region?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetail = (intel: MarketIntelligence) => {
    setSelectedIntel(intel);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inteligência de Mercado</h1>
          <p className="text-gray-500 mt-1">Informações sobre concorrentes e tendências</p>
        </div>
        <Button onClick={() => { setSelectedIntel(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Informação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Registros</p>
              <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Concorrentes</p>
              <p className="text-xl font-bold text-gray-900">{stats?.competitors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alertas de Preço</p>
              <p className="text-xl font-bold text-gray-900">{stats?.priceAlerts || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esta Semana</p>
              <p className="text-xl font-bold text-gray-900">{stats?.thisWeek || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar informações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as IntelType | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos os tipos</option>
              <option value="COMPETITOR_PRICE">Preço de Concorrente</option>
              <option value="MARKET_TREND">Tendência de Mercado</option>
              <option value="SUPPLIER_CHANGE">Mudança de Fornecedor</option>
              <option value="PRICE_VARIATION">Variação de Preço</option>
              <option value="NEW_COMPETITOR">Novo Concorrente</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Intel List */}
      <div className="space-y-4">
        {filteredData?.map((intel) => (
          <Card key={intel.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={intelTypeColors[intel.type]}>
                    {intelTypeLabels[intel.type]}
                  </Badge>
                  {intel.scrapType && (
                    <Badge variant="outline">
                      {scrapTypeLabels[intel.scrapType]}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-900 mb-2">{intel.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {intel.competitorName && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{intel.competitorName}</span>
                    </div>
                  )}
                  {intel.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>R$ {intel.price.toFixed(2)}/kg</span>
                    </div>
                  )}
                  {intel.region && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{intel.region}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>por {intel.user?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {format(parseISO(intel.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-400">
                    Data da info: {format(parseISO(intel.intelDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetail(intel)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredData?.length === 0 && (
          <Card className="p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhuma informação encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Cadastre novas informações de mercado usando o botão acima
            </p>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIntel(null);
        }}
        title={selectedIntel ? 'Detalhes da Informação' : 'Nova Informação de Mercado'}
        size="lg"
      >
        {selectedIntel ? (
          <IntelDetailModal 
            intel={selectedIntel} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedIntel(null);
            }}
          />
        ) : (
          <NewIntelModal
            onClose={() => {
              setIsModalOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// Intel Detail Modal
const IntelDetailModal: React.FC<{ intel: MarketIntelligence; onClose: () => void }> = ({ intel, onClose }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge className={intelTypeColors[intel.type]}>
          {intelTypeLabels[intel.type]}
        </Badge>
        {intel.scrapType && (
          <Badge variant="outline">
            {scrapTypeLabels[intel.scrapType]}
          </Badge>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <p className="text-gray-900 mt-1">{intel.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {intel.competitorName && (
          <div>
            <label className="text-sm font-medium text-gray-700">Concorrente</label>
            <p className="text-gray-900">{intel.competitorName}</p>
          </div>
        )}
        {intel.price && (
          <div>
            <label className="text-sm font-medium text-gray-700">Preço</label>
            <p className="text-gray-900">R$ {intel.price.toFixed(2)}/kg</p>
          </div>
        )}
        {intel.region && (
          <div>
            <label className="text-sm font-medium text-gray-700">Região</label>
            <p className="text-gray-900">{intel.region}</p>
          </div>
        )}
        {intel.source && (
          <div>
            <label className="text-sm font-medium text-gray-700">Fonte</label>
            <p className="text-gray-900">{intel.source}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Registrado por</label>
          <p className="text-gray-900">{intel.user?.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Data do Registro</label>
          <p className="text-gray-900">
            {format(parseISO(intel.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};

// New Intel Modal
const NewIntelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'COMPETITOR_PRICE' as IntelType,
    competitorName: '',
    scrapType: '' as ScrapType | '',
    price: '',
    region: '',
    description: '',
    source: '',
    intelDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const createIntel = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.post('/market-intel', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intel'] });
      queryClient.invalidateQueries({ queryKey: ['market-intel-stats'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIntel.mutate({
      ...formData,
      price: formData.price ? parseFloat(formData.price) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Informação *
        </label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as IntelType })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="COMPETITOR_PRICE">Preço de Concorrente</option>
          <option value="MARKET_TREND">Tendência de Mercado</option>
          <option value="SUPPLIER_CHANGE">Mudança de Fornecedor</option>
          <option value="PRICE_VARIATION">Variação de Preço</option>
          <option value="NEW_COMPETITOR">Novo Concorrente</option>
          <option value="OTHER">Outro</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Concorrente
          </label>
          <Input
            value={formData.competitorName}
            onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
            placeholder="Ex: Sucata Ltda"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Sucata
          </label>
          <select
            value={formData.scrapType}
            onChange={(e) => setFormData({ ...formData, scrapType: e.target.value as ScrapType })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecione</option>
            <option value="FERROUS">Ferroso</option>
            <option value="NON_FERROUS">Não Ferroso</option>
            <option value="MIXED">Misto</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$/kg)
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Região
          </label>
          <Input
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="Ex: São Paulo - SP"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição *
        </label>
        <textarea
          required
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Descreva a informação de mercado..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fonte
        </label>
        <Input
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          placeholder="Ex: Contato com fornecedor, pesquisa de mercado..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data da Informação *
        </label>
        <Input
          type="date"
          required
          value={formData.intelDate}
          onChange={(e) => setFormData({ ...formData, intelDate: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={createIntel.isPending}>
          Salvar Informação
        </Button>
      </div>
    </form>
  );
};

export default MarketIntelligence;
