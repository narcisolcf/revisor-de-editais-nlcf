/**
 * CloudRunClient - Cliente para comunicação com serviços Cloud Run
 * LicitaReview Cloud Functions
 */
interface ILogger {
    debug(message: string, metadata?: any): Promise<void>;
    info(message: string, metadata?: any): Promise<void>;
    warn(message: string, metadata?: any): Promise<void>;
    error(message: string, metadata?: any): Promise<void>;
}
interface IMetricsService {
    recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
    recordTimer(name: string, duration: number, tags?: Record<string, string>): Promise<void>;
    getMetrics(): Promise<any>;
}
import { AuthConfig as AuthServiceConfig, JWTConfig } from './AuthenticationService';
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
    callback_config?: {
        callback_url?: string;
        callback_events?: string[];
        callback_secret?: string;
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
    callback_registered?: boolean;
    webhook_url?: string;
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
export interface AuthConfig {
    serviceAccountEmail?: string;
    serviceAccountKeyFile?: string;
    projectId?: string;
    audience?: string;
    scopes?: string[];
}
export interface DocumentUploadRequest {
    file: Buffer;
    filename: string;
    contentType: string;
}
export interface DocumentUploadResponse {
    document_id: string;
    filename: string;
    file_type: string;
    file_size: number;
    extracted_text_length: number;
    document_type: string;
    processing_status: string;
    upload_timestamp: string;
}
export interface AnalysisPreset {
    name: string;
    description: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    weight_distribution: string;
    dominant_category: string;
    suitable_for: string[];
}
export interface AnalysisPresetsResponse {
    available_presets: Record<string, AnalysisPreset>;
    custom_preset_info: {
        name: string;
        description: string;
        allows_custom_weights: boolean;
        allows_custom_rules: boolean;
        allows_templates: boolean;
    };
}
export interface ConfigValidationRequest {
    organization_id: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    custom_rules: any[];
    templates: any[];
}
export interface ConfigValidationResponse {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    config_summary: any;
}
export interface CallbackRegistrationRequest {
    analysis_id: string;
    callback_url: string;
    events: string[];
    secret_key?: string;
    retry_config?: {
        max_retries: number;
        initial_delay: number;
        backoff_multiplier: number;
    };
}
export interface CallbackRegistrationResponse {
    callback_id: string;
    webhook_url: string;
    registered_events: string[];
    status: 'active' | 'inactive';
    created_at: string;
}
export interface WebhookConfigRequest {
    callback_url: string;
    events: string[];
    secret_key?: string;
    active: boolean;
}
export interface WebhookConfigResponse {
    webhook_id: string;
    callback_url: string;
    events: string[];
    status: 'active' | 'inactive';
    created_at: string;
    last_used?: string;
}
export declare class CloudRunClient {
    private httpClient;
    private auth;
    private jwtClient;
    private serviceUrl;
    private circuitBreaker;
    private retryConfig;
    private authConfig;
    private authService;
    private metricsService;
    private logger;
    private httpClientPromise;
    private lastTokenRefresh;
    private tokenRefreshInterval;
    private tokenCache;
    private readonly tokenCacheTimeout;
    constructor(serviceUrl: string, authConfig?: AuthConfig, circuitBreakerConfig?: CircuitBreakerConfig, retryConfig?: RetryConfig, metricsService?: IMetricsService, authServiceConfig?: AuthServiceConfig, jwtConfig?: JWTConfig, logger?: ILogger);
    /**
     * Garante que o httpClient esteja inicializado
     */
    private ensureHttpClient;
    /**
     * Analisa um documento via Cloud Run
     */
    analyzeDocument(request: CloudRunAnalysisRequest): Promise<CloudRunAnalysisResponse>;
    /**
     * Inicia uma análise (alias para analyzeDocument para compatibilidade)
     */
    startAnalysis(request: CloudRunAnalysisRequest): Promise<{
        analysisId: string;
        status: string;
    }>;
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
     * Faz upload de um documento para análise
     */
    uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse>;
    /**
     * Obtém presets de análise disponíveis
     */
    getAnalysisPresets(): Promise<AnalysisPresetsResponse>;
    /**
     * Valida configuração organizacional
     */
    validateConfig(request: ConfigValidationRequest): Promise<ConfigValidationResponse>;
    /**
     * Verifica se o serviço está disponível
     */
    isAvailable(): Promise<boolean>;
    /**
     * Valida se a configuração de autenticação está correta
     */
    validateAuth(): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Obtém informações sobre a configuração atual
     */
    getConfig(): {
        serviceUrl: string;
        authConfig: Partial<AuthConfig>;
        circuitBreakerConfig: CircuitBreakerConfig;
        retryConfig: RetryConfig;
    };
    /**
     * Configura a autenticação baseada nos parâmetros fornecidos
     */
    private setupAuthentication;
    /**
     * Obtém token de autenticação com cache e refresh automático
     */
    private getAuthToken;
    /**
     * Obtém token IAP para Identity-Aware Proxy
     */
    private getIAPToken;
    private setupHttpClient;
    private retryWithBackoff;
    private isRetryableError;
    private handleHttpError;
    private sleep;
    /**
     * Registra um callback para uma análise específica
     */
    registerCallback(request: CallbackRegistrationRequest): Promise<CallbackRegistrationResponse>;
    /**
     * Remove um callback registrado
     */
    unregisterCallback(callbackId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Lista todos os callbacks registrados
     */
    listCallbacks(analysisId?: string): Promise<CallbackRegistrationResponse[]>;
    /**
     * Configura webhook global para o serviço
     */
    configureWebhook(request: WebhookConfigRequest): Promise<WebhookConfigResponse>;
    /**
     * Obtém configuração atual do webhook
     */
    getWebhookConfig(): Promise<WebhookConfigResponse | null>;
    /**
     * Testa conectividade do webhook
     */
    testWebhook(webhookId: string): Promise<{
        success: boolean;
        response_time: number;
        error?: string;
    }>;
    /**
     * Envia notificação manual para callback (para testes)
     */
    sendTestCallback(callbackId: string, payload: any): Promise<{
        success: boolean;
        response_time: number;
        error?: string;
    }>;
    /**
     * Obtém estatísticas de callbacks
     */
    getCallbackStats(timeRange?: '1h' | '24h' | '7d' | '30d'): Promise<{
        total_callbacks: number;
        successful_deliveries: number;
        failed_deliveries: number;
        average_response_time: number;
        success_rate: number;
    }>;
    /**
     * Configura URL de callback padrão para todas as análises
     */
    setDefaultCallbackUrl(callbackUrl: string, events?: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Remove URL de callback padrão
     */
    removeDefaultCallbackUrl(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Verifica se o serviço suporta callbacks
     */
    supportsCallbacks(): Promise<boolean>;
}
export {};
