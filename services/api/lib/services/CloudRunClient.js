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
class CloudRunClient {
    constructor(serviceUrl, circuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
    }, retryConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    }) {
        this.httpClient = null;
        this.httpClientPromise = null;
        this.serviceUrl = serviceUrl;
        this.retryConfig = retryConfig;
        this.auth = new google_auth_library_1.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
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
            });
        });
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
            });
        });
    }
    /**
     * Verifica a saúde do serviço Cloud Run
     */
    async healthCheck() {
        await this.ensureHttpClient();
        try {
            const response = await this.httpClient.get('/health', {
                timeout: 5000 // 5 segundos timeout
            });
            return response.data;
        }
        catch (error) {
            console.error('Health check falhou:', error);
            throw new Error('Serviço Cloud Run indisponível');
        }
    }
    /**
     * Obtém métricas do serviço
     */
    async getMetrics() {
        await this.ensureHttpClient();
        try {
            const response = await this.httpClient.get('/metrics', {
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error('Erro ao obter métricas:', error);
            throw error;
        }
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
    // Métodos privados
    async setupHttpClient() {
        this.httpClient = axios_1.default.create({
            baseURL: this.serviceUrl,
            timeout: 60000, // 1 minuto timeout padrão
            headers: {
                'User-Agent': 'LicitaReview-CloudFunctions/1.0'
            }
        });
        // Interceptor para adicionar token de autenticação
        this.httpClient.interceptors.request.use(async (config) => {
            try {
                const token = await this.auth.getAccessToken();
                if (token) {
                    if (!config.headers) {
                        config.headers = {};
                    }
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
            catch (error) {
                console.error('Erro ao obter token de autenticação:', error);
            }
            return config;
        });
        // Interceptor para logging e tratamento de erros
        this.httpClient.interceptors.response.use((response) => {
            console.log(`Cloud Run request successful: ${response.config.method?.toUpperCase()} ${response.config.url}`);
            return response;
        }, (error) => {
            console.error(`Cloud Run request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            return Promise.reject(this.handleHttpError(error));
        });
    }
    async retryWithBackoff(operation) {
        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === this.retryConfig.maxRetries) {
                    break;
                }
                // Verificar se o erro é retryable
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                // Calcular delay com backoff exponencial
                const delay = Math.min(this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt), this.retryConfig.maxDelay);
                console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`, error);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    isRetryableError(error) {
        // Erros de rede ou timeouts são retryable
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }
        // Status HTTP 5xx são retryable
        if (error.response?.status >= 500) {
            return true;
        }
        // Status 429 (rate limit) é retryable
        if (error.response?.status === 429) {
            return true;
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
                console.log('Circuit breaker mudou para HALF_OPEN');
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
            console.log('Circuit breaker mudou para CLOSED');
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
            console.log('Circuit breaker mudou para OPEN');
        }
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
}
//# sourceMappingURL=CloudRunClient.js.map