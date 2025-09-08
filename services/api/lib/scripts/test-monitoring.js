#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestMonitor = void 0;
exports.getTestMonitor = getTestMonitor;
exports.startTestMonitoring = startTestMonitoring;
exports.recordTest = recordTest;
const fs_1 = require("fs");
const path_1 = require("path");
const MetricsService_1 = require("../services/MetricsService");
const AuditService_1 = require("../services/AuditService");
const FirebaseService_1 = require("../services/FirebaseService");
const LoggingService_1 = require("../services/LoggingService");
class TestMonitor {
    constructor() {
        this.metrics = [];
        this.systemMetrics = [];
        this.startTime = new Date();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = (0, path_1.join)(process.cwd(), 'logs', `test-execution-${timestamp}.log`);
        this.metricsFile = (0, path_1.join)(process.cwd(), 'logs', `test-metrics-${timestamp}.json`);
    }
    async initialize() {
        console.log('🔍 Inicializando monitoramento de testes...');
        try {
            // Criar diretório de logs se não existir
            await fs_1.promises.mkdir((0, path_1.join)(process.cwd(), 'logs'), { recursive: true });
            // Inicializar serviços opcionalmente
            try {
                this.firebaseService = new FirebaseService_1.FirebaseService();
                await this.firebaseService.initialize();
                this.metricsService = new MetricsService_1.MetricsService();
                this.auditService = new AuditService_1.AuditService(new LoggingService_1.LoggingService());
                console.log('✅ Serviços de monitoramento inicializados');
            }
            catch (error) {
                console.warn('⚠️ Serviços de monitoramento não disponíveis:', error);
            }
            // Configurar coleta de métricas do sistema
            this.startSystemMonitoring();
            // Configurar handlers de processo
            this.setupProcessHandlers();
            await this.log('INFO', 'Monitoramento de testes inicializado');
        }
        catch (error) {
            console.error('❌ Erro ao inicializar monitoramento:', error);
            throw error;
        }
    }
    async recordTestStart(suiteName, testName) {
        const testId = `${suiteName}-${testName}-${Date.now()}`;
        const metric = {
            testSuite: suiteName,
            testName: testName,
            status: 'passed', // Será atualizado
            duration: 0,
            startTime: new Date(),
            endTime: new Date(),
            memoryUsage: process.memoryUsage()
        };
        this.metrics.push(metric);
        await this.log('INFO', `Iniciando teste: ${suiteName} > ${testName}`);
        return testId;
    }
    async recordTestEnd(testId, status, errorMessage, assertions) {
        const metric = this.metrics.find(m => `${m.testSuite}-${m.testName}-${m.startTime.getTime()}` === testId);
        if (!metric) {
            await this.log('WARN', `Métrica não encontrada para teste: ${testId}`);
            return;
        }
        metric.endTime = new Date();
        metric.duration = metric.endTime.getTime() - metric.startTime.getTime();
        metric.status = status;
        metric.errorMessage = errorMessage;
        metric.assertions = assertions;
        metric.memoryUsage = process.memoryUsage();
        const logLevel = status === 'failed' ? 'ERROR' : 'INFO';
        await this.log(logLevel, `Teste finalizado: ${metric.testSuite} > ${metric.testName} - ${status} (${metric.duration}ms)`);
        // Enviar métricas para serviços se disponíveis
        if (this.metricsService) {
            try {
                await this.metricsService.recordTestMetric({
                    testSuite: metric.testSuite,
                    testName: metric.testName,
                    status: metric.status,
                    duration: metric.duration,
                    memoryUsage: metric.memoryUsage?.heapUsed || 0
                });
            }
            catch (error) {
                await this.log('WARN', `Erro ao enviar métrica: ${error}`);
            }
        }
    }
    async recordSystemMetrics() {
        const metrics = {
            cpuUsage: process.cpuUsage(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            loadAverage: require('os').loadavg(),
            timestamp: new Date()
        };
        this.systemMetrics.push(metrics);
        // Manter apenas as últimas 100 métricas do sistema
        if (this.systemMetrics.length > 100) {
            this.systemMetrics = this.systemMetrics.slice(-100);
        }
    }
    async generateReport(suiteName) {
        const suites = suiteName
            ? [suiteName]
            : Array.from(new Set(this.metrics.map(m => m.testSuite)));
        const reports = [];
        for (const suite of suites) {
            const suiteMetrics = this.metrics.filter(m => m.testSuite === suite);
            if (suiteMetrics.length === 0)
                continue;
            const passedTests = suiteMetrics.filter(m => m.status === 'passed').length;
            const failedTests = suiteMetrics.filter(m => m.status === 'failed').length;
            const skippedTests = suiteMetrics.filter(m => m.status === 'skipped').length;
            const totalDuration = suiteMetrics.reduce((sum, m) => sum + m.duration, 0);
            const averageDuration = totalDuration / suiteMetrics.length;
            const memoryPeak = Math.max(...suiteMetrics
                .filter(m => m.memoryUsage)
                .map(m => m.memoryUsage.heapUsed));
            const report = {
                suiteName: suite,
                totalTests: suiteMetrics.length,
                passedTests,
                failedTests,
                skippedTests,
                totalDuration,
                averageDuration,
                memoryPeak,
                coverage: {
                    overall: 0, // Seria calculado por ferramenta de coverage
                    lines: 0,
                    functions: 0,
                    branches: 0,
                    statements: 0
                },
                tests: suiteMetrics,
                timestamp: new Date()
            };
            reports.push(report);
        }
        return reports;
    }
    async saveReport(reports) {
        try {
            const reportData = {
                reports,
                systemMetrics: this.systemMetrics,
                summary: {
                    totalSuites: reports.length,
                    totalTests: reports.reduce((sum, r) => sum + r.totalTests, 0),
                    totalPassed: reports.reduce((sum, r) => sum + r.passedTests, 0),
                    totalFailed: reports.reduce((sum, r) => sum + r.failedTests, 0),
                    totalSkipped: reports.reduce((sum, r) => sum + r.skippedTests, 0),
                    totalDuration: reports.reduce((sum, r) => sum + r.totalDuration, 0),
                    executionTime: new Date().getTime() - this.startTime.getTime(),
                    timestamp: new Date()
                }
            };
            await fs_1.promises.writeFile(this.metricsFile, JSON.stringify(reportData, null, 2));
            await this.log('INFO', `Relatório salvo em: ${this.metricsFile}`);
        }
        catch (error) {
            await this.log('ERROR', `Erro ao salvar relatório: ${error}`);
        }
    }
    async printSummary() {
        const reports = await this.generateReport();
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DOS TESTES');
        console.log('='.repeat(60));
        const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
        const totalPassed = reports.reduce((sum, r) => sum + r.passedTests, 0);
        const totalFailed = reports.reduce((sum, r) => sum + r.failedTests, 0);
        const totalSkipped = reports.reduce((sum, r) => sum + r.skippedTests, 0);
        const totalDuration = reports.reduce((sum, r) => sum + r.totalDuration, 0);
        console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
        console.log(`   Total de Suites: ${reports.length}`);
        console.log(`   Total de Testes: ${totalTests}`);
        console.log(`   ✅ Passou: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
        console.log(`   ❌ Falhou: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
        console.log(`   ⏭️ Pulou: ${totalSkipped} (${((totalSkipped / totalTests) * 100).toFixed(1)}%)`);
        console.log(`   ⏱️ Duração Total: ${(totalDuration / 1000).toFixed(2)}s`);
        console.log(`   ⚡ Duração Média: ${(totalDuration / totalTests).toFixed(0)}ms por teste`);
        console.log(`\n📊 POR SUITE:`);
        reports.forEach(report => {
            const successRate = (report.passedTests / report.totalTests * 100).toFixed(1);
            console.log(`   ${report.suiteName}:`);
            console.log(`     Testes: ${report.totalTests} | Passou: ${report.passedTests} | Falhou: ${report.failedTests}`);
            console.log(`     Taxa de Sucesso: ${successRate}% | Duração: ${(report.totalDuration / 1000).toFixed(2)}s`);
            console.log(`     Memória Pico: ${(report.memoryPeak / 1024 / 1024).toFixed(2)}MB`);
        });
        if (this.systemMetrics.length > 0) {
            const latestMetrics = this.systemMetrics[this.systemMetrics.length - 1];
            console.log(`\n🖥️ MÉTRICAS DO SISTEMA:`);
            console.log(`   Memória Heap: ${(latestMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Memória Total: ${(latestMetrics.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Uptime: ${(latestMetrics.uptime / 60).toFixed(1)} minutos`);
            console.log(`   Load Average: ${latestMetrics.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
        }
        console.log('\n' + '='.repeat(60));
        if (totalFailed === 0) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
        }
        else {
            console.log('🚨 ALGUNS TESTES FALHARAM');
            console.log('\n❌ TESTES QUE FALHARAM:');
            reports.forEach(report => {
                const failedTests = report.tests.filter(t => t.status === 'failed');
                if (failedTests.length > 0) {
                    console.log(`   ${report.suiteName}:`);
                    failedTests.forEach(test => {
                        console.log(`     - ${test.testName}: ${test.errorMessage || 'Erro desconhecido'}`);
                    });
                }
            });
        }
        console.log('='.repeat(60));
    }
    async log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level}: ${message}\n`;
        try {
            await fs_1.promises.appendFile(this.logFile, logEntry);
        }
        catch (error) {
            console.error('Erro ao escrever log:', error);
        }
        // Também registrar no audit service se disponível
        if (this.auditService) {
            try {
                await this.auditService.logEvent({
                    action: 'test_execution',
                    resource: 'test_monitor',
                    success: level !== 'ERROR',
                    details: {
                        level: level.toLowerCase(),
                        message,
                        timestamp: new Date()
                    },
                    metadata: {
                        source: 'test-monitor',
                        logFile: this.logFile
                    }
                });
            }
            catch (error) {
                // Ignorar erros do audit service para não afetar os testes
            }
        }
    }
    startSystemMonitoring() {
        // Coletar métricas do sistema a cada 5 segundos
        setInterval(() => {
            this.recordSystemMetrics().catch(error => {
                console.warn('Erro ao coletar métricas do sistema:', error);
            });
        }, 5000);
    }
    setupProcessHandlers() {
        // Salvar relatório ao finalizar processo
        const cleanup = async () => {
            try {
                const reports = await this.generateReport();
                await this.saveReport(reports);
                await this.printSummary();
            }
            catch (error) {
                console.error('Erro no cleanup:', error);
            }
        };
        process.on('exit', () => {
            // Cleanup síncrono apenas
        });
        process.on('SIGINT', async () => {
            await cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await cleanup();
            process.exit(0);
        });
        process.on('uncaughtException', async (error) => {
            await this.log('ERROR', `Exceção não capturada: ${error.message}`);
            await cleanup();
            process.exit(1);
        });
        process.on('unhandledRejection', async (reason) => {
            await this.log('ERROR', `Promise rejeitada: ${reason}`);
        });
    }
}
exports.TestMonitor = TestMonitor;
// Singleton para uso global
let globalMonitor = null;
function getTestMonitor() {
    if (!globalMonitor) {
        globalMonitor = new TestMonitor();
    }
    return globalMonitor;
}
// Funções de conveniência para uso em testes
async function startTestMonitoring() {
    const monitor = getTestMonitor();
    await monitor.initialize();
    return monitor;
}
async function recordTest(suiteName, testName, testFn) {
    const monitor = getTestMonitor();
    const testId = await monitor.recordTestStart(suiteName, testName);
    try {
        await testFn();
        await monitor.recordTestEnd(testId, 'passed');
    }
    catch (error) {
        await monitor.recordTestEnd(testId, 'failed', error.message || String(error));
        throw error;
    }
}
// Executar monitoramento se chamado diretamente
if (require.main === module) {
    console.log('🔍 Iniciando monitoramento de testes...');
    startTestMonitoring()
        .then(() => {
        console.log('✅ Monitoramento iniciado com sucesso');
        console.log('Use Ctrl+C para finalizar e gerar relatório');
    })
        .catch(error => {
        console.error('❌ Erro ao iniciar monitoramento:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test-monitoring.js.map