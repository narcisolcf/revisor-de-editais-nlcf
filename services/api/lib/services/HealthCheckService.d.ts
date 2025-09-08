/**
 * Serviço de Verificação de Saúde
 *
 * Monitora a saúde de componentes críticos do sistema,
 * realiza verificações periódicas e fornece status detalhado.
 */
import { Firestore } from 'firebase-admin/firestore';
import { SystemHealth, HealthCheckConfig } from '../types/monitoring.types';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';
export declare class HealthCheckService {
    private db;
    private logger;
    private metricsService;
    private healthChecks;
    private lastResults;
    private checkInterval;
    constructor(db: Firestore, logger: LoggingService, metricsService: MetricsService);
    /**
     * Inicializa verificações de saúde padrão
     */
    private initializeHealthChecks;
    /**
     * Inicia o monitoramento periódico
     */
    startMonitoring(): void;
    /**
     * Para o monitoramento periódico
     */
    stopMonitoring(): void;
    /**
     * Executa todas as verificações de saúde
     */
    runAllHealthChecks(): Promise<SystemHealth>;
    /**
     * Executa uma verificação específica
     */
    private runHealthCheck;
    /**
     * Executa a lógica específica de cada verificação
     */
    private executeHealthCheck;
    /**
     * Verifica conectividade com Firestore
     */
    private checkFirestore;
    /**
     * Verifica uso de memória
     */
    private checkMemory;
    /**
     * Verifica uso de CPU
     */
    private checkCpu;
    /**
     * Verifica uso de disco
     */
    private checkDisk;
    /**
     * Verifica APIs externas
     */
    private checkExternalApis;
    /**
     * Calcula o status geral do sistema
     */
    private calculateSystemHealth;
    /**
     * Salva resultados de saúde no banco
     */
    private saveHealthResults;
    /**
     * Registra métricas de saúde
     */
    private recordHealthMetrics;
    /**
     * Simula obtenção de uso de CPU
     */
    private getCpuUsage;
    /**
     * Simula obtenção de uso de disco
     */
    private getDiskUsage;
    /**
     * Verifica endpoint de API
     */
    private checkApiEndpoint;
    /**
     * Obtém status atual do sistema
     */
    getCurrentHealth(): Promise<SystemHealth>;
    /**
     * Obtém histórico de saúde
     */
    getHealthHistory(hours?: number, limit?: number): Promise<SystemHealth[]>;
    /**
     * Adiciona verificação customizada
     */
    addHealthCheck(id: string, config: HealthCheckConfig): void;
    /**
     * Remove verificação
     */
    removeHealthCheck(id: string): void;
    /**
     * Obtém configurações de verificação
     */
    getHealthCheckConfigs(): HealthCheckConfig[];
}
