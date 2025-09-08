"use strict";
/**
 * CallbackHandler - Gerencia callbacks e notificações do Cloud Run
 * LicitaReview Cloud Functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackHandler = void 0;
const crypto = __importStar(require("crypto"));
const firestore_1 = require("firebase-admin/firestore");
class CallbackHandler {
    constructor(orchestrator, notificationService, metricsService, auditService, securityConfig) {
        this.processedCallbacks = new Set();
        this.orchestrator = orchestrator;
        this.notificationService = notificationService;
        this.metricsService = metricsService;
        this.auditService = auditService;
        this.securityConfig = securityConfig;
        this.callbackMetrics = {
            total_received: 0,
            successful_processed: 0,
            failed_processed: 0,
            invalid_signatures: 0,
            duplicate_callbacks: 0,
            average_processing_time: 0
        };
    }
    /**
     * Processa callback do Cloud Run
     */
    async handleCallback(req, res) {
        const startTime = Date.now();
        this.callbackMetrics.total_received++;
        try {
            // 1. Validar segurança do callback
            const securityValidation = await this.validateCallbackSecurity(req);
            if (!securityValidation.valid) {
                this.callbackMetrics.invalid_signatures++;
                await this.auditService.logSecurityViolation({
                    violationType: 'callback_security_violation',
                    details: {
                        source_ip: req.ip,
                        reason: securityValidation.reason
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
                res.status(401).json({ error: 'Unauthorized callback' });
                return;
            }
            // 2. Extrair e validar payload
            const payload = this.extractCallbackPayload(req);
            if (!payload) {
                res.status(400).json({ error: 'Invalid callback payload' });
                return;
            }
            // 3. Verificar duplicatas
            const callbackId = this.generateCallbackId(payload);
            if (this.processedCallbacks.has(callbackId)) {
                this.callbackMetrics.duplicate_callbacks++;
                console.warn(`Callback duplicado ignorado: ${callbackId}`);
                res.status(200).json({ status: 'duplicate_ignored' });
                return;
            }
            // 4. Delegar processamento principal para o AnalysisOrchestrator
            const { AnalysisOrchestrator } = await Promise.resolve().then(() => __importStar(require('./AnalysisOrchestrator')));
            const firestore = (0, firestore_1.getFirestore)();
            const orchestrator = new AnalysisOrchestrator(firestore, process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url', process.env.GOOGLE_CLOUD_PROJECT || 'default-project');
            await orchestrator.processCallback(payload.analysis_id, payload);
            // 5. Processar callback local para métricas e logging
            await this.processCallbackByStatus(payload);
            // 5. Marcar como processado
            this.processedCallbacks.add(callbackId);
            this.callbackMetrics.successful_processed++;
            // 6. Atualizar métricas de tempo
            const processingTime = Date.now() - startTime;
            this.updateProcessingTimeMetrics(processingTime);
            // 7. Log de auditoria
            await this.auditService.logAudit({
                userId: payload.organization_id,
                action: 'callback_processed',
                resource: `analysis_${payload.analysis_id}`,
                success: true,
                details: {
                    analysis_id: payload.analysis_id,
                    document_id: payload.document_id,
                    organization_id: payload.organization_id,
                    status: payload.status,
                    processing_time: processingTime
                }
            });
            res.status(200).json({
                status: 'success',
                callback_id: callbackId,
                processing_time: processingTime
            });
        }
        catch (error) {
            this.callbackMetrics.failed_processed++;
            const processingTime = Date.now() - startTime;
            console.error('Erro ao processar callback:', error);
            await this.auditService.logAudit({
                userId: undefined,
                action: 'callback_error',
                resource: 'callback_handler',
                success: false,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    processing_time: processingTime
                }
            });
            res.status(500).json({
                error: 'Internal server error processing callback',
                processing_time: processingTime
            });
        }
    }
    /**
     * Valida a segurança do callback
     */
    async validateCallbackSecurity(req) {
        try {
            // 1. Verificar IP se configurado
            if (this.securityConfig.allowedIPs && this.securityConfig.allowedIPs.length > 0) {
                const clientIP = req.ip || req.connection.remoteAddress;
                if (!clientIP || !this.securityConfig.allowedIPs.includes(clientIP)) {
                    return { valid: false, reason: 'IP not allowed' };
                }
            }
            // 2. Verificar assinatura
            const signature = req.headers[this.securityConfig.signatureHeader.toLowerCase()];
            if (!signature) {
                return { valid: false, reason: 'Missing signature' };
            }
            // 3. Verificar timestamp para evitar replay attacks
            const timestamp = req.headers['x-timestamp'];
            if (timestamp) {
                const requestTime = parseInt(timestamp);
                const currentTime = Math.floor(Date.now() / 1000);
                if (Math.abs(currentTime - requestTime) > this.securityConfig.timestampTolerance) {
                    return { valid: false, reason: 'Request too old or too far in future' };
                }
            }
            // 4. Validar assinatura HMAC
            const body = JSON.stringify(req.body);
            const expectedSignature = this.generateSignature(body, timestamp);
            if (!this.verifySignature(signature, expectedSignature)) {
                return { valid: false, reason: 'Invalid signature' };
            }
            return { valid: true };
        }
        catch (error) {
            console.error('Erro na validação de segurança:', error);
            return { valid: false, reason: 'Security validation error' };
        }
    }
    /**
     * Extrai e valida o payload do callback
     */
    extractCallbackPayload(req) {
        try {
            const payload = req.body;
            // Validações básicas
            if (!payload.analysis_id || !payload.document_id || !payload.organization_id || !payload.status) {
                return null;
            }
            // Validar status
            const validStatuses = ['processing', 'completed', 'failed', 'progress_update'];
            if (!validStatuses.includes(payload.status)) {
                return null;
            }
            // Validar timestamp
            if (!payload.timestamp) {
                payload.timestamp = new Date().toISOString();
            }
            return payload;
        }
        catch (error) {
            console.error('Erro ao extrair payload:', error);
            return null;
        }
    }
    /**
     * Processa callback por status
     */
    async processCallbackByStatus(payload) {
        switch (payload.status) {
            case 'processing':
                await this.handleAnalysisProcessing(payload);
                break;
            case 'progress_update':
                await this.handleProgressUpdate(payload);
                break;
            case 'completed':
                await this.handleAnalysisCompleted(payload);
                break;
            case 'failed':
                await this.handleAnalysisFailed(payload);
                break;
            default:
                console.warn(`Status de callback desconhecido: ${payload.status}`);
        }
    }
    /**
     * Processa atualização de progresso
     */
    async handleProgressUpdate(payload) {
        if (!payload.progress) {
            console.warn('Callback de progresso sem dados de progresso');
            return;
        }
        await this.orchestrator.updateProgress(payload.analysis_id, {
            status: 'processing',
            progress: payload.progress.percentage,
            currentStep: payload.progress.current_step,
            estimatedCompletion: payload.progress.estimated_completion ?
                new Date(payload.progress.estimated_completion) : undefined
        });
        // Notificar usuário sobre progresso significativo
        if (payload.progress.percentage % 25 === 0) {
            await this.notificationService.notifyAnalysisProgress(payload.organization_id, payload.analysis_id, payload.progress.percentage, payload.progress.current_step);
        }
    }
    /**
     * Processa análise completada
     */
    async handleAnalysisCompleted(payload) {
        if (!payload.results) {
            console.error('Callback de conclusão sem resultados');
            return;
        }
        // Atualizar progresso para 100%
        await this.orchestrator.updateProgress(payload.analysis_id, {
            status: 'completed',
            progress: 100,
            currentStep: 'Análise concluída',
            completedAt: new Date()
        });
        // Salvar resultados usando a interface local AnalysisResult
        const analysisResult = {
            id: payload.analysis_id,
            documentId: payload.document_id,
            organizationId: payload.organization_id,
            conformityScore: payload.results.conformity_score,
            confidence: payload.results.confidence,
            problems: payload.results.problems,
            recommendations: payload.results.recommendations,
            metrics: payload.results.metrics,
            categoryResults: payload.results.categories,
            processingTime: payload.processing_time || 0,
            aiUsed: payload.results.ai_used,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.orchestrator.saveAnalysisResult(payload.document_id, analysisResult);
        // Notificar conclusão
        await this.notificationService.notifyAnalysisComplete(payload.organization_id, // userId
        payload.organization_id, payload.analysis_id, 'Documento', // documentName - placeholder
        payload.results);
        // Atualizar métricas
        this.metricsService.incrementCounter('analysis_completion', 1, {
            analysis_id: payload.analysis_id,
            organization_id: payload.organization_id,
            ai_used: payload.results.ai_used.toString()
        });
        this.metricsService.recordHistogram('analysis_processing_time', payload.processing_time || 0, {
            analysis_id: payload.analysis_id,
            organization_id: payload.organization_id
        });
    }
    /**
     * Processa análise falhada
     */
    async handleAnalysisFailed(payload) {
        const errorMessage = payload.error?.message || 'Erro desconhecido na análise';
        await this.orchestrator.updateProgress(payload.analysis_id, {
            status: 'failed',
            progress: 0,
            currentStep: 'Análise falhou',
            error: errorMessage,
            failedAt: new Date()
        });
        // Notificar falha
        await this.notificationService.notifyAnalysisFailure(payload.organization_id, // userId
        payload.organization_id, payload.analysis_id, 'Documento', // documentName - placeholder
        errorMessage);
        // Log de auditoria
        await this.auditService.logAudit({
            userId: payload.organization_id,
            action: 'analysis_failed',
            resource: `analysis_${payload.analysis_id}`,
            success: false,
            details: {
                analysis_id: payload.analysis_id,
                document_id: payload.document_id,
                organization_id: payload.organization_id,
                error: payload.error
            }
        });
        // Registrar métricas de erro
        this.metricsService.incrementCounter('analysis_error', 1, {
            analysis_id: payload.analysis_id,
            organization_id: payload.organization_id,
            error_code: payload.error?.code || 'UNKNOWN'
        });
    }
    /**
     * Processa início de processamento
     */
    async handleAnalysisProcessing(payload) {
        await this.orchestrator.updateProgress(payload.analysis_id, {
            status: 'processing',
            progress: 5,
            currentStep: 'Iniciando análise no Cloud Run',
            startedAt: new Date()
        });
    }
    /**
     * Gera ID único para o callback
     */
    generateCallbackId(payload) {
        const data = `${payload.analysis_id}-${payload.status}-${payload.timestamp}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    /**
     * Gera assinatura HMAC para validação
     */
    generateSignature(body, timestamp) {
        const data = timestamp ? `${timestamp}.${body}` : body;
        return crypto
            .createHmac('sha256', this.securityConfig.secretKey)
            .update(data)
            .digest('hex');
    }
    /**
     * Verifica assinatura HMAC
     */
    verifySignature(received, expected) {
        // Remove prefixos como "sha256="
        const cleanReceived = received.replace(/^sha256=/, '');
        const cleanExpected = expected.replace(/^sha256=/, '');
        return crypto.timingSafeEqual(Buffer.from(cleanReceived, 'hex'), Buffer.from(cleanExpected, 'hex'));
    }
    /**
     * Atualiza métricas de tempo de processamento
     */
    updateProcessingTimeMetrics(processingTime) {
        const totalCallbacks = this.callbackMetrics.successful_processed;
        const currentAverage = this.callbackMetrics.average_processing_time;
        this.callbackMetrics.average_processing_time =
            ((currentAverage * (totalCallbacks - 1)) + processingTime) / totalCallbacks;
    }
    /**
     * Obtém métricas do callback handler
     */
    getMetrics() {
        return { ...this.callbackMetrics };
    }
    /**
     * Limpa callbacks processados antigos (para evitar vazamento de memória)
     */
    cleanupOldCallbacks() {
        // Manter apenas os últimos 1000 callbacks processados
        if (this.processedCallbacks.size > 1000) {
            const callbacksArray = Array.from(this.processedCallbacks);
            const toKeep = callbacksArray.slice(-500); // Manter os 500 mais recentes
            this.processedCallbacks.clear();
            toKeep.forEach(id => this.processedCallbacks.add(id));
        }
    }
    /**
     * Configura limpeza automática
     */
    startCleanupSchedule(intervalMinutes = 60) {
        setInterval(() => {
            this.cleanupOldCallbacks();
        }, intervalMinutes * 60 * 1000);
    }
}
exports.CallbackHandler = CallbackHandler;
//# sourceMappingURL=CallbackHandler.js.map