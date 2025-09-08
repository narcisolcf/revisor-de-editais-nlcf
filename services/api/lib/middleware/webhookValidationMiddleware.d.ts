import { Request, Response, NextFunction } from 'express';
import { WebhookSecurityConfig, WebhookValidationResult } from '../services/WebhookSecurityService';
import { MetricsService } from '../services/MetricsService';
/**
 * Request estendido com informações do webhook validado
 */
export interface WebhookRequest extends Request {
    webhook?: {
        validated: boolean;
        signature: string;
        timestamp: number;
        eventType: string;
        validationResult: WebhookValidationResult;
    };
}
/**
 * Opções para o middleware de validação de webhook
 */
export interface WebhookValidationOptions {
    config: WebhookSecurityConfig;
    metricsService?: MetricsService;
    skipValidation?: boolean;
    customErrorHandler?: (error: WebhookValidationResult, req: Request, res: Response) => void;
}
/**
 * Classe para middleware de validação de webhooks
 */
export declare class WebhookValidationMiddleware {
    private securityService;
    private options;
    constructor(options: WebhookValidationOptions);
    /**
     * Middleware principal de validação
     */
    validate(): (req: WebhookRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware para validação apenas de assinatura
     */
    validateSignatureOnly(): (req: WebhookRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Middleware para rate limiting baseado em webhook
     */
    rateLimit(maxRequests: number, windowMs: number): (req: WebhookRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Middleware para logging de webhooks
     */
    logWebhook(): (req: WebhookRequest, res: Response, next: NextFunction) => void;
    /**
     * Obtém estatísticas do middleware
     */
    getStats(): {
        replayCacheSize: number;
        validationMetrics: string;
        config: Partial<WebhookSecurityConfig>;
    };
    /**
     * Finaliza o middleware e limpa recursos
     */
    shutdown(): void;
    /**
     * Alias para shutdown() - limpa recursos
     */
    cleanup(): void;
    private handleValidationError;
    private getStatusCodeForError;
    private getClientIdentifier;
}
/**
 * Factory function para criar middleware de validação
 */
export declare function createWebhookValidation(options: WebhookValidationOptions): WebhookValidationMiddleware;
/**
 * Middleware simples para validação de webhook
 */
export declare function validateWebhook(config: WebhookSecurityConfig): (req: WebhookRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware simples para validação apenas de assinatura
 */
export declare function validateSignature(config: WebhookSecurityConfig): (req: WebhookRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
