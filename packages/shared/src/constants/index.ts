/**
 * Constantes compartilhadas
 */

export * from './app';
export * from './validation';

// Re-exportações organizadas
export {
  // Configurações da aplicação
  APP_CONFIG,
  LIMITS,
  API_CONFIG,
  
  // Status e tipos
  STATUS,
  ENTITY_TYPES,
  USER_ROLES,
  USER_CONTEXTS,
  ORGANIZATION_TYPES,
  ORGANIZATION_SIZES,
  ANALYSIS_TYPES,
  PRIORITIES,
  
  // Códigos e eventos
  ERROR_CODES,
  DOMAIN_EVENTS,
  
  // Cache e notificações
  CACHE_KEYS,
  NOTIFICATION_TYPES
} from './app';

export {
  // Validação
  REGEX,
  VALIDATION_MESSAGES,
  VALIDATION_LIMITS,
  
  // Dados brasileiros
  BRAZILIAN_STATES,
  BRAZILIAN_AREA_CODES,
  
  // Arquivos
  ALLOWED_FILE_TYPES,
  FILE_EXTENSIONS
} from './validation';