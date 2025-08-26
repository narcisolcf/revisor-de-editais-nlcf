/**
 * Serviço de tratamento de erros
 */

import { 
  BaseError, 
  ValidationError as IValidationError,
  NetworkError as INetworkError,
  AuthenticationError,
  AuthorizationError,
  BusinessError,
  BusinessErrorCategory,
  SystemError,
  FileError,
  FileErrorType,
  AppError,
  ErrorHandlingConfig
} from '../../types/core/errors';
import { Severity } from '../../types/core/common';

/** Configuração do serviço de erros */
export interface ErrorServiceConfig extends ErrorHandlingConfig {
  /** Se deve reportar erros automaticamente */
  autoReport: boolean;
  /** URL do serviço de relatórios */
  reportingUrl?: string;
  /** Chave da API de relatórios */
  apiKey?: string;
  /** Máximo de tentativas */
  maxRetries: number;
  /** Delay entre tentativas */
  retryDelay: number;
  /** Filtros de erro */
  filters: {
    /** Severidades a ignorar */
    ignoreSeverities: Severity[];
    /** Códigos de erro a ignorar */
    ignoreCodes: string[];
    /** Padrões de mensagem a ignorar */
    ignorePatterns: RegExp[];
  };
}

/** Implementação de erro base */
export class AppErrorImpl extends Error implements BaseError {
  public readonly code: string;
  public readonly severity: Severity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    severity: Severity = 'error',
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.cause = cause;

    // Mantém stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Converte para objeto serializável */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /** Cria uma cópia com contexto adicional */
  withContext(additionalContext: Record<string, unknown>): AppErrorImpl {
    return new AppErrorImpl(
      this.message,
      this.code,
      this.severity,
      { ...this.context, ...additionalContext },
      this.cause
    );
  }
}

/** Erro de validação */
export class ValidationError extends AppErrorImpl implements IValidationError {
  public readonly field: string;
  public readonly value?: unknown;
  public readonly rule?: string;

  constructor(
    message: string,
    field: string,
    value?: unknown,
    rule?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 'warning', context);
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}

/** Erro de rede */
export class NetworkError extends AppErrorImpl implements INetworkError {
  public readonly status?: number;
  public readonly url?: string;
  public readonly method?: string;
  public readonly headers?: Record<string, string>;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    status?: number,
    url?: string,
    method?: string,
    headers?: Record<string, string>,
    responseBody?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', 'error', context);
    this.status = status;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.responseBody = responseBody;
  }
}

/** Erro de autenticação */
export class AuthError extends AppErrorImpl implements AuthenticationError {
  public readonly authType: 'login' | 'token' | 'permission' | 'session';
  public readonly requiresReauth: boolean;

  constructor(
    message: string,
    authType: 'login' | 'token' | 'permission' | 'session' = 'token',
    requiresReauth = false,
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTH_ERROR', 'error', context);
    this.authType = authType;
    this.requiresReauth = requiresReauth;
  }
}

/** Erro de autorização */
export class AuthzError extends AppErrorImpl implements AuthorizationError {
  public readonly resource: string;
  public readonly action: string;
  public readonly requiredPermissions: string[];
  public readonly userPermissions: string[];

  constructor(
    message: string,
    resource: string,
    action: string,
    requiredPermissions: string[] = [],
    userPermissions: string[] = [],
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHZ_ERROR', 'error', context);
    this.resource = resource;
    this.action = action;
    this.requiredPermissions = requiredPermissions;
    this.userPermissions = userPermissions;
  }
}

/** Erro de negócio */
export class BizError extends AppErrorImpl implements BusinessError {
  public readonly category: BusinessErrorCategory;
  public readonly userResolvable: boolean;
  public readonly suggestedActions?: string[];

  constructor(
    message: string,
    category: BusinessErrorCategory,
    userResolvable = true,
    suggestedActions?: string[],
    context?: Record<string, unknown>
  ) {
    super(message, 'BUSINESS_ERROR', 'warning', context);
    this.category = category;
    this.userResolvable = userResolvable;
    this.suggestedActions = suggestedActions;
  }
}

/** Erro de sistema */
export class SysError extends AppErrorImpl implements SystemError {
  public readonly component: string;
  public readonly operation: string;
  public readonly recoverable: boolean;
  public readonly sessionId?: string;

  constructor(
    message: string,
    component: string,
    operation: string,
    recoverable = false,
    sessionId?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'SYSTEM_ERROR', 'critical', context);
    this.component = component;
    this.operation = operation;
    this.recoverable = recoverable;
    this.sessionId = sessionId;
  }
}

/** Erro de arquivo */
export class FileErrorImpl extends AppErrorImpl implements FileError {
  public readonly fileName: string;
  public readonly fileSize?: number;
  public readonly mimeType?: string;
  public readonly fileErrorType: FileErrorType;

  constructor(
    message: string,
    fileName: string,
    fileErrorType: FileErrorType,
    fileSize?: number,
    mimeType?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILE_ERROR', 'error', context);
    this.fileName = fileName;
    this.fileErrorType = fileErrorType;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
  }
}

/** Serviço de tratamento de erros */
export class ErrorService {
  private config: ErrorServiceConfig;
  private errorQueue: AppError[] = [];
  private reportingTimer?: ReturnType<typeof setTimeout>;

  constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = {
      autoLog: true,
      showNotification: false,
      autoRecover: false,
      maxRetries: 3,
      retryDelay: 1000,
      autoReport: false,
      filters: {
        ignoreSeverities: [],
        ignoreCodes: [],
        ignorePatterns: []
      },
      ...config
    };

    // Configura handler global de erros não capturados
    this.setupGlobalHandlers();

    // Inicia timer de relatórios se habilitado
    if (this.config.autoReport) {
      this.startReportingTimer();
    }
  }

  /** Trata um erro */
  handle(error: Error | AppError, context?: Record<string, unknown>): AppError {
    let appError: AppError;

    // Converte para AppError se necessário
    if (error instanceof AppErrorImpl) {
      appError = context ? error.withContext(context) : error;
    } else {
      appError = new AppErrorImpl(
        error.message,
        'UNKNOWN_ERROR',
        'error',
        context,
        error instanceof Error ? error : undefined
      );
    }

    // Aplica filtros
    if (this.shouldIgnoreError(appError)) {
      return appError;
    }

    // Log do erro
    if (this.config.autoLog) {
      this.logError(appError);
    }

    // Adiciona à fila de relatórios
    if (this.config.showNotification) {
      this.queueForReporting(appError);
    }

    return appError;
  }

  /** Cria erro de validação */
  createValidationError(
    message: string,
    field: string,
    value?: unknown,
    rule?: string,
    context?: Record<string, unknown>
  ): ValidationError {
    return new ValidationError(message, field, value, rule, context);
  }

  /** Cria erro de rede */
  createNetworkError(
    message: string,
    status?: number,
    url?: string,
    method?: string,
    headers?: Record<string, string>,
    responseBody?: unknown,
    context?: Record<string, unknown>
  ): NetworkError {
    return new NetworkError(message, status, url, method, headers, responseBody, context);
  }

  /** Cria erro de autenticação */
  createAuthError(
    message: string,
    authType: 'login' | 'token' | 'permission' | 'session' = 'token',
    requiresReauth = false,
    context?: Record<string, unknown>
  ): AuthError {
    return new AuthError(message, authType, requiresReauth, context);
  }

  /** Cria erro de autorização */
  createAuthzError(
    message: string,
    resource: string,
    action: string,
    requiredPermissions: string[] = [],
    userPermissions: string[] = [],
    context?: Record<string, unknown>
  ): AuthzError {
    return new AuthzError(message, resource, action, requiredPermissions, userPermissions, context);
  }

  /** Cria erro de negócio */
  createBusinessError(
    message: string,
    category: BusinessErrorCategory,
    userResolvable = true,
    suggestedActions?: string[],
    context?: Record<string, unknown>
  ): BizError {
    return new BizError(message, category, userResolvable, suggestedActions, context);
  }

  /** Cria erro de sistema */
  createSystemError(
    message: string,
    component: string,
    operation: string,
    recoverable = false,
    sessionId?: string,
    context?: Record<string, unknown>
  ): SysError {
    return new SysError(message, component, operation, recoverable, sessionId, context);
  }

  /** Cria erro de arquivo */
  createFileError(
    message: string,
    fileName: string,
    fileErrorType: FileErrorType,
    fileSize?: number,
    mimeType?: string,
    context?: Record<string, unknown>
  ): FileErrorImpl {
    return new FileErrorImpl(message, fileName, fileErrorType, fileSize, mimeType, context);
  }

  /** Verifica se deve ignorar o erro */
  private shouldIgnoreError(error: AppError): boolean {
    const { filters } = this.config;

    // Verifica severidade
    if (filters.ignoreSeverities.includes(error.severity)) {
      return true;
    }

    // Verifica código
    if (filters.ignoreCodes.includes(error.code)) {
      return true;
    }

    // Verifica padrões de mensagem
    for (const pattern of filters.ignorePatterns) {
      if (pattern.test(error.message)) {
        return true;
      }
    }

    return false;
  }

  /** Faz log do erro */
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.code}] ${error.message}`;
    const logData = {
      error: error instanceof AppErrorImpl ? error.toJSON() : {
        code: error.code,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp.toISOString()
      },
      timestamp: error.timestamp.toISOString()
    };

    console[logLevel](logMessage, logData);
  }

  /** Obtém nível de log baseado na severidade */
  private getLogLevel(severity: Severity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'info':
        return 'log';
      case 'warning':
        return 'warn';
      case 'error':
      case 'critical':
        return 'error';
      default:
        return 'log';
    }
  }

  /** Adiciona erro à fila de relatórios */
  private queueForReporting(error: AppError): void {
    this.errorQueue.push(error);

    // Se não está em modo auto-report, envia imediatamente
    if (!this.config.autoReport) {
      this.sendErrorReports();
    }
  }

  /** Envia relatórios de erro */
  private async sendErrorReports(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.config.reportingUrl) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const report = {
        errors: errors.map(error => ({
          error: error instanceof AppErrorImpl ? error.toJSON() : {
            code: error.code,
            message: error.message,
            severity: error.severity,
            timestamp: error.timestamp.toISOString()
          },
          context: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
            currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
            userId: this.getUserId()
          },
          userConsent: true
        }))
      };

      await fetch(this.config.reportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(report)
      });

      console.log(`Relatório de ${errors.length} erro(s) enviado com sucesso`);
    } catch (reportError) {
      console.error('Falha ao enviar relatório de erros:', reportError);
      // Recoloca os erros na fila para tentar novamente
      this.errorQueue.unshift(...errors);
    }
  }

  /** Obtém ID do usuário para relatórios */
  private getUserId(): string | undefined {
    // Implementar lógica para obter ID do usuário
    // Por exemplo, do localStorage, contexto de autenticação, etc.
    return undefined;
  }

  /** Configura handlers globais */
  private setupGlobalHandlers(): void {
    // Handler para erros não capturados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handle(new Error(event.message), {
          component: 'global',
          operation: 'window.error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      // Handler para promises rejeitadas
      window.addEventListener('unhandledrejection', (event) => {
        this.handle(new Error(String(event.reason)), {
          component: 'global',
          operation: 'unhandledrejection'
        });
      });
    } else {
      // Node.js
      process.on('uncaughtException', (error) => {
        this.handle(error, {
          component: 'global',
          operation: 'uncaughtException'
        });
      });

      process.on('unhandledRejection', (reason) => {
        this.handle(new Error(String(reason)), {
          component: 'global',
          operation: 'unhandledRejection'
        });
      });
    }
  }

  /** Inicia timer de relatórios */
  private startReportingTimer(): void {
    this.reportingTimer = setInterval(() => {
      this.sendErrorReports();
    }, 30000); // 30 segundos
  }

  /** Para timer de relatórios */
  private stopReportingTimer(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = undefined;
    }
  }

  /** Obtém estatísticas de erros */
  getStats(): {
    queueSize: number;
    config: ErrorServiceConfig;
  } {
    return {
      queueSize: this.errorQueue.length,
      config: this.config
    };
  }

  /** Limpa fila de erros */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /** Destrói o serviço */
  destroy(): void {
    this.stopReportingTimer();
    this.clearQueue();
  }
}

/** Instância global do serviço de erros */
export const errorService = new ErrorService({
  autoLog: true,
  showNotification: false,
  autoRecover: false,
  autoReport: false
});

/** Função utilitária para tratar erros */
export function handleError(error: Error | AppError, context?: Record<string, unknown>): AppError {
  return errorService.handle(error, context);
}

/** Função utilitária para criar wrapper de função com tratamento de erro */
export function withErrorHandling<T extends (..._args: any[]) => any>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Se retorna Promise, trata erros assíncronos
      if (result instanceof Promise) {
        return result.catch(error => {
          throw handleError(error, context);
        });
      }
      
      return result;
    } catch (error) {
      throw handleError(error as Error, context);
    }
  }) as T;
}

/** Decorator para métodos com tratamento de erro */
export function ErrorHandler(context?: Record<string, unknown>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = withErrorHandling(originalMethod, {
      component: target.constructor.name,
      operation: propertyKey,
      ...context
    });
    
    return descriptor;
  };
}