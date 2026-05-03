// ============================================
// USER TYPES
// ============================================
export type UserRole = 'PARTNER' | 'BUYER' | 'ANALYST' | 'MANAGER' | 'DIRECTOR' | 'INTEL_COORDINATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';
export type DeviceLinkStatus = 'UNLINKED' | 'PENDING' | 'LINKED' | 'REVOKED';

export interface User {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
  firstLogin: boolean;
  needsPasswordChange?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  deviceId?: string;
  deviceModel?: string;
  deviceOsVersion?: string;
  deviceAppVersion?: string;
  deviceLinkedAt?: string;
  deviceStatus?: DeviceLinkStatus;
}

// ============================================
// AUTH TYPES
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  cpf?: string;
  phone?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AuthError {
  error: string;
  code: string;
  status?: UserStatus;
  lockedUntil?: string;
  attemptsRemaining?: number;
  retryAfter?: number;
}

// ============================================
// OPPORTUNITY TYPES
// ============================================
export type OpportunityStage = 
  | 'PRIMEIRO_CONTATO'
  | 'SEGUNDO_CONTATO'
  | 'VISITA'
  | 'EM_NEGOCIACAO'
  | 'CONTRA_PROPOSTA'
  | 'EM_FECHAMENTO'
  | 'CONCLUIDA_SUCESSO'
  | 'FORA_DE_PERFIL'
  | 'BAIXA_GERACAO_DIR'
  | 'BAIXA_GERACAO_ENT';

export type OpportunityType = 'LEILAO_LOTE_SPOT' | 'LEILAO_GERACAO_CONTINUA' | 'FONTE' | 'SUCATEIRO' | 'LOTE_SPOT';
export type DocumentType = 'PF' | 'PJ';
export type OpportunityStatus = 'ACTIVE' | 'INACTIVE' | 'CONVERTED' | 'LOST';
export type ScrapType = 'FERROUS' | 'NON_FERROUS' | 'MIXED';
export type ContainerType = 'DRUM' | 'BIG_BAG' | 'SKIP_BIN' | 'CONTAINER';
export type ExchangeFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SPORADIC';
export type LowGenType = 'DIRECT' | 'DELIVERY';
export type CompanyType = 'NON_TRANSFORMER' | 'TOOL_SHOP' | 'MACHINING' | 'STAMPING' | 'FORGING' | 'CUTTING_BENDING' | 'OTHER';

export interface Opportunity {
  id: string;
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
  website?: string;              // Site da empresa
  responsibleName?: string;    // Nome do responsável
  responsibleRole?: string;    // Cargo
  responsiblePhone?: string;    // Celular
  observations?: string;        // Observações
  stage: OpportunityStage;
  previousStage?: OpportunityStage;
  lowGenType?: LowGenType;
  companyType?: CompanyType;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number;
  assignedTo: string;
  assignedUser?: User;
  source?: string;
  scrapType?: ScrapType;
  quantityGenerated?: number;
  containerWeight?: number;
  containerType?: ContainerType;
  exchangeFrequency?: ExchangeFrequency;
  currentBuyer?: string;
  competitorPrice?: number;
  competitorName?: string;
  proposedPrice?: number;
  negotiatedVolume?: number;
  paymentTerms?: string;
  collectionFrequency?: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  _count?: {
    contacts: number;
    visits: number;
    photos: number;
  };
}

// ============================================
// CONTACT TYPES
// ============================================
export interface Contact {
  id: string;
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
  isMainContact: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PHOTO TYPES
// ============================================
export type PhotoCategory = 'SCRAP' | 'LOCATION' | 'ACCESS' | 'CONTAINER' | 'DOCUMENT' | 'OTHER';

export interface Photo {
  id: string;
  opportunityId: string;
  url: string;
  thumbnailUrl?: string;
  category: PhotoCategory;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ============================================
// VISIT TYPES
// ============================================
export type VisitStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Visit {
  id: string;
  opportunityId: string;
  opportunity?: Opportunity;
  scheduledAt: string;
  duration?: number;
  visitorId: string;
  visitor?: User;
  objectives?: string;
  checklist?: VisitChecklist;
  status: VisitStatus;
  result?: string;
  observations?: string;
  photos?: VisitPhoto[];
  visitorLatitude?: number;
  visitorLongitude?: number;
  locationVerified: boolean;
  verifiedAt?: string;
  locationDistance?: number;
  createdAt: string;
  completedAt?: string;
}

export interface VisitChecklist {
  id: string;
  visitId: string;
  hasProperAccess?: boolean;
  hasSafetyEquipment?: boolean;
  hasProperStorage?: boolean;
  hasDocumentation?: boolean;
  scrapVerified?: boolean;
  quantityVerified?: boolean;
  qualityVerified?: boolean;
  notes?: string;
}

export interface VisitPhoto {
  id: string;
  visitId: string;
  url: string;
  category: PhotoCategory;
  description?: string;
}

// ============================================
// ACTIVITY TYPES
// ============================================
export type ActivityType = 
  | 'CREATED' 
  | 'UPDATED' 
  | 'STAGE_CHANGED' 
  | 'CONTACT_ADDED' 
  | 'PHOTO_UPLOADED' 
  | 'VISIT_SCHEDULED' 
  | 'VISIT_COMPLETED' 
  | 'NOTE_ADDED' 
  | 'NEGOTIATION' 
  | 'CONVERTED' 
  | 'LOST'
  | 'CALL'
  | 'CALL_COMPLETED'
  | 'CALL_MISSED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_SIGNED';

export interface Activity {
  id: string;
  opportunityId: string;
  userId: string;
  user?: User;
  opportunity?: Opportunity;
  type: ActivityType;
  description: string;
  oldStage?: OpportunityStage;
  newStage?: OpportunityStage;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============================================
// MARKET INTELLIGENCE TYPES
// ============================================
export type IntelType = 'COMPETITOR_PRICE' | 'MARKET_TREND' | 'SUPPLIER_CHANGE' | 'PRICE_VARIATION' | 'NEW_COMPETITOR' | 'OTHER';

export interface MarketIntelligence {
  id: string;
  userId: string;
  user?: User;
  opportunityId?: string;
  opportunity?: Opportunity;
  type: IntelType;
  competitorName?: string;
  scrapType?: ScrapType;
  price?: number;
  region?: string;
  description: string;
  source?: string;
  intelDate: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType = 'VISIT_REMINDER' | 'STAGE_CHANGE' | 'NEW_OPPORTUNITY' | 'APPROVAL_NEEDED' | 'MARKET_ALERT' | 'SYSTEM' | 'USER_APPROVED' | 'USER_REJECTED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface DashboardMetrics {
  opportunities: {
    total: number;
    byStage: Array<{ stage: OpportunityStage; _count: { stage: number } }>;
    byType: Array<{ type: OpportunityType; _count: { type: number } }>;
    converted: number;
    conversionRate: number;
  };
  visits: {
    total: number;
    thisMonth: number;
    upcoming: number;
  };
  conversions: {
    thisMonth: number;
    total: number;
  };
  competitors: Array<{ competitorName: string; _count: { competitorName: number } }>;
}

// ============================================
// DOCUMENT TYPES
// ============================================
export type DocumentStatus = 'PENDING' | 'SIGNED' | 'ARCHIVED';

export interface Document {
  id: string;
  title: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  signatureData?: string;
  signedAt?: string;
  signedBy?: string;
  opportunityId?: string;
  opportunity?: Opportunity;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CALL TYPES
// ============================================
export type CallType = 'CALL' | 'CALL_COMPLETED' | 'CALL_MISSED';

export interface Call {
  id: string;
  type: CallType;
  description: string;
  opportunityId: string;
  opportunity?: Opportunity;
  userId: string;
  user?: User;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CallStats {
  periodo: number;
  total: number;
  completed: number;
  missed: number;
  attempted: number;
  avgDurationSeconds: number;
  avgDurationFormatted: string;
  conversionRate: number;
}

// ============================================
// AUDIT LOG TYPES
// ============================================
export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_APPROVED'
  | 'USER_REJECTED'
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'OPPORTUNITY_CREATED'
  | 'OPPORTUNITY_UPDATED'
  | 'OPPORTUNITY_DELETED'
  | 'OPPORTUNITY_ASSIGNED'
  | 'STAGE_CHANGED'
  | 'VISIT_CREATED'
  | 'VISIT_COMPLETED'
  | 'PHOTO_UPLOADED'
  | 'DATA_EXPORTED'
  | 'SETTINGS_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'SESSION_REVOKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  riskLevel: RiskLevel;
}

// ============================================
// PAGINATION
// ============================================
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// FILTERS
// ============================================
export interface ActivityFilters {
  opportunityId?: string;
  userId?: string;
  type?: ActivityType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface CreateActivityData {
  opportunityId: string;
  type: ActivityType;
  description: string;
  oldStage?: OpportunityStage;
  newStage?: OpportunityStage;
  metadata?: Record<string, any>;
}

export interface VisitFilters {
  opportunityId?: string;
  visitorId?: string;
  status?: VisitStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface PhotoFilters {
  opportunityId?: string;
  category?: PhotoCategory;
  limit?: number;
}

export interface MarketIntelFilters {
  type?: IntelType;
  region?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================
// USER SESSION TYPES
// ============================================
export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
}
