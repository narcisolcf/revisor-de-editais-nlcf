/**
 * CallbackHandler - Gerencia callbacks e notificações do Cloud Run
 * LicitaReview Cloud Functions
 */
import { Request, Response } from 'express';
import { AnalysisOrchestrator } from './AnalysisOrchestrator';
import { NotificationService } from './NotificationService';
import { MetricsService } from './MetricsService';
import { AuditService } from './AuditService';
export interface CallbackPayload {
    analysis_id: string;
    document_id: string;
    organization_id: string;
    status: 'processing' | 'completed' | 'failed' | 'progress_update';
    progress?: {
        percentage: number;
        current_step: string;
        estimated_completion?: string;
    };
    results?: {
        conformity_score: number;
        confidence: number;
        problems: any[];
        recommendations: string[];
        metrics: Record<string, any>;
        categories: Record<string, any>;
        ai_used: boolean;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    processing_time?: number;
    timestamp: string;
    callback_url?: string;
    retry_count?: number;
}
export interface CallbackSecurityConfig {
    secretKey: string;
    allowedIPs?: string[];
    signatureHeader: string;
    timestampTolerance: number;
}
export interface CallbackMetrics {
    total_received: number;
    successful_processed: number;
    failed_processed: number;
    invalid_signatures: number;
    duplicate_callbacks: number;
    average_processing_time: number;
}
export declare class CallbackHandler {
    private orchestrator;
    private notificationService;
    private metricsService;
    private auditService;
    private securityConfig;
    private processedCallbacks;
    private callbackMetrics;
    constructor(orchestrator: AnalysisOrchestrator, notificationService: NotificationService, metricsService: MetricsService, auditService: AuditService, securityConfig: CallbackSecurityConfig);
    /**
     * Processa callback do Cloud Run
     */
    handleCallback(req: Request, res: Response): Promise<void>;
    /**
     * Valida a segurança do callback
     */
    private validateCallbackSecurity;
    /**
     * Extrai e valida o payload do callback
     */
    private extractCallbackPayload;
    /**
     * Processa callback por status
     */
    private processCallbackByStatus;
    /**
     * Processa atualização de progresso
     */
    private handleProgressUpdate;
    /**
     * Processa análise completada
     */
    private handleAnalysisCompleted;
    /**
     * Processa análise falhada
     */
    private handleAnalysisFailed;
    /**
     * Processa início de processamento
     */
    private handleAnalysisProcessing;
    /**
     * Gera ID único para o callback
     */
    private generateCallbackId;
    /**
     * Gera assinatura HMAC para validação
     */
    private generateSignature;
    /**
     * Verifica assinatura HMAC
     */
    private verifySignature;
    /**
     * Atualiza métricas de tempo de processamento
     */
    private updateProcessingTimeMetrics;
    /**
     * Obtém métricas do callback handler
     */
    getMetrics(): CallbackMetrics;
    /**
     * Limpa callbacks processados antigos (para evitar vazamento de memória)
     */
    cleanupOldCallbacks(): void;
    /**
     * Configura limpeza automática
     */
    startCleanupSchedule(intervalMinutes?: number): void;
}
