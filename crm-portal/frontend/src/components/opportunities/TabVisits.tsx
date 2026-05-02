import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent, Modal, Input, Badge } from '@/components/ui';
import { useVisits, useCreateVisit, useCompleteVisit } from '@/hooks/useVisits';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface TabVisitsProps {
  opportunityId: string;
}

interface VisitFormData {
  scheduledAt: string;
  duration: number;
  objectives: string;
}

// Hook para geolocalização
const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getPosition = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste dispositivo');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return { position, error, loading, getPosition };
};

// Calcular distância entre duas coordenadas (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
};

export const TabVisits: React.FC<TabVisitsProps> = ({ opportunityId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const { data: visits, isLoading } = useVisits({ opportunityId });
  const createVisit = useCreateVisit();
  const completeVisit = useCompleteVisit();
  const { position, error: geoError, loading: geoLoading, getPosition } = useGeolocation();

  const [formData, setFormData] = useState<VisitFormData>({
    scheduledAt: '',
    duration: 60,
    objectives: '',
  });

  const [completeForm, setCompleteForm] = useState({
    result: '',
    observations: '',
    checklist: {
      hasProperAccess: false,
      hasSafetyEquipment: false,
      hasProperStorage: false,
      hasDocumentation: false,
      scrapVerified: false,
      quantityVerified: false,
      qualityVerified: false,
    },
  });

  // Verificar localização quando abrir modal de conclusão
  useEffect(() => {
    if (isCompleteModalOpen) {
      getPosition();
    }
  }, [isCompleteModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVisit.mutateAsync({
        opportunityId,
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
      toast.success('Visita agendada!');
      setIsModalOpen(false);
      setFormData({ scheduledAt: '', duration: 60, objectives: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao agendar visita');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position) {
      toast.error('Não foi possível obter sua localização. Verifique o GPS.');
      return;
    }

    try {
      await completeVisit.mutateAsync({
        id: selectedVisit.id,
        data: {
          ...completeForm,
          visitorLatitude: position.coords.latitude,
          visitorLongitude: position.coords.longitude,
        },
      });
      toast.success('Visita concluída!');
      setIsCompleteModalOpen(false);
      setSelectedVisit(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao concluir visita');
    }
  };

  const openCompleteModal = (visit: any) => {
    setSelectedVisit(visit);
    setIsCompleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Visitas</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Agendar Visita
        </Button>
      </div>

      <div className="space-y-3">
        {visits?.map((visit: any) => (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {format(parseISO(visit.scheduledAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <Badge variant={visit.status === 'COMPLETED' ? 'success' : visit.status === 'SCHEDULED' ? 'primary' : 'default'}>
                      {visit.status === 'COMPLETED' ? 'Concluída' : visit.status === 'SCHEDULED' ? 'Agendada' : visit.status}
                    </Badge>
                  </div>
                  {visit.visitor && (
                    <p className="text-sm text-gray-500">Responsável: {visit.visitor.name}</p>
                  )}
                  {visit.objectives && (
                    <p className="text-sm text-gray-600 mt-2">{visit.objectives}</p>
                  )}
                  {visit.locationVerified && (
                    <div className="flex items-center gap-1 text-success-600 text-sm mt-2">
                      <CheckCircle className="w-4 h-4" />
                      Localização validada ({visit.locationDistance?.toFixed(0)}m de distância)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {visit.status === 'SCHEDULED' && (
                    <Button size="sm" onClick={() => openCompleteModal(visit)}>
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visits?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhuma visita agendada
        </div>
      )}

      {/* Modal Agendar Visita */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agendar Visita"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} isLoading={createVisit.isPending}>
              Agendar
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Data e Hora"
            type="datetime-local"
            value={formData.scheduledAt}
            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração Estimada (minutos)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              min={15}
              step={15}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos da Visita</label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 min-h-[100px]"
              placeholder="Descreva os objetivos da visita..."
            />
          </div>
        </form>
      </Modal>

      {/* Modal Concluir Visita com GPS */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Concluir Visita"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCompleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleComplete} 
              isLoading={completeVisit.isPending || geoLoading}
              disabled={!position}
            >
              Concluir Visita
            </Button>
          </>
        }
      >
        <form onSubmit={handleComplete} className="space-y-4">
          {/* Status do GPS */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-primary-600" />
              <span className="font-medium">Localização GPS</span>
            </div>
            
            {geoLoading && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                Obtendo localização...
              </div>
            )}
            
            {geoError && (
              <div className="flex items-center gap-2 text-danger-600">
                <AlertTriangle className="w-4 h-4" />
                Erro: {geoError}
              </div>
            )}
            
            {position && (
              <div className="space-y-1 text-sm">
                <p className="text-success-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Localização obtida com sucesso!
                </p>
                <p className="text-gray-600">Latitude: {position.coords.latitude.toFixed(6)}</p>
                <p className="text-gray-600">Longitude: {position.coords.longitude.toFixed(6)}</p>
                <p className="text-gray-600">Precisão: ±{position.coords.accuracy?.toFixed(0)}m</p>
              </div>
            )}
            
            {!position && !geoLoading && !geoError && (
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                Clique em "Obter Localização" para validar a visita
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resultado da Visita</label>
            <textarea
              value={completeForm.result}
              onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 min-h-[80px]"
              placeholder="Descreva o resultado da visita..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={completeForm.observations}
              onChange={(e) => setCompleteForm({ ...completeForm, observations: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 min-h-[80px]"
              placeholder="Observações adicionais..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
            <div className="space-y-2">
              {Object.entries(completeForm.checklist).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setCompleteForm({
                      ...completeForm,
                      checklist: { ...completeForm.checklist, [key]: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">
                    {key === 'hasProperAccess' && 'Acesso adequado ao local'}
                    {key === 'hasSafetyEquipment' && 'Equipamentos de segurança'}
                    {key === 'hasProperStorage' && 'Armazenamento adequado'}
                    {key === 'hasDocumentation' && 'Documentação em dia'}
                    {key === 'scrapVerified' && 'Sucata verificada'}
                    {key === 'quantityVerified' && 'Quantidade verificada'}
                    {key === 'qualityVerified' && 'Qualidade verificada'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
