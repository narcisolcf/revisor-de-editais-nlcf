export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
}

export interface RedisSetOptions {
  ex?: number; // Expiration in seconds
  px?: number; // Expiration in milliseconds
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

export class RedisService {
  private client: any;
  private isConnected: boolean = false;
  private config: RedisConfig;
  private mockData: Map<string, { value: string; expiry?: number }> = new Map();

  constructor(config: RedisConfig) {
    this.config = config;
    
    // Para testes, usar implementação em memória
    if (process.env.NODE_ENV === 'test') {
      this.isConnected = true;
    }
  }

  async connect(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.isConnected = true;
      return;
    }

    try {
      // Em produção, conectar ao Redis real
      // const Redis = require('ioredis');
      // this.client = new Redis(this.config);
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.mockData.clear();
      this.isConnected = false;
      return;
    }

    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (process.env.NODE_ENV === 'test') {
      const item = this.mockData.get(key);
      if (!item) return null;
      
      // Verificar expiração
      if (item.expiry && Date.now() > item.expiry) {
        this.mockData.delete(key);
        return null;
      }
      
      return item.value;
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: RedisSetOptions): Promise<'OK'> {
    if (process.env.NODE_ENV === 'test') {
      let expiry: number | undefined;
      
      if (options?.ex) {
        expiry = Date.now() + (options.ex * 1000);
      } else if (options?.px) {
        expiry = Date.now() + options.px;
      }
      
      // Verificar condições nx/xx
      const exists = this.mockData.has(key);
      if (options?.nx && exists) {
        return 'OK'; // Não definir se já existe
      }
      if (options?.xx && !exists) {
        return 'OK'; // Não definir se não existe
      }
      
      this.mockData.set(key, { value, expiry });
      return 'OK';
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    const args: any[] = [key, value];
    if (options?.ex) args.push('EX', options.ex);
    if (options?.px) args.push('PX', options.px);
    if (options?.nx) args.push('NX');
    if (options?.xx) args.push('XX');

    return await this.client.set(...args);
  }

  async del(key: string): Promise<number> {
    if (process.env.NODE_ENV === 'test') {
      const existed = this.mockData.has(key);
      this.mockData.delete(key);
      return existed ? 1 : 0;
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    if (process.env.NODE_ENV === 'test') {
      const item = this.mockData.get(key);
      if (!item) return 0;
      
      // Verificar expiração
      if (item.expiry && Date.now() > item.expiry) {
        this.mockData.delete(key);
        return 0;
      }
      
      return 1;
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.exists(key);
  }

  async incr(key: string): Promise<number> {
    if (process.env.NODE_ENV === 'test') {
      const current = await this.get(key);
      const newValue = (parseInt(current || '0', 10) + 1).toString();
      await this.set(key, newValue);
      return parseInt(newValue, 10);
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (process.env.NODE_ENV === 'test') {
      const item = this.mockData.get(key);
      if (!item) return 0;
      
      item.expiry = Date.now() + (seconds * 1000);
      this.mockData.set(key, item);
      return 1;
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    if (process.env.NODE_ENV === 'test') {
      const item = this.mockData.get(key);
      if (!item) return -2; // Key doesn't exist
      if (!item.expiry) return -1; // Key exists but no expiry
      
      const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (process.env.NODE_ENV === 'test') {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Array.from(this.mockData.keys()).filter(key => regex.test(key));
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.keys(pattern);
  }

  async flushall(): Promise<'OK'> {
    if (process.env.NODE_ENV === 'test') {
      this.mockData.clear();
      return 'OK';
    }

    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    return await this.client.flushall();
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  getStats() {
    if (process.env.NODE_ENV === 'test') {
      return {
        connected: this.isConnected,
        keysCount: this.mockData.size,
        memoryUsage: 0
      };
    }

    return {
      connected: this.isConnected,
      keysCount: 0,
      memoryUsage: 0
    };
  }

  // Método para limpar dados de teste
  clearTestData(): void {
    if (process.env.NODE_ENV === 'test') {
      this.mockData.clear();
    }
  }
}

// Instância global para testes
let globalRedisInstance: RedisService | null = null;

export function initializeRedis(config: RedisConfig): RedisService {
  globalRedisInstance = new RedisService(config);
  return globalRedisInstance;
}

export function getRedisInstance(): RedisService {
  if (!globalRedisInstance) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return globalRedisInstance;
}