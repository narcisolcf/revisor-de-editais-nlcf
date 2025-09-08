/**
 * Serviço de Auditoria
 * LicitaReview - Sistema de Análise de Editais
 */
import { LoggingService } from './LoggingService';
export interface AuditEntry {
    id: string;
    timestamp: Date;
    userId?: string;
    action: string;
    resource: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}
export interface AuditFilter {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
}
export declare class AuditService {
    private entries;
    private logger;
    constructor(logger: LoggingService);
    /**
     * Registrar entrada de auditoria
     */
    logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Buscar entradas de auditoria
     */
    getAuditEntries(filter?: AuditFilter, limit?: number): Promise<AuditEntry[]>;
    /**
     * Obter estatísticas de auditoria
     */
    getAuditStats(filter?: AuditFilter): Promise<{
        total: number;
        successful: number;
        failed: number;
        uniqueUsers: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topResources: Array<{
            resource: string;
            count: number;
        }>;
    }>;
    /**
     * Limpar entradas de auditoria (apenas para testes)
     */
    clear(): void;
    /**
     * Obter todas as entradas (apenas para testes)
     */
    getAllEntries(): AuditEntry[];
    /**
     * Gerar ID único
     */
    private generateId;
    /**
     * Salvar no Firestore (implementação futura)
     */
    private saveToFirestore;
    /**
     * Registrar acesso a endpoint
     */
    logEndpointAccess({ userId, method, path, statusCode, responseTime, ipAddress, userAgent, requestSize, responseSize, metadata }: {
        userId?: string;
        method: string;
        path: string;
        statusCode: number;
        responseTime: number;
        ipAddress?: string;
        userAgent?: string;
        requestSize?: number;
        responseSize?: number;
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Registrar tentativa de autenticação
     */
    logAuthAttempt({ userId, email, success, reason, ipAddress, userAgent, metadata }: {
        userId?: string;
        email?: string;
        success: boolean;
        reason?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Registrar violação de segurança
     */
    logSecurityViolation({ userId, violationType, details, ipAddress, userAgent, metadata }: {
        userId?: string;
        violationType: string;
        details: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Registrar evento genérico
     */
    logEvent({ userId, action, resource, success, details, ipAddress, userAgent, metadata, errorMessage }: {
        userId?: string;
        action: string;
        resource: string;
        success?: boolean;
        details?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, any>;
        errorMessage?: string;
    }): Promise<void>;
}
