import React, { useState } from 'react';
import { Edit, Save, X, MapPin, Factory, Globe, Briefcase, Phone, StickyNote } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useUpdateOpportunity } from '@/hooks/useOpportunities';
import toast from 'react-hot-toast';
import type { Opportunity } from '@/types';

interface TabInfoProps {
  opportunity: Opportunity;
}

const scrapTypeLabels: Record<string, string> = {
  FERROUS: 'Sucata Ferrosa',
  NON_FERROUS: 'Sucata Não-Ferrosa',
  MIXED: 'Sucata Mista',
};

const containerTypeLabels: Record<string, string> = {
  DRUM: 'Tambor',
  BIG_BAG: 'Big Bag',
  SKIP_BIN: 'Caçamba',
  CONTAINER: 'Container',
};

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SPORADIC: 'Esporádica',
};

const companyTypeLabels: Record<string, string> = {
  NON_TRANSFORMER: 'Não transformadora de aço',
  TOOL_SHOP: 'Ferramentaria',
  MACHINING: 'Usinagem',
  STAMPING: 'Estamparia',
  FORGING: 'Forjaria',
  CUTTING_BENDING: 'Corte e dobra/Plasma',
  OTHER: 'Outros',
};

export const TabInfo: React.FC<TabInfoProps> = ({ opportunity }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    scrapType: opportunity.scrapType || '',
    quantityGenerated: opportunity.quantityGenerated || '',
    containerWeight: opportunity.containerWeight || '',
    containerType: opportunity.containerType || '',
    exchangeFrequency: opportunity.exchangeFrequency || '',
    currentBuyer: opportunity.currentBuyer || '',
    competitorPrice: opportunity.competitorPrice || '',
    competitorName: opportunity.competitorName || '',
    proposedPrice: opportunity.proposedPrice || '',
    negotiatedVolume: opportunity.negotiatedVolume || '',
    paymentTerms: opportunity.paymentTerms || '',
    collectionFrequency: opportunity.collectionFrequency || '',
    companyType: opportunity.companyType || '',
    latitude: opportunity.latitude || '',
    longitude: opportunity.longitude || '',
    geofenceRadius: opportunity.geofenceRadius || '100',
    website: opportunity.website || '',
    responsibleName: opportunity.responsibleName || '',
    responsibleRole: opportunity.responsibleRole || '',
    responsiblePhone: opportunity.responsiblePhone || '',
    observations: opportunity.observations || '',
  });

  const updateOpportunity = useUpdateOpportunity();

  const handleSave = async () => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunity.id,
        data: {
          ...formData,
          quantityGenerated: formData.quantityGenerated ? Number(formData.quantityGenerated) : undefined,
          containerWeight: formData.containerWeight ? Number(formData.containerWeight) : undefined,
          competitorPrice: formData.competitorPrice ? Number(formData.competitorPrice) : undefined,
          proposedPrice: formData.proposedPrice ? Number(formData.proposedPrice) : undefined,
          negotiatedVolume: formData.negotiatedVolume ? Number(formData.negotiatedVolume) : undefined,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          geofenceRadius: formData.geofenceRadius ? Number(formData.geofenceRadius) : undefined,
        },
      });
      toast.success('Informações atualizadas!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Empresa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Tipo de Oportunidade
          </CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium text-lg">
              {opportunity.type === 'LEILAO_LOTE_SPOT' && 'Leilão — Lote Spot'}
              {opportunity.type === 'LEILAO_GERACAO_CONTINUA' && 'Leilão — Geração Contínua'}
              {opportunity.type === 'FONTE' && 'Fonte Geradora (Indústria)'}
              {opportunity.type === 'SUCATEIRO' && 'Sucateiro Parceiro'}
              {opportunity.type === 'LOTE_SPOT' && 'Lote Spot / Pontual'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CNPJ / CPF</p>
            <p className="font-medium">{opportunity.documentNumber}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Empresa (para Fonte e outros) */}
      {(opportunity.website || opportunity.responsibleName || opportunity.responsiblePhone || opportunity.observations) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Informações da Empresa
            </CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {opportunity.website && (
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="font-medium text-blue-600">{opportunity.website}</p>
                </div>
              )}
              {opportunity.responsibleName && (
                <div>
                  <p className="text-sm text-gray-500">Responsável</p>
                  <p className="font-medium">{opportunity.responsibleName}</p>
                  {opportunity.responsibleRole && (
                    <p className="text-sm text-gray-400">{opportunity.responsibleRole}</p>
                  )}
                </div>
              )}
              {opportunity.responsiblePhone && (
                <div>
                  <p className="text-sm text-gray-500">Celular do Responsável</p>
                  <p className="font-medium">{opportunity.responsiblePhone}</p>
                </div>
              )}
            </div>
            {opportunity.observations && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <StickyNote className="w-4 h-4" /> Observações
                </p>
                <p className="font-medium mt-1">{opportunity.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados da Sucata */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dados da Sucata</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sucata</label>
                <select
                  value={formData.scrapType}
                  onChange={(e) => setFormData({ ...formData, scrapType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(scrapTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Gerada (kg)</label>
                <input
                  type="number"
                  value={formData.quantityGenerated}
                  onChange={(e) => setFormData({ ...formData, quantityGenerated: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso da Caçamba (kg)</label>
                <input
                  type="number"
                  value={formData.containerWeight}
                  onChange={(e) => setFormData({ ...formData, containerWeight: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Caçamba</label>
                <select
                  value={formData.containerType}
                  onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(containerTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Troca</label>
                <select
                  value={formData.exchangeFrequency}
                  onChange={(e) => setFormData({ ...formData, exchangeFrequency: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprador Atual</label>
                <input
                  type="text"
                  value={formData.currentBuyer}
                  onChange={(e) => setFormData({ ...formData, currentBuyer: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="Quem está comprando?"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tipo de Sucata</p>
                <p className="font-medium">{opportunity.scrapType ? scrapTypeLabels[opportunity.scrapType] : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantidade Gerada</p>
                <p className="font-medium">{opportunity.quantityGenerated ? `${opportunity.quantityGenerated.toLocaleString()} kg` : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Peso da Caçamba</p>
                <p className="font-medium">{opportunity.containerWeight ? `${opportunity.containerWeight} kg` : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Caçamba</p>
                <p className="font-medium">{opportunity.containerType ? containerTypeLabels[opportunity.containerType] : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frequência de Troca</p>
                <p className="font-medium">{opportunity.exchangeFrequency ? frequencyLabels[opportunity.exchangeFrequency] : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Comprador Atual</p>
                <p className="font-medium">{opportunity.currentBuyer || 'Não informado'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concorrência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Concorrência</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço da Concorrência (R$/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.competitorPrice}
                  onChange={(e) => setFormData({ ...formData, competitorPrice: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Concorrente</label>
                <input
                  type="text"
                  value={formData.competitorName}
                  onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="Nome do comprador concorrente"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Preço da Concorrência</p>
                <p className="font-medium">{opportunity.competitorPrice ? `R$ ${opportunity.competitorPrice.toFixed(2)}/kg` : 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Concorrente</p>
                <p className="font-medium">{opportunity.competitorName || 'Não informado'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geolocalização */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geolocalização (GPS)
          </CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="-46.6333"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raio de Validação (metros)</label>
                <input
                  type="number"
                  value={formData.geofenceRadius}
                  onChange={(e) => setFormData({ ...formData, geofenceRadius: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  placeholder="100"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Latitude</p>
                <p className="font-medium">{opportunity.latitude || 'Não definida'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Longitude</p>
                <p className="font-medium">{opportunity.longitude || 'Não definida'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Raio de Validação</p>
                <p className="font-medium">{opportunity.geofenceRadius ? `${opportunity.geofenceRadius}m` : '100m (padrão)'}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">
            A geolocalização é usada para validar se a visita está sendo realizada no local correto.
          </p>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={updateOpportunity.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
};
