/**
 * Tipos base para documentos
 */

import { BaseEntity, TimestampedEntity } from '../core/base';
import { Status } from '../core/common';

/** Interface base para documentos */
export interface Document extends TimestampedEntity {
  /** Nome do documento */
  name: string;
  /** Descrição do documento */
  description?: string;
  /** Tipo do documento */
  type: DocumentType;
  /** Status atual do documento */
  status: DocumentStatus;
  /** Tamanho do arquivo em bytes */
  size: number;
  /** Tipo MIME do arquivo */
  mimeType: string;
  /** Hash do arquivo para verificação de integridade */
  hash: string;
  /** URL para download/visualização */
  url?: string;
  /** URL para thumbnail/preview */
  thumbnailUrl?: string;
  /** Metadados do documento */
  metadata: DocumentMetadata;
  /** Tags para categorização */
  tags: string[];
  /** ID do usuário que fez upload */
  uploadedBy: string;
  /** Configurações de acesso */
  access: AccessConfig;
}

/** Tipos de documento suportados */
export type DocumentType = 
  | 'edital'
  | 'contrato'
  | 'ata'
  | 'termo_referencia'
  | 'proposta'
  | 'documentacao_tecnica'
  | 'certidao'
  | 'declaracao'
  | 'comprovante'
  | 'outros';

/** Status possíveis de um documento */
export type DocumentStatus = 
  | 'uploading'      // Upload em andamento
  | 'processing'     // Processamento inicial
  | 'ready'          // Pronto para análise
  | 'analyzing'      // Análise em andamento
  | 'analyzed'       // Análise concluída
  | 'error'          // Erro no processamento
  | 'archived'       // Arquivado
  | 'deleted';       // Marcado para exclusão

/** Metadados básicos do documento */
export interface DocumentMetadata {
  /** Número de páginas (para PDFs) */
  pageCount?: number;
  /** Idioma detectado */
  language?: string;
  /** Encoding do texto */
  encoding?: string;
  /** Informações do autor */
  author?: string;
  /** Data de criação do documento original */
  originalCreatedAt?: Date;
  /** Data de modificação do documento original */
  originalModifiedAt?: Date;
  /** Aplicativo usado para criar o documento */
  application?: string;
  /** Versão do aplicativo */
  applicationVersion?: string;
  /** Palavras-chave extraídas */
  keywords?: string[];
  /** Resumo automático */
  summary?: string;
}

/** Configurações de acesso ao documento */
export interface AccessConfig {
  /** Nível de visibilidade */
  visibility: 'private' | 'internal' | 'public';
  /** Usuários com acesso específico */
  allowedUsers?: string[];
  /** Grupos com acesso */
  allowedGroups?: string[];
  /** Permissões específicas */
  permissions: DocumentPermissions;
  /** Data de expiração do acesso */
  expiresAt?: Date;
  /** Se requer autenticação para visualizar */
  requiresAuth: boolean;
}

/** Permissões sobre documentos */
export interface DocumentPermissions {
  /** Pode visualizar */
  read: boolean;
  /** Pode baixar */
  download: boolean;
  /** Pode editar metadados */
  edit: boolean;
  /** Pode deletar */
  delete: boolean;
  /** Pode compartilhar */
  share: boolean;
  /** Pode analisar */
  analyze: boolean;
  /** Pode comentar */
  comment: boolean;
}

/** Informações de processamento do documento */
export interface ProcessingInfo {
  /** Status do processamento */
  status: Status;
  /** Progresso em porcentagem */
  progress: number;
  /** Etapa atual do processamento */
  currentStage: ProcessingStage;
  /** Tempo estimado restante em segundos */
  estimatedTimeRemaining?: number;
  /** Mensagem de status */
  message?: string;
  /** Erros ocorridos */
  errors?: ProcessingError[];
  /** Avisos */
  warnings?: ProcessingWarning[];
}

/** Etapas do processamento */
export type ProcessingStage = 
  | 'upload'
  | 'validation'
  | 'virus_scan'
  | 'text_extraction'
  | 'ocr'
  | 'classification'
  | 'indexing'
  | 'thumbnail_generation'
  | 'complete';

/** Erro de processamento */
export interface ProcessingError {
  /** Código do erro */
  code: string;
  /** Mensagem de erro */
  message: string;
  /** Etapa onde ocorreu o erro */
  stage: ProcessingStage;
  /** Detalhes técnicos */
  details?: Record<string, unknown>;
}

/** Aviso de processamento */
export interface ProcessingWarning {
  /** Código do aviso */
  code: string;
  /** Mensagem de aviso */
  message: string;
  /** Etapa onde ocorreu o aviso */
  stage: ProcessingStage;
  /** Se pode ser ignorado */
  ignorable: boolean;
}

/** Versão de um documento */
export interface DocumentVersion extends BaseEntity {
  /** ID do documento pai */
  documentId: string;
  /** Número da versão */
  versionNumber: number;
  /** Comentário da versão */
  comment?: string;
  /** Hash do arquivo desta versão */
  hash: string;
  /** Tamanho do arquivo */
  size: number;
  /** URL do arquivo */
  url: string;
  /** Usuário que criou a versão */
  createdBy: string;
  /** Se é a versão atual */
  isCurrent: boolean;
}

/** Histórico de um documento */
export interface DocumentHistory extends BaseEntity {
  /** ID do documento */
  documentId: string;
  /** Ação realizada */
  action: DocumentAction;
  /** Usuário que realizou a ação */
  userId: string;
  /** Detalhes da ação */
  details?: Record<string, unknown>;
  /** IP do usuário */
  userIp?: string;
  /** User agent */
  userAgent?: string;
}

/** Ações possíveis em documentos */
export type DocumentAction = 
  | 'upload'
  | 'download'
  | 'view'
  | 'edit'
  | 'delete'
  | 'share'
  | 'analyze'
  | 'comment'
  | 'version_create'
  | 'access_grant'
  | 'access_revoke';

/** Estatísticas de um documento */
export interface DocumentStats {
  /** Número de visualizações */
  viewCount: number;
  /** Número de downloads */
  downloadCount: number;
  /** Número de compartilhamentos */
  shareCount: number;
  /** Número de análises */
  analysisCount: number;
  /** Número de comentários */
  commentCount: number;
  /** Última visualização */
  lastViewedAt?: Date;
  /** Último download */
  lastDownloadedAt?: Date;
  /** Usuários únicos que visualizaram */
  uniqueViewers: number;
}