/**
 * Serviço de cache para otimização de performance
 */

import { CacheProvider, CacheStats } from './base';

/** Configuração do cache em memória */
export interface MemoryCacheConfig {
  /** Tamanho máximo do cache */
  maxSize: number;
  /** TTL padrão em ms */
  defaultTtl: number;
  /** Estratégia de limpeza */
  evictionStrategy: 'lru' | 'fifo' | 'ttl';
  /** Intervalo de limpeza em ms */
  cleanupInterval: number;
  /** Se deve logar operações */
  enableLogging: boolean;
}

/** Item do cache */
interface CacheItem<T> {
  /** Valor armazenado */
  value: T;
  /** Timestamp de criação */
  createdAt: number;
  /** Timestamp de expiração */
  expiresAt: number;
  /** Timestamp do último acesso */
  lastAccessed: number;
  /** Número de acessos */
  accessCount: number;
  /** Tamanho estimado em bytes */
  size: number;
}

/** Implementação de cache em memória */
export class MemoryCache implements CacheProvider {
  private cache = new Map<string, CacheItem<unknown>>();
  private config: MemoryCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<MemoryCacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTtl: 300000, // 5 minutos
      evictionStrategy: 'lru',
      cleanupInterval: 60000, // 1 minuto
      enableLogging: false,
      ...config
    };

    this.startCleanupTimer();
  }

  /** Obtém valor do cache */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      this.stats.misses++;
      this.log('debug', `Cache miss para chave: ${key}`);
      return null;
    }

    // Verifica se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.log('debug', `Cache miss (expirado) para chave: ${key}`);
      return null;
    }

    // Atualiza estatísticas de acesso
    item.lastAccessed = Date.now();
    item.accessCount++;
    this.stats.hits++;
    
    this.log('debug', `Cache hit para chave: ${key}`);
    return item.value;
  }

  /** Define valor no cache */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const effectiveTtl = ttl || this.config.defaultTtl;
    const size = this.estimateSize(value);

    const item: CacheItem<T> = {
      value,
      createdAt: now,
      expiresAt: now + effectiveTtl,
      lastAccessed: now,
      accessCount: 0,
      size
    };

    // Verifica se precisa fazer limpeza antes de adicionar
    if (this.cache.size >= this.config.maxSize) {
      this.evictItems(1);
    }

    this.cache.set(key, item as CacheItem<unknown>);
    this.stats.sets++;
    
    this.log('debug', `Valor armazenado no cache para chave: ${key}`);
  }

  /** Remove valor do cache */
  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.log('debug', `Valor removido do cache para chave: ${key}`);
    }
  }

  /** Limpa todo o cache */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.log('info', `Cache limpo: ${size} itens removidos`);
  }

  /** Verifica se chave existe */
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Verifica se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /** Obtém estatísticas do cache */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    let memoryUsage = 0;
    for (const item of this.cache.values()) {
      memoryUsage += item.size;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      memoryUsage
    };
  }

  /** Remove itens expirados */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.log('debug', `Limpeza automática: ${removedCount} itens expirados removidos`);
    }
  }

  /** Remove itens baseado na estratégia de limpeza */
  private evictItems(count: number): void {
    const keysToRemove: string[] = [];
    
    switch (this.config.evictionStrategy) {
      case 'lru':
        keysToRemove.push(...this.getLRUKeys(count));
        break;
      case 'fifo':
        keysToRemove.push(...this.getFIFOKeys(count));
        break;
      case 'ttl':
        keysToRemove.push(...this.getTTLKeys(count));
        break;
    }

    for (const key of keysToRemove) {
      this.cache.delete(key);
      this.stats.evictions++;
    }

    if (keysToRemove.length > 0) {
      this.log('debug', `Eviction: ${keysToRemove.length} itens removidos (${this.config.evictionStrategy})`);
    }
  }

  /** Obtém chaves para remoção LRU */
  private getLRUKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count);
    
    return entries.map(([key]) => key);
  }

  /** Obtém chaves para remoção FIFO */
  private getFIFOKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      .slice(0, count);
    
    return entries.map(([key]) => key);
  }

  /** Obtém chaves para remoção TTL */
  private getTTLKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.expiresAt - b.expiresAt)
      .slice(0, count);
    
    return entries.map(([key]) => key);
  }

  /** Estima tamanho de um valor */
  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 8;
    
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    
    if (typeof value === 'number') {
      return 8;
    }
    
    if (typeof value === 'boolean') {
      return 4;
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2;
      } catch {
        return 1024; // Estimativa padrão
      }
    }
    
    return 64; // Estimativa padrão
  }

  /** Inicia timer de limpeza */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /** Para timer de limpeza */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /** Log */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    if (!this.config.enableLogging) return;
    
    console[level === 'debug' ? 'log' : level](`[MemoryCache] ${message}`);
  }

  /** Destrói o cache */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
    this.log('info', 'Cache destruído');
  }

  /** Obtém informações detalhadas */
  getDetailedInfo(): {
    config: MemoryCacheConfig;
    stats: typeof this.stats;
    items: Array<{ key: string; size: number; age: number; accessCount: number }>;
  } {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      size: item.size,
      age: now - item.createdAt,
      accessCount: item.accessCount
    }));

    return {
      config: this.config,
      stats: { ...this.stats },
      items
    };
  }
}

/** Cache que persiste no localStorage */
export class LocalStorageCache implements CacheProvider {
  private prefix: string;
  private defaultTtl: number;

  constructor(prefix = 'cache_', defaultTtl = 300000) {
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return parsed.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const item = {
        value,
        expiresAt: Date.now() + (ttl || this.defaultTtl)
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch {
      // Ignora erros de quota
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async getStats(): Promise<CacheStats> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: keys.length,
      memoryUsage: 0
    };
  }
}

/** Cache composto que usa múltiplos providers */
export class MultiLevelCache implements CacheProvider {
  private providers: CacheProvider[];

  constructor(providers: CacheProvider[]) {
    this.providers = providers;
  }

  async get<T>(key: string): Promise<T | null> {
    for (let i = 0; i < this.providers.length; i++) {
      const value = await this.providers[i].get<T>(key);
      if (value !== null) {
        // Propaga para níveis superiores
        for (let j = 0; j < i; j++) {
          await this.providers[j].set(key, value);
        }
        return value;
      }
    }
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await Promise.all(
      this.providers.map(provider => provider.set(key, value, ttl))
    );
  }

  async delete(key: string): Promise<void> {
    await Promise.all(
      this.providers.map(provider => provider.delete(key))
    );
  }

  async clear(): Promise<void> {
    await Promise.all(
      this.providers.map(provider => provider.clear())
    );
  }

  async has(key: string): Promise<boolean> {
    for (const provider of this.providers) {
      if (await provider.has(key)) {
        return true;
      }
    }
    return false;
  }

  async getStats(): Promise<CacheStats> {
    const stats = await Promise.all(
      this.providers.map(provider => provider.getStats())
    );

    return stats.reduce((acc, stat) => ({
      hits: acc.hits + stat.hits,
      misses: acc.misses + stat.misses,
      hitRate: (acc.hits + stat.hits) / (acc.hits + stat.hits + acc.misses + stat.misses),
      size: acc.size + stat.size,
      memoryUsage: acc.memoryUsage + stat.memoryUsage
    }), {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0
    });
  }
}

/** Instância global de cache */
export const globalCache = new MemoryCache({
  maxSize: 1000,
  defaultTtl: 300000,
  evictionStrategy: 'lru',
  enableLogging: false
});

/** Cache para desenvolvimento */
export const devCache = new MemoryCache({
  maxSize: 100,
  defaultTtl: 60000,
  evictionStrategy: 'lru',
  enableLogging: true
});

/** Cache híbrido (memória + localStorage) */
export const hybridCache = new MultiLevelCache([
  new MemoryCache({ maxSize: 500, defaultTtl: 300000 }),
  new LocalStorageCache('app_cache_', 3600000)
]);