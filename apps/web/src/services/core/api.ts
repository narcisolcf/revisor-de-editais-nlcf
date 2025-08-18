/**
 * Serviço de API para gerenciar requisições HTTP
 */

import { 
  ApiResponse, 
  RequestConfig, 
  HttpMethod, 
  HttpStatusCode,
  RequestInterceptor,
  ResponseInterceptor
} from '../../types/core/api';
import { NetworkError as INetworkError } from '../../types/core/errors';
import { Severity } from '../../types/core/common';
import { ServiceError } from './base';

/** Classe de erro de rede */
export class NetworkError extends Error implements INetworkError {
  public readonly code: string;
  public readonly severity: Severity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly status?: number;
  public readonly url?: string;
  public readonly method?: string;
  public readonly headers?: Record<string, string>;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.severity = 'error';
    this.timestamp = new Date();
    this.context = context;
    
    if (context) {
      this.status = context.status as number;
      this.url = context.url as string;
      this.method = context.method as string;
      this.headers = context.headers as Record<string, string>;
      this.responseBody = context.responseBody;
    }
  }
}

/** Configuração do cliente API */
export interface ApiClientConfig {
  /** URL base */
  baseUrl: string;
  /** Timeout padrão */
  timeout: number;
  /** Headers padrão */
  defaultHeaders: Record<string, string>;
  /** Interceptors de requisição */
  requestInterceptors: RequestInterceptor[];
  /** Interceptors de resposta */
  responseInterceptors: ResponseInterceptor[];
  /** Se deve fazer retry automático */
  enableRetry: boolean;
  /** Número máximo de tentativas */
  maxRetries: number;
  /** Delay entre tentativas */
  retryDelay: number;
  /** Se deve logar requisições */
  enableLogging: boolean;
}

/** Cliente API */
export class ApiClient {
  private config: ApiClientConfig;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: '',
      timeout: 30000,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      requestInterceptors: [],
      responseInterceptors: [],
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: false,
      ...config
    };
  }

  /** Adiciona interceptor de requisição */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.config.requestInterceptors.push(interceptor);
  }

  /** Adiciona interceptor de resposta */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.config.responseInterceptors.push(interceptor);
  }

  /** Remove interceptor de requisição */
  removeRequestInterceptor(interceptor: RequestInterceptor): void {
    const index = this.config.requestInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.config.requestInterceptors.splice(index, 1);
    }
  }

  /** Remove interceptor de resposta */
  removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    const index = this.config.responseInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.config.responseInterceptors.splice(index, 1);
    }
  }

  /** Executa requisição GET */
  async get<T = unknown>(
    url: string, 
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /** Executa requisição POST */
  async post<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, body: data });
  }

  /** Executa requisição PUT */
  async put<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, body: data });
  }

  /** Executa requisição PATCH */
  async patch<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, body: data });
  }

  /** Executa requisição DELETE */
  async delete<T = unknown>(
    url: string, 
    config?: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /** Executa requisição genérica */
  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      // Aplica interceptors de requisição
      let processedConfig = await this.applyRequestInterceptors(config);
      
      // Executa requisição com retry
      const response = await this.executeWithRetry(processedConfig, requestId);
      
      // Aplica interceptors de resposta
      const processedResponse = await this.applyResponseInterceptors(response);
      
      return processedResponse as ApiResponse<T>;
    } catch (error) {
      this.log('error', `Erro na requisição ${requestId}`, error);
      throw this.createApiError(error, config);
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /** Cancela requisição */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /** Cancela todas as requisições */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.abortControllers) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /** Executa requisição com retry */
  private async executeWithRetry<T>(
    config: RequestConfig, 
    requestId: string
  ): Promise<ApiResponse<T>> {
    let lastError: unknown;
    const maxAttempts = this.config.enableRetry ? this.config.maxRetries + 1 : 1;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log('info', `Executando requisição ${requestId} (tentativa ${attempt}/${maxAttempts})`);
        
        const response = await this.executeRequest<T>(config, requestId);
        
        if (attempt > 1) {
          this.log('info', `Requisição ${requestId} bem-sucedida após ${attempt} tentativas`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !this.shouldRetry(error)) {
          break;
        }
        
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        this.log('warn', `Requisição ${requestId} falhou na tentativa ${attempt}, tentando novamente em ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /** Executa requisição individual */
  private async executeRequest<T>(
    config: RequestConfig, 
    requestId: string
  ): Promise<ApiResponse<T>> {
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);
    
    // Timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, config.timeout || this.config.timeout);
    
    try {
      const url = this.buildUrl(config.url);
      const headers = this.buildHeaders(config.headers);
      
      const fetchConfig: RequestInit = {
        method: config.method,
        headers,
        signal: abortController.signal
      };
      
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        fetchConfig.body = this.serializeData(config.body, headers['Content-Type']);
      }
      
      this.log('info', `Enviando requisição ${config.method} para ${url}`);
      
      const response = await fetch(url, fetchConfig);
      
      clearTimeout(timeoutId);
      
      return await this.processResponse<T>(response, requestId);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /** Processa resposta */
  private async processResponse<T>(
    response: Response, 
    requestId: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    let data: T;
    const contentType = headers['content-type'] || '';
    
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = await response.blob() as unknown as T;
      }
    } catch (error) {
      this.log('warn', `Erro ao processar corpo da resposta ${requestId}`, error);
      data = null as unknown as T;
    }
    
    const apiResponse: ApiResponse<T> = {
      data,
      status: response.status as HttpStatusCode,
      statusText: response.statusText,
      headers,
      config: {} as RequestConfig // Será preenchido pelos interceptors
    };
    
    if (!response.ok) {
      throw new NetworkError(
        `Requisição falhou com status ${response.status}`,
        'API_ERROR',
        { status: response.status, response: apiResponse }
      );
    }
    
    this.log('info', `Requisição ${requestId} concluída com sucesso`);
    
    return apiResponse;
  }

  /** Aplica interceptors de requisição */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = { ...config };
    
    for (const interceptor of this.config.requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        this.log('error', 'Erro em interceptor de requisição', error);
        throw error;
      }
    }
    
    return processedConfig;
  }

  /** Aplica interceptors de resposta */
  private async applyResponseInterceptors<T>(
    response: ApiResponse<T>
  ): Promise<ApiResponse<T>> {
    let processedResponse = { ...response };
    
    for (const interceptor of this.config.responseInterceptors) {
      try {
        if (interceptor.onSuccess) {
          processedResponse = await interceptor.onSuccess(processedResponse);
        }
      } catch (error) {
        this.log('error', 'Erro em interceptor de resposta', error);
        if (interceptor.onError && error instanceof NetworkError) {
          throw await interceptor.onError(error);
        }
        throw error;
      }
    }
    
    return processedResponse;
  }

  /** Constrói URL completa */
  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${cleanPath}`;
  }

  /** Constrói headers */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.config.defaultHeaders,
      ...customHeaders
    };
  }

  /** Serializa dados */
  private serializeData(data: unknown, contentType: string): string | FormData | Blob {
    if (data instanceof FormData || data instanceof Blob) {
      return data;
    }
    
    if (contentType.includes('application/json')) {
      return JSON.stringify(data);
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams();
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }
      return params.toString();
    }
    
    return String(data);
  }

  /** Verifica se deve fazer retry */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof NetworkError) {
      // Não faz retry para erros de cliente (4xx)
      return !error.status || error.status >= 500;
    }
    
    // Faz retry para erros de rede
    return true;
  }

  /** Cria erro de API */
  private createApiError(error: unknown, config: RequestConfig): NetworkError {
    if (error instanceof NetworkError) {
      return error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NetworkError('Requisição cancelada', 'REQUEST_CANCELLED', { originalError: error });
      }
      
      return new NetworkError(
        `Erro de rede: ${error.message}`,
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
    
    return new NetworkError('Erro desconhecido', 'UNKNOWN_ERROR', { originalError: error });
  }

  /** Gera ID único para requisição */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Log */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (!this.config.enableLogging) return;
    
    console[level]('[ApiClient]', message, data);
  }

  /** Atualiza configuração */
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /** Obtém configuração atual */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

/** Instância global do cliente API */
export const apiClient = new ApiClient();

/** Interceptor para adicionar token de autenticação */
export const authInterceptor: RequestInterceptor = async (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
};

/** Interceptor para tratar erros de autenticação */
export const authErrorInterceptor: ResponseInterceptor = {
  onSuccess: async (response) => {
    if (response.status === 401) {
      // Remove token inválido
      localStorage.removeItem('auth_token');
      
      // Redireciona para login (se estiver no browser)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return response;
  }
};

/** Interceptor para logging */
export const loggingInterceptor: ResponseInterceptor = {
  onSuccess: async (response) => {
    console.log(`[API] ${response.config?.method} ${response.config?.url} - ${response.status}`);
    return response;
  }
};

/** Configuração padrão para desenvolvimento */
export const developmentConfig: Partial<ApiClientConfig> = {
  enableLogging: true,
  enableRetry: true,
  maxRetries: 2,
  timeout: 10000
};

/** Configuração padrão para produção */
export const productionConfig: Partial<ApiClientConfig> = {
  enableLogging: false,
  enableRetry: true,
  maxRetries: 3,
  timeout: 30000
};