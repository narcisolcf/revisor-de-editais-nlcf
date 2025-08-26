/**
 * Tipos para tratamento de erros no sistema
 */

import { Severity } from './common';

/** Interface base para erros do sistema */
export interface BaseError {
  /** Código único do erro */
  code: string;
  /** Mensagem de erro */
  message: string;
  /** Severidade do erro */
  severity: Severity;
  /** Timestamp quando o erro ocorreu */
  timestamp: Date;
  /** Contexto adicional do erro */
  context?: Record<string, unknown>;
  /** Stack trace (para debugging) */
  stack?: string;
}

/** Erro de validação */
export interface ValidationError extends BaseError {
  /** Campo que falhou na validação */
  field: string;
  /** Valor que causou o erro */
  value?: unknown;
  /** Regra de validação que falhou */
  rule?: string;
}

/** Erro de rede/API */
export interface NetworkError extends BaseError {
  /** Status HTTP */
  status?: number;
  /** URL da requisição */
  url?: string;
  /** Método HTTP */
  method?: string;
  /** Headers da resposta */
  headers?: Record<string, string>;
  /** Corpo da resposta de erro */
  responseBody?: unknown;
}

/** Erro de autenticação */
export interface AuthenticationError extends BaseError {
  /** Tipo de erro de auth */
  authType: 'login' | 'token' | 'permission' | 'session';
  /** Se o usuário precisa fazer login novamente */
  requiresReauth: boolean;
}

/** Erro de autorização */
export interface AuthorizationError extends BaseError {
  /** Recurso que foi negado acesso */
  resource: string;
  /** Ação que foi negada */
  action: string;
  /** Permissões necessárias */
  requiredPermissions: string[];
  /** Permissões atuais do usuário */
  userPermissions: string[];
}

/** Erro de negócio */
export interface BusinessError extends BaseError {
  /** Categoria do erro de negócio */
  category: BusinessErrorCategory;
  /** Se o erro pode ser resolvido pelo usuário */
  userResolvable: boolean;
  /** Ações sugeridas para resolução */
  suggestedActions?: string[];
}

/** Categorias de erros de negócio */
export type BusinessErrorCategory =
  | 'document_validation'
  | 'file_processing'
  | 'analysis_failure'
  | 'classification_error'
  | 'quota_exceeded'
  | 'feature_unavailable'
  | 'data_integrity'
  | 'workflow_violation';

/** Erro técnico/sistema */
export interface SystemError extends BaseError {
  /** Componente onde o erro ocorreu */
  component: string;
  /** Operação que estava sendo executada */
  operation: string;
  /** Se o erro é recuperável */
  recoverable: boolean;
  /** ID da sessão/request */
  sessionId?: string;
}

/** Erro de arquivo */
export interface FileError extends BaseError {
  /** Nome do arquivo */
  fileName: string;
  /** Tamanho do arquivo */
  fileSize?: number;
  /** Tipo MIME do arquivo */
  mimeType?: string;
  /** Tipo específico do erro de arquivo */
  fileErrorType: FileErrorType;
}

/** Tipos de erro de arquivo */
export type FileErrorType =
  | 'invalid_format'
  | 'file_too_large'
  | 'file_corrupted'
  | 'unsupported_type'
  | 'virus_detected'
  | 'upload_failed'
  | 'processing_failed';

/** União de todos os tipos de erro */
export type AppError = 
  | ValidationError
  | NetworkError
  | AuthenticationError
  | AuthorizationError
  | BusinessError
  | SystemError
  | FileError;

/** Resultado que pode conter erro */
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Configuração para tratamento de erros */
export interface ErrorHandlingConfig {
  /** Se deve fazer log automático dos erros */
  autoLog: boolean;
  /** Se deve mostrar notificação para o usuário */
  showNotification: boolean;
  /** Se deve tentar recuperação automática */
  autoRecover: boolean;
  /** Função customizada para tratamento */
  customHandler?: (_error: AppError) => void;
}

/** Contexto de erro para debugging */
export interface ErrorContext {
  /** ID do usuário */
  userId?: string;
  /** ID da sessão */
  sessionId?: string;
  /** URL atual */
  currentUrl?: string;
  /** User agent */
  userAgent?: string;
  /** Dados adicionais */
  additionalData?: Record<string, unknown>;
}

/** Relatório de erro para envio */
export interface ErrorReport {
  /** Erro que ocorreu */
  error: AppError;
  /** Contexto quando o erro ocorreu */
  context: ErrorContext;
  /** Se o usuário consentiu em enviar o relatório */
  userConsent: boolean;
  /** Comentário adicional do usuário */
  userComment?: string;
}