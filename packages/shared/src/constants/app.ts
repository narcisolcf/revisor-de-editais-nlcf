/**
 * Constantes da aplicação
 */

// Configurações gerais
export const APP_CONFIG = {
  NAME: 'Revisor de Editais',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de revisão e análise de editais públicos'
} as const;

// Limites da aplicação
export const LIMITS = {
  // Arquivos
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  
  // Análise
  MAX_ANALYSIS_TIMEOUT: 5 * 60 * 1000, // 5 minutos
  MAX_CONCURRENT_ANALYSIS: 3,
  
  // Documentos
  MAX_DOCUMENTS_PER_ORGANIZATION: 1000,
  MAX_DOCUMENT_TITLE_LENGTH: 200,
  MAX_DOCUMENT_DESCRIPTION_LENGTH: 1000,
  
  // Organizações
  MAX_ORGANIZATION_NAME_LENGTH: 100,
  MAX_ORGANIZATION_DESCRIPTION_LENGTH: 500,
  MAX_USERS_PER_ORGANIZATION: 100,
  
  // Usuários
  MAX_USER_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Paginação
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache
  DEFAULT_CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  MAX_CACHE_SIZE: 1000
} as const;

// Status de entidades
export const STATUS = {
  DOCUMENT: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
    DELETED: 'deleted'
  },
  ANALYSIS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  ORGANIZATION: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending'
  },
  USER: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification'
  }
} as const;

// Tipos de entidades
export const ENTITY_TYPES = {
  DOCUMENT: 'document',
  ANALYSIS: 'analysis',
  ORGANIZATION: 'organization',
  USER: 'user'
} as const;

// Roles de usuário
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer'
} as const;

// Contextos de usuário
export const USER_CONTEXTS = {
  GOVERNMENT: 'government',
  PRIVATE: 'private',
  ACADEMIC: 'academic',
  NGO: 'ngo'
} as const;

// Tipos de organização
export const ORGANIZATION_TYPES = {
  GOVERNMENT: 'government',
  PRIVATE_COMPANY: 'private_company',
  UNIVERSITY: 'university',
  NGO: 'ngo',
  COOPERATIVE: 'cooperative'
} as const;

// Tamanhos de organização
export const ORGANIZATION_SIZES = {
  MICRO: 'micro',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

// Tipos de análise
export const ANALYSIS_TYPES = {
  COMPLIANCE: 'compliance',
  RISK: 'risk',
  OPPORTUNITY: 'opportunity',
  TECHNICAL: 'technical',
  FINANCIAL: 'financial'
} as const;

// Prioridades
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

// Códigos de erro
export const ERROR_CODES = {
  // Validação
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  
  // Negócio
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Sistema
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// Eventos de domínio
export const DOMAIN_EVENTS = {
  DOCUMENT: {
    CREATED: 'document.created',
    UPDATED: 'document.updated',
    PUBLISHED: 'document.published',
    ARCHIVED: 'document.archived',
    DELETED: 'document.deleted'
  },
  ANALYSIS: {
    STARTED: 'analysis.started',
    COMPLETED: 'analysis.completed',
    FAILED: 'analysis.failed',
    CANCELLED: 'analysis.cancelled'
  },
  ORGANIZATION: {
    CREATED: 'organization.created',
    UPDATED: 'organization.updated',
    ACTIVATED: 'organization.activated',
    DEACTIVATED: 'organization.deactivated',
    SUSPENDED: 'organization.suspended'
  },
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    EMAIL_VERIFIED: 'user.email_verified',
    ACTIVATED: 'user.activated',
    DEACTIVATED: 'user.deactivated',
    SUSPENDED: 'user.suspended',
    LOGIN: 'user.login',
    LOGOUT: 'user.logout'
  }
} as const;

// Configurações de cache
export const CACHE_KEYS = {
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
  ORGANIZATION_USERS: (orgId: string) => `organization:users:${orgId}`,
  DOCUMENT_ANALYSIS: (docId: string) => `document:analysis:${docId}`,
  ANALYSIS_RESULTS: (analysisId: string) => `analysis:results:${analysisId}`
} as const;

// Configurações de notificação
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

// Configurações de API
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000
  }
} as const;