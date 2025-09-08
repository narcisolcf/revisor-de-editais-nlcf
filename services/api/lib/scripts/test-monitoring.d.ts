#!/usr/bin/env node
/**
 * Sistema de monitoramento e logging para testes
 * Coleta métricas, logs e relatórios de execução de testes
 */
interface TestMetrics {
    testSuite: string;
    testName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    startTime: Date;
    endTime: Date;
    memoryUsage?: NodeJS.MemoryUsage;
    errorMessage?: string;
    assertions?: number;
    coverage?: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
}
interface TestSuiteReport {
    suiteName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    averageDuration: number;
    memoryPeak: number;
    coverage: {
        overall: number;
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    tests: TestMetrics[];
    timestamp: Date;
}
interface SystemMetrics {
    cpuUsage: NodeJS.CpuUsage;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage: number[];
    timestamp: Date;
}
declare class TestMonitor {
    private metrics;
    private systemMetrics;
    private startTime;
    private metricsService?;
    private auditService?;
    private firebaseService?;
    private logFile;
    private metricsFile;
    constructor();
    initialize(): Promise<void>;
    recordTestStart(suiteName: string, testName: string): Promise<string>;
    recordTestEnd(testId: string, status: 'passed' | 'failed' | 'skipped', errorMessage?: string, assertions?: number): Promise<void>;
    recordSystemMetrics(): Promise<void>;
    generateReport(suiteName?: string): Promise<TestSuiteReport[]>;
    saveReport(reports: TestSuiteReport[]): Promise<void>;
    printSummary(): Promise<void>;
    private log;
    private startSystemMonitoring;
    private setupProcessHandlers;
}
export declare function getTestMonitor(): TestMonitor;
export declare function startTestMonitoring(): Promise<TestMonitor>;
export declare function recordTest(suiteName: string, testName: string, testFn: () => Promise<void>): Promise<void>;
export { TestMonitor, TestMetrics, TestSuiteReport, SystemMetrics };
