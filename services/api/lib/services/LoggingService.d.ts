/**
 * Serviço de Logging
 * LicitaReview - Sistema de Análise de Editais
 */
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
export declare class LoggingService {
    private serviceName;
    private environment;
    constructor(serviceName?: string, environment?: string);
    /**
     * Log de debug
     */
    debug(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de informação
     */
    info(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de aviso
     */
    warn(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de erro
     */
    error(message: string, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Log de segurança
     */
    security(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de auditoria
     */
    audit(message: string, metadata?: Record<string, any>): void;
    /**
     * Log de performance
     */
    performance(message: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * Método principal de logging
     */
    private log;
    /**
     * Armazenar logs em memória para testes
     */
    private storeTestLog;
    /**
     * Limpar logs de teste
     */
    static clearTestLogs(): void;
    /**
     * Obter logs de teste
     */
    static getTestLogs(): LogEntry[];
}
export declare const logger: LoggingService;
