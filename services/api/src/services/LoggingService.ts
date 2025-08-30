/**
 * Serviço de Logging
 * LicitaReview - Sistema de Análise de Editais
 */

// Declaração global para testes
declare global {
  var testLogs: LogEntry[] | undefined;
}

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  function?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * Serviço de logging para a aplicação
 */
export class LoggingService {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string = 'api', environment: string = process.env.NODE_ENV || 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Log de debug
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log de informação
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log de aviso
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, metadata, error);
  }

  /**
   * Log de segurança
   */
  security(message: string, metadata?: Record<string, any>): void {
    this.log('warn', `[SECURITY] ${message}`, {
      ...metadata,
      category: 'security'
    });
  }

  /**
   * Log de auditoria
   */
  audit(message: string, metadata?: Record<string, any>): void {
    this.log('info', `[AUDIT] ${message}`, {
      ...metadata,
      category: 'audit'
    });
  }

  /**
   * Log de performance
   */
  performance(message: string, duration: number, metadata?: Record<string, any>): void {
    this.log('info', `[PERFORMANCE] ${message}`, {
      ...metadata,
      duration,
      category: 'performance'
    });
  }

  /**
   * Método principal de logging
   */
  private log(level: string, message: string, metadata?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      function: metadata?.function,
      metadata: {
        ...metadata,
        service: this.serviceName,
        environment: this.environment
      },
      error
    };

    // Em ambiente de teste, apenas armazenar em memória
    if (this.environment === 'test') {
      this.storeTestLog(entry);
      return;
    }

    // Formatação da saída
    const timestamp = entry.timestamp.toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Adicionar metadados se existirem
    const metadataStr = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : '';
    
    // Adicionar erro se existir
    const errorStr = error ? ` | Error: ${error.message}\n${error.stack}` : '';
    
    const fullMessage = `${logMessage}${metadataStr}${errorStr}`;

    // Output baseado no nível
    switch (level) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }

  /**
   * Armazenar logs em memória para testes
   */
  private storeTestLog(entry: LogEntry): void {
    // Em ambiente de teste, podemos armazenar logs em uma estrutura global
    // para verificação posterior nos testes
    if (typeof global !== 'undefined') {
      if (!global.testLogs) {
        global.testLogs = [];
      }
      global.testLogs.push(entry);
    }
  }

  /**
   * Limpar logs de teste
   */
  static clearTestLogs(): void {
    if (typeof global !== 'undefined' && global.testLogs) {
      global.testLogs = [];
    }
  }

  /**
   * Obter logs de teste
   */
  static getTestLogs(): LogEntry[] {
    if (typeof global !== 'undefined' && global.testLogs) {
      return global.testLogs;
    }
    return [];
  }
}

// Instância global para uso em toda a aplicação
export const logger = new LoggingService();