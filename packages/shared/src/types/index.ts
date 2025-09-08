/**
 * Tipos compartilhados
 */

export * from './common';

// Re-exportações organizadas
export type {
  // Tipos básicos
  ID,
  Timestamp,
  JSONValue,
  JSONObject,
  JSONArray,
  
  // Tipos de resultado
  Result,
  SuccessResult,
  ErrorResult,
  
  // Tipos de paginação
  PaginationParams,
  PaginatedResponse,
  
  // Tipos de filtro
  FilterParams,
  
  // Tipos de API
  ApiResponse,
  ApiError,
  
  // Tipos de arquivo
  FileInfo,
  FileUploadProgress,
  
  // Tipos de auditoria
  AuditInfo,
  
  // Tipos de configuração
  AppConfig,
  
  // Tipos de notificação
  Notification,
  NotificationAction,
  
  // Tipos de validação
  ValidationError,
  ValidationResult,
  
  // Tipos de permissão
  Permission,
  PermissionCheck,
  
  // Tipos de evento
  DomainEvent,
  
  // Tipos utilitários
  Optional,
  RequiredFields,
  DeepPartial,
  NonEmptyArray,
  ValueOf
} from './common';