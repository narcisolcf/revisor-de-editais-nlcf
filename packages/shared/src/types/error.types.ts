/**
 * Error Types
 * Tipos relacionados ao tratamento de erros
 */

// Error Categories
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
  TIMEOUT = 'timeout',
  BUSINESS = 'business'
}

// Error Severity
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

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
  reason: 'invalid_credentials' | 'token_expired' | 'token_invalid' | 'account_locked' | 'account_disabled';
}

export interface AuthorizationError extends BaseError {
  category: ErrorCategory.AUTHORIZATION;
  resource: string;
  action: string;
  requiredPermissions?: string[];
}

export interface NotFoundError extends BaseError {
  category: ErrorCategory.NOT_FOUND;
  resource: string;
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
  originalError?: Error;
  stack?: string;
}

export interface ExternalError extends BaseError {
  category: ErrorCategory.EXTERNAL;
  service: string;
  statusCode?: number;
  originalResponse?: unknown;
}

export interface NetworkError extends BaseError {
  category: ErrorCategory.NETWORK;
  url?: string;
  method?: string;
  statusCode?: number;
}

export interface TimeoutError extends BaseError {
  category: ErrorCategory.TIMEOUT;
  timeoutMs: number;
  operation: string;
}

export interface BusinessError extends BaseError {
  category: ErrorCategory.BUSINESS;
  businessRule: string;
  context?: Record<string, unknown>;
}

// Union Type for All Errors
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
  | TimeoutError
  | BusinessError;

// Error Response
export interface AppErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

// Error Context
export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// Error Report
export interface ErrorReport {
  error: AppError;
  context: ErrorContext;
  stack?: string;
  breadcrumbs?: ErrorBreadcrumb[];
  tags?: Record<string, string>;
  fingerprint?: string[];
}

export interface ErrorBreadcrumb {
  timestamp: Date;
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// Result Type for Error Handling
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Error Handler Function Type
export type ErrorHandler = (error: AppError, context: ErrorContext) => void | Promise<void>;

// Error Recovery Strategy
export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCategory[];
  onRetry?: (attempt: number, error: AppError) => void;
  onMaxRetriesReached?: (error: AppError) => void;
}