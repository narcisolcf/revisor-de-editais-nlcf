/**
 * Error Types
 * Tipos relacionados ao tratamento de erros
 */

// Error Categories
/* eslint-disable no-unused-vars */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  NETWORK = 'network',
  FILE = 'file',
  BUSINESS = 'business'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
/* eslint-enable no-unused-vars */

// Base Error Interface
export interface BaseError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

// Specific Error Types
export interface ValidationError extends BaseError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  value?: unknown;
  constraints?: string[];
}

export interface AuthenticationError extends BaseError {
  category: ErrorCategory.AUTHENTICATION;
  reason: 'invalid_credentials' | 'token_expired' | 'token_invalid' | 'account_locked';
}

export interface AuthorizationError extends BaseError {
  category: ErrorCategory.AUTHORIZATION;
  requiredPermission?: string;
  userPermissions?: string[];
}

export interface NotFoundError extends BaseError {
  category: ErrorCategory.NOT_FOUND;
  resourceType: string;
  resourceId?: string;
}

export interface ConflictError extends BaseError {
  category: ErrorCategory.CONFLICT;
  conflictingResource?: string;
  conflictingValue?: unknown;
}

export interface RateLimitError extends BaseError {
  category: ErrorCategory.RATE_LIMIT;
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface InternalError extends BaseError {
  category: ErrorCategory.INTERNAL;
  stack?: string;
  originalError?: Error;
}

export interface ExternalError extends BaseError {
  category: ErrorCategory.EXTERNAL;
  service: string;
  statusCode?: number;
  response?: unknown;
}

export interface NetworkError extends BaseError {
  category: ErrorCategory.NETWORK;
  url?: string;
  method?: string;
  statusCode?: number;
  timeout?: boolean;
}

export interface FileError extends BaseError {
  category: ErrorCategory.FILE;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  reason: 'too_large' | 'invalid_type' | 'corrupted' | 'virus_detected' | 'upload_failed';
}

export interface BusinessError extends BaseError {
  category: ErrorCategory.BUSINESS;
  businessRule: string;
  context?: Record<string, unknown>;
}

// Union type for all errors
export type AppError = 
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | InternalError
  | ExternalError
  | NetworkError
  | FileError
  | BusinessError;

// Error Response (renamed to avoid conflict with api.types)
export interface AppErrorResponse {
  success: false;
  error: AppError;
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
}

// Error Context
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  additionalData?: Record<string, unknown>;
}

// Error Report
export interface ErrorReport {
  error: AppError;
  context: ErrorContext;
  userConsent: boolean;
  userComment?: string;
  reproductionSteps?: string[];
}

// Result type
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };