// Exportações principais dos tipos de documentos
export * from './base';
export * from './analysis';

// Exportações específicas para evitar conflitos
export type {
  // Upload types
  DocumentUpload,
  UploadStatus,
  UploadProgress,
  UploadConfig,
  UploadResult,
  UploadError,
  UploadWarning,
  DocumentClassification as UploadDocumentClassification,
  BatchUploadOptions,
  FileValidation
} from './upload';

export type {
  // Classification types
  ClassificationHierarchy,
  ClassificationResult,
  ClassificationConfig,
  ValidationRule as ClassificationValidationRule,
  RuleCondition,
  IdentificationRule,
  ClassificationMatch
} from './classification';

export type {
  // Validation types
  DocumentValidationResult,
  ValidationCheck,
  ValidationConfig,
  ValidationRule,
  ValidationError as DocumentValidationError,
  ValidationWarning as DocumentValidationWarning,
  ValidationProfile,
  ValidationReport
} from './validation';

export type {
  // Metadata types
  FileMetadata,
  ContentMetadata,
  TechnicalMetadata,
  BusinessMetadata,
  ProcessingMetadata,
  LanguageDetection,
  Keyword,
  NamedEntity,
  EntityType,
  Topic,
  SentimentAnalysis,
  ReadabilityStats,
  CreatorInfo,
  ApplicationInfo,
  SecurityInfo,
  MetadataChange,
  MetadataSchema
} from './metadata';