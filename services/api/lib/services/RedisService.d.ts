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
    ex?: number;
    px?: number;
    nx?: boolean;
    xx?: boolean;
}
export declare class RedisService {
    private client;
    private isConnected;
    private config;
    private mockData;
    constructor(config: RedisConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: RedisSetOptions): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushall(): Promise<'OK'>;
    isHealthy(): boolean;
    getStats(): {
        connected: boolean;
        keysCount: number;
        memoryUsage: number;
    };
    clearTestData(): void;
}
export declare function initializeRedis(config: RedisConfig): RedisService;
export declare function getRedisInstance(): RedisService;
