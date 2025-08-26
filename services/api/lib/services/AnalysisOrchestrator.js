"use strict";
/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisOrchestrator = void 0;
const DocumentRepository_1 = require("../db/repositories/DocumentRepository");
const OrganizationRepository_1 = require("../db/repositories/OrganizationRepository");
const CloudRunClient_1 = require("./CloudRunClient");
const NotificationService_1 = require("./NotificationService");
class AnalysisOrchestrator {
    constructor(firestore, cloudRunServiceUrl, projectId) {
        this.activeAnalyses = new Map();
        this.maxRetries = 3;
        this.retryDelayMs = 5000; // 5 segundos
        this.maxRetryDelayMs = 60000; // 1 minuto
        this.db = firestore;
        this.documentRepo = new DocumentRepository_1.DocumentRepository(firestore);
        this.organizationRepo = new OrganizationRepository_1.OrganizationRepository(firestore);
        this.cloudRunClient = new CloudRunClient_1.CloudRunClient(cloudRunServiceUrl);
        this.notificationService = new NotificationService_1.NotificationService(projectId);
    }
    /**
     * Inicia uma nova análise
     */
    async startAnalysis(request) {
        const analysisId = this.generateAnalysisId();
        // Criar progresso inicial
        const progress = {
            analysisId,
            documentId: request.documentId,
            status: 'pending',
            progress: 0,
            currentStep: 'Iniciando análise',
            estimatedTimeRemaining: 300, // 5 minutos estimado
            startedAt: new Date()
        };
        this.activeAnalyses.set(analysisId, progress);
        await this.saveAnalysisProgress(progress);
        // Processar análise de forma assíncrona
        this.processAnalysis(analysisId, request).catch(error => {
            this.handleAnalysisError(analysisId, error);
        });
        return analysisId;
    }
    /**
     * Processa uma análise
     */
    async processAnalysis(analysisId, request) {
        const progress = await this.getAnalysisProgress(analysisId);
        const retryCount = progress?.retryCount || 0;
        const maxRetries = progress?.maxRetries || this.maxRetries;
        try {
            // Atualizar progresso
            await this.updateProgress(analysisId, {
                status: 'processing',
                progress: 10,
                currentStep: 'Carregando documento',
                retryCount,
                maxRetries
            });
            // Buscar documento com retry
            const document = await this.retryOperation(() => this.loadDocument(request.documentId), 'Carregando documento', analysisId);
            await this.updateProgress(analysisId, {
                progress: 30,
                currentStep: 'Carregando configurações'
            });
            // Configuração da organização com retry
            const orgConfig = await this.retryOperation(() => this.loadOrganizationConfig(request.organizationId), 'Carregando configurações', analysisId);
            await this.updateProgress(analysisId, {
                progress: 50,
                currentStep: 'Enviando para análise'
            });
            // Preparar request para Cloud Run
            const cloudRunRequest = {
                document_content: document.content || '',
                document_type: document.type || 'EDITAL',
                classification: { type: document.type },
                organization_config: orgConfig || {},
                analysis_options: {
                    include_ai: request.options.includeAI,
                    generate_recommendations: request.options.generateRecommendations,
                    detailed_metrics: request.options.detailedMetrics,
                    custom_rules: orgConfig?.analysisSettings?.customRules || []
                },
                metadata: {
                    document_id: request.documentId,
                    file_size: document.size || 0,
                    upload_date: document.uploadedAt || new Date()
                }
            };
            // Análise com retry automático (CloudRunClient já tem retry interno)
            const cloudRunResult = await this.cloudRunClient.analyzeDocument(cloudRunRequest);
            await this.updateProgress(analysisId, {
                progress: 90,
                currentStep: 'Processando resultados'
            });
            // Converter resultado para formato interno
            const analysisResult = this.convertCloudRunResult(cloudRunResult, request);
            // Salvar resultado com retry
            await this.retryOperation(() => this.saveAnalysisResult(request.documentId, analysisResult), 'Salvando resultados', analysisId);
            // Finalizar análise
            await this.updateProgress(analysisId, {
                status: 'completed',
                progress: 100,
                currentStep: 'Análise concluída',
                completedAt: new Date()
            });
            // Enviar notificação (sem retry crítico)
            try {
                await this.notificationService.notifyAnalysisComplete(request.userId, request.organizationId, analysisId, document.name || 'Documento', analysisResult);
            }
            catch (notificationError) {
                console.warn(`Falha ao enviar notificação para análise ${analysisId}:`, notificationError);
            }
            this.activeAnalyses.delete(analysisId);
        }
        catch (error) {
            await this.handleAnalysisErrorWithRetry(analysisId, request, error, retryCount, maxRetries);
        }
    }
    /**
     * Obtém o progresso de uma análise
     */
    async getAnalysisProgress(analysisId) {
        // Verificar cache primeiro
        const cached = this.activeAnalyses.get(analysisId);
        if (cached) {
            return cached;
        }
        // Carregar do banco
        return await this.loadAnalysisProgress(analysisId);
    }
    /**
     * Cancela uma análise
     */
    async cancelAnalysis(analysisId, userId) {
        const progress = await this.getAnalysisProgress(analysisId);
        if (!progress) {
            return false;
        }
        if (progress.status === 'completed' || progress.status === 'failed') {
            return false;
        }
        await this.updateProgress(analysisId, {
            status: 'cancelled',
            currentStep: 'Análise cancelada',
            completedAt: new Date()
        });
        this.activeAnalyses.delete(analysisId);
        return true;
    }
    /**
     * Lista análises ativas
     */
    getActiveAnalyses() {
        return Array.from(this.activeAnalyses.values());
    }
    // Métodos privados
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    convertCloudRunResult(cloudRunResult, request) {
        return {
            id: this.generateAnalysisId(),
            documentId: request.documentId,
            organizationId: request.organizationId,
            conformityScore: cloudRunResult.results.conformity_score || 0,
            confidence: cloudRunResult.results.confidence || 0,
            problems: cloudRunResult.results.problems || [],
            recommendations: cloudRunResult.results.recommendations || [],
            metrics: cloudRunResult.results.metrics || {},
            categoryResults: cloudRunResult.results.categories || {},
            processingTime: cloudRunResult.processing_time || 0,
            aiUsed: cloudRunResult.results.ai_used || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async updateProgress(analysisId, updates) {
        const current = this.activeAnalyses.get(analysisId);
        if (current) {
            const updated = { ...current, ...updates };
            this.activeAnalyses.set(analysisId, updated);
            await this.saveAnalysisProgress(updated);
        }
    }
    async saveAnalysisProgress(progress) {
        await this.db.collection('analysis_progress').doc(progress.analysisId).set({
            ...progress,
            updatedAt: new Date()
        });
    }
    async loadAnalysisProgress(analysisId) {
        const doc = await this.db.collection('analysis_progress').doc(analysisId).get();
        return doc.exists ? doc.data() : null;
    }
    async saveAnalysisResult(documentId, result) {
        await this.db.collection('analysis_results').doc(result.id).set(result);
        // Atualizar documento com referência ao resultado
        await this.db.collection('documents').doc(documentId).update({
            lastAnalysisId: result.id,
            lastAnalysisDate: new Date(),
            analysisStatus: 'completed'
        });
    }
    async handleAnalysisError(analysisId, error) {
        await this.updateProgress(analysisId, {
            status: 'failed',
            currentStep: 'Erro na análise',
            error: error.message,
            completedAt: new Date()
        });
        // Log do erro
        console.error(`Análise ${analysisId} falhou:`, {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        this.activeAnalyses.delete(analysisId);
    }
    /**
     * Trata erros com lógica de retry automático
     */
    async handleAnalysisErrorWithRetry(analysisId, request, error, currentRetryCount, maxRetries) {
        const isRetryableError = this.isRetryableError(error);
        const canRetry = isRetryableError && currentRetryCount < maxRetries;
        if (canRetry) {
            const nextRetryCount = currentRetryCount + 1;
            const delayMs = this.calculateRetryDelay(nextRetryCount);
            console.warn(`Análise ${analysisId} falhou (tentativa ${nextRetryCount}/${maxRetries}). Reagendando em ${delayMs}ms:`, {
                error: error.message,
                retryCount: nextRetryCount,
                maxRetries,
                delayMs
            });
            await this.updateProgress(analysisId, {
                status: 'processing',
                currentStep: `Erro temporário - reagendando (${nextRetryCount}/${maxRetries})`,
                error: error.message,
                retryCount: nextRetryCount,
                lastRetryAt: new Date()
            });
            // Agendar retry
            setTimeout(async () => {
                try {
                    await this.processAnalysis(analysisId, request);
                }
                catch (retryError) {
                    console.error(`Erro no retry da análise ${analysisId}:`, retryError);
                }
            }, delayMs);
        }
        else {
            // Falha definitiva
            await this.updateProgress(analysisId, {
                status: 'failed',
                currentStep: isRetryableError ? 'Máximo de tentativas excedido' : 'Erro não recuperável',
                error: error.message,
                completedAt: new Date(),
                retryCount: currentRetryCount
            });
            console.error(`Análise ${analysisId} falhou definitivamente:`, {
                error: error.message,
                stack: error.stack,
                retryCount: currentRetryCount,
                maxRetries,
                isRetryableError,
                timestamp: new Date().toISOString()
            });
            this.activeAnalyses.delete(analysisId);
        }
    }
    /**
     * Executa uma operação com retry automático
     */
    async retryOperation(operation, operationName, analysisId, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries || !this.isRetryableError(lastError)) {
                    throw lastError;
                }
                const delayMs = this.calculateRetryDelay(attempt);
                console.warn(`${operationName} falhou (tentativa ${attempt}/${maxRetries}). Tentando novamente em ${delayMs}ms:`, {
                    error: lastError.message,
                    analysisId,
                    attempt,
                    maxRetries
                });
                await this.sleep(delayMs);
            }
        }
        throw lastError;
    }
    /**
     * Verifica se um erro pode ser retentado
     */
    isRetryableError(error) {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        // Erros de rede e temporários
        const networkErrors = [
            'network', 'timeout', 'econnreset', 'enotfound', 'econnrefused',
            'socket hang up', 'request timeout', 'connection reset'
        ];
        // Erros HTTP retryáveis
        const retryableHttpErrors = [
            '429', '500', '502', '503', '504', 'rate limit', 'service unavailable',
            'internal server error', 'bad gateway', 'gateway timeout'
        ];
        // Erros do Firestore retryáveis
        const firestoreErrors = [
            'unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted'
        ];
        return networkErrors.some(err => message.includes(err) || name.includes(err)) ||
            retryableHttpErrors.some(err => message.includes(err)) ||
            firestoreErrors.some(err => message.includes(err));
    }
    /**
     * Calcula o delay para retry com backoff exponencial
     */
    calculateRetryDelay(attempt) {
        const baseDelay = this.retryDelayMs;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Adiciona jitter para evitar thundering herd
        return Math.min(exponentialDelay + jitter, this.maxRetryDelayMs);
    }
    /**
     * Utilitário para sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Carrega documento do banco de dados
     */
    async loadDocument(documentId) {
        try {
            // Tentar carregar do repository primeiro
            if (this.documentRepo) {
                const document = await this.documentRepo.findById(documentId);
                if (document) {
                    return document;
                }
            }
            // Fallback para busca direta no Firestore
            const doc = await this.db.collection('documents').doc(documentId).get();
            if (!doc.exists) {
                throw new Error(`Documento ${documentId} não encontrado`);
            }
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            console.error(`Erro ao carregar documento ${documentId}:`, error);
            throw error;
        }
    }
    /**
     * Carrega configuração da organização
     */
    async loadOrganizationConfig(organizationId) {
        try {
            // Tentar carregar organização do repository primeiro
            if (this.organizationRepo) {
                const organization = await this.organizationRepo.findById(organizationId);
                if (organization) {
                    // Extrair configurações da organização
                    return {
                        analysisSettings: {
                            enableAI: true,
                            strictMode: false,
                            customRules: []
                        },
                        notificationSettings: {
                            email: true
                        }
                    };
                }
            }
            // Fallback para busca direta no Firestore
            const doc = await this.db.collection('organization_configs').doc(organizationId).get();
            if (!doc.exists) {
                // Retornar configuração padrão se não existir
                return {
                    analysisSettings: {
                        enableAI: true,
                        strictMode: false,
                        customRules: []
                    },
                    notificationSettings: {
                        email: true
                    }
                };
            }
            return doc.data();
        }
        catch (error) {
            console.error(`Erro ao carregar configuração da organização ${organizationId}:`, error);
            throw error;
        }
    }
}
exports.AnalysisOrchestrator = AnalysisOrchestrator;
//# sourceMappingURL=AnalysisOrchestrator.js.map