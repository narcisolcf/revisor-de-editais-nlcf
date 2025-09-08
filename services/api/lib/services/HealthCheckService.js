"use strict";
/**
 * Serviço de Verificação de Saúde
 *
 * Monitora a saúde de componentes críticos do sistema,
 * realiza verificações periódicas e fornece status detalhado.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const monitoring_types_1 = require("../types/monitoring.types");
class HealthCheckService {
    constructor(db, logger, metricsService) {
        this.healthChecks = new Map();
        this.lastResults = new Map();
        this.checkInterval = null;
        this.db = db;
        this.logger = logger;
        this.metricsService = metricsService;
        this.initializeHealthChecks();
    }
    // ============================================================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // ============================================================================
    /**
     * Inicializa verificações de saúde padrão
     */
    initializeHealthChecks() {
        // Verificação do Firestore
        this.healthChecks.set('firestore', {
            name: 'Firestore Database',
            description: 'Conectividade com o banco de dados Firestore',
            intervalSeconds: 30,
            timeoutSeconds: 10,
            enabled: true,
            critical: true
        });
        // Verificação de memória
        this.healthChecks.set('memory', {
            name: 'Memory Usage',
            description: 'Uso de memória do sistema',
            intervalSeconds: 60,
            timeoutSeconds: 5,
            enabled: true,
            critical: false
        });
        // Verificação de CPU
        this.healthChecks.set('cpu', {
            name: 'CPU Usage',
            description: 'Uso de CPU do sistema',
            intervalSeconds: 60,
            timeoutSeconds: 5,
            enabled: true,
            critical: false
        });
        // Verificação de disco
        this.healthChecks.set('disk', {
            name: 'Disk Usage',
            description: 'Uso de espaço em disco',
            intervalSeconds: 300, // 5 minutos
            timeoutSeconds: 10,
            enabled: true,
            critical: false
        });
        // Verificação de APIs externas
        this.healthChecks.set('external_apis', {
            name: 'External APIs',
            description: 'Conectividade com APIs externas',
            intervalSeconds: 120, // 2 minutos
            timeoutSeconds: 15,
            enabled: true,
            critical: false
        });
    }
    /**
     * Inicia o monitoramento periódico
     */
    startMonitoring() {
        if (this.checkInterval) {
            this.stopMonitoring();
        }
        // Executar verificações a cada 30 segundos
        this.checkInterval = setInterval(() => {
            this.runAllHealthChecks().catch(error => {
                this.logger.error('Erro no monitoramento de saúde', error instanceof Error ? error : new Error(String(error)), {
                    function: 'startMonitoring'
                });
            });
        }, 30000);
        this.logger.info('Monitoramento de saúde iniciado', {
            function: 'startMonitoring'
        });
    }
    /**
     * Para o monitoramento periódico
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.logger.info('Monitoramento de saúde parado', {
            function: 'stopMonitoring'
        });
    }
    // ============================================================================
    // VERIFICAÇÕES DE SAÚDE
    // ============================================================================
    /**
     * Executa todas as verificações de saúde
     */
    async runAllHealthChecks() {
        const startTime = Date.now();
        const checks = [];
        const promises = [];
        // Executar todas as verificações em paralelo
        for (const [checkId, config] of this.healthChecks) {
            if (config.enabled) {
                promises.push(this.runHealthCheck(checkId, config));
            }
        }
        try {
            const results = await Promise.allSettled(promises);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    checks.push(result.value);
                }
                else {
                    // Criar resultado de falha para verificações que falharam
                    const checkId = Array.from(this.healthChecks.keys())[index];
                    const config = this.healthChecks.get(checkId);
                    checks.push({
                        id: checkId,
                        name: config.name,
                        service: checkId,
                        status: monitoring_types_1.HealthStatus.UNHEALTHY,
                        message: `Erro na verificação: ${result.reason}`,
                        timestamp: new Date(),
                        responseTime: 0,
                        metadata: {
                            error: result.reason instanceof Error ? result.reason.message : String(result.reason)
                        }
                    });
                }
            });
            // Calcular status geral do sistema
            const systemHealth = this.calculateSystemHealth(checks, startTime);
            // Salvar resultados
            await this.saveHealthResults(systemHealth);
            // Registrar métricas
            await this.recordHealthMetrics(systemHealth);
            return systemHealth;
        }
        catch (error) {
            this.logger.error('Erro ao executar verificações de saúde', error instanceof Error ? error : new Error(String(error)), {
                function: 'runAllHealthChecks'
            });
            throw error;
        }
    }
    /**
     * Executa uma verificação específica
     */
    async runHealthCheck(checkId, config) {
        const startTime = Date.now();
        try {
            // Verificar se deve executar baseado no intervalo
            const lastResult = this.lastResults.get(checkId);
            if (lastResult) {
                const timeSinceLastCheck = Date.now() - lastResult.timestamp.getTime();
                if (timeSinceLastCheck < config.intervalSeconds * 1000) {
                    return lastResult; // Retornar resultado anterior se ainda válido
                }
            }
            let result;
            // Executar verificação com timeout
            const checkPromise = this.executeHealthCheck(checkId, config);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), config.timeoutSeconds * 1000);
            });
            result = await Promise.race([checkPromise, timeoutPromise]);
            result.responseTime = Date.now() - startTime;
            // Armazenar resultado
            this.lastResults.set(checkId, result);
            return result;
        }
        catch (error) {
            const result = {
                id: checkId,
                name: config.name,
                service: checkId,
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                metadata: {
                    error: error instanceof Error ? error.message : String(error),
                    timeout: config.timeoutSeconds
                }
            };
            this.lastResults.set(checkId, result);
            return result;
        }
    }
    /**
     * Executa a lógica específica de cada verificação
     */
    async executeHealthCheck(checkId, config) {
        switch (checkId) {
            case 'firestore':
                return await this.checkFirestore(config);
            case 'memory':
                return await this.checkMemory(config);
            case 'cpu':
                return await this.checkCpu(config);
            case 'disk':
                return await this.checkDisk(config);
            case 'external_apis':
                return await this.checkExternalApis(config);
            default:
                throw new Error(`Verificação não implementada: ${checkId}`);
        }
    }
    // ============================================================================
    // VERIFICAÇÕES ESPECÍFICAS
    // ============================================================================
    /**
     * Verifica conectividade com Firestore
     */
    async checkFirestore(config) {
        try {
            // Tentar uma operação simples no Firestore
            const testDoc = this.db.collection('health_check').doc('test');
            await testDoc.set({ timestamp: new Date(), test: true });
            await testDoc.delete();
            return {
                id: 'firestore',
                name: config.name,
                service: 'firestore',
                status: monitoring_types_1.HealthStatus.HEALTHY,
                message: 'Conectividade com Firestore OK',
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    operation: 'write_and_delete_test_document'
                }
            };
        }
        catch (error) {
            return {
                id: 'firestore',
                name: config.name,
                service: 'firestore',
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: `Erro de conectividade: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Verifica uso de memória
     */
    async checkMemory(config) {
        try {
            const memUsage = process.memoryUsage();
            const totalMemory = memUsage.heapTotal;
            const usedMemory = memUsage.heapUsed;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            let status = monitoring_types_1.HealthStatus.HEALTHY;
            let message = `Uso de memória: ${memoryUsagePercent.toFixed(1)}%`;
            if (memoryUsagePercent > 90) {
                status = monitoring_types_1.HealthStatus.UNHEALTHY;
                message = `Uso crítico de memória: ${memoryUsagePercent.toFixed(1)}%`;
            }
            else if (memoryUsagePercent > 75) {
                status = monitoring_types_1.HealthStatus.DEGRADED;
                message = `Uso alto de memória: ${memoryUsagePercent.toFixed(1)}%`;
            }
            return {
                id: 'memory',
                name: config.name,
                service: 'memory',
                status,
                message,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    heapUsed: usedMemory,
                    heapTotal: totalMemory,
                    usagePercent: memoryUsagePercent,
                    external: memUsage.external,
                    rss: memUsage.rss
                }
            };
        }
        catch (error) {
            return {
                id: 'memory',
                name: config.name,
                service: 'memory',
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: `Erro ao verificar memória: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Verifica uso de CPU
     */
    async checkCpu(config) {
        try {
            // Simular verificação de CPU (em produção, usar bibliotecas como 'os-utils')
            const cpuUsage = await this.getCpuUsage();
            let status = monitoring_types_1.HealthStatus.HEALTHY;
            let message = `Uso de CPU: ${cpuUsage.toFixed(1)}%`;
            if (cpuUsage > 90) {
                status = monitoring_types_1.HealthStatus.UNHEALTHY;
                message = `Uso crítico de CPU: ${cpuUsage.toFixed(1)}%`;
            }
            else if (cpuUsage > 75) {
                status = monitoring_types_1.HealthStatus.DEGRADED;
                message = `Uso alto de CPU: ${cpuUsage.toFixed(1)}%`;
            }
            return {
                id: 'cpu',
                name: config.name,
                service: 'cpu',
                status,
                message,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    cpuUsage,
                    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
                }
            };
        }
        catch (error) {
            return {
                id: 'cpu',
                name: config.name,
                service: 'cpu',
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: `Erro ao verificar CPU: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Verifica uso de disco
     */
    async checkDisk(config) {
        try {
            // Simular verificação de disco (em produção, usar bibliotecas como 'node-disk-info')
            const diskUsage = await this.getDiskUsage();
            let status = monitoring_types_1.HealthStatus.HEALTHY;
            let message = `Uso de disco: ${diskUsage.toFixed(1)}%`;
            if (diskUsage > 95) {
                status = monitoring_types_1.HealthStatus.UNHEALTHY;
                message = `Uso crítico de disco: ${diskUsage.toFixed(1)}%`;
            }
            else if (diskUsage > 85) {
                status = monitoring_types_1.HealthStatus.DEGRADED;
                message = `Uso alto de disco: ${diskUsage.toFixed(1)}%`;
            }
            return {
                id: 'disk',
                name: config.name,
                service: 'disk',
                status,
                message,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    diskUsage,
                    platform: process.platform
                }
            };
        }
        catch (error) {
            return {
                id: 'disk',
                name: config.name,
                service: 'disk',
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: `Erro ao verificar disco: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Verifica APIs externas
     */
    async checkExternalApis(config) {
        try {
            // Lista de APIs para verificar (configurável)
            const apisToCheck = [
                { name: 'Google APIs', url: 'https://www.googleapis.com' },
                // Adicionar outras APIs conforme necessário
            ];
            const results = await Promise.allSettled(apisToCheck.map(api => this.checkApiEndpoint(api.url)));
            const failedApis = results.filter(result => result.status === 'rejected').length;
            const totalApis = apisToCheck.length;
            const successRate = ((totalApis - failedApis) / totalApis) * 100;
            let status = monitoring_types_1.HealthStatus.HEALTHY;
            let message = `APIs externas: ${successRate.toFixed(1)}% disponíveis`;
            if (successRate < 50) {
                status = monitoring_types_1.HealthStatus.UNHEALTHY;
                message = `APIs externas críticas: ${successRate.toFixed(1)}% disponíveis`;
            }
            else if (successRate < 80) {
                status = monitoring_types_1.HealthStatus.DEGRADED;
                message = `APIs externas degradadas: ${successRate.toFixed(1)}% disponíveis`;
            }
            return {
                id: 'external_apis',
                name: config.name,
                service: 'external_apis',
                status,
                message,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    totalApis,
                    failedApis,
                    successRate,
                    checkedApis: apisToCheck.map(api => api.name)
                }
            };
        }
        catch (error) {
            return {
                id: 'external_apis',
                name: config.name,
                service: 'external_apis',
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
                message: `Erro ao verificar APIs: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date(),
                responseTime: 0,
                metadata: {
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    /**
     * Calcula o status geral do sistema
     */
    calculateSystemHealth(checks, startTime) {
        const totalResponseTime = Date.now() - startTime;
        // Determinar status geral
        let overallStatus = monitoring_types_1.HealthStatus.HEALTHY;
        const criticalChecks = checks.filter(check => {
            if (!check.id)
                return false;
            const config = this.healthChecks.get(check.id);
            return config?.critical === true;
        });
        // Se alguma verificação crítica falhou, sistema está unhealthy
        if (criticalChecks.some(check => check.status === monitoring_types_1.HealthStatus.UNHEALTHY)) {
            overallStatus = monitoring_types_1.HealthStatus.UNHEALTHY;
        }
        else if (checks.some(check => check.status === monitoring_types_1.HealthStatus.UNHEALTHY)) {
            overallStatus = monitoring_types_1.HealthStatus.DEGRADED;
        }
        else if (checks.some(check => check.status === monitoring_types_1.HealthStatus.DEGRADED)) {
            overallStatus = monitoring_types_1.HealthStatus.DEGRADED;
        }
        // Calcular componentes
        const components = checks.map(check => ({
            name: check.name || check.service || 'Unknown Component',
            status: check.status,
            message: check.message,
            responseTime: check.responseTime
        }));
        return {
            status: overallStatus,
            timestamp: new Date(),
            responseTime: totalResponseTime,
            components,
            metadata: {
                totalChecks: checks.length,
                healthyChecks: checks.filter(c => c.status === monitoring_types_1.HealthStatus.HEALTHY).length,
                degradedChecks: checks.filter(c => c.status === monitoring_types_1.HealthStatus.DEGRADED).length,
                unhealthyChecks: checks.filter(c => c.status === monitoring_types_1.HealthStatus.UNHEALTHY).length,
                criticalChecks: criticalChecks.length
            }
        };
    }
    /**
     * Salva resultados de saúde no banco
     */
    async saveHealthResults(systemHealth) {
        try {
            await this.db.collection('health_checks').add({
                ...systemHealth,
                createdAt: new Date()
            });
        }
        catch (error) {
            this.logger.error('Erro ao salvar resultados de saúde', error instanceof Error ? error : new Error(String(error)), {
                function: 'saveHealthResults'
            });
        }
    }
    /**
     * Registra métricas de saúde
     */
    async recordHealthMetrics(systemHealth) {
        try {
            // Métrica de status geral
            await this.metricsService.setGauge('system_health_status', systemHealth.status === monitoring_types_1.HealthStatus.HEALTHY ? 1 : 0, { status: systemHealth.status });
            // Métricas por componente
            for (const component of systemHealth.components) {
                await this.metricsService.setGauge('component_health_status', component.status === monitoring_types_1.HealthStatus.HEALTHY ? 1 : 0, {
                    component: component.name,
                    status: component.status
                });
                if (component.responseTime !== undefined) {
                    await this.metricsService.recordHistogram('health_check_response_time', component.responseTime, { component: component.name });
                }
            }
            // Tempo total de verificação
            await this.metricsService.recordHistogram('health_check_total_time', systemHealth.responseTime);
        }
        catch (error) {
            this.logger.error('Erro ao registrar métricas de saúde', error instanceof Error ? error : new Error(String(error)), {
                function: 'recordHealthMetrics'
            });
        }
    }
    /**
     * Simula obtenção de uso de CPU
     */
    async getCpuUsage() {
        // Em produção, usar biblioteca como 'os-utils' ou 'systeminformation'
        return Math.random() * 100; // Simulação
    }
    /**
     * Simula obtenção de uso de disco
     */
    async getDiskUsage() {
        // Em produção, usar biblioteca como 'node-disk-info' ou 'systeminformation'
        return Math.random() * 100; // Simulação
    }
    /**
     * Verifica endpoint de API
     */
    async checkApiEndpoint(url) {
        try {
            // Em produção, fazer requisição HTTP real
            // const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
            // return response.ok;
            // Simulação
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            return Math.random() > 0.1; // 90% de sucesso
        }
        catch {
            return false;
        }
    }
    // ============================================================================
    // MÉTODOS PÚBLICOS
    // ============================================================================
    /**
     * Obtém status atual do sistema
     */
    async getCurrentHealth() {
        return await this.runAllHealthChecks();
    }
    /**
     * Obtém histórico de saúde
     */
    async getHealthHistory(hours = 24, limit = 100) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (hours * 3600000));
            const snapshot = await this.db.collection('health_checks')
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            }));
        }
        catch (error) {
            this.logger.error('Erro ao buscar histórico de saúde', error instanceof Error ? error : new Error(String(error)), {
                function: 'getHealthHistory'
            });
            throw error;
        }
    }
    /**
     * Adiciona verificação customizada
     */
    addHealthCheck(id, config) {
        this.healthChecks.set(id, config);
        this.logger.info(`Verificação de saúde adicionada: ${config.name}`, {
            function: 'addHealthCheck',
            metadata: { id, config }
        });
    }
    /**
     * Remove verificação
     */
    removeHealthCheck(id) {
        this.healthChecks.delete(id);
        this.lastResults.delete(id);
        this.logger.info(`Verificação de saúde removida: ${id}`, {
            function: 'removeHealthCheck',
            metadata: { id }
        });
    }
    /**
     * Obtém configurações de verificação
     */
    getHealthCheckConfigs() {
        return Array.from(this.healthChecks.values());
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=HealthCheckService.js.map