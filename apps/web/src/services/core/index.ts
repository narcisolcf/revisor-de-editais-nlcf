/**
 * Exportações dos serviços principais
 */

export * from './api.js';
export * from './cache.js';
export * from './error.js';
export * from './validation.js';
export * from './logging.js';

// Re-exporta tipos comuns
export type {
  // Tipos de API
  HttpMethod,
  HttpStatusCode,
  RequestConfig,
  ApiResponse,
  ApiErrorResponse,
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  RetryConfig,
  ApiPaginationConfig,
  ApiEndpoint,
  CrudOperations,
  SearchOperations,
  RequestState,
  WebhookConfig
} from '../../types/core/api';

export type {
  // Tipos de erro
  BaseError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  BusinessError,
  SystemError,
  FileError,
  BusinessErrorCategory,
  FileErrorType,
  AppError,
  Result,
  ErrorHandlingConfig,
  ErrorReport
} from '../../types/core/errors';

export type {
  // Tipos comuns
  Severity,
  Status,
  ExtendedStatus,
  Priority,
  NotificationType,
  SortDirection,
  FilterOperator,
  Filter,
  Sort,
  FieldSelection,
  CacheConfig,
  RetryConfig as CommonRetryConfig,
  TimeoutConfig,
  Coordinates,
  Location,
  NumericRange,
  DateRange,
  FormatConfig,
  ValidationResult as CommonValidationResult,
  ValidationError as CommonValidationError,
  ValidationWarning
} from '../../types/core/common';

/**
 * Configuração global dos serviços
 */
export interface CoreServicesConfig {
  /** Configuração da API */
  api?: {
    baseURL?: string;
    timeout?: number;
    retries?: number;
  };
  /** Configuração do cache */
  cache?: {
    defaultTTL?: number;
    maxSize?: number;
  };
  /** Configuração de logging */
  logging?: {
    level?: import('./logging').LogLevel;
    console?: boolean;
    persist?: boolean;
  };
  /** Configuração de tratamento de erros */
  error?: {
    autoLog?: boolean;
    showNotification?: boolean;
    autoRecover?: boolean;
  };
}