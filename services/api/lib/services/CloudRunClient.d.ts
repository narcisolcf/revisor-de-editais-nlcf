/**
 * CloudRunClient - Cliente para comunicação com serviços Cloud Run
 * LicitaReview Cloud Functions
 */
export interface CloudRunAnalysisRequest {
    document_content: string;
    document_type: string;
    classification: any;
    organization_config: any;
    analysis_options: any;
    metadata: {
        document_id: string;
        file_size: number;
        upload_date: Date;
    };
}
export interface CloudRunAnalysisResponse {
    analysis_id: string;
    document_id: string;
    organization_id: string;
    status: 'processing' | 'completed' | 'failed';
    results: {
        conformity_score: number;
        confidence: number;
        problems: any[];
        recommendations: string[];
        metrics: Record<string, any>;
        categories: Record<string, any>;
        ai_used: boolean;
    };
    processing_time: number;
    error?: string;
}
export interface CloudRunHealthResponse {
    status: 'healthy' | 'unhealthy';
    version: string;
    timestamp: string;
    services: {
        ocr: boolean;
        classification: boolean;
        analysis: boolean;
    };
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
}
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
export declare class CloudRunClient {
    private httpClient;
    private auth;
    private serviceUrl;
    private circuitBreaker;
    private retryConfig;
    private httpClientPromise;
    constructor(serviceUrl: string, circuitBreakerConfig?: CircuitBreakerConfig, retryConfig?: RetryConfig);
    /**
     * Garante que o httpClient esteja inicializado
     */
    private ensureHttpClient;
    /**
     * Analisa um documento via Cloud Run
     */
    analyzeDocument(request: CloudRunAnalysisRequest): Promise<CloudRunAnalysisResponse>;
    /**
     * Classifica um documento
     */
    classifyDocument(documentContent: string, metadata: any): Promise<any>;
    /**
     * Verifica a saúde do serviço Cloud Run
     */
    healthCheck(): Promise<CloudRunHealthResponse>;
    /**
     * Obtém métricas do serviço
     */
    getMetrics(): Promise<any>;
    /**
     * Verifica se o serviço está disponível
     */
    isAvailable(): Promise<boolean>;
    private setupHttpClient;
    private retryWithBackoff;
    private isRetryableError;
    private handleHttpError;
    private sleep;
}
//# sourceMappingURL=CloudRunClient.d.ts.map