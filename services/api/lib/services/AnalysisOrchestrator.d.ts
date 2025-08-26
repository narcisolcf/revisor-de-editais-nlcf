/**
 * AnalysisOrchestrator - Orquestração de análises entre Cloud Functions e Cloud Run
 * LicitaReview Cloud Functions
 */
import { Firestore } from 'firebase-admin/firestore';
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
}
export interface AnalysisProgress {
    analysisId: string;
    documentId: string;
    status: AnalysisStatus;
    progress: number;
    currentStep: string;
    estimatedTimeRemaining: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    retryCount?: number;
    lastRetryAt?: Date;
    maxRetries?: number;
}
export declare class AnalysisOrchestrator {
    private db;
    private documentRepo;
    private organizationRepo;
    private cloudRunClient;
    private notificationService;
    private activeAnalyses;
    private readonly maxRetries;
    private readonly retryDelayMs;
    private readonly maxRetryDelayMs;
    constructor(firestore: Firestore, cloudRunServiceUrl: string, projectId: string);
    /**
     * Inicia uma nova análise
     */
    startAnalysis(request: AnalysisRequest): Promise<string>;
    /**
     * Processa uma análise
     */
    processAnalysis(analysisId: string, request: AnalysisRequest): Promise<void>;
    /**
     * Obtém o progresso de uma análise
     */
    getAnalysisProgress(analysisId: string): Promise<AnalysisProgress | null>;
    /**
     * Cancela uma análise
     */
    cancelAnalysis(analysisId: string, userId: string): Promise<boolean>;
    /**
     * Lista análises ativas
     */
    getActiveAnalyses(): AnalysisProgress[];
    private generateAnalysisId;
    private convertCloudRunResult;
    private updateProgress;
    private saveAnalysisProgress;
    private loadAnalysisProgress;
    private saveAnalysisResult;
    private handleAnalysisError;
    /**
     * Trata erros com lógica de retry automático
     */
    private handleAnalysisErrorWithRetry;
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
}
//# sourceMappingURL=AnalysisOrchestrator.d.ts.map