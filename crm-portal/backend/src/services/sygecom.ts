/**
 * INTEGRACAO SYGECOM - Webhook para exportar fontes concluidas
 * 
 * Este modulo envia automaticamente os dados de uma fonte geradora
 * para o Sygecom (ou qualquer ERP) quando a oportunidade atinge
 * a fase CONCLUIDA_COM_SUCESSO.
 * 
 * PRE-REQUISITOS:
 *   1. Configurar SYGECOM_WEBHOOK_URL nas variaveis de ambiente
 *   2. Configurar SYGECOM_API_KEY (chave de autenticacao)
 *   3. Verificar com Sygecom qual formato de dados eles aceitam
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONFIGURACAO
// ============================================
const SYGECOM_WEBHOOK_URL = process.env.SYGECOM_WEBHOOK_URL || '';
const SYGECOM_API_KEY = process.env.SYGECOM_API_KEY || '';
const SYGECOM_ENABLED = process.env.SYGECOM_ENABLED === 'true';

// ============================================
// INTERFACE - Dados enviados ao Sygecom
// ============================================
export interface SygecomFontePayload {
  // Identificacao
  codigo_externo: string;           // ID do CRM
  cnpj: string;                     // CNPJ da fonte
  razao_social: string;             // Nome completo
  nome_fantasia: string;            // Nome fantasia
  
  // Endereco
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  
  // Contato
  telefone: string;
  telefone_secundario?: string;
  email: string;
  website?: string;
  
  // Dados da sucata
  tipo_sucata?: string;             // ACO_FERROSO, ACO_INOX, ALUMINIO, etc.
  geracao_mensal_kg?: number;       // Quantidade gerada por mes
  peso_medio_caixa_kg?: number;    // Peso medio da caixa/container
  frequencia_troca?: string;        // SEMANAL, QUINZENAL, MENSAL
  
  // Comercial
  comprador_atual?: string;         // Para quem vende hoje
  concorrente?: string;             // Nome do concorrente
  preco_proposto?: number;          // Valor negociado
  volume_negociado?: number;        // Volume contratado
  condicao_pagamento?: string;      // A_VISTA, 30_DIAS, 45_DIAS
  frequencia_coleta?: string;     // Quantas vezes por semana/mes
  
  // Origem
  data_cadastro: string;            // ISO date
  data_conclusao: string;           // ISO date
  comprador_responsavel: string;   // Nome do comprador
  origem: string;                  // FONTE, LEILAO, SUCATEIRO, etc.
  
  // Metadados
  latitude?: number;
  longitude?: number;
  atividade_principal?: string;
  observacoes?: string;
}

// ============================================
// MAPEAMENTO DE TIPO DE SUCATA
// ============================================
function mapScrapType(type: string | null | undefined): string {
  if (!type) return 'ACO_FERROSO'; // default
  const t = type.toUpperCase();
  if (t.includes('INOX')) return 'ACO_INOX';
  if (t.includes('ALUMIN')) return 'ALUMINIO';
  if (t.includes('COBRE')) return 'COBRE';
  if (t.includes('LATON') || t.includes('BRONZE')) return 'METAIS_NAO_FERROSOS';
  return 'ACO_FERROSO';
}

// ============================================
// MAPEAMENTO DE FREQUENCIA
// ============================================
function mapFrequency(freq: string | null | undefined): string {
  if (!freq) return 'SEMANAL';
  const f = freq.toUpperCase();
  if (f.includes('SEMANA') || f.includes('SEMANAL')) return 'SEMANAL';
  if (f.includes('QUINZE') || f.includes('15')) return 'QUINZENAL';
  if (f.includes('MES') || f.includes('MENSAL')) return 'MENSAL';
  if (f.includes('DIA') || f.includes('DIARIO')) return 'DIARIO';
  return 'SEMANAL';
}

// ============================================
// CONSTRUIR PAYLOAD
// ============================================
async function buildSygecomPayload(opportunityId: string): Promise<SygecomFontePayload | null> {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      assignedUser: { select: { name: true, email: true } },
      contacts: true,
    },
  });

  if (!opp) return null;

  // Pegar contato principal (primeiro da lista)
  const contatoPrincipal = opp.contacts[0];

  // Parse endereco
  const parts = (opp.address || '').split(',');
  const logradouro = parts[0]?.trim() || '';
  const numeroMatch = opp.address?.match(/Nº\s*(\d+)/);
  const numero = numeroMatch ? numeroMatch[1] : '';
  const bairro = parts[parts.length - 1]?.trim() || '';

  return {
    codigo_externo: opp.id,
    cnpj: opp.documentNumber,
    razao_social: opp.razaoSocial || opp.name,
    nome_fantasia: opp.name,
    endereco: logradouro,
    numero,
    complemento: undefined,
    bairro,
    cidade: opp.city || '',
    estado: opp.state || 'SP',
    cep: opp.zipCode || '',
    telefone: opp.phone || contatoPrincipal?.phone || '',
    telefone_secundario: contatoPrincipal?.phone,
    email: opp.email || contatoPrincipal?.email || '',
    website: opp.website,
    tipo_sucata: mapScrapType(opp.scrapType),
    geracao_mensal_kg: opp.quantityGenerated || undefined,
    peso_medio_caixa_kg: opp.containerWeight || undefined,
    frequencia_troca: mapFrequency(opp.exchangeFrequency),
    comprador_atual: opp.currentBuyer,
    concorrente: opp.competitorName,
    preco_proposto: opp.proposedPrice || undefined,
    volume_negociado: opp.negotiatedVolume || undefined,
    condicao_pagamento: opp.paymentTerms || undefined,
    frequencia_coleta: opp.collectionFrequency || undefined,
    data_cadastro: opp.leadDate?.toISOString() || opp.createdAt.toISOString(),
    data_conclusao: new Date().toISOString(),
    comprador_responsavel: opp.assignedUser?.name || '',
    origem: opp.type,
    latitude: opp.latitude || undefined,
    longitude: opp.longitude || undefined,
    atividade_principal: undefined,
    observacoes: opp.observations || undefined,
  };
}

// ============================================
// ENVIAR PARA SYGECOM
// ============================================
export async function enviarParaSygecom(opportunityId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  // Verificar se integracao esta ativada
  if (!SYGECOM_ENABLED || !SYGECOM_WEBHOOK_URL) {
    return {
      sucesso: false,
      mensagem: 'Integracao Sygecom nao configurada. Defina SYGECOM_WEBHOOK_URL e SYGECOM_ENABLED=true',
    };
  }

  try {
    // Construir payload
    const payload = await buildSygecomPayload(opportunityId);
    if (!payload) {
      return { sucesso: false, mensagem: 'Oportunidade nao encontrada' };
    }

    // Log do envio (para auditoria)
    console.log(`[Sygecom] Enviando fonte ${payload.cnpj} - ${payload.razao_social}`);

    // Enviar via POST
    const response = await axios.post(SYGECOM_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SYGECOM_API_KEY}`,
        'X-Source': 'CRM-Sucata',
        'X-Event': 'fonte_concluida',
      },
      timeout: 30000,
    });

    // Registrar sucesso no banco (opcional)
    await prisma.activity.create({
      data: {
        type: 'OPPORTUNITY_UPDATED', // ou criar um tipo especifico
        description: `Fonte enviada para Sygecom: ${payload.razao_social}`,
        userId: 'system',
        opportunityId,
        metadata: {
          sygecom_status: response.status,
          sygecom_response: response.data,
          cnpj: payload.cnpj,
        },
      },
    });

    return {
      sucesso: true,
      mensagem: `Enviado com sucesso! Status: ${response.status}`,
    };

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
    console.error(`[Sygecom] Erro no envio: ${errorMsg}`);

    // Registrar falha
    await prisma.activity.create({
      data: {
        type: 'OPPORTUNITY_UPDATED',
        description: `FALHA ao enviar para Sygecom: ${errorMsg}`,
        userId: 'system',
        opportunityId,
        metadata: {
          sygecom_error: errorMsg,
          sygecom_status: error.response?.status,
        },
      },
    });

    return {
      sucesso: false,
      mensagem: `Falha no envio: ${errorMsg}`,
    };
  }
}

// ============================================
// TRIGGER - Chamar quando stage mudar para CONCLUIDA_SUCESSO
// ============================================
export async function onOportunidadeConcluida(opportunityId: string): Promise<void> {
  // Envia para Sygecom automaticamente
  const resultado = await enviarParaSygecom(opportunityId);
  console.log(`[Sygecom] Resultado: ${resultado.mensagem}`);
}

export default {
  enviarParaSygecom,
  onOportunidadeConcluida,
  buildSygecomPayload,
};
