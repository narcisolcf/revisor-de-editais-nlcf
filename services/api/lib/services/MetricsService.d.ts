/**
 * Serviço de Métricas
 * LicitaReview - Sistema de Análise de Editais
 */
export interface MetricEntry {
    name: string;
    value: number;
    type: 'counter' | 'gauge' | 'histogram' | 'timer';
    timestamp: Date;
    tags?: Record<string, string>;
    metadata?: Record<string, any>;
}
export interface TimerResult {
    duration: number;
    stop: () => number;
}
/**
 * Serviço de métricas para monitoramento da aplicação
 */
export declare class MetricsService {
    private serviceName;
    private environment;
    private metrics;
    private timers;
    constructor(serviceName?: string, environment?: string);
    /**
     * Incrementar contador
     */
    incrementCounter(name: string, value?: number, tags?: Record<string, string>): void;
    /**
     * Definir gauge (valor atual)
     */
    setGauge(name: string, value: number, tags?: Record<string, string>): void;
    /**
     * Registrar histograma
     */
    recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
    /**
     * Iniciar timer
     */
    startTimer(name: string): TimerResult;
    /**
     * Medir tempo de execução de uma função
     */
    timeFunction<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    /**
     * Registrar métrica de HTTP
     */
    recordHttpRequest(method: string, path: string, statusCode: number, duration: number, tags?: Record<string, string>): void;
    /**
     * Registrar métrica de segurança
     */
    recordSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high', tags?: Record<string, string>): void;
    /**
     * Registrar métrica de rate limiting
     */
    recordRateLimit(action: 'allowed' | 'blocked', clientId: string, tags?: Record<string, string>): void;
    /**
     * Registrar métrica de autenticação
     */
    recordAuthEvent(eventType: 'login' | 'logout' | 'token_refresh' | 'auth_failure', userId?: string, tags?: Record<string, string>): void;
    /**
     * Obter métricas por nome
     */
    getMetrics(name?: string): MetricEntry[];
    /**
     * Obter resumo das métricas
     */
    getMetricsSummary(): Record<string, any>;
    /**
     * Limpar métricas antigas
     */
    cleanup(olderThanMs?: number): void;
    /**
     * Limpar todas as métricas (útil para testes)
     */
    clear(): void;
    /**
     * Registrar métrica de teste
     */
    recordTestMetric(testData: {
        testSuite: string;
        testName: string;
        status: string;
        duration: number;
        memoryUsage?: number;
    }): void;
    /**
     * Registrar métrica interna
     */
    private recordMetric;
}
export declare const metrics: MetricsService;
