/**
 * Serviço base para todos os serviços da aplicação
 */

import { BaseEntity } from '../../types/core/base';
import { ApiResponse, RequestConfig } from '../../types/core/api';
import { ValidationResult } from '../../types/core/common';

/** Configuração base para serviços */
export interface ServiceConfig {
  /** URL base da API */
  baseUrl?: string;
  /** Timeout padrão em ms */
  timeout?: number;
  /** Headers padrão */
  defaultHeaders?: Record<string, string>;
  /** Se deve fazer retry automático */
  enableRetry?: boolean;
  /** Número máximo de tentativas */
  maxRetries?: number;
  /** Se deve usar cache */
  enableCache?: boolean;
  /** TTL do cache em ms */
  cacheTtl?: number;
  /** Se deve validar dados */
  enableValidation?: boolean;
  /** Se deve logar operações */
  enableLogging?: boolean;
}

/** Interface base para todos os serviços */
export abstract class BaseService<T extends BaseEntity = BaseEntity> {
  protected config: ServiceConfig;
  protected serviceName: string;

  constructor(serviceName: string, config: Partial<ServiceConfig> = {}) {
    this.serviceName = serviceName;
    this.config = {
      timeout: 30000,
      enableRetry: true,
      maxRetries: 3,
      enableCache: false,
      cacheTtl: 300000, // 5 minutos
      enableValidation: true,
      enableLogging: true,
      ...config
    };
  }

  /** Valida uma entidade */
  protected abstract validate(entity: Partial<T>): ValidationResult;

  /** Transforma dados antes de enviar para API */
  protected abstract transformForApi(entity: Partial<T>): unknown;

  /** Transforma dados recebidos da API */
  protected abstract transformFromApi(data: unknown): T;

  /** Gera chave de cache */
  protected generateCacheKey(operation: string, params?: Record<string, unknown>): string {
    const baseKey = `${this.serviceName}:${operation}`;
    if (!params) return baseKey;
    
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join('&');
    
    return `${baseKey}:${paramString}`;
  }

  /** Loga operação */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (!this.config.enableLogging) return;
    
    const logData = {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    console[level](`[${this.serviceName}]`, logData);
  }

  /** Trata erros de forma padronizada */
  protected handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    this.log('error', `Erro na operação ${operation}`, { error: errorMessage });
    
    throw new ServiceError(
      `Erro no serviço ${this.serviceName} durante ${operation}: ${errorMessage}`,
      operation,
      error
    );
  }

  /** Executa operação com retry */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    let lastError: unknown;
    const maxAttempts = this.config.enableRetry ? this.config.maxRetries! + 1 : 1;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log('info', `Executando ${operationName} (tentativa ${attempt}/${maxAttempts})`);
        const result = await operation();
        
        if (attempt > 1) {
          this.log('info', `${operationName} bem-sucedido após ${attempt} tentativas`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          this.log('error', `${operationName} falhou após ${maxAttempts} tentativas`, error);
          break;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Backoff exponencial
        this.log('warn', `${operationName} falhou na tentativa ${attempt}, tentando novamente em ${delay}ms`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /** Valida dados se a validação estiver habilitada */
  protected validateIfEnabled(entity: Partial<T>, operation: string): void {
    if (!this.config.enableValidation) return;
    
    const validation = this.validate(entity);
    if (!validation.isValid) {
      const errors = validation.errors?.map(e => e.message).join(', ') || 'Dados inválidos';
      throw new ValidationError(`Validação falhou para ${operation}: ${errors}`, validation.errors);
    }
  }

  /** Atualiza configuração do serviço */
  public updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'Configuração do serviço atualizada', newConfig);
  }

  /** Obtém configuração atual */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /** Obtém nome do serviço */
  public getServiceName(): string {
    return this.serviceName;
  }
}

/** Erro específico de serviço */
export class ServiceError extends Error {
  public readonly operation: string;
  public readonly originalError: unknown;
  public readonly timestamp: Date;

  constructor(message: string, operation: string, originalError?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.operation = operation;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

/** Erro de validação */
export class ValidationError extends Error {
  public readonly validationErrors: Array<{ field: string; message: string }>;

  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = errors || [];
  }
}

/** Interface para operações CRUD básicas */
export interface CrudService<T extends BaseEntity> {
  /** Cria uma nova entidade */
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  
  /** Busca entidade por ID */
  findById(id: string): Promise<T | null>;
  
  /** Busca múltiplas entidades */
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  
  /** Atualiza entidade */
  update(id: string, updates: Partial<T>): Promise<T>;
  
  /** Remove entidade */
  delete(id: string): Promise<void>;
  
  /** Conta entidades */
  count(filters?: Record<string, unknown>): Promise<number>;
}

/** Opções para busca de múltiplas entidades */
export interface FindManyOptions<T> {
  /** Filtros */
  where?: Partial<T>;
  /** Ordenação */
  orderBy?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
  /** Paginação */
  skip?: number;
  /** Limite */
  take?: number;
  /** Campos a incluir */
  select?: Array<keyof T>;
  /** Relacionamentos a incluir */
  include?: string[];
}

/** Resultado paginado */
export interface PaginatedResult<T> {
  /** Dados */
  data: T[];
  /** Total de registros */
  total: number;
  /** Página atual */
  page: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de páginas */
  totalPages: number;
  /** Se há próxima página */
  hasNext: boolean;
  /** Se há página anterior */
  hasPrevious: boolean;
}

/** Implementação base para serviços CRUD */
export abstract class BaseCrudService<T extends BaseEntity> extends BaseService<T> implements CrudService<T> {
  
  abstract create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(options?: FindManyOptions<T>): Promise<T[]>;
  abstract update(id: string, updates: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract count(filters?: Record<string, unknown>): Promise<number>;

  /** Busca com paginação */
  async findPaginated(options: {
    page: number;
    pageSize: number;
    where?: Partial<T>;
    orderBy?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
  }): Promise<PaginatedResult<T>> {
    const { page, pageSize, where, orderBy } = options;
    const skip = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      this.findMany({ where, orderBy, skip, take: pageSize }),
      this.count(where as Record<string, unknown>)
    ]);
    
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /** Busca ou cria entidade */
  async findOrCreate(
    where: Partial<T>,
    create: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ entity: T; created: boolean }> {
    const existing = await this.findMany({ where, take: 1 });
    
    if (existing.length > 0) {
      return { entity: existing[0], created: false };
    }
    
    const newEntity = await this.create(create);
    return { entity: newEntity, created: true };
  }

  /** Atualiza ou cria entidade */
  async upsert(
    where: Partial<T>,
    update: Partial<T>,
    create: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ entity: T; created: boolean }> {
    const existing = await this.findMany({ where, take: 1 });
    
    if (existing.length > 0) {
      const updated = await this.update(existing[0].id, update);
      return { entity: updated, created: false };
    }
    
    const newEntity = await this.create(create);
    return { entity: newEntity, created: true };
  }
}

/** Configuração de cache */
export interface CacheConfig {
  /** Se o cache está habilitado */
  enabled: boolean;
  /** TTL padrão em ms */
  defaultTtl: number;
  /** Tamanho máximo do cache */
  maxSize: number;
  /** Estratégia de limpeza */
  evictionStrategy: 'lru' | 'fifo' | 'ttl';
}

/** Interface para cache */
export interface CacheProvider {
  /** Obtém valor do cache */
  get<T>(key: string): Promise<T | null>;
  
  /** Define valor no cache */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /** Remove valor do cache */
  delete(key: string): Promise<void>;
  
  /** Limpa todo o cache */
  clear(): Promise<void>;
  
  /** Verifica se chave existe */
  has(key: string): Promise<boolean>;
  
  /** Obtém estatísticas do cache */
  getStats(): Promise<CacheStats>;
}

/** Estatísticas do cache */
export interface CacheStats {
  /** Número de hits */
  hits: number;
  /** Número de misses */
  misses: number;
  /** Taxa de hit */
  hitRate: number;
  /** Número de entradas */
  size: number;
  /** Memória usada */
  memoryUsage: number;
}

/** Classe base com suporte a cache */
export abstract class CachedService<T extends BaseEntity = BaseEntity> extends BaseService<T> {
  protected cache?: CacheProvider;

  constructor(serviceName: string, config: Partial<ServiceConfig> = {}, cacheProvider?: CacheProvider) {
    super(serviceName, config);
    this.cache = cacheProvider;
  }

  /** Executa operação com cache */
  protected async executeWithCache<R>(
    key: string,
    operation: () => Promise<R>,
    ttl?: number
  ): Promise<R> {
    if (!this.config.enableCache || !this.cache) {
      return operation();
    }

    // Tenta buscar no cache
    const cached = await this.cache.get<R>(key);
    if (cached !== null) {
      this.log('info', `Cache hit para chave: ${key}`);
      return cached;
    }

    // Executa operação e armazena no cache
    this.log('info', `Cache miss para chave: ${key}`);
    const result = await operation();
    await this.cache.set(key, result, ttl || this.config.cacheTtl);
    
    return result;
  }

  /** Invalida cache */
  protected async invalidateCache(pattern?: string): Promise<void> {
    if (!this.cache) return;
    
    if (pattern) {
      // Implementação específica dependeria do provider de cache
      this.log('info', `Invalidando cache com padrão: ${pattern}`);
    } else {
      await this.cache.clear();
      this.log('info', 'Cache completamente invalidado');
    }
  }
}