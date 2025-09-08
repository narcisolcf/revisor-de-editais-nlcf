"use strict";
/**
 * Serviço de Logging
 * LicitaReview - Sistema de Análise de Editais
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LoggingService = void 0;
/**
 * Serviço de logging para a aplicação
 */
class LoggingService {
    constructor(serviceName = 'api', environment = process.env.NODE_ENV || 'development') {
        this.serviceName = serviceName;
        this.environment = environment;
    }
    /**
     * Log de debug
     */
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
    /**
     * Log de informação
     */
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    /**
     * Log de aviso
     */
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    /**
     * Log de erro
     */
    error(message, error, metadata) {
        this.log('error', message, metadata, error);
    }
    /**
     * Log de segurança
     */
    security(message, metadata) {
        this.log('warn', `[SECURITY] ${message}`, {
            ...metadata,
            category: 'security'
        });
    }
    /**
     * Log de auditoria
     */
    audit(message, metadata) {
        this.log('info', `[AUDIT] ${message}`, {
            ...metadata,
            category: 'audit'
        });
    }
    /**
     * Log de performance
     */
    performance(message, duration, metadata) {
        this.log('info', `[PERFORMANCE] ${message}`, {
            ...metadata,
            duration,
            category: 'performance'
        });
    }
    /**
     * Método principal de logging
     */
    log(level, message, metadata, error) {
        const entry = {
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
    storeTestLog(entry) {
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
    static clearTestLogs() {
        if (typeof global !== 'undefined' && global.testLogs) {
            global.testLogs = [];
        }
    }
    /**
     * Obter logs de teste
     */
    static getTestLogs() {
        if (typeof global !== 'undefined' && global.testLogs) {
            return global.testLogs;
        }
        return [];
    }
}
exports.LoggingService = LoggingService;
// Instância global para uso em toda a aplicação
exports.logger = new LoggingService();
//# sourceMappingURL=LoggingService.js.map