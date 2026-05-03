import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Building2,
  Trash2,
  Search,
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useCalls, useCallStats, useDeleteCall } from '@/hooks/useCalls';
import { Button } from '@/components/ui';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const periodoOptions = [
  { label: 'Hoje', value: 1 },
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const tipoLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CALL_COMPLETED: { label: 'Atendida', color: 'bg-green-100 text-green-700', icon: PhoneCall },
  CALL_MISSED: { label: 'Perdida', color: 'bg-red-100 text-red-700', icon: PhoneMissed },
  CALL: { label: 'Tentativa', color: 'bg-amber-100 text-amber-700', icon: Phone },
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
};

const normalizePhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const Calls: React.FC = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const { data: stats } = useCallStats(periodo);
  const { data: callsData, isLoading } = useCalls({
    periodo,
    tipo: tipoFilter,
    page: 1,
    limit: 50,
  });

  const deleteCall = useDeleteCall();

  const handleDelete = (id: string) => {
    if (window.confirm('Remover este registro de chamada?')) {
      deleteCall.mutate(id);
    }
  };

  // Filtrar por busca
  const filteredCalls = (callsData?.calls || []).filter((call) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      call.opportunity?.name?.toLowerCase().includes(term) ||
      call.metadata?.nome_contato?.toLowerCase().includes(term) ||
      call.metadata?.telefone?.includes(term) ||
      call.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Chamadas</h1>
            <p className="text-sm text-gray-500 mt-1">
              Chamadas registradas automaticamente pelo app ou manualmente
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span className="ml-2 text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <PhoneCall className="w-5 h-5 text-green-600" />
              <span className="ml-2 text-sm text-gray-500">Atendidas</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-2">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <PhoneMissed className="w-5 h-5 text-red-600" />
              <span className="ml-2 text-sm text-gray-500">Perdidas</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-2">{stats.missed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-amber-600" />
              <span className="ml-2 text-sm text-gray-500">Tentativas</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-2">{stats.attempted}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-primary-600" />
              <span className="ml-2 text-sm text-gray-500">Media</span>
            </div>
            <p className="text-2xl font-bold text-primary-700 mt-2">{stats.avgDurationFormatted}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, contato ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Periodo */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {periodoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Tipo filter */}
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os tipos</option>
          <option value="CALL_COMPLETED">Atendidas</option>
          <option value="CALL_MISSED">Perdidas</option>
          <option value="CALL">Tentativas</option>
        </select>
      </div>

      {/* Calls List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Oportunidade</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Contato</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Telefone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Duracao</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 uppercase">Registrado por</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                      <span className="ml-2">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nenhuma chamada registrada</p>
                    <p className="text-sm mt-1">
                      As chamadas serao registradas automaticamente pelo app Android ou manualmente.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const tipoInfo = tipoLabels[call.type] || tipoLabels.CALL;
                  const TipoIcon = tipoInfo.icon;
                  const meta = call.metadata;

                  return (
                    <tr
                      key={call.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => call.opportunityId && navigate(`/opportunities/${call.opportunityId}`)}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                          <TipoIcon className="w-3.5 h-3.5" />
                          {tipoInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {call.createdAt
                          ? format(parseISO(call.createdAt), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {call.opportunity ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{call.opportunity.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nao vinculada</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {meta?.nome_contato || meta?.contato_nome || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {meta?.telefone ? normalizePhone(meta.telefone) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                          {meta?.duracao_segundos !== undefined
                            ? formatDuration(meta.duracao_segundos)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {call.user?.name || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(call.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {callsData && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 flex items-center justify-between">
            <span>
              {filteredCalls.length} de {callsData.pagination.total} registros
            </span>
            <span>
              Taxa de atendimento: {stats?.conversionRate || 0}%
            </span>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start">
          <TrendingUp className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Como funciona o registro automatico?</p>
            <p className="text-blue-700">
              Quando um comprador realiza ou recebe uma chamada, o app Android envia os dados
              (numero, duracao, data) para esta API. O sistema verifica se o numero existe no cadastro
              de oportunidades ou contatos. Encontrando a empresa, a chamada e registrada
              automaticamente no historico de relacionamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
