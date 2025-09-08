/**
 * Utilitários compartilhados
 */

export * from './formatters';
export * from './validators';
export * from './helpers';

// Re-exportações organizadas
export {
  // Formatadores de documentos brasileiros
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatPhone,
  formatPhoneInternational,
  
  // Formatadores de números e moeda
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatFileSize,
  
  // Formatadores de data
  formatDate,
  formatDateTime,
  formatDateTimeFull,
  formatRelativeTime,
  
  // Formatadores de texto
  formatInitials,
  formatName,
  formatFullName,
  formatAddress,
  formatAddressShort,
  
  // Formatadores de status e tipos
  formatStatus,
  formatPriority,
  formatOrganizationType,
  formatUserRole,
  formatUserContext,
  
  // Utilitários de texto
  truncateText,
  highlightSearchText
} from './formatters';

export {
  // Validadores de documentos brasileiros
  isValidCPF,
  isValidCNPJ,
  isValidCEP,
  isValidPhone,
  
  // Validadores básicos
  isValidEmail,
  isStrongPassword,
  isValidURL,
  isValidUUID,
  
  // Validadores de data
  isValidDate,
  isFutureDate,
  isPastDate,
  isMinimumAge,
  
  // Validadores de arquivo
  isValidFileType,
  isValidFileSize,
  isValidFileName,
  
  // Outros validadores
  isValidHexColor,
  isValidCreditCard,
  isValidIP,
  isValidJSON,
  isValidInternationalPhone,
  isValidPostalCode
} from './validators';

export {
  // Funções de cálculo e análise
  calculateWeightedScore,
  getScoreCategory,
  getCategoryColor,
  
  // Utilitários gerais
  generateId,
  deepClone,
  isEmpty,
  get,
  
  // Utilitários de controle de fluxo
  createDebounce,
  sleep,
  
  // Utilitários de severidade
  severityToText,
  getSeverityColor,
  
  // Utilitários de formatação
  formatDuration,
  
  // Utilitários de arquivo
  isAllowedFileType,
  getFileExtension,
  sanitizeFilename,
  
  // Utilitários de cor
  generateRandomColor
} from './helpers';