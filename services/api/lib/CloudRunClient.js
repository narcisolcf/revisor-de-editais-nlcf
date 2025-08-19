"use strict";
/**
 * CloudRunClient - Cliente para comunicação com serviços Cloud Run
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
exports.CloudRunClient = void 0;
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importStar(require("axios"));
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
        const client = await this.auth.getIdTokenClient(this.serviceUrl);
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
                const token = await client.getAccessToken();
                if (token.token) {
                    if (!config.headers) {
                        config.headers = new axios_1.AxiosHeaders();
                    }
                    config.headers.Authorization = `Bearer ${token.token}`;
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
