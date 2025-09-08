/**
 * Tipos comuns compartilhados entre os pacotes
 */

// Tipos básicos
export type ID = string;
export type Timestamp = Date;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// Tipos de resultado
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface SuccessResult<T> extends Result<T> {
  success: true;
  data: T;
  error?: never;
}

export interface ErrorResult<E = Error> extends Result<never, E> {
  success: false;
  data?: never;
  error: E;
}

// Tipos de paginação
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos de filtro
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

// Tipos de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// Tipos de arquivo
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Tipos de auditoria
export interface AuditInfo {
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
  version: number;
}

// Tipos de configuração
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    fileSize: number;
    analysisTimeout: number;
    maxDocuments: number;
  };
}

// Tipos de notificação
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary';
}

// Tipos de validação
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Tipos de permissão
export type Permission = 
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'analysis:read'
  | 'analysis:write'
  | 'analysis:delete'
  | 'organizations:read'
  | 'organizations:write'
  | 'organizations:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'admin:all';

export interface PermissionCheck {
  permission: Permission;
  resource?: string;
  context?: Record<string, unknown>;
}

// Tipos de evento
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: JSONObject;
  metadata: {
    timestamp: Timestamp;
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

// Tipos utilitários
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonEmptyArray<T> = [T, ...T[]];
export type ValueOf<T> = T[keyof T];