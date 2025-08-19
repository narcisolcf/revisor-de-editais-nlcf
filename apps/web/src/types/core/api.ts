/**
 * Tipos para APIs e requisições HTTP
 */

import { BaseError, NetworkError } from './errors';
import { PaginatedResult, QueryOptions } from './pagination';

/** Métodos HTTP suportados */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/** Status codes HTTP mais comuns */
export type HttpStatusCode = 
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503; // Service Unavailable

/** Configuração base para requisições */
export interface RequestConfig {
  /** URL da requisição */
  url: string;
  /** Método HTTP */
  method: HttpMethod;
  /** Headers da requisição */
  headers?: Record<string, string>;
  /** Parâmetros de query */
  params?: Record<string, unknown>;
  /** Corpo da requisição */
  body?: unknown;
  /** Timeout em milissegundos */
  timeout?: number;
  /** Se deve incluir credenciais */
  withCredentials?: boolean;
  /** Tipo de resposta esperado */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  /** Callback para progresso de upload */
  onUploadProgress?: (progress: ProgressEvent) => void;
  /** Callback para progresso de download */
  onDownloadProgress?: (progress: ProgressEvent) => void;
}

/** Resposta da API */
export interface ApiResponse<T = unknown> {
  /** Dados da resposta */
  data: T;
  /** Status HTTP */
  status: HttpStatusCode;
  /** Mensagem de status */
  statusText: string;
  /** Headers da resposta */
  headers: Record<string, string>;
  /** Configuração da requisição */
  config: RequestConfig;
}

/** Resposta de erro da API */
export interface ApiErrorResponse {
  /** Código do erro */
  code: string;
  /** Mensagem de erro */
  message: string;
  /** Detalhes adicionais */
  details?: Record<string, unknown>;
  /** Timestamp do erro */
  timestamp: string;
  /** ID da requisição para rastreamento */
  requestId?: string;
}

/** Configuração do cliente da API */
export interface ApiClientConfig {
  /** URL base da API */
  baseURL: string;
  /** Headers padrão */
  defaultHeaders?: Record<string, string>;
  /** Timeout padrão */
  defaultTimeout?: number;
  /** Interceptors de requisição */
  requestInterceptors?: RequestInterceptor[];
  /** Interceptors de resposta */
  responseInterceptors?: ResponseInterceptor[];
  /** Configuração de retry */
  retryConfig?: RetryConfig;
  /** Se deve fazer log das requisições */
  enableLogging?: boolean;
}

/** Interceptor de requisição */
export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;

/** Interceptor de resposta */
export type ResponseInterceptor = {
  /** Interceptor para respostas de sucesso */
  onSuccess?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  /** Interceptor para respostas de erro */
  onError?: (_error: NetworkError) => NetworkError | Promise<NetworkError>;
};

/** Configuração de retry */
export interface RetryConfig {
  /** Número máximo de tentativas */
  maxRetries: number;
  /** Delay inicial em milissegundos */
  initialDelay: number;
  /** Multiplicador para backoff exponencial */
  backoffMultiplier: number;
  /** Delay máximo */
  maxDelay: number;
  /** Status codes que devem ser retentados */
  retryableStatusCodes: HttpStatusCode[];
  /** Função para determinar se deve retentar */
  shouldRetry?: (error: NetworkError, attempt: number) => boolean;
}

/** Opções para cache de requisições */
export interface CacheOptions {
  /** Chave do cache */
  key?: string;
  /** TTL em milissegundos */
  ttl?: number;
  /** Se deve usar cache stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Se deve invalidar cache em mutações */
  invalidateOnMutation?: boolean;
}

/** Configuração de paginação para APIs */
export interface ApiPaginationConfig {
  /** Parâmetro para página */
  pageParam: string;
  /** Parâmetro para limite */
  limitParam: string;
  /** Parâmetro para ordenação */
  sortParam: string;
  /** Parâmetro para filtros */
  filterParam: string;
  /** Formato dos filtros */
  filterFormat: 'query' | 'json' | 'custom';
}

/** Endpoint da API */
export interface ApiEndpoint {
  /** Nome do endpoint */
  name: string;
  /** Path do endpoint */
  path: string;
  /** Método HTTP */
  method: HttpMethod;
  /** Se requer autenticação */
  requiresAuth: boolean;
  /** Permissões necessárias */
  permissions?: string[];
  /** Configuração de cache */
  cache?: CacheOptions;
  /** Configuração de retry específica */
  retry?: Partial<RetryConfig>;
}

/** Operações CRUD padrão */
export interface CrudOperations<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  /** Listar itens com paginação */
  list: (options?: QueryOptions) => Promise<PaginatedResult<T>>;
  /** Obter item por ID */
  get: (id: string) => Promise<T>;
  /** Criar novo item */
  create: (data: CreateData) => Promise<T>;
  /** Atualizar item existente */
  update: (id: string, data: UpdateData) => Promise<T>;
  /** Deletar item */
  delete: (id: string) => Promise<void>;
}

/** Operações de busca */
export interface SearchOperations<T> {
  /** Busca textual */
  search: (query: string, options?: QueryOptions) => Promise<PaginatedResult<T>>;
  /** Busca avançada */
  advancedSearch: (criteria: SearchCriteria) => Promise<PaginatedResult<T>>;
  /** Sugestões de busca */
  suggestions: (query: string, limit?: number) => Promise<string[]>;
}

/** Critérios de busca avançada */
export interface SearchCriteria {
  /** Termo de busca */
  query?: string;
  /** Filtros específicos */
  filters: Record<string, unknown>;
  /** Range de datas */
  dateRange?: {
    field: string;
    start: Date;
    end: Date;
  };
  /** Localização */
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

/** Estado de uma requisição */
export interface RequestState<T = unknown> {
  /** Dados da resposta */
  data?: T;
  /** Se está carregando */
  loading: boolean;
  /** Erro se houver */
  error?: BaseError;
  /** Timestamp da última atualização */
  lastUpdated?: Date;
  /** Se os dados estão stale */
  isStale: boolean;
}

/** Configuração de webhook */
export interface WebhookConfig {
  /** URL do webhook */
  url: string;
  /** Eventos que devem disparar o webhook */
  events: string[];
  /** Headers customizados */
  headers?: Record<string, string>;
  /** Secret para validação */
  secret?: string;
  /** Se está ativo */
  active: boolean;
}

/** Payload de webhook */
export interface WebhookPayload {
  /** Evento que disparou o webhook */
  event: string;
  /** Dados do evento */
  data: unknown;
  /** Timestamp do evento */
  timestamp: Date;
  /** ID único do evento */
  eventId: string;
  /** Versão da API */
  apiVersion: string;
}