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
const TaskQueueService_1 = require("./TaskQueueService");
const NotificationService_1 = require("./NotificationService");
class AnalysisOrchestrator {
    constructor(firestore, cloudRunServiceUrl, projectId) {
        this.activeAnalyses = new Map();
        this.db = firestore;
        this.documentRepo = new DocumentRepository_1.DocumentRepository(firestore);
        this.organizationRepo = new OrganizationRepository_1.OrganizationRepository(firestore);
        this.cloudRunClient = new CloudRunClient_1.CloudRunClient(cloudRunServiceUrl);
        this.taskQueue = new TaskQueueService_1.TaskQueueService(projectId);
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
        var _a;
        try {
            // Atualizar progresso
            await this.updateProgress(analysisId, {
                status: 'processing',
                progress: 10,
                currentStep: 'Carregando documento'
            });
            // Buscar documento (simulado para teste)
            const document = {
                id: request.documentId,
                name: `Documento ${request.documentId}`,
                content: 'Conteúdo simulado do documento para teste',
                type: 'EDITAL',
                size: 1024,
                uploadedAt: new Date()
            };
            await this.updateProgress(analysisId, {
                progress: 30,
                currentStep: 'Carregando configurações'
            });
            // Configuração da organização (simulada para teste)
            const orgConfig = {
                analysisSettings: {
                    enableAI: true,
                    strictMode: false,
                    customRules: []
                }
            };
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
                    custom_rules: ((_a = orgConfig === null || orgConfig === void 0 ? void 0 : orgConfig.analysisSettings) === null || _a === void 0 ? void 0 : _a.customRules) || []
                },
                metadata: {
                    document_id: request.documentId,
                    file_size: document.size || 0,
                    upload_date: document.uploadedAt || new Date()
                }
            };
            const cloudRunResult = await this.cloudRunClient.analyzeDocument(cloudRunRequest);
            await this.updateProgress(analysisId, {
                progress: 90,
                currentStep: 'Processando resultados'
            });
            // Converter resultado para formato interno
            const analysisResult = this.convertCloudRunResult(cloudRunResult, request);
            // Salvar resultado
            await this.saveAnalysisResult(request.documentId, analysisResult);
            // Finalizar análise
            await this.updateProgress(analysisId, {
                status: 'completed',
                progress: 100,
                currentStep: 'Análise concluída',
                completedAt: new Date()
            });
            // Enviar notificação
            await this.notificationService.notifyAnalysisComplete(request.userId, request.organizationId, analysisId, document.name || 'Documento', analysisResult);
            this.activeAnalyses.delete(analysisId);
        }
        catch (error) {
            await this.handleAnalysisError(analysisId, error);
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
            const updated = Object.assign(Object.assign({}, current), updates);
            this.activeAnalyses.set(analysisId, updated);
            await this.saveAnalysisProgress(updated);
        }
    }
    async saveAnalysisProgress(progress) {
        await this.db.collection('analysis_progress').doc(progress.analysisId).set(Object.assign(Object.assign({}, progress), { updatedAt: new Date() }));
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
}
exports.AnalysisOrchestrator = AnalysisOrchestrator;
//# sourceMappingURL=AnalysisOrchestrator.js.map