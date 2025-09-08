/**
 * Middleware de Segurança
 *
 * Implementa headers de segurança, rate limiting,
 * auditoria de acesso e proteções contra ataques.
 */
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';
interface SecurityConfig {
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests?: boolean;
        skipFailedRequests?: boolean;
    };
    audit: {
        enabled: boolean;
        sensitiveFields: string[];
        excludePaths: string[];
    };
    headers: {
        contentSecurityPolicy?: string;
        strictTransportSecurity?: string;
        xFrameOptions?: string;
        xContentTypeOptions?: string;
        referrerPolicy?: string;
    };
}
/**
 * Classe para gerenciar segurança da aplicação
 */
export declare class SecurityManager {
    private db;
    private logger;
    private metrics;
    private config;
    private rateLimitStore;
    private cleanupInterval;
    constructor(db: FirebaseFirestore.Firestore, logger: LoggingService, metrics: MetricsService, config?: Partial<SecurityConfig>);
    /**
     * Middleware para aplicar headers de segurança
     */
    securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware de rate limiting
     */
    rateLimit: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware de auditoria de acesso
     */
    auditAccess: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware de proteção contra ataques
     */
    attackProtection: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Obter ID do cliente para rate limiting
     */
    private getClientId;
    /**
     * Obter IP do cliente
     */
    private getClientIp;
    /**
     * Calcular tamanho da requisição
     */
    private getRequestSize;
    /**
     * Verificar se contém dados sensíveis
     */
    private containsSensitiveData;
    /**
     * Sanitizar headers para auditoria
     */
    private sanitizeHeaders;
    /**
     * Detectar atividade suspeita
     */
    private detectSuspiciousActivity;
    /**
     * Registrar entrada de auditoria
     */
    private logAuditEntry;
    /**
     * Obter razão do erro baseado no status code
     */
    private getErrorReason;
    /**
     * Gerar ID único
     */
    private generateId;
    /**
     * Limpar entradas expiradas do rate limit
     */
    private cleanupExpiredRateLimits;
    /**
     * Destruir recursos
     */
    destroy(): void;
}
/**
 * Inicializar o gerenciador de segurança
 */
export declare function initializeSecurity(db: FirebaseFirestore.Firestore, logger: LoggingService, metrics: MetricsService, config?: Partial<SecurityConfig>): SecurityManager;
/**
 * Obter instância do gerenciador de segurança
 */
export declare function getSecurityManager(): SecurityManager;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const auditAccess: (options?: {
    sensitive?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const auditAccessMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const attackProtection: (req: Request, res: Response, next: NextFunction) => void;
export {};
