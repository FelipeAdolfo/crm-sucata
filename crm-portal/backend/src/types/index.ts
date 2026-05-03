import { UserRole, UserStatus, OpportunityStage, OpportunityType, DocumentType } from '@prisma/client';

// User types
export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  cpf: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: UserPayload;
  token?: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

// 2FA types
export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
}

// Opportunity types
export interface CreateOpportunityRequest {
  name: string;
  type: OpportunityType;
  documentType: DocumentType;
  documentNumber: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  source?: string;
  assignedTo?: string;
}

export interface UpdateOpportunityRequest {
  name?: string;
  stage?: OpportunityStage;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  scrapType?: string;
  quantityGenerated?: number;
  containerWeight?: number;
  containerType?: string;
  exchangeFrequency?: string;
  currentBuyer?: string;
  competitorPrice?: number;
  competitorName?: string;
  proposedPrice?: number;
  negotiatedVolume?: number;
  paymentTerms?: string;
  collectionFrequency?: string;
}

// Contact types
export interface CreateContactRequest {
  opportunityId: string;
  name: string;
  role?: string;
  email?: string;
  phoneMobile?: string;
  phoneLandline?: string;
  extension?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isMainContact?: boolean;
}

// Visit types
export interface CreateVisitRequest {
  opportunityId: string;
  scheduledAt: string;
  duration?: number;
  objectives?: string;
}

export interface UpdateVisitRequest {
  scheduledAt?: string;
  duration?: number;
  objectives?: string;
  status?: string;
  result?: string;
  observations?: string;
}

// Photo types
export interface UploadPhotoRequest {
  opportunityId: string;
  category: string;
  description?: string;
}

// Market Intelligence types
export interface CreateMarketIntelRequest {
  opportunityId?: string;
  type: string;
  competitorName?: string;
  scrapType?: string;
  price?: number;
  region?: string;
  description: string;
  source?: string;
  intelDate?: string;
}

// Dashboard types
export interface DashboardMetrics {
  totalOpportunities: number;
  opportunitiesByStage: Record<string, number>;
  totalVisits: number;
  visitsThisMonth: number;
  conversionsThisMonth: number;
  topCompetitors: Array<{ name: string; count: number }>;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
