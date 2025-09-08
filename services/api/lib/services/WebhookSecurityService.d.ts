import { Request } from 'express';
interface ILogger {
    debug(message: string, context?: any): Promise<void>;
    info(message: string, context?: any): Promise<void>;
    warn(message: string, context?: any): Promise<void>;
    error(message: string, context?: any): Promise<void>;
    fatal(message: string, context?: any): Promise<void>;
}
import { MetricsService } from './MetricsService';
/**
 * Configuração de segurança para webhooks
 */
export interface WebhookSecurityConfig {
    secretKey: string;
    timestampTolerance: number;
    signatureHeader: string;
    timestampHeader: string;
    maxPayloadSize: number;
    allowedEvents: string[];
    enableReplayProtection: boolean;
    replayWindowSize: number;
}
/**
 * Resultado da validação de webhook
 */
export interface WebhookValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
    details?: {
        signatureValid?: boolean;
        timestampValid?: boolean;
        payloadSizeValid?: boolean;
        eventTypeValid?: boolean;
        replayCheckPassed?: boolean;
    };
}
/**
 * Informações do webhook validado
 */
export interface ValidatedWebhook {
    payload: any;
    signature: string;
    timestamp: number;
    eventType: string;
    requestId: string;
}
/**
 * Serviço de segurança para webhooks
 */
export declare class WebhookSecurityService {
    private config;
    private replayCache;
    private cleanupInterval;
    private metricsService;
    private logger;
    constructor(config: WebhookSecurityConfig, metricsService?: MetricsService, logger?: ILogger);
    /**
     * Valida webhook completo
     */
    validateWebhook(req: Request): Promise<WebhookValidationResult>;
    /**
     * Valida apenas a assinatura do webhook
     */
    validateSignature(payload: string, signature: string, timestamp?: string): WebhookValidationResult;
    /**
     * Valida timestamp do webhook
     */
    validateTimestamp(timestamp: string): WebhookValidationResult;
    /**
     * Valida tamanho do payload
     */
    validatePayloadSize(req: Request): WebhookValidationResult;
    /**
     * Valida tipo de evento
     */
    validateEventType(eventType: string): WebhookValidationResult;
    /**
     * Verifica replay attack
     */
    checkReplayAttack(signature: string, timestamp: number): WebhookValidationResult;
    /**
     * Gera assinatura para webhook
     */
    generateSignature(payload: string, timestamp?: string): string;
    /**
     * Obtém estatísticas de segurança
     */
    getSecurityStats(): {
        replayCacheSize: number;
        validationMetrics: string;
        config: Partial<WebhookSecurityConfig>;
    };
    /**
     * Limpa cache de replay
     */
    clearReplayCache(): void;
    /**
     * Para o serviço e limpa recursos
     */
    shutdown(): void;
    private getPayloadString;
    private startReplayCacheCleanup;
    private cleanupReplayCache;
    private recordValidationMetrics;
}
export {};
