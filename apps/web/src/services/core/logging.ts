/**
 * Serviço de logging para a aplicação
 */

import { Severity } from '../../types/core/common';

/** Níveis de log */
/* eslint-disable no-unused-vars */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}
/* eslint-enable no-unused-vars */

/** Entrada de log */
export interface LogEntry {
  /** Timestamp do log */
  timestamp: Date;
  /** Nível do log */
  level: LogLevel;
  /** Mensagem do log */
  message: string;
  /** Contexto adicional */
  context?: Record<string, unknown>;
  /** Categoria/módulo */
  category?: string;
  /** ID da sessão */
  sessionId?: string;
  /** ID do usuário */
  userId?: string;
  /** Erro associado */
  error?: Error;
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
}

/** Configuração do logger */
export interface LoggerConfig {
  /** Nível mínimo de log */
  level: LogLevel;
  /** Se deve incluir timestamp */
  includeTimestamp: boolean;
  /** Se deve incluir stack trace para erros */
  includeStackTrace: boolean;
  /** Formato de saída */
  format: 'json' | 'text';
  /** Tamanho máximo do buffer */
  maxBufferSize: number;
  /** Intervalo de flush em ms */
  flushInterval: number;
  /** Se deve fazer log no console */
  console: boolean;
  /** Se deve persistir logs */
  persist: boolean;
  /** Filtros de categoria */
  categoryFilters?: string[];
  /** Configurações de transporte */
  transports?: LogTransportConfig[];
}

/** Configuração de transporte de log */
export interface LogTransportConfig {
  /** Tipo do transporte */
  type: 'console' | 'file' | 'remote' | 'storage';
  /** Nível mínimo para este transporte */
  level?: LogLevel;
  /** Configurações específicas */
  options?: Record<string, unknown>;
}

/** Interface para transporte de logs */
export interface LogTransport {
  /** Nome do transporte */
  name: string;
  /** Nível mínimo */
  level: LogLevel;
  /** Envia log */
  send(entry: LogEntry): Promise<void> | void;
  /** Limpa recursos */
  cleanup?(): Promise<void> | void;
}

/** Transporte para console */
export class ConsoleTransport implements LogTransport {
  name = 'console';
  level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  send(entry: LogEntry): void {
    if (entry.level < this.level) return;

    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const category = entry.category ? `[${entry.category}]` : '';
    const message = `${timestamp} ${levelName} ${category} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.context, entry.error);
        break;
    }
  }
}

/** Transporte para localStorage */
export class StorageTransport implements LogTransport {
  name = 'storage';
  level: LogLevel;
  private storageKey: string;
  private maxEntries: number;

  constructor(
    level: LogLevel = LogLevel.WARN,
    storageKey = 'app_logs',
    maxEntries = 1000
  ) {
    this.level = level;
    this.storageKey = storageKey;
    this.maxEntries = maxEntries;
  }

  send(entry: LogEntry): void {
    if (entry.level < this.level) return;

    try {
      const logs = this.getLogs();
      logs.push({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      });

      // Mantém apenas as últimas entradas
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log no storage:', error);
    }
  }

  getLogs(): Array<Omit<LogEntry, 'timestamp'> & { timestamp: string }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }

  cleanup(): void {
    this.clearLogs();
  }
}

/** Transporte remoto */
export class RemoteTransport implements LogTransport {
  name = 'remote';
  level: LogLevel;
  private endpoint: string;
  private apiKey?: string;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(
    endpoint: string,
    level: LogLevel = LogLevel.ERROR,
    apiKey?: string
  ) {
    this.level = level;
    this.endpoint = endpoint;
    this.apiKey = apiKey;

    // Flush automático a cada 30 segundos
    this.flushTimer = setInterval(() => this.flush(), 30000);
  }

  send(entry: LogEntry): void {
    if (entry.level < this.level) return;

    this.buffer.push(entry);

    // Flush imediato para erros críticos
    if (entry.level >= LogLevel.CRITICAL) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      console.error('Erro ao enviar logs remotos:', error);
      // Recoloca logs no buffer para tentar novamente
      this.buffer.unshift(...logs);
    }
  }

  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

/** Serviço de logging */
export class LoggingService {
  private config: LoggerConfig;
  private transports: LogTransport[] = [];
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      includeTimestamp: true,
      includeStackTrace: true,
      format: 'text',
      maxBufferSize: 100,
      flushInterval: 5000,
      console: true,
      persist: false,
      ...config
    };

    this.setupDefaultTransports();
    this.startFlushTimer();
  }

  private setupDefaultTransports(): void {
    if (this.config.console) {
      this.addTransport(new ConsoleTransport(this.config.level));
    }

    if (this.config.persist) {
      this.addTransport(new StorageTransport(LogLevel.WARN));
    }

    // Configura transportes customizados
    if (this.config.transports) {
      for (const transportConfig of this.config.transports) {
        this.addTransportFromConfig(transportConfig);
      }
    }
  }

  private addTransportFromConfig(config: LogTransportConfig): void {
    const level = config.level || this.config.level;

    switch (config.type) {
      case 'console':
        this.addTransport(new ConsoleTransport(level));
        break;
      case 'storage':
        this.addTransport(new StorageTransport(
          level,
          config.options?.storageKey as string,
          config.options?.maxEntries as number
        ));
        break;
      case 'remote':
        this.addTransport(new RemoteTransport(
          config.options?.endpoint as string,
          level,
          config.options?.apiKey as string
        ));
        break;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval);
  }

  /** Adiciona um transporte */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /** Remove um transporte */
  removeTransport(name: string): boolean {
    const index = this.transports.findIndex(t => t.name === name);
    if (index >= 0) {
      this.transports.splice(index, 1);
      return true;
    }
    return false;
  }

  /** Cria uma entrada de log */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    category?: string,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context,
      category,
      error,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }
    };
  }

  private getSessionId(): string | undefined {
    // Implementar lógica de sessão
    return typeof window !== 'undefined' ? 
      sessionStorage.getItem('sessionId') || undefined : undefined;
  }

  private getUserId(): string | undefined {
    // Implementar lógica de usuário
    return typeof localStorage !== 'undefined' ? 
      localStorage.getItem('userId') || undefined : undefined;
  }

  /** Faz log de uma entrada */
  private log(entry: LogEntry): void {
    // Verifica nível mínimo
    if (entry.level < this.config.level) return;

    // Verifica filtros de categoria
    if (this.config.categoryFilters && entry.category) {
      if (!this.config.categoryFilters.includes(entry.category)) {
        return;
      }
    }

    // Adiciona ao buffer
    this.buffer.push(entry);

    // Flush imediato para erros críticos
    if (entry.level >= LogLevel.CRITICAL) {
      this.flushBuffer();
    }

    // Flush se buffer estiver cheio
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flushBuffer();
    }
  }

  /** Flush do buffer */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    for (const entry of entries) {
      for (const transport of this.transports) {
        try {
          transport.send(entry);
        } catch (error) {
          console.error(`Erro no transporte ${transport.name}:`, error);
        }
      }
    }
  }

  /** Log de debug */
  debug(message: string, context?: Record<string, unknown>, category?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, category);
    this.log(entry);
  }

  /** Log de informação */
  info(message: string, context?: Record<string, unknown>, category?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, category);
    this.log(entry);
  }

  /** Log de aviso */
  warn(message: string, context?: Record<string, unknown>, category?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, category);
    this.log(entry);
  }

  /** Log de erro */
  error(message: string, error?: Error, context?: Record<string, unknown>, category?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, category, error);
    this.log(entry);
  }

  /** Log crítico */
  critical(message: string, error?: Error, context?: Record<string, unknown>, category?: string): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, category, error);
    this.log(entry);
  }

  /** Cria um logger com categoria */
  createLogger(category: string): CategoryLogger {
    return new CategoryLogger(this, category);
  }

  /** Obtém configuração atual */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /** Atualiza configuração */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Obtém logs do storage */
  getStoredLogs(): Array<Omit<LogEntry, 'timestamp'> & { timestamp: string }> {
    const storageTransport = this.transports.find(
      t => t instanceof StorageTransport
    ) as StorageTransport;
    
    return storageTransport ? storageTransport.getLogs() : [];
  }

  /** Limpa logs armazenados */
  clearStoredLogs(): void {
    const storageTransport = this.transports.find(
      t => t instanceof StorageTransport
    ) as StorageTransport;
    
    if (storageTransport) {
      storageTransport.clearLogs();
    }
  }

  /** Limpa recursos */
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushBuffer();

    for (const transport of this.transports) {
      if (transport.cleanup) {
        transport.cleanup();
      }
    }
  }
}

/** Logger com categoria */
export class CategoryLogger {
  constructor(
    private service: LoggingService,
    private category: string
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.service.debug(message, context, this.category);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.service.info(message, context, this.category);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.service.warn(message, context, this.category);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.service.error(message, error, context, this.category);
  }

  critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.service.critical(message, error, context, this.category);
  }
}

/** Instância global do serviço de logging */
export const loggingService = new LoggingService({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  console: true,
  persist: true,
  includeStackTrace: true
});

/** Loggers por categoria */
export const loggers = {
  api: loggingService.createLogger('api'),
  auth: loggingService.createLogger('auth'),
  ui: loggingService.createLogger('ui'),
  validation: loggingService.createLogger('validation'),
  cache: loggingService.createLogger('cache'),
  error: loggingService.createLogger('error')
};

/** Função utilitária para log */
export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  category?: string
): void {
  switch (level) {
    case LogLevel.DEBUG:
      loggingService.debug(message, context, category);
      break;
    case LogLevel.INFO:
      loggingService.info(message, context, category);
      break;
    case LogLevel.WARN:
      loggingService.warn(message, context, category);
      break;
    case LogLevel.ERROR:
      loggingService.error(message, undefined, context, category);
      break;
    case LogLevel.CRITICAL:
      loggingService.critical(message, undefined, context, category);
      break;
  }
}

/** Decorator para log automático */
export function LogMethod(category?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = category ? loggingService.createLogger(category) : loggingService;
      const methodName = `${target.constructor.name}.${propertyKey}`;
      
      logger.debug(`Iniciando ${methodName}`, { args });
      
      try {
        const result = await originalMethod.apply(this, args);
        logger.debug(`${methodName} concluído com sucesso`);
        return result;
      } catch (error) {
        logger.error(`Erro em ${methodName}`, error as Error, { args });
        throw error;
      }
    };

    return descriptor;
  };
}

/** Função para capturar erros não tratados */
export function setupGlobalErrorLogging(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      loggingService.error(
        'Erro JavaScript não tratado',
        new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        'global'
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      loggingService.error(
        'Promise rejeitada não tratada',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {},
        'global'
      );
    });
  }
}

// Configura logging global automaticamente
if (typeof window !== 'undefined') {
  setupGlobalErrorLogging();
}