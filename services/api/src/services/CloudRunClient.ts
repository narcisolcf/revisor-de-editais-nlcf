/**
 * CloudRunClient - Cliente para comunicação com serviços Cloud Run
 * LicitaReview Cloud Functions
 */

import { GoogleAuth } from 'google-auth-library';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { JWT } from 'google-auth-library/build/src/auth/jwtclient';
import { LoggingService } from './LoggingService';

// Interface simplificada para logging
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
import { MetricsService } from './MetricsService';
import { AuthenticationService, AuthConfig as AuthServiceConfig, JWTConfig } from './AuthenticationService';

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

export class CloudRunClient {
  private httpClient: AxiosInstance | null = null;
  private auth!: GoogleAuth;
  private jwtClient: JWT | null = null;
  private serviceUrl: string;
  private circuitBreaker: CircuitBreaker;
  private retryConfig: RetryConfig;
  private authConfig: AuthConfig;
  private authService: AuthenticationService;
  private metricsService: IMetricsService;
  private logger: ILogger;
  private httpClientPromise: Promise<void> | null = null;
  private lastTokenRefresh: number = 0;
  private tokenRefreshInterval: number = 3300000; // 55 minutos
  private tokenCache = new Map<string, { token: string; expires: number }>();
  private readonly tokenCacheTimeout = 50 * 60 * 1000; // 50 minutos

  constructor(
    serviceUrl: string,
    authConfig: AuthConfig = {},
    circuitBreakerConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 10000
    },
    retryConfig: RetryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    },
    metricsService?: IMetricsService,
    authServiceConfig?: AuthServiceConfig,
    jwtConfig?: JWTConfig,
    logger?: ILogger
  ) {
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
    const defaultAuthServiceConfig: AuthServiceConfig = {
      projectId: authConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || '',
      audience: serviceUrl,
      scopes: authConfig.scopes || ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/run.invoker']
    };
    
    this.authService = new AuthenticationService(
      authServiceConfig || defaultAuthServiceConfig,
      jwtConfig
    );
    
    // Configurar autenticação baseada nos parâmetros fornecidos
    this.setupAuthentication();
    
    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
  }

  /**
   * Garante que o httpClient esteja inicializado
   */
  private async ensureHttpClient(): Promise<void> {
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
  async analyzeDocument(request: CloudRunAnalysisRequest): Promise<CloudRunAnalysisResponse> {
    await this.ensureHttpClient();
    return await this.circuitBreaker.execute(async () => {
      return await this.retryWithBackoff(async () => {
        const response = await this.httpClient!.post<CloudRunAnalysisResponse>(
          '/analyze',
          request,
          {
            timeout: 120000, // 2 minutos timeout
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data;
      }, 'analyzeDocument');
    });
  }

  /**
   * Inicia uma análise (alias para analyzeDocument para compatibilidade)
   */
  async startAnalysis(request: CloudRunAnalysisRequest): Promise<{ analysisId: string; status: string }> {
    const response = await this.analyzeDocument(request);
    return {
      analysisId: response.analysis_id,
      status: response.status
    };
  }

  /**
   * Classifica um documento
   */
  async classifyDocument(documentContent: string, metadata: any): Promise<any> {
    await this.ensureHttpClient();
    return await this.circuitBreaker.execute(async () => {
      return await this.retryWithBackoff(async () => {
        const response = await this.httpClient!.post(
          '/classify',
          {
            document_content: documentContent,
            metadata
          },
          {
            timeout: 30000, // 30 segundos timeout
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data;
      }, 'classifyDocument');
    });
  }

  /**
   * Verifica a saúde do serviço Cloud Run
   */
  async healthCheck(): Promise<CloudRunHealthResponse> {
    await this.ensureHttpClient();
    return await this.retryWithBackoff(async () => {
      const response = await this.httpClient!.get<CloudRunHealthResponse>('/health', {
        timeout: 5000 // 5 segundos timeout
      });
      
      return response.data;
    }, 'healthCheck');
  }

  /**
   * Obtém métricas do serviço
   */
  async getMetrics(): Promise<any> {
    await this.ensureHttpClient();
    return await this.retryWithBackoff(async () => {
      const response = await this.httpClient!.get('/metrics', {
        timeout: 10000
      });
      
      return response.data;
    }, 'getMetrics');
  }

  /**
   * Faz upload de um documento para análise
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    await this.ensureHttpClient();
    return await this.circuitBreaker.execute(async () => {
      return await this.retryWithBackoff(async () => {
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', request.file, {
          filename: request.filename,
          contentType: request.contentType
        });

        const response = await this.httpClient!.post<DocumentUploadResponse>(
          '/upload',
          formData,
          {
            timeout: 60000, // 1 minuto timeout
            headers: {
              ...formData.getHeaders(),
            }
          }
        );
        
        return response.data;
      }, 'uploadDocument');
    });
  }

  /**
   * Obtém presets de análise disponíveis
   */
  async getAnalysisPresets(): Promise<AnalysisPresetsResponse> {
    await this.ensureHttpClient();
    return await this.retryWithBackoff(async () => {
      const response = await this.httpClient!.get<AnalysisPresetsResponse>('/presets', {
        timeout: 10000
      });
      
      return response.data;
    }, 'getAnalysisPresets');
  }

  /**
   * Valida configuração organizacional
   */
  async validateConfig(request: ConfigValidationRequest): Promise<ConfigValidationResponse> {
    await this.ensureHttpClient();
    return await this.circuitBreaker.execute(async () => {
      return await this.retryWithBackoff(async () => {
        const response = await this.httpClient!.post<ConfigValidationResponse>(
          '/validate-config',
          request,
          {
            timeout: 30000, // 30 segundos timeout
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return response.data;
      }, 'validateConfig');
    });
  }

  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Valida se a configuração de autenticação está correta
   */
  async validateAuth(): Promise<{ valid: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { valid: false, error: 'Não foi possível obter token de autenticação' };
      }
      
      // Tentar fazer uma requisição simples para validar o token
      await this.healthCheck();
      return { valid: true };
    } catch (error: any) {
      return { 
        valid: false, 
        error: error.message || 'Erro na validação de autenticação' 
      };
    }
  }

  /**
   * Obtém informações sobre a configuração atual
   */
  getConfig(): {
    serviceUrl: string;
    authConfig: Partial<AuthConfig>;
    circuitBreakerConfig: CircuitBreakerConfig;
    retryConfig: RetryConfig;
  } {
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
  private setupAuthentication(): void {
    const scopes = this.authConfig.scopes || ['https://www.googleapis.com/auth/cloud-platform'];
    
    if (this.authConfig.serviceAccountKeyFile) {
      // Usar arquivo de chave de service account
      this.auth = new GoogleAuth({
        keyFilename: this.authConfig.serviceAccountKeyFile,
        scopes,
        projectId: this.authConfig.projectId
      });
    } else if (this.authConfig.serviceAccountEmail) {
      // Usar email de service account com credenciais padrão
      this.auth = new GoogleAuth({
        scopes,
        projectId: this.authConfig.projectId
      });
    } else {
      // Usar Application Default Credentials (ADC)
      this.auth = new GoogleAuth({
        scopes,
        projectId: this.authConfig.projectId
      });
    }
  }

  /**
   * Obtém token de autenticação com cache e refresh automático
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await this.authService.getGoogleCloudToken();
      return token;
    } catch (error) {
      this.logger.error('Erro ao obter token de autenticação', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Falha na autenticação com Cloud Run');
    }
  }

  /**
   * Obtém token IAP para Identity-Aware Proxy
   */
  private async getIAPToken(): Promise<string> {
    try {
      return await this.authService.getIAPToken();
    } catch (error) {
      this.logger.error('Erro ao obter token IAP', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Falha na autenticação IAP');
    }
  }

  private async setupHttpClient(): Promise<void> {
    this.httpClient = axios.create({
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
    this.httpClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
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
        } catch (error) {
          this.logger.error('Erro ao obter token de autenticação', error instanceof Error ? error : new Error(String(error)));
          throw new Error('Falha na autenticação com Cloud Run');
        }
        return config;
      },
      async (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para logging e tratamento de erros
    this.httpClient.interceptors.response.use(
      async (response: AxiosResponse) => {
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`[CloudRunClient] Resposta: ${response.status} ${response.statusText}`);
        }
        return response;
      },
      async (error) => {
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
        } else if (error.request) {
          this.logger.error('[CloudRunClient] Erro de rede/timeout', error instanceof Error ? error : new Error(String(error)));
          this.circuitBreaker.recordFailure();
        } else {
          this.logger.error('[CloudRunClient] Erro de configuração', error instanceof Error ? error : new Error(String(error)));
        }
        
        return Promise.reject(this.handleHttpError(error));
      }
    );
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
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
        const baseDelay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );
        
        // Adicionar jitter (±25% do delay base)
        const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
        const delay = Math.max(100, baseDelay + jitter); // Mínimo de 100ms
        
        this.logger.warn(`[CloudRunClient] Tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1} falhou para ${context}. Tentando novamente em ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
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

  private handleHttpError(error: any): Error {
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
    } else if (error.request) {
      // Erro de rede
      return new Error('Não foi possível conectar ao serviço Cloud Run');
    } else {
      // Erro de configuração
      return new Error(`Erro na configuração da requisição: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Registra um callback para uma análise específica
   */
  async registerCallback(request: CallbackRegistrationRequest): Promise<CallbackRegistrationResponse> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.post('/callbacks/register', request);
        return response.data;
      });
    }, 'registerCallback');
  }

  /**
   * Remove um callback registrado
   */
  async unregisterCallback(callbackId: string): Promise<{ success: boolean; message: string }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.delete(`/callbacks/${callbackId}`);
        return response.data;
      });
    }, 'unregisterCallback');
  }

  /**
   * Lista todos os callbacks registrados
   */
  async listCallbacks(analysisId?: string): Promise<CallbackRegistrationResponse[]> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const url = analysisId ? `/callbacks?analysis_id=${analysisId}` : '/callbacks';
        const response = await this.httpClient!.get(url);
        return response.data.callbacks || [];
      });
    }, 'listCallbacks');
  }

  /**
   * Configura webhook global para o serviço
   */
  async configureWebhook(request: WebhookConfigRequest): Promise<WebhookConfigResponse> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.post('/webhooks/configure', request);
        return response.data;
      });
    }, 'configureWebhook');
  }

  /**
   * Obtém configuração atual do webhook
   */
  async getWebhookConfig(): Promise<WebhookConfigResponse | null> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        try {
          const response = await this.httpClient!.get('/webhooks/config');
          return response.data;
        } catch (error: any) {
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
  async testWebhook(webhookId: string): Promise<{ success: boolean; response_time: number; error?: string }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.post(`/webhooks/${webhookId}/test`);
        return response.data;
      });
    }, 'testWebhook');
  }

  /**
   * Envia notificação manual para callback (para testes)
   */
  async sendTestCallback(callbackId: string, payload: any): Promise<{ success: boolean; response_time: number; error?: string }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.post(`/callbacks/${callbackId}/test`, { payload });
        return response.data;
      });
    }, 'sendTestCallback');
  }

  /**
   * Obtém estatísticas de callbacks
   */
  async getCallbackStats(timeRange?: '1h' | '24h' | '7d' | '30d'): Promise<{
    total_callbacks: number;
    successful_deliveries: number;
    failed_deliveries: number;
    average_response_time: number;
    success_rate: number;
  }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const url = timeRange ? `/callbacks/stats?range=${timeRange}` : '/callbacks/stats';
        const response = await this.httpClient!.get(url);
        return response.data;
      });
    }, 'getCallbackStats');
  }

  /**
   * Configura URL de callback padrão para todas as análises
   */
  async setDefaultCallbackUrl(callbackUrl: string, events: string[] = ['completed', 'failed']): Promise<{ success: boolean; message: string }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.post('/callbacks/default', {
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
  async removeDefaultCallbackUrl(): Promise<{ success: boolean; message: string }> {
    await this.ensureHttpClient();
    
    return this.retryWithBackoff(async () => {
      return this.circuitBreaker.execute(async () => {
        const response = await this.httpClient!.delete('/callbacks/default');
        return response.data;
      });
    }, 'removeDefaultCallbackUrl');
  }

  /**
   * Verifica se o serviço suporta callbacks
   */
  async supportsCallbacks(): Promise<boolean> {
    try {
      await this.ensureHttpClient();
      const response = await this.httpClient!.get('/capabilities');
      return response.data.features?.includes('callbacks') || false;
    } catch (error) {
      this.logger.warn('Não foi possível verificar suporte a callbacks', { error: (error as Error).message });
      return false;
    }
  }
}

/**
 * Circuit Breaker para proteger contra falhas em cascata
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        // Circuit breaker mudou para HALF_OPEN
      } else {
        throw new Error('Circuit breaker está OPEN - serviço indisponível');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      // Circuit breaker mudou para CLOSED
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      // Circuit breaker mudou para OPEN
    }
  }

  canExecute(): boolean {
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

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  getStatus(): {
    state: string;
    failureCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}