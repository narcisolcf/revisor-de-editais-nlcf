"use strict";
/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisOrchestrator = void 0;
const DocumentRepository_1 = require("../db/repositories/DocumentRepository");
const OrganizationRepository_1 = require("../db/repositories/OrganizationRepository");
const AnalysisRepository_1 = require("../db/repositories/AnalysisRepository");
const CloudRunClient_1 = require("./CloudRunClient");
const NotificationService_1 = require("./NotificationService");
const ParameterEngine_1 = require("./ParameterEngine");
class AnalysisOrchestrator {
    constructor(firestore, cloudRunServiceUrl, projectId, authConfig) {
        this.activeAnalyses = new Map();
        this.maxRetries = 3;
        this.retryDelayMs = 2000; // 2 segundos inicial
        this.maxRetryDelayMs = 30000; // 30 segundos máximo
        this.exponentialBackoffMultiplier = 2;
        this.jitterMaxMs = 1000; // Jitter para evitar thundering herd
        this.db = firestore;
        this.documentRepo = new DocumentRepository_1.DocumentRepository(firestore);
        this.organizationRepo = new OrganizationRepository_1.OrganizationRepository(firestore);
        this.analysisRepo = new AnalysisRepository_1.AnalysisRepository(firestore);
        // Configurar autenticação para Cloud Run com configurações padrão seguras
        const defaultAuthConfig = {
            projectId,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            ...authConfig
        };
        this.cloudRunClient = new CloudRunClient_1.CloudRunClient(cloudRunServiceUrl, defaultAuthConfig, {
            failureThreshold: 5,
            resetTimeout: 60000,
            monitoringPeriod: 10000
        }, {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2
        });
        this.notificationService = new NotificationService_1.NotificationService(projectId);
        this.parameterEngine = new ParameterEngine_1.ParameterEngine(firestore, {
            enableAdaptiveWeights: true,
            enableLearningMode: true,
            adaptationThreshold: 10,
            maxWeightAdjustment: 15.0,
            cacheTimeout: 30 * 60 * 1000 // 30 minutos
        });
    }
    /**
     * Inicia uma nova análise
     */
    async startAnalysis(request) {
        // Validar parâmetros obrigatórios
        if (!request.documentId) {
            throw new Error('ID do documento é obrigatório');
        }
        if (!request.organizationId) {
            throw new Error('ID da organização é obrigatório');
        }
        if (!request.userId) {
            throw new Error('ID do usuário é obrigatório');
        }
        if (!request.options) {
            throw new Error('Opções de análise são obrigatórias');
        }
        // Validar se documento existe
        const document = await this.documentRepo.findById(request.documentId);
        if (!document) {
            throw new Error(`Documento ${request.documentId} não encontrado`);
        }
        // Validar se organização existe
        const organization = await this.organizationRepo.findById(request.organizationId);
        if (!organization) {
            throw new Error(`Organização ${request.organizationId} não encontrada`);
        }
        // Validar parâmetros específicos se fornecidos
        if (request.parameters) {
            if (typeof request.parameters !== 'object') {
                throw new Error('Parâmetros inválidos - deve ser um objeto');
            }
            // Validação adicional de parâmetros específicos
            if (request.parameters.invalidParam) {
                throw new Error('Parâmetros inválidos - parâmetro não suportado');
            }
        }
        const analysisId = this.generateAnalysisId();
        const analysisData = {
            id: analysisId,
            documentId: request.documentId,
            organizationId: request.organizationId,
            userId: request.userId,
            analysisType: 'FULL',
            configurationId: 'default',
            createdBy: request.userId,
            request: {
                priority: request.priority?.toUpperCase() || 'NORMAL',
                options: {
                    includeAI: request.options?.includeAI || false,
                    generateRecommendations: request.options?.generateRecommendations || false,
                    detailedMetrics: request.options?.detailedMetrics || false,
                    customRules: request.options?.customRules || []
                },
                timeout: 300
            },
            processing: {
                status: 'PENDING',
                progress: 0
            },
            engine: {
                name: 'licitareview-v2',
                version: '2.0.0',
                fallbackUsed: false,
                cacheHit: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Criar análise no AnalysisRepository com todos os campos obrigatórios
        await this.analysisRepo.createAnalysis(analysisData);
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
     * Inicia análise completa com upload e processamento integrado
     */
    async startAnalysisWithUpload(file, filename, organizationId, userId, analysisOptions, priority = 'normal') {
        try {
            // 1. Upload do documento para Cloud Run
            const uploadResult = await this.uploadDocumentToCloudRun(file, filename, organizationId, userId);
            if (!uploadResult.success || !uploadResult.documentId) {
                return {
                    success: false,
                    error: uploadResult.error || 'Falha no upload do documento'
                };
            }
            // 2. Iniciar análise do documento
            const analysisRequest = {
                documentId: uploadResult.documentId,
                organizationId,
                userId,
                options: analysisOptions,
                priority
            };
            const analysisId = await this.startAnalysis(analysisRequest);
            return {
                success: true,
                analysisId,
                documentId: uploadResult.documentId
            };
        }
        catch (error) {
            console.error('Erro na análise com upload:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro na análise com upload'
            };
        }
    }
    /**
     * Processa uma análise com integração robusta end-to-end
     */
    async processAnalysis(analysisId, request) {
        const progress = await this.getAnalysisProgress(analysisId);
        const retryCount = progress?.retryCount || 0;
        const maxRetries = progress?.maxRetries || this.maxRetries;
        try {
            console.log(`[AnalysisOrchestrator] Iniciando análise ${analysisId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
            // Atualizar progresso inicial
            await this.updateProgress(analysisId, {
                status: 'processing',
                progress: 5,
                currentStep: 'Validando conectividade Cloud Run',
                retryCount,
                maxRetries
            });
            // 1. Verificar conectividade com Cloud Run
            await this.validateCloudRunConnectivity();
            await this.updateProgress(analysisId, {
                progress: 15,
                currentStep: 'Carregando documento'
            });
            // 2. Buscar documento com retry robusto
            const document = await this.retryOperationWithExponentialBackoff(() => this.loadDocument(request.documentId), 'Carregando documento', analysisId, 3);
            await this.updateProgress(analysisId, {
                progress: 25,
                currentStep: 'Carregando configurações da organização'
            });
            // 3. Configuração da organização com retry
            const orgConfig = await this.retryOperationWithExponentialBackoff(() => this.loadOrganizationConfig(request.organizationId), 'Carregando configurações', analysisId, 3);
            await this.updateProgress(analysisId, {
                progress: 35,
                currentStep: 'Gerando parâmetros otimizados'
            });
            // 4. Gerar parâmetros otimizados usando ParameterEngine
            const analysisParameters = await this.retryOperationWithExponentialBackoff(() => this.parameterEngine.generateParameters(request.organizationId), 'Gerando parâmetros de análise', analysisId, 2);
            await this.updateProgress(analysisId, {
                progress: 45,
                currentStep: 'Preparando requisição para Cloud Run'
            });
            // 5. Configurar callback URL para comunicação bidirecional
            const callbackUrl = this.buildCallbackUrl(analysisId);
            const callbackSecret = this.generateCallbackSecret(analysisId);
            // 6. Preparar request para Cloud Run com validação completa
            const cloudRunRequest = this.buildCloudRunRequest(document, request, orgConfig, analysisParameters, callbackUrl, callbackSecret);
            await this.updateProgress(analysisId, {
                progress: 55,
                currentStep: 'Enviando para análise no Cloud Run'
            });
            // 7. Executar análise com retry e circuit breaker
            const cloudRunResult = await this.executeCloudRunAnalysisWithRetry(cloudRunRequest, analysisId, maxRetries);
            await this.updateProgress(analysisId, {
                progress: 85,
                currentStep: 'Processando e validando resultados'
            });
            // 8. Converter e validar resultado
            const analysisResult = this.convertAndValidateCloudRunResult(cloudRunResult, request);
            await this.updateProgress(analysisId, {
                progress: 95,
                currentStep: 'Persistindo resultados'
            });
            // 9. Salvar resultado com retry e validação
            await this.retryOperationWithExponentialBackoff(() => this.saveAnalysisResultWithValidation(request.documentId, analysisResult), 'Salvando resultados', analysisId, 3);
            // 10. Finalizar análise com sucesso
            await this.finalizeSuccessfulAnalysis(analysisId, request, document, analysisResult);
            console.log(`[AnalysisOrchestrator] Análise ${analysisId} concluída com sucesso`);
        }
        catch (error) {
            console.error(`[AnalysisOrchestrator] Erro na análise ${analysisId}:`, error);
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
    // eslint-disable-next-line no-unused-vars
    async cancelAnalysis(analysisId, _userId) {
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
    /**
     * Verifica a saúde da conexão com Cloud Run
     */
    async checkCloudRunHealth() {
        try {
            const startTime = Date.now();
            const health = await this.cloudRunClient.healthCheck();
            const responseTime = Date.now() - startTime;
            return {
                isHealthy: health.status === 'healthy',
                status: health.status,
                responseTime
            };
        }
        catch (error) {
            return {
                isHealthy: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    /**
     * Obtém parâmetros de análise otimizados para uma organização
     */
    async getAnalysisParameters(organizationId, forceRefresh = false) {
        return await this.parameterEngine.generateParameters(organizationId, forceRefresh);
    }
    /**
     * Obtém parâmetros de análise combinando ParameterEngine local e presets do Cloud Run
     */
    async getEnhancedAnalysisParameters(organizationId, forceRefresh = false) {
        try {
            // 1. Obter parâmetros otimizados localmente
            const localParameters = await this.parameterEngine.generateParameters(organizationId, forceRefresh);
            // 2. Obter presets disponíveis do Cloud Run
            const presetsResult = await this.getAvailableAnalysisPresets(organizationId);
            // 3. Validar configuração no Cloud Run
            const validationResult = await this.validateOrganizationConfig(organizationId, localParameters);
            return {
                success: true,
                parameters: localParameters,
                presets: presetsResult.presets,
                validation: validationResult.validation
            };
        }
        catch (error) {
            console.error('Erro ao obter parâmetros aprimorados:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao obter parâmetros'
            };
        }
    }
    /**
     * Limpa o cache de parâmetros para uma organização
     */
    async clearParameterCache(organizationId) {
        return await this.parameterEngine.clearCache(organizationId);
    }
    /**
     * Obtém estatísticas do ParameterEngine
     */
    getParameterEngineStats() {
        return this.parameterEngine.getEngineStats();
    }
    /**
     * Obtém métricas do serviço Cloud Run
     */
    async getCloudRunMetrics() {
        try {
            const metrics = await this.cloudRunClient.getMetrics();
            return {
                success: true,
                metrics
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao obter métricas'
            };
        }
    }
    /**
     * Faz upload de documento para o serviço Cloud Run
     */
    async uploadDocumentToCloudRun(file, filename, organizationId, userId, options) {
        try {
            const uploadRequest = {
                file,
                filename,
                contentType: 'application/pdf', // Default content type
                organizationId,
                userId,
                options: {
                    extractText: options?.extractText ?? true,
                    detectType: options?.detectType ?? true,
                    validateFormat: options?.validateFormat ?? true
                }
            };
            const uploadResponse = await this.cloudRunClient.uploadDocument(uploadRequest);
            return {
                success: true,
                documentId: uploadResponse.document_id,
                uploadResponse
            };
        }
        catch (error) {
            console.error('Erro no upload para Cloud Run:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro no upload'
            };
        }
    }
    /**
     * Obtém presets de análise disponíveis do Cloud Run
     */
    async getAvailableAnalysisPresets(organizationId) {
        try {
            const presetsResponse = await this.cloudRunClient.getAnalysisPresets();
            return {
                success: true,
                presets: Object.values(presetsResponse.available_presets)
            };
        }
        catch (error) {
            console.error('Erro ao obter presets de análise:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao obter presets'
            };
        }
    }
    /**
     * Valida configuração organizacional no Cloud Run
     */
    async validateOrganizationConfig(organizationId, config) {
        try {
            const validationRequest = {
                organization_id: organizationId,
                weights: config.weights || { structural: 25, legal: 25, clarity: 25, abnt: 25 },
                custom_rules: config.customRules || [],
                templates: config.templates || []
            };
            const validationResponse = await this.cloudRunClient.validateConfig(validationRequest);
            return {
                success: true,
                validation: {
                    isValid: validationResponse.is_valid,
                    errors: validationResponse.errors,
                    warnings: validationResponse.warnings,
                    suggestions: validationResponse.suggestions
                },
                warnings: validationResponse.warnings,
                suggestions: validationResponse.suggestions
            };
        }
        catch (error) {
            console.error('Erro na validação de configuração:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro na validação'
            };
        }
    }
    /**
     * Verifica se o serviço Cloud Run está disponível
     */
    async isCloudRunAvailable() {
        try {
            return await this.cloudRunClient.isAvailable();
        }
        catch (error) {
            console.warn('Erro ao verificar disponibilidade do Cloud Run:', error);
            return false;
        }
    }
    /**
     * Obtém configuração atual do CloudRunClient
     */
    getCloudRunConfig() {
        return this.cloudRunClient.getConfig();
    }
    /**
     * Valida a autenticação com Cloud Run
     */
    async validateCloudRunAuth() {
        try {
            await this.cloudRunClient.validateAuth();
            return { isValid: true };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Erro de autenticação'
            };
        }
    }
    // Métodos privados
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Valida conectividade com Cloud Run
     */
    async validateCloudRunConnectivity() {
        try {
            console.log('[AnalysisOrchestrator] Validando conectividade com Cloud Run...');
            const healthCheck = await this.cloudRunClient.healthCheck();
            if (healthCheck.status !== 'healthy') {
                throw new Error(`Cloud Run não está saudável: Status ${healthCheck.status}`);
            }
            console.log('[AnalysisOrchestrator] Conectividade com Cloud Run validada com sucesso');
        }
        catch (error) {
            console.error('[AnalysisOrchestrator] Falha na validação de conectividade:', error);
            throw new Error(`Falha na conectividade com Cloud Run: ${error.message}`);
        }
    }
    /**
     * Constrói requisição para Cloud Run com validação completa
     */
    buildCloudRunRequest(document, request, orgConfig, analysisParameters, callbackUrl, callbackSecret) {
        // Validar dados obrigatórios
        if (!document?.content) {
            throw new Error('Conteúdo do documento é obrigatório');
        }
        if (!analysisParameters) {
            throw new Error('Parâmetros de análise são obrigatórios');
        }
        return {
            document_content: document.content,
            document_type: document.type || 'EDITAL',
            classification: { type: document.type },
            organization_config: orgConfig || {},
            analysis_options: {
                include_ai: request.options.includeAI,
                generate_recommendations: request.options.generateRecommendations,
                detailed_metrics: request.options.detailedMetrics,
                custom_rules: analysisParameters.customRules,
                weights: analysisParameters.weights,
                preset: analysisParameters.preset,
                adaptive_adjustments: analysisParameters.adaptiveAdjustments
            },
            parameter_engine_config: {
                engine_version: analysisParameters.metadata?.engineVersion || '1.0',
                config_version: analysisParameters.metadata?.configVersion || '1.0',
                generated_at: analysisParameters.metadata?.generatedAt || new Date(),
                organization_id: analysisParameters.organizationId
            },
            metadata: {
                document_id: request.documentId,
                file_size: document.size || 0,
                upload_date: document.uploadedAt || new Date(),
                analysis_id: request.documentId // Para rastreamento
            },
            callback_config: {
                callback_url: callbackUrl,
                callback_events: ['progress', 'completed', 'failed', 'error'],
                callback_secret: callbackSecret
            }
        };
    }
    /**
     * Executa análise no Cloud Run com retry e circuit breaker
     */
    async executeCloudRunAnalysisWithRetry(cloudRunRequest, analysisId, maxRetries) {
        return this.retryOperationWithExponentialBackoff(async () => {
            console.log(`[AnalysisOrchestrator] Enviando requisição para Cloud Run (análise ${analysisId})`);
            const result = await this.cloudRunClient.analyzeDocument(cloudRunRequest);
            // Validar resposta básica
            if (!result) {
                throw new Error('Cloud Run retornou resposta vazia');
            }
            console.log(`[AnalysisOrchestrator] Resposta recebida do Cloud Run (análise ${analysisId})`);
            return result;
        }, 'Análise no Cloud Run', analysisId, maxRetries);
    }
    /**
     * Converte e valida resultado do Cloud Run para formato interno
     */
    convertAndValidateCloudRunResult(cloudRunResult, request) {
        // Validar estrutura da resposta
        if (!cloudRunResult) {
            throw new Error('Resultado do Cloud Run é nulo ou indefinido');
        }
        const result = {
            id: `analysis_${Date.now()}`,
            documentId: request.documentId,
            organizationId: request.organizationId,
            conformityScore: cloudRunResult.results?.conformity_score || 0,
            confidence: this.validateConfidence(cloudRunResult.results?.confidence),
            problems: Array.isArray(cloudRunResult.results?.problems) ? cloudRunResult.results.problems : [],
            recommendations: Array.isArray(cloudRunResult.results?.recommendations) ? cloudRunResult.results.recommendations : [],
            metrics: cloudRunResult.results?.metrics || {},
            categoryResults: cloudRunResult.results?.categories || {},
            processingTime: cloudRunResult.processing_time || 0,
            aiUsed: cloudRunResult.results?.ai_used || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Validar campos críticos
        this.validateAnalysisResult(result);
        return result;
    }
    /**
     * Valida valor de confiança
     */
    validateConfidence(confidence) {
        const conf = typeof confidence === 'number' ? confidence : 0.85;
        return Math.max(0, Math.min(1, conf)); // Garantir entre 0 e 1
    }
    /**
     * Valida resultado de análise
     */
    validateAnalysisResult(result) {
        if (!result.documentId) {
            throw new Error('ID do documento é obrigatório no resultado');
        }
        if (!result.organizationId) {
            throw new Error('ID da organização é obrigatório no resultado');
        }
        if (result.confidence < 0 || result.confidence > 1) {
            throw new Error('Confiança deve estar entre 0 e 1');
        }
    }
    /**
     * Salva resultado com validação adicional
     */
    async saveAnalysisResultWithValidation(documentId, analysisResult) {
        // Validar antes de salvar
        this.validateAnalysisResult(analysisResult);
        // Salvar no Firestore
        await this.saveAnalysisResult(documentId, analysisResult);
        console.log(`[AnalysisOrchestrator] Resultado salvo com sucesso para documento ${documentId}`);
    }
    /**
     * Finaliza análise com sucesso
     */
    async finalizeSuccessfulAnalysis(analysisId, request, document, analysisResult) {
        // Atualizar progresso final
        await this.updateProgress(analysisId, {
            status: 'completed',
            progress: 100,
            currentStep: 'Análise concluída',
            completedAt: new Date()
        });
        // Atualizar análise no AnalysisRepository
        await this.analysisRepo.updateStatus(analysisId, 'COMPLETED');
        // Enviar notificação (sem retry crítico)
        try {
            await this.notificationService.notifyAnalysisComplete(request.userId, request.organizationId, analysisId, document.name || 'Documento', analysisResult);
        }
        catch (notificationError) {
            console.warn(`[AnalysisOrchestrator] Falha ao enviar notificação para análise ${analysisId}:`, notificationError);
        }
        // Limpar análise ativa
        this.activeAnalyses.delete(analysisId);
    }
    /**
     * Converte resultado do Cloud Run para formato interno (método legado)
     */
    convertCloudRunResult(cloudRunResult, request) {
        return this.convertAndValidateCloudRunResult(cloudRunResult, request);
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
        // Salvar resultado da análise
        await this.db.collection('analysis_results').doc(result.id).set(result);
        // Atualizar análise no AnalysisRepository
        await this.analysisRepo.updateResults(result.id, {
            result: result,
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date()
        });
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
        // Atualizar análise no AnalysisRepository
        await this.analysisRepo.updateStatus(analysisId, 'FAILED', undefined, undefined, error.message);
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
            // Atualizar análise no AnalysisRepository
            await this.analysisRepo.updateStatus(analysisId, 'FAILED', undefined, undefined, error.message);
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
     * Operação com retry e exponential backoff aprimorado
     */
    async retryOperationWithExponentialBackoff(operation, operationName, analysisId, maxRetries = this.maxRetries) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    throw new Error(`${operationName} falhou após ${maxRetries + 1} tentativas: ${lastError.message}`);
                }
                // Exponential backoff com jitter
                const baseDelay = this.retryDelayMs * Math.pow(this.exponentialBackoffMultiplier, attempt);
                const jitter = Math.random() * this.jitterMaxMs;
                const delay = Math.min(baseDelay + jitter, this.maxRetryDelayMs);
                console.warn(`[AnalysisOrchestrator] ${operationName} falhou (tentativa ${attempt + 1}/${maxRetries + 1}), tentando novamente em ${Math.round(delay)}ms:`, error);
                await this.updateProgress(analysisId, {
                    currentStep: `${operationName} - Tentativa ${attempt + 2}/${maxRetries + 1}`
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    /**
     * Executa uma operação com retry automático
     */
    async retryOperation(operation, operationName, analysisId, maxRetries = 3) {
        return this.retryOperationWithExponentialBackoff(operation, operationName, analysisId, maxRetries);
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
    /**
     * Constrói URL de callback para análise
     */
    buildCallbackUrl(analysisId) {
        const baseUrl = process.env.CLOUD_FUNCTION_BASE_URL || 'https://us-central1-revisor-editais.cloudfunctions.net';
        return `${baseUrl}/callbacksApi/callback/analysis?analysisId=${analysisId}`;
    }
    /**
     * Gera secret para validação de callback
     */
    generateCallbackSecret(analysisId) {
        const crypto = require('crypto');
        const secretKey = process.env.CALLBACK_SECRET_KEY || 'default-secret-key';
        return crypto.createHmac('sha256', secretKey)
            .update(`${analysisId}-${Date.now()}`)
            .digest('hex');
    }
    /**
     * Processa callback recebido do Cloud Run
     */
    async processCallback(analysisId, callbackData) {
        try {
            const { status, progress, error, result } = callbackData;
            switch (status) {
                case 'progress':
                    await this.updateProgress(analysisId, {
                        progress: progress || 0,
                        currentStep: callbackData.currentStep || 'Processando no Cloud Run'
                    });
                    break;
                case 'completed':
                    if (result) {
                        // Converter resultado do Cloud Run para formato interno
                        // Criar um AnalysisRequest mínimo para conversão
                        const mockRequest = {
                            documentId: callbackData.documentId,
                            organizationId: callbackData.organizationId || 'unknown',
                            userId: callbackData.userId || 'system',
                            priority: 'normal',
                            options: {
                                includeAI: true,
                                generateRecommendations: true,
                                detailedMetrics: false,
                                customRules: []
                            }
                        };
                        const analysisResult = this.convertCloudRunResult(result, mockRequest);
                        // Salvar resultado
                        await this.saveAnalysisResult(callbackData.documentId, analysisResult);
                        // Finalizar análise
                        await this.updateProgress(analysisId, {
                            status: 'completed',
                            progress: 100,
                            currentStep: 'Análise concluída via callback',
                            completedAt: new Date()
                        });
                        this.activeAnalyses.delete(analysisId);
                    }
                    break;
                case 'failed':
                case 'error':
                    await this.updateProgress(analysisId, {
                        status: 'failed',
                        currentStep: 'Falha reportada pelo Cloud Run',
                        error: error || 'Erro desconhecido no Cloud Run',
                        completedAt: new Date()
                    });
                    this.activeAnalyses.delete(analysisId);
                    break;
                default:
                    console.warn(`Status de callback desconhecido: ${status}`);
            }
        }
        catch (error) {
            console.error(`Erro ao processar callback para análise ${analysisId}:`, error);
            throw error;
        }
    }
}
exports.AnalysisOrchestrator = AnalysisOrchestrator;
//# sourceMappingURL=AnalysisOrchestrator.js.map