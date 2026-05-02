import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, User, Globe, Phone, MapPin, FileText, Briefcase, StickyNote } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { useCreateOpportunity } from '@/hooks/useOpportunities';
import toast from 'react-hot-toast';

interface ModalNewOpportunityProps {
  isOpen: boolean;
  onClose: () => void;
}

type OpportunityType = 
  | 'LEILAO_LOTE_SPOT' 
  | 'LEILAO_GERACAO_CONTINUA' 
  | 'FONTE' 
  | 'SUCATEIRO' 
  | 'LOTE_SPOT';

interface FormData {
  name: string;
  documentType: 'PF' | 'PJ';
  documentNumber: string;
  type: OpportunityType;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Campos específicos para Fonte
  responsibleName?: string;
  responsibleRole?: string;
  responsiblePhone?: string;
  observations?: string;
  visitDate?: string;
  visitTime?: string;
}

const typeLabels: Record<OpportunityType, string> = {
  LEILAO_LOTE_SPOT: 'Leilão — Lote Spot',
  LEILAO_GERACAO_CONTINUA: 'Leilão — Geração Contínua',
  FONTE: 'Fonte Geradora (Indústria)',
  SUCATEIRO: 'Sucateiro Parceiro',
  LOTE_SPOT: 'Lote Spot / Pontual',
};

const typeDescriptions: Record<OpportunityType, string> = {
  LEILAO_LOTE_SPOT: 'Compra por meio de leilão, material disponível em lote único',
  LEILAO_GERACAO_CONTINUA: 'Compra por meio de leilão, geração contínua de material',
  FONTE: 'Indústria geradora de sucata com fornecimento regular',
  SUCATEIRO: 'Parceiro sucateiro que vende material',
  LOTE_SPOT: 'Compra pontual de lote específico',
};

export const ModalNewOpportunity: React.FC<ModalNewOpportunityProps> = ({ isOpen, onClose }) => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>();
  const createOpportunity = useCreateOpportunity();
  const documentType = watch('documentType');
  const selectedType = watch('type') as OpportunityType;

  const onSubmit = async (data: FormData) => {
    try {
      await createOpportunity.mutateAsync(data);
      toast.success('Oportunidade criada com sucesso!');
      reset();
      onClose();
    } catch (error: any) {
      // Tratar erro de documento duplicado (CPF/CNPJ)
      if (error.response?.data?.code === 'DUPLICATE_DOCUMENT') {
        const existing = error.response.data.existing;
        const docLabel = data.documentType === 'PF' ? 'CPF' : 'CNPJ';
        toast.error(
          `${docLabel} já cadastrado!\n\n` +
          `Empresa: ${existing.name}\n` +
          `Tipo: ${typeLabels[existing.type as OpportunityType] || existing.type}\n` +
          `Fase: ${existing.stage}\n\n` +
          `Não é possível cadastrar a mesma empresa duas vezes.`,
          { duration: 6000 }
        );
        return;
      }
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao criar oportunidade');
    }
  };

  const isFonte = selectedType === 'FONTE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Oportunidade"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={createOpportunity.isPending}
          >
            Criar Oportunidade
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* ETAPA 1: Tipo de Oportunidade (seleção obrigatória primeiro) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-semibold text-blue-900 mb-3">
            1. Selecione o Tipo de Oportunidade *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(typeLabels) as OpportunityType[]).map((type) => (
              <label
                key={type}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedType === type 
                    ? 'border-blue-500 bg-blue-100' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  value={type}
                  {...register('type', { required: 'Selecione o tipo de oportunidade' })}
                  className="w-4 h-4 mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{typeLabels[type]}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{typeDescriptions[type]}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.type && (
            <p className="text-red-600 text-sm mt-2">{errors.type.message}</p>
          )}
        </div>

        {/* ETAPA 2: Dados da Empresa/Pessoa */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            2. Dados da Empresa ou Pessoa *
          </label>
          
          {/* Tipo de Documento */}
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
              <input
                type="radio"
                value="PF"
                {...register('documentType', { required: true })}
                className="w-4 h-4 text-blue-600"
              />
              <User className="w-5 h-5 text-gray-400" />
              <span>Pessoa Física (CPF)</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
              <input
                type="radio"
                value="PJ"
                {...register('documentType', { required: true })}
                className="w-4 h-4 text-blue-600"
              />
              <Building2 className="w-5 h-5 text-gray-400" />
              <span>Pessoa Jurídica (CNPJ)</span>
            </label>
          </div>

          {/* Nome/Razão Social */}
          <Input
            label={documentType === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
            {...register('name', { required: 'Nome é obrigatório' })}
            error={errors.name?.message}
            placeholder={documentType === 'PF' ? 'Nome completo' : 'Nome da empresa'}
          />

          {/* CPF/CNPJ */}
          <Input
            label={documentType === 'PF' ? 'CPF *' : 'CNPJ *'}
            {...register('documentNumber', { required: documentType === 'PF' ? 'CPF é obrigatório' : 'CNPJ é obrigatório' })}
            placeholder={documentType === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
            error={errors.documentNumber?.message}
          />
        </div>

        {/* ETAPA 3: Contato */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            3. Contato
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefone"
              {...register('phone')}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="E-mail"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
            />
          </div>
          {isFonte && (
            <Input
              label="Website"
              {...register('website')}
              placeholder="www.exemplo.com.br"
              leftIcon={<Globe className="w-5 h-5" />}
              className="mt-3"
            />
          )}
        </div>

        {/* ETAPA 4: Endereço */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            4. Endereço
          </label>
          <div className="space-y-3">
            <Input
              label="Endereço Completo"
              {...register('address')}
              placeholder="Rua, número, complemento - Bairro"
              leftIcon={<MapPin className="w-5 h-5" />}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Cidade"
                {...register('city')}
                placeholder="Ribeirão Pires"
              />
              <Input
                label="Estado"
                {...register('state')}
                placeholder="SP"
                maxLength={2}
              />
              <Input
                label="CEP"
                {...register('zipCode')}
                placeholder="09414-500"
              />
            </div>
          </div>
        </div>

        {/* ETAPA 5: Responsável (apenas para Fonte) */}
        {isFonte && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-green-900 mb-3">
              5. Responsável na Empresa
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome do Responsável"
                {...register('responsibleName')}
                placeholder="André Pini"
                leftIcon={<User className="w-5 h-5" />}
              />
              <Input
                label="Cargo"
                {...register('responsibleRole')}
                placeholder="Gerente de Fábrica"
                leftIcon={<Briefcase className="w-5 h-5" />}
              />
            </div>
            <Input
              label="Celular do Responsável"
              {...register('responsiblePhone')}
              placeholder="(11) 9 4585-3404"
              leftIcon={<Phone className="w-5 h-5" />}
              className="mt-3"
            />
          </div>
        )}

        {/* ETAPA 6: Observações e Visitas */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            {isFonte ? '6. Observações e Visita' : '5. Observações'}
          </label>
          
          {isFonte && (
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Input
                label="Data da Visita"
                type="date"
                {...register('visitDate')}
              />
              <Input
                label="Horário da Visita"
                type="time"
                {...register('visitTime')}
              />
            </div>
          )}
          
          <div className="relative">
            <StickyNote className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              {...register('observations')}
              placeholder={
                isFonte 
                  ? "Ex: Geramos 2 a 3 caçambas de sucata ferrosa por mês e 1 caçamba de carepa de aço. Combinar melhor data na semana que vem."
                  : "Observações sobre a oportunidade..."
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isFonte 
              ? 'Descreva a geração de sucata, frequência, tipos de material e qualquer detalhe relevante.'
              : 'Adicione informações relevantes sobre esta oportunidade.'
            }
          </p>
        </div>
      </form>
    </Modal>
  );
};
