/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */
import { Firestore } from 'firebase-admin/firestore';
import { AuthConfig } from './CloudRunClient';
export interface Document {
    id: string;
    name: string;
    organizationId: string;
    uploadedBy: string;
    uploadedAt: Date;
    size: number;
    type: string;
    status: string;
    content?: string;
}
export interface AnalysisResult {
    id: string;
    documentId: string;
    organizationId: string;
    conformityScore: number;
    confidence: number;
    problems: Problem[];
    recommendations: string[];
    metrics: Record<string, any>;
    categoryResults: Record<string, any>;
    processingTime: number;
    aiUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Problem {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    suggestion?: string;
}
export interface OrganizationConfig {
    id: string;
    organizationId: string;
    analysisSettings: {
        enableAI: boolean;
        strictMode: boolean;
        customRules: any[];
    };
    notificationSettings: {
        email: boolean;
        webhook?: string;
    };
}
export interface AnalysisOptions {
    includeAI: boolean;
    generateRecommendations: boolean;
    detailedMetrics: boolean;
    customRules?: any[];
}
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export interface AnalysisRequest {
    documentId: string;
    organizationId: string;
    userId: string;
    options: AnalysisOptions;
    priority: 'low' | 'normal' | 'high';
    parameters?: any;
}
export interface AnalysisProgress {
    analysisId: string;
    documentId: string;
    status: AnalysisStatus;
    progress: number;
    currentStep: string;
    estimatedTimeRemaining: number;
    estimatedCompletion?: Date;
    startedAt: Date;
    completedAt?: Date;
    failedAt?: Date;
    error?: string;
    retryCount?: number;
    lastRetryAt?: Date;
    maxRetries?: number;
}
export declare class AnalysisOrchestrator {
    private db;
    private documentRepo;
    private organizationRepo;
    private analysisRepo;
    private cloudRunClient;
    private notificationService;
    private parameterEngine;
    private activeAnalyses;
    private readonly maxRetries;
    private readonly retryDelayMs;
    private readonly maxRetryDelayMs;
    private readonly exponentialBackoffMultiplier;
    private readonly jitterMaxMs;
    constructor(firestore: Firestore, cloudRunServiceUrl: string, projectId: string, authConfig?: AuthConfig);
    /**
     * Inicia uma nova análise
     */
    startAnalysis(request: AnalysisRequest): Promise<string>;
    /**
     * Inicia análise completa com upload e processamento integrado
     */
    startAnalysisWithUpload(file: Buffer, filename: string, organizationId: string, userId: string, analysisOptions: AnalysisOptions, priority?: 'low' | 'normal' | 'high'): Promise<{
        success: boolean;
        analysisId?: string;
        documentId?: string;
        error?: string;
    }>;
    /**
     * Processa uma análise com integração robusta end-to-end
     */
    processAnalysis(analysisId: string, request: AnalysisRequest): Promise<void>;
    /**
     * Obtém o progresso de uma análise
     */
    getAnalysisProgress(analysisId: string): Promise<AnalysisProgress | null>;
    /**
     * Cancela uma análise
     */
    cancelAnalysis(analysisId: string, _userId: string): Promise<boolean>;
    /**
     * Lista análises ativas
     */
    getActiveAnalyses(): AnalysisProgress[];
    /**
     * Verifica a saúde da conexão com Cloud Run
     */
    checkCloudRunHealth(): Promise<{
        isHealthy: boolean;
        status: string;
        responseTime?: number;
        error?: string;
    }>;
    /**
     * Obtém parâmetros de análise otimizados para uma organização
     */
    getAnalysisParameters(organizationId: string, forceRefresh?: boolean): Promise<import("./ParameterEngine").AnalysisParameters>;
    /**
     * Obtém parâmetros de análise combinando ParameterEngine local e presets do Cloud Run
     */
    getEnhancedAnalysisParameters(organizationId: string, forceRefresh?: boolean): Promise<{
        success: boolean;
        parameters?: any;
        presets?: any[];
        validation?: any;
        error?: string;
    }>;
    /**
     * Limpa o cache de parâmetros para uma organização
     */
    clearParameterCache(organizationId?: string): Promise<void>;
    /**
     * Obtém estatísticas do ParameterEngine
     */
    getParameterEngineStats(): {
        version: string;
        config: import("./ParameterEngine").ParameterEngineConfig;
        cacheSize: number;
        cacheHitRate?: number;
    };
    /**
     * Obtém métricas do serviço Cloud Run
     */
    getCloudRunMetrics(): Promise<{
        success: boolean;
        metrics?: any;
        error?: string;
    }>;
    /**
     * Faz upload de documento para o serviço Cloud Run
     */
    uploadDocumentToCloudRun(file: Buffer, filename: string, organizationId: string, userId: string, options?: {
        extractText?: boolean;
        detectType?: boolean;
        validateFormat?: boolean;
    }): Promise<{
        success: boolean;
        documentId?: string;
        uploadResponse?: any;
        error?: string;
    }>;
    /**
     * Obtém presets de análise disponíveis do Cloud Run
     */
    getAvailableAnalysisPresets(organizationId?: string): Promise<{
        success: boolean;
        presets?: any[];
        error?: string;
    }>;
    /**
     * Valida configuração organizacional no Cloud Run
     */
    validateOrganizationConfig(organizationId: string, config: any): Promise<{
        success: boolean;
        validation?: any;
        warnings?: string[];
        suggestions?: string[];
        error?: string;
    }>;
    /**
     * Verifica se o serviço Cloud Run está disponível
     */
    isCloudRunAvailable(): Promise<boolean>;
    /**
     * Obtém configuração atual do CloudRunClient
     */
    getCloudRunConfig(): {
        serviceUrl: string;
        authConfig: any;
        circuitBreakerConfig: any;
        retryConfig: any;
    };
    /**
     * Valida a autenticação com Cloud Run
     */
    validateCloudRunAuth(): Promise<{
        isValid: boolean;
        error?: string;
    }>;
    private generateAnalysisId;
    /**
     * Valida conectividade com Cloud Run
     */
    private validateCloudRunConnectivity;
    /**
     * Constrói requisição para Cloud Run com validação completa
     */
    private buildCloudRunRequest;
    /**
     * Executa análise no Cloud Run com retry e circuit breaker
     */
    private executeCloudRunAnalysisWithRetry;
    /**
     * Converte e valida resultado do Cloud Run para formato interno
     */
    private convertAndValidateCloudRunResult;
    /**
     * Valida valor de confiança
     */
    private validateConfidence;
    /**
     * Valida resultado de análise
     */
    private validateAnalysisResult;
    /**
     * Salva resultado com validação adicional
     */
    private saveAnalysisResultWithValidation;
    /**
     * Finaliza análise com sucesso
     */
    private finalizeSuccessfulAnalysis;
    /**
     * Converte resultado do Cloud Run para formato interno (método legado)
     */
    private convertCloudRunResult;
    updateProgress(analysisId: string, updates: Partial<AnalysisProgress>): Promise<void>;
    private saveAnalysisProgress;
    private loadAnalysisProgress;
    saveAnalysisResult(documentId: string, result: AnalysisResult): Promise<void>;
    private handleAnalysisError;
    /**
     * Trata erros com lógica de retry automático
     */
    private handleAnalysisErrorWithRetry;
    /**
     * Operação com retry e exponential backoff aprimorado
     */
    private retryOperationWithExponentialBackoff;
    /**
     * Executa uma operação com retry automático
     */
    private retryOperation;
    /**
     * Verifica se um erro pode ser retentado
     */
    private isRetryableError;
    /**
     * Calcula o delay para retry com backoff exponencial
     */
    private calculateRetryDelay;
    /**
     * Utilitário para sleep
     */
    private sleep;
    /**
     * Carrega documento do banco de dados
     */
    private loadDocument;
    /**
     * Carrega configuração da organização
     */
    private loadOrganizationConfig;
    /**
     * Constrói URL de callback para análise
     */
    private buildCallbackUrl;
    /**
     * Gera secret para validação de callback
     */
    private generateCallbackSecret;
    /**
     * Processa callback recebido do Cloud Run
     */
    processCallback(analysisId: string, callbackData: any): Promise<void>;
}
