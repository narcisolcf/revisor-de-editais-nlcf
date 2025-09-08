"use strict";
/**
 * CloudRunClient - Cliente para comunicação com serviços Cloud Run
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudRunClient = void 0;
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
const AuthenticationService_1 = require("./AuthenticationService");
class CloudRunClient {
    constructor(serviceUrl, authConfig = {}, circuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
    }, retryConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    }, metricsService, authServiceConfig, jwtConfig, logger) {
        this.httpClient = null;
        this.jwtClient = null;
        this.httpClientPromise = null;
        this.lastTokenRefresh = 0;
        this.tokenRefreshInterval = 3300000; // 55 minutos
        this.tokenCache = new Map();
        this.tokenCacheTimeout = 50 * 60 * 1000; // 50 minutos
        this.serviceUrl = serviceUrl;
        this.authConfig = authConfig;
        this.retryConfig = retryConfig;
        this.metricsService = metricsService || {
            recordMetric: () => Promise.resolve(),
            recordTimer: () => Promise.resolve(),
            getMetrics: () => Promise.resolve({})
        };
        this.logger = logger || {
            debug: () => Promise.resolve(),
            info: () => Promise.resolve(),
            warn: () => Promise.resolve(),
            error: () => Promise.resolve()
        };
        // Inicializar serviço de autenticação
        const defaultAuthServiceConfig = {
            projectId: authConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || '',
            audience: serviceUrl,
            scopes: authConfig.scopes || ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/run.invoker']
        };
        this.authService = new AuthenticationService_1.AuthenticationService(authServiceConfig || defaultAuthServiceConfig, jwtConfig);
        // Configurar autenticação baseada nos parâmetros fornecidos
        this.setupAuthentication();
        this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
    }
    /**
     * Garante que o httpClient esteja inicializado
     */
    async ensureHttpClient() {
        if (this.httpClient) {
            return;
        }
        if (!this.httpClientPromise) {
            this.httpClientPromise = this.setupHttpClient();
        }
        await this.httpClientPromise;
    }
    /**
     * Analisa um documento via Cloud Run
     */
    async analyzeDocument(request) {
        await this.ensureHttpClient();
        return await this.circuitBreaker.execute(async () => {
            return await this.retryWithBackoff(async () => {
                const response = await this.httpClient.post('/analyze', request, {
                    timeout: 120000, // 2 minutos timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }, 'analyzeDocument');
        });
    }
    /**
     * Inicia uma análise (alias para analyzeDocument para compatibilidade)
     */
    async startAnalysis(request) {
        const response = await this.analyzeDocument(request);
        return {
            analysisId: response.analysis_id,
            status: response.status
        };
    }
    /**
     * Classifica um documento
     */
    async classifyDocument(documentContent, metadata) {
        await this.ensureHttpClient();
        return await this.circuitBreaker.execute(async () => {
            return await this.retryWithBackoff(async () => {
                const response = await this.httpClient.post('/classify', {
                    document_content: documentContent,
                    metadata
                }, {
                    timeout: 30000, // 30 segundos timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }, 'classifyDocument');
        });
    }
    /**
     * Verifica a saúde do serviço Cloud Run
     */
    async healthCheck() {
        await this.ensureHttpClient();
        return await this.retryWithBackoff(async () => {
            const response = await this.httpClient.get('/health', {
                timeout: 5000 // 5 segundos timeout
            });
            return response.data;
        }, 'healthCheck');
    }
    /**
     * Obtém métricas do serviço
     */
    async getMetrics() {
        await this.ensureHttpClient();
        return await this.retryWithBackoff(async () => {
            const response = await this.httpClient.get('/metrics', {
                timeout: 10000
            });
            return response.data;
        }, 'getMetrics');
    }
    /**
     * Faz upload de um documento para análise
     */
    async uploadDocument(request) {
        await this.ensureHttpClient();
        return await this.circuitBreaker.execute(async () => {
            return await this.retryWithBackoff(async () => {
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', request.file, {
                    filename: request.filename,
                    contentType: request.contentType
                });
                const response = await this.httpClient.post('/upload', formData, {
                    timeout: 60000, // 1 minuto timeout
                    headers: {
                        ...formData.getHeaders(),
                    }
                });
                return response.data;
            }, 'uploadDocument');
        });
    }
    /**
     * Obtém presets de análise disponíveis
     */
    async getAnalysisPresets() {
        await this.ensureHttpClient();
        return await this.retryWithBackoff(async () => {
            const response = await this.httpClient.get('/presets', {
                timeout: 10000
            });
            return response.data;
        }, 'getAnalysisPresets');
    }
    /**
     * Valida configuração organizacional
     */
    async validateConfig(request) {
        await this.ensureHttpClient();
        return await this.circuitBreaker.execute(async () => {
            return await this.retryWithBackoff(async () => {
                const response = await this.httpClient.post('/validate-config', request, {
                    timeout: 30000, // 30 segundos timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }, 'validateConfig');
        });
    }
    /**
     * Verifica se o serviço está disponível
     */
    async isAvailable() {
        try {
            const health = await this.healthCheck();
            return health.status === 'healthy';
        }
        catch {
            return false;
        }
    }
    /**
     * Valida se a configuração de autenticação está correta
     */
    async validateAuth() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                return { valid: false, error: 'Não foi possível obter token de autenticação' };
            }
            // Tentar fazer uma requisição simples para validar o token
            await this.healthCheck();
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: error.message || 'Erro na validação de autenticação'
            };
        }
    }
    /**
     * Obtém informações sobre a configuração atual
     */
    getConfig() {
        return {
            serviceUrl: this.serviceUrl,
            authConfig: {
                projectId: this.authConfig.projectId,
                serviceAccountEmail: this.authConfig.serviceAccountEmail,
                audience: this.authConfig.audience,
                scopes: this.authConfig.scopes
                // Não expor serviceAccountKeyFile por segurança
            },
            circuitBreakerConfig: this.circuitBreaker.getConfig(),
            retryConfig: this.retryConfig
        };
    }
    // Métodos privados
    /**
     * Configura a autenticação baseada nos parâmetros fornecidos
     */
    setupAuthentication() {
        const scopes = this.authConfig.scopes || ['https://www.googleapis.com/auth/cloud-platform'];
        if (this.authConfig.serviceAccountKeyFile) {
            // Usar arquivo de chave de service account
            this.auth = new google_auth_library_1.GoogleAuth({
                keyFilename: this.authConfig.serviceAccountKeyFile,
                scopes,
                projectId: this.authConfig.projectId
            });
        }
        else if (this.authConfig.serviceAccountEmail) {
            // Usar email de service account com credenciais padrão
            this.auth = new google_auth_library_1.GoogleAuth({
                scopes,
                projectId: this.authConfig.projectId
            });
        }
        else {
            // Usar Application Default Credentials (ADC)
            this.auth = new google_auth_library_1.GoogleAuth({
                scopes,
                projectId: this.authConfig.projectId
            });
        }
    }
    /**
     * Obtém token de autenticação com cache e refresh automático
     */
    async getAuthToken() {
        try {
            const token = await this.authService.getGoogleCloudToken();
            return token;
        }
        catch (error) {
            this.logger.error('Erro ao obter token de autenticação', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Falha na autenticação com Cloud Run');
        }
    }
    /**
     * Obtém token IAP para Identity-Aware Proxy
     */
    async getIAPToken() {
        try {
            return await this.authService.getIAPToken();
        }
        catch (error) {
            this.logger.error('Erro ao obter token IAP', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Falha na autenticação IAP');
        }
    }
    async setupHttpClient() {
        this.httpClient = axios_1.default.create({
            baseURL: this.serviceUrl,
            timeout: 60000, // Aumentado para 60 segundos
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CloudRunClient/2.0',
                'Accept': 'application/json'
            },
            // Configurações adicionais de timeout
            timeoutErrorMessage: 'Timeout na comunicação com Cloud Run',
            maxRedirects: 3,
            validateStatus: (status) => status < 500 // Não rejeitar automaticamente 4xx
        });
        // Interceptor para adicionar token de autenticação
        this.httpClient.interceptors.request.use(async (config) => {
            try {
                const token = await this.getAuthToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                // Adicionar audience se configurado (para Identity-Aware Proxy)
                if (this.authConfig.audience && config.headers) {
                    config.headers['X-Goog-IAP-JWT-Assertion'] = await this.getIAPToken();
                }
                // Log da requisição (apenas em desenvolvimento)
                if (process.env.NODE_ENV === 'development') {
                    this.logger.debug(`[CloudRunClient] ${config.method?.toUpperCase()} ${config.url}`);
                }
            }
            catch (error) {
                this.logger.error('Erro ao obter token de autenticação', error instanceof Error ? error : new Error(String(error)));
                throw new Error('Falha na autenticação com Cloud Run');
            }
            return config;
        }, async (error) => {
            return Promise.reject(error);
        });
        // Interceptor para logging e tratamento de erros
        this.httpClient.interceptors.response.use(async (response) => {
            if (process.env.NODE_ENV === 'development') {
                this.logger.debug(`[CloudRunClient] Resposta: ${response.status} ${response.statusText}`);
            }
            return response;
        }, async (error) => {
            // Log detalhado do erro
            if (error.response) {
                const status = error.response.status;
                const statusText = error.response.statusText;
                const data = error.response.data;
                this.logger.error(`[CloudRunClient] Erro HTTP ${status}: ${statusText}`, new Error(`HTTP ${status}: ${statusText}`));
                if (data && typeof data === 'object' && data.message) {
                    this.logger.error(`[CloudRunClient] Detalhes: ${data.message}`, new Error(data.message));
                }
                // Marcar falha no circuit breaker para erros 5xx
                if (status >= 500) {
                    this.circuitBreaker.recordFailure();
                }
            }
            else if (error.request) {
                this.logger.error('[CloudRunClient] Erro de rede/timeout', error instanceof Error ? error : new Error(String(error)));
                this.circuitBreaker.recordFailure();
            }
            else {
                this.logger.error('[CloudRunClient] Erro de configuração', error instanceof Error ? error : new Error(String(error)));
            }
            return Promise.reject(this.handleHttpError(error));
        });
    }
    async retryWithBackoff(operation, context) {
        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Não fazer retry se não for um erro retryable
                if (!this.isRetryableError(error)) {
                    // Para erros de autenticação, tentar renovar token uma vez
                    if (error.response?.status === 401 && attempt === 0) {
                        this.logger.info('[CloudRunClient] Erro de autenticação, renovando token...');
                        this.lastTokenRefresh = 0; // Forçar renovação do token
                        continue; // Tentar novamente com token renovado
                    }
                    throw error;
                }
                // Se for a última tentativa, lançar o erro
                if (attempt === this.retryConfig.maxRetries) {
                    break;
                }
                // Calcular delay com backoff exponencial + jitter
                const baseDelay = Math.min(this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt), this.retryConfig.maxDelay);
                // Adicionar jitter (±25% do delay base)
                const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
                const delay = Math.max(100, baseDelay + jitter); // Mínimo de 100ms
                this.logger.warn(`[CloudRunClient] Tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1} falhou para ${context}. Tentando novamente em ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    isRetryableError(error) {
        // Erros de rede
        if (error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'EHOSTUNREACH') {
            return true;
        }
        // Timeout do axios
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            return true;
        }
        // Erros HTTP retryable
        if (error.response) {
            const status = error.response.status;
            // 5xx, 429 (Too Many Requests), 408 (Request Timeout)
            return status >= 500 || status === 429 || status === 408;
        }
        return false;
    }
    handleHttpError(error) {
        if (error.response) {
            // Erro HTTP com resposta
            const status = error.response.status;
            const message = error.response.data?.error || error.response.statusText;
            switch (status) {
                case 400:
                    return new Error(`Requisição inválida: ${message}`);
                case 401:
                    return new Error('Não autorizado para acessar o serviço Cloud Run');
                case 403:
                    return new Error('Acesso negado ao serviço Cloud Run');
                case 404:
                    return new Error('Endpoint não encontrado no serviço Cloud Run');
                case 429:
                    return new Error('Rate limit excedido no serviço Cloud Run');
                case 500:
                    return new Error(`Erro interno do serviço Cloud Run: ${message}`);
                case 503:
                    return new Error('Serviço Cloud Run temporariamente indisponível');
                default:
                    return new Error(`Erro HTTP ${status}: ${message}`);
            }
        }
        else if (error.request) {
            // Erro de rede
            return new Error('Não foi possível conectar ao serviço Cloud Run');
        }
        else {
            // Erro de configuração
            return new Error(`Erro na configuração da requisição: ${error.message}`);
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Registra um callback para uma análise específica
     */
    async registerCallback(request) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.post('/callbacks/register', request);
                return response.data;
            });
        }, 'registerCallback');
    }
    /**
     * Remove um callback registrado
     */
    async unregisterCallback(callbackId) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.delete(`/callbacks/${callbackId}`);
                return response.data;
            });
        }, 'unregisterCallback');
    }
    /**
     * Lista todos os callbacks registrados
     */
    async listCallbacks(analysisId) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const url = analysisId ? `/callbacks?analysis_id=${analysisId}` : '/callbacks';
                const response = await this.httpClient.get(url);
                return response.data.callbacks || [];
            });
        }, 'listCallbacks');
    }
    /**
     * Configura webhook global para o serviço
     */
    async configureWebhook(request) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.post('/webhooks/configure', request);
                return response.data;
            });
        }, 'configureWebhook');
    }
    /**
     * Obtém configuração atual do webhook
     */
    async getWebhookConfig() {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                try {
                    const response = await this.httpClient.get('/webhooks/config');
                    return response.data;
                }
                catch (error) {
                    if (error.response?.status === 404) {
                        return null; // Webhook não configurado
                    }
                    throw error;
                }
            });
        }, 'getWebhookConfig');
    }
    /**
     * Testa conectividade do webhook
     */
    async testWebhook(webhookId) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.post(`/webhooks/${webhookId}/test`);
                return response.data;
            });
        }, 'testWebhook');
    }
    /**
     * Envia notificação manual para callback (para testes)
     */
    async sendTestCallback(callbackId, payload) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.post(`/callbacks/${callbackId}/test`, { payload });
                return response.data;
            });
        }, 'sendTestCallback');
    }
    /**
     * Obtém estatísticas de callbacks
     */
    async getCallbackStats(timeRange) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const url = timeRange ? `/callbacks/stats?range=${timeRange}` : '/callbacks/stats';
                const response = await this.httpClient.get(url);
                return response.data;
            });
        }, 'getCallbackStats');
    }
    /**
     * Configura URL de callback padrão para todas as análises
     */
    async setDefaultCallbackUrl(callbackUrl, events = ['completed', 'failed']) {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.post('/callbacks/default', {
                    callback_url: callbackUrl,
                    events
                });
                return response.data;
            });
        }, 'setDefaultCallbackUrl');
    }
    /**
     * Remove URL de callback padrão
     */
    async removeDefaultCallbackUrl() {
        await this.ensureHttpClient();
        return this.retryWithBackoff(async () => {
            return this.circuitBreaker.execute(async () => {
                const response = await this.httpClient.delete('/callbacks/default');
                return response.data;
            });
        }, 'removeDefaultCallbackUrl');
    }
    /**
     * Verifica se o serviço suporta callbacks
     */
    async supportsCallbacks() {
        try {
            await this.ensureHttpClient();
            const response = await this.httpClient.get('/capabilities');
            return response.data.features?.includes('callbacks') || false;
        }
        catch (error) {
            this.logger.warn('Não foi possível verificar suporte a callbacks', { error: error.message });
            return false;
        }
    }
}
exports.CloudRunClient = CloudRunClient;
/**
 * Circuit Breaker para proteger contra falhas em cascata
 */
class CircuitBreaker {
    constructor(config) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.config = config;
    }
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
                // Circuit breaker mudou para HALF_OPEN
            }
            else {
                throw new Error('Circuit breaker está OPEN - serviço indisponível');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            // Circuit breaker mudou para CLOSED
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
            // Circuit breaker mudou para OPEN
        }
    }
    canExecute() {
        if (this.state === 'CLOSED') {
            return true;
        }
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }
        // HALF_OPEN state
        return true;
    }
    recordSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
    getConfig() {
        return { ...this.config };
    }
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}
//# sourceMappingURL=CloudRunClient.js.map