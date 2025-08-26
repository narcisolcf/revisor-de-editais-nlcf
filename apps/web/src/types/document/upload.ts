/**
 * Tipos para upload de documentos
 */

import { DocumentType, DocumentMetadata, ProcessingInfo } from './base';

// Interface base para entidades com ID e timestamps
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Estado de upload de um documento */
export interface DocumentUpload extends BaseEntity {
  /** Arquivo sendo enviado */
  file: File;
  /** Tipo do documento */
  documentType: DocumentType;
  /** Classificação específica */
  classification?: DocumentClassification;
  /** Status atual do upload */
  status: UploadStatus;
  /** Progresso do upload */
  progress: UploadProgress;
  /** Informações de processamento */
  processing: ProcessingInfo;
  /** Metadados do documento */
  metadata: DocumentMetadata;
  /** URL temporária para preview */
  previewUrl?: string;
  /** Resultado do upload (quando concluído) */
  result?: UploadResult;
  /** Erros ocorridos */
  errors: UploadError[];
  /** Configurações do upload */
  config: UploadConfig;
}

/** Status do upload */
export type UploadStatus = 
  | 'pending'        // Aguardando início
  | 'validating'     // Validando arquivo
  | 'uploading'      // Upload em andamento
  | 'processing'     // Processamento pós-upload
  | 'completed'      // Concluído com sucesso
  | 'failed'         // Falhou
  | 'cancelled'      // Cancelado pelo usuário
  | 'paused';        // Pausado

/** Progresso detalhado do upload */
export interface UploadProgress {
  /** Etapa atual */
  stage: UploadStage;
  /** Progresso da etapa atual (0-100) */
  stageProgress: number;
  /** Progresso total (0-100) */
  totalProgress: number;
  /** Bytes transferidos */
  bytesTransferred: number;
  /** Total de bytes */
  totalBytes: number;
  /** Velocidade de upload (bytes/segundo) */
  uploadSpeed: number;
  /** Tempo decorrido em segundos */
  elapsedTime: number;
  /** Tempo estimado restante em segundos */
  estimatedTimeRemaining?: number;
  /** Mensagem de status atual */
  message: string;
  /** Timestamp da última atualização */
  lastUpdated: Date;
}

/** Etapas do upload */
export type UploadStage = 
  | 'preparing'      // Preparando arquivo
  | 'validating'     // Validando arquivo
  | 'uploading'      // Enviando arquivo
  | 'virus_scanning' // Verificação de vírus
  | 'processing'     // Processamento inicial
  | 'extracting'     // Extração de texto/metadados
  | 'classifying'    // Classificação automática
  | 'indexing'       // Indexação para busca
  | 'finalizing';    // Finalizando

/** Configurações de upload */
export interface UploadConfig {
  /** Se deve fazer classificação automática */
  autoClassify: boolean;
  /** Se deve extrair texto automaticamente */
  extractText: boolean;
  /** Se deve gerar thumbnail */
  generateThumbnail: boolean;
  /** Se deve fazer OCR em imagens */
  performOCR: boolean;
  /** Se deve fazer verificação de vírus */
  virusScan: boolean;
  /** Qualidade da compressão (0-100) */
  compressionQuality?: number;
  /** Tamanho máximo permitido em bytes */
  maxFileSize: number;
  /** Tipos MIME permitidos */
  allowedMimeTypes: string[];
  /** Se deve sobrescrever arquivo existente */
  overwriteExisting: boolean;
  /** Callback para progresso */
  onProgress?: (_progress: UploadProgress) => void;
  /** Callback para conclusão */
  onComplete?: (_result: UploadResult) => void;
  /** Callback para erro */
  onError?: (_error: UploadError) => void;
}

/** Resultado do upload */
export interface UploadResult {
  /** ID do documento criado */
  documentId: string;
  /** URL final do documento */
  documentUrl: string;
  /** URL do thumbnail */
  thumbnailUrl?: string;
  /** Metadados extraídos */
  extractedMetadata: DocumentMetadata;
  /** Classificação detectada */
  detectedClassification?: DocumentClassification;
  /** Texto extraído */
  extractedText?: string;
  /** Estatísticas do processamento */
  processingStats: ProcessingStats;
  /** Avisos gerados */
  warnings: UploadWarning[];
}

/** Estatísticas de processamento */
export interface ProcessingStats {
  /** Tempo total de processamento em segundos */
  totalProcessingTime: number;
  /** Tempo de upload em segundos */
  uploadTime: number;
  /** Tempo de processamento em segundos */
  processingTime: number;
  /** Tamanho original do arquivo */
  originalSize: number;
  /** Tamanho final do arquivo */
  finalSize: number;
  /** Taxa de compressão */
  compressionRatio: number;
  /** Número de páginas processadas */
  pagesProcessed?: number;
  /** Confiança da classificação (0-1) */
  classificationConfidence?: number;
}

/** Erro de upload */
export interface UploadError {
  /** Código do erro */
  code: UploadErrorCode;
  /** Mensagem de erro */
  message: string;
  /** Etapa onde ocorreu o erro */
  stage: UploadStage;
  /** Detalhes técnicos */
  details?: Record<string, unknown>;
  /** Se o erro é recuperável */
  recoverable: boolean;
  /** Ações sugeridas */
  suggestedActions?: string[];
  /** Timestamp do erro */
  timestamp: Date;
}

/** Códigos de erro de upload */
export type UploadErrorCode = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_CORRUPTED'
  | 'VIRUS_DETECTED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'DUPLICATE_FILE'
  | 'PROCESSING_FAILED'
  | 'CLASSIFICATION_FAILED'
  | 'TEXT_EXTRACTION_FAILED'
  | 'THUMBNAIL_GENERATION_FAILED'
  | 'UNKNOWN_ERROR';

/** Aviso de upload */
export interface UploadWarning {
  /** Código do aviso */
  code: string;
  /** Mensagem de aviso */
  message: string;
  /** Severidade do aviso */
  severity: 'low' | 'medium' | 'high';
  /** Se pode ser ignorado */
  ignorable: boolean;
}

/** Classificação de documento */
export interface DocumentClassification {
  /** Tipo principal */
  primaryType: DocumentType;
  /** Subtipo específico */
  subtype?: string;
  /** Categoria */
  category?: string;
  /** Confiança da classificação (0-1) */
  confidence: number;
  /** Classificações alternativas */
  alternatives?: AlternativeClassification[];
  /** Características detectadas */
  features: ClassificationFeature[];
}

/** Classificação alternativa */
export interface AlternativeClassification {
  /** Tipo alternativo */
  type: DocumentType;
  /** Subtipo */
  subtype?: string;
  /** Confiança */
  confidence: number;
}

/** Característica de classificação */
export interface ClassificationFeature {
  /** Nome da característica */
  name: string;
  /** Valor da característica */
  value: unknown;
  /** Peso na classificação */
  weight: number;
  /** Confiança desta característica */
  confidence: number;
}

/** Opções de upload em lote */
export interface BatchUploadOptions {
  /** Arquivos para upload */
  files: File[];
  /** Configuração comum */
  commonConfig: Partial<UploadConfig>;
  /** Configurações específicas por arquivo */
  fileConfigs?: Map<string, Partial<UploadConfig>>;
  /** Número máximo de uploads simultâneos */
  maxConcurrent: number;
  /** Se deve parar em caso de erro */
  stopOnError: boolean;
  /** Callback para progresso do lote */
  onBatchProgress?: (_progress: BatchProgress) => void;
}

/** Progresso de upload em lote */
export interface BatchProgress {
  /** Número total de arquivos */
  totalFiles: number;
  /** Arquivos concluídos */
  completedFiles: number;
  /** Arquivos com erro */
  failedFiles: number;
  /** Arquivos em andamento */
  inProgressFiles: number;
  /** Progresso total (0-100) */
  totalProgress: number;
  /** Velocidade média de upload */
  averageSpeed: number;
  /** Tempo estimado restante */
  estimatedTimeRemaining?: number;
}

/** Estado de upload em lote */
export interface BatchUploadState {
  /** Status do lote */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Progresso do lote */
  progress: BatchProgress;
  /** Uploads individuais */
  uploads: Map<string, DocumentUpload>;
  /** Resultados */
  results: UploadResult[];
  /** Erros globais */
  errors: UploadError[];
}

/** Validação de arquivo */
export interface FileValidation {
  /** Se o arquivo é válido */
  isValid: boolean;
  /** Erros de validação */
  errors: ValidationError[];
  /** Avisos */
  warnings: ValidationWarning[];
  /** Metadados básicos */
  metadata: BasicFileMetadata;
}

/** Erro de validação */
export interface ValidationError {
  /** Código do erro */
  code: string;
  /** Mensagem */
  message: string;
  /** Campo relacionado */
  field?: string;
  /** Valor que causou o erro */
  value?: unknown;
}

/** Aviso de validação */
export interface ValidationWarning {
  /** Código do aviso */
  code: string;
  /** Mensagem */
  message: string;
  /** Campo relacionado */
  field?: string;
}

/** Metadados básicos de arquivo */
export interface BasicFileMetadata {
  /** Nome do arquivo */
  name: string;
  /** Tamanho em bytes */
  size: number;
  /** Tipo MIME */
  mimeType: string;
  /** Extensão */
  extension: string;
  /** Data de modificação */
  lastModified: Date;
}