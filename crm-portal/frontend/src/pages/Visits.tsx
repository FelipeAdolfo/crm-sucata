import React, { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  List, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useVisits, useCreateVisit, useUpdateVisit } from '@/hooks/useVisits';
import { useOpportunities } from '@/hooks/useOpportunities';
import type { Visit, VisitStatus } from '@/types';

const statusLabels: Record<VisitStatus, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reagendada',
};

const statusColors: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-danger-100 text-danger-700',
  RESCHEDULED: 'bg-purple-100 text-purple-700',
};

export const Visits: React.FC = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: visits, isLoading } = useVisits({
    startDate: startOfMonth(currentMonth).toISOString(),
    endDate: endOfMonth(currentMonth).toISOString(),
    status: statusFilter || undefined,
  });

  const { data: opportunities } = useOpportunities({ limit: 100 });
  const createVisit = useCreateVisit();
  const updateVisit = useUpdateVisit();

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const filteredVisits = visits?.filter(visit => {
    const matchesSearch = searchTerm === '' || 
      visit.opportunity?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getVisitsForDay = (day: Date) => {
    return filteredVisits?.filter(visit => 
      isSameDay(parseISO(visit.scheduledAt), day)
    ) || [];
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const handleVisitClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (visitId: string, newStatus: VisitStatus) => {
    await updateVisit.mutateAsync({ id: visitId, data: { status: newStatus } });
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
          <h1 className="text-2xl font-bold text-gray-900">Visitas</h1>
          <p className="text-gray-500 mt-1">Gerencie as visitas agendadas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendário
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedVisit(null);
              setSelectedDate(new Date());
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Visita
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar visitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VisitStatus | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos os status</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="RESCHEDULED">Reagendada</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {daysInMonth.map((day, index) => {
              const dayVisits = getVisitsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'ring-2 ring-primary-500 ring-inset' : ''
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayVisits.slice(0, 3).map((visit) => (
                      <div
                        key={visit.id}
                        className="text-xs p-1 rounded bg-primary-50 text-primary-700 truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVisitClick(visit);
                        }}
                      >
                        {format(parseISO(visit.scheduledAt), 'HH:mm')} - {visit.opportunity?.name}
                      </div>
                    ))}
                    {dayVisits.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayVisits.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data/Hora</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Empresa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Visitante</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Localização</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisits?.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(parseISO(visit.scheduledAt), 'dd/MM/yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(visit.scheduledAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{visit.opportunity?.name}</p>
                      <p className="text-xs text-gray-500">{visit.opportunity?.city}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{visit.visitor?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[visit.status]}>
                        {statusLabels[visit.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {visit.locationVerified ? (
                        <div className="flex items-center gap-1 text-success-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Verificado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-xs">Pendente</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {visit.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(visit.id, 'CONFIRMED')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(visit.id, 'CANCELLED')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {visit.status === 'CONFIRMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(visit.id, 'IN_PROGRESS')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {visit.status === 'IN_PROGRESS' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(visit.id, 'COMPLETED')}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVisits?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma visita encontrada</p>
            </div>
          )}
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVisit(null);
          setSelectedDate(null);
        }}
        title={selectedVisit ? 'Detalhes da Visita' : 'Nova Visita'}
        size="lg"
      >
        {selectedVisit ? (
          <VisitDetailModal 
            visit={selectedVisit} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedVisit(null);
            }}
          />
        ) : (
          <NewVisitModal
            selectedDate={selectedDate}
            opportunities={opportunities?.data || []}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedDate(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// Visit Detail Modal Component
const VisitDetailModal: React.FC<{ visit: Visit; onClose: () => void }> = ({ visit, onClose }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Empresa</label>
          <p className="text-gray-900">{visit.opportunity?.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Visitante</label>
          <p className="text-gray-900">{visit.visitor?.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Data e Hora</label>
          <p className="text-gray-900">
            {format(parseISO(visit.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Badge className={statusColors[visit.status]}>
            {statusLabels[visit.status]}
          </Badge>
        </div>
      </div>

      {visit.objectives && (
        <div>
          <label className="text-sm font-medium text-gray-700">Objetivos</label>
          <p className="text-gray-900 mt-1">{visit.objectives}</p>
        </div>
      )}

      {visit.result && (
        <div>
          <label className="text-sm font-medium text-gray-700">Resultado</label>
          <p className="text-gray-900 mt-1">{visit.result}</p>
        </div>
      )}

      {visit.observations && (
        <div>
          <label className="text-sm font-medium text-gray-700">Observações</label>
          <p className="text-gray-900 mt-1">{visit.observations}</p>
        </div>
      )}

      {/* Location Verification */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Verificação de Localização</h4>
        {visit.locationVerified ? (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Visita verificada por GPS</span>
            </div>
            <p className="text-sm text-success-600 mt-1">
              Distância: {visit.locationDistance?.toFixed(0)}m do local
            </p>
            {visit.verifiedAt && (
              <p className="text-sm text-success-600">
                Verificado em: {format(parseISO(visit.verifiedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Localização não verificada</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              A verificação de GPS será feita quando a visita for iniciada.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};

// New Visit Modal Component
const NewVisitModal: React.FC<{
  selectedDate: Date | null;
  opportunities: any[];
  onClose: () => void;
}> = ({ selectedDate, opportunities, onClose }) => {
  const createVisit = useCreateVisit();
  const [formData, setFormData] = useState({
    opportunityId: '',
    scheduledAt: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
    duration: 60,
    objectives: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVisit.mutateAsync({
      ...formData,
      visitorId: '', // Will be set by backend
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Oportunidade *
        </label>
        <select
          required
          value={formData.opportunityId}
          onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Selecione uma oportunidade</option>
          {opportunities.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.name} - {opp.city}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data e Hora *
          </label>
          <Input
            type="datetime-local"
            required
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração (minutos)
          </label>
          <Input
            type="number"
            min={15}
            step={15}
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivos da Visita
        </label>
        <textarea
          rows={3}
          value={formData.objectives}
          onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Descreva os objetivos desta visita..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={createVisit.isPending}>
          Agendar Visita
        </Button>
      </div>
    </form>
  );
};

export default Visits;
