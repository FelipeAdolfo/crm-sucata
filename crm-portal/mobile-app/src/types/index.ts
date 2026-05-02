export type UserRole = 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'INTEL_COORDINATOR' | 'ANALYST' | 'BUYER' | 'PARTNER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';
export type DeviceLinkStatus = 'UNLINKED' | 'PENDING' | 'LINKED' | 'REVOKED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  cpf?: string;
  phone?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  deviceId?: string;
  deviceModel?: string;
  deviceStatus?: DeviceLinkStatus;
  twoFactorEnabled: boolean;
  firstLogin: boolean;
}

export type OpportunityType = 'LEILAO_LOTE_SPOT' | 'LEILAO_GERACAO_CONTINUA' | 'FONTE' | 'SUCATEIRO' | 'LOTE_SPOT';
export type OpportunityStage = 'PRIMEIRO_CONTATO' | 'SEGUNDO_CONTATO' | 'VISITA' | 'EM_NEGOCIACAO' | 'CONTRA_PROPOSTA' | 'EM_FECHAMENTO' | 'CONCLUIDA_SUCESSO' | 'FORA_DE_PERFIL' | 'BAIXA_GERACAO_DIR' | 'BAIXA_GERACAO_ENT';

export interface Opportunity {
  id: string;
  name: string;
  type: OpportunityType;
  stage: OpportunityStage;
  status: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  website?: string;
  responsibleName?: string;
  responsibleRole?: string;
  responsiblePhone?: string;
  observations?: string;
  scrapTypes?: string[];
  estimatedVolume?: number;
  paymentCondition?: string;
  quantityGenerated?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string };
}

export interface CallRecord {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  metadata?: {
    telefone: string;
    nome_contato: string;
    duracao_segundos: number;
    tipo_chamada: string;
  };
  opportunity?: { id: string; name: string };
}

export interface Document {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'SIGNED' | 'ARCHIVED';
  signedAt?: string;
  signedBy?: string;
  opportunityId?: string;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export interface VisitRecord {
  id: string;
  scheduledDate: string;
  status: string;
  objective?: string;
  notes?: string;
  checkInLat?: number;
  checkInLng?: number;
  distance?: number;
  validationStatus?: string;
  opportunity?: { id: string; name: string };
}

export interface DashboardStats {
  totalOpportunities: number;
  converted: number;
  conversionRate: number;
  visitsThisMonth: number;
  monthlyGoal: number;
  goalProgress: number;
}

export interface MarketIntelEntry {
  id: string;
  scrapType: string;
  pricePerKg: number;
  source: string;
  referenceDate: string;
  trend: string;
  observations?: string;
}
