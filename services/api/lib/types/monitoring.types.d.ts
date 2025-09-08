/**
 * Tipos para Sistema de Monitoramento
 *
 * Define interfaces para logging estruturado, métricas de performance,
 * alertas e monitoramento de saúde do sistema.
 */
import { z } from 'zod';
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    TIMER = "timer"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AlertStatus {
    ACTIVE = "active",
    RESOLVED = "resolved",
    ACKNOWLEDGED = "acknowledged",
    SUPPRESSED = "suppressed"
}
export declare enum HealthStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy"
}
export declare const LogEntrySchema: z.ZodObject<{
    timestamp: z.ZodDate;
    level: z.ZodNativeEnum<typeof LogLevel>;
    message: z.ZodString;
    service: z.ZodString;
    function: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        message: z.ZodString;
        stack: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        message: string;
        code?: string | undefined;
        stack?: string | undefined;
    }, {
        name: string;
        message: string;
        code?: string | undefined;
        stack?: string | undefined;
    }>>;
    performance: z.ZodOptional<z.ZodObject<{
        duration: z.ZodNumber;
        memoryUsed: z.ZodOptional<z.ZodNumber>;
        cpuUsed: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        memoryUsed?: number | undefined;
        cpuUsed?: number | undefined;
    }, {
        duration: number;
        memoryUsed?: number | undefined;
        cpuUsed?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    service: string;
    message: string;
    timestamp: Date;
    level: LogLevel;
    function?: string | undefined;
    error?: {
        name: string;
        message: string;
        code?: string | undefined;
        stack?: string | undefined;
    } | undefined;
    performance?: {
        duration: number;
        memoryUsed?: number | undefined;
        cpuUsed?: number | undefined;
    } | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    requestId?: string | undefined;
    correlationId?: string | undefined;
}, {
    service: string;
    message: string;
    timestamp: Date;
    level: LogLevel;
    function?: string | undefined;
    error?: {
        name: string;
        message: string;
        code?: string | undefined;
        stack?: string | undefined;
    } | undefined;
    performance?: {
        duration: number;
        memoryUsed?: number | undefined;
        cpuUsed?: number | undefined;
    } | undefined;
    organizationId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    requestId?: string | undefined;
    correlationId?: string | undefined;
}>;
export declare const MetricSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof MetricType>;
    value: z.ZodNumber;
    timestamp: z.ZodDate;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    unit: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    value: number;
    type: MetricType;
    timestamp: Date;
    tags?: Record<string, string> | undefined;
    description?: string | undefined;
    unit?: string | undefined;
}, {
    name: string;
    value: number;
    type: MetricType;
    timestamp: Date;
    tags?: Record<string, string> | undefined;
    description?: string | undefined;
    unit?: string | undefined;
}>;
export declare const AlertRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    metric: z.ZodString;
    condition: z.ZodEnum<[">", "<", ">=", "<=", "==", "!="]>;
    threshold: z.ZodNumber;
    severity: z.ZodNativeEnum<typeof AlertSeverity>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    cooldownMinutes: z.ZodDefault<z.ZodNumber>;
    notificationChannels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    severity: AlertSeverity;
    name: string;
    id: string;
    enabled: boolean;
    condition: "<" | "<=" | "==" | "!=" | ">=" | ">";
    metric: string;
    threshold: number;
    cooldownMinutes: number;
    notificationChannels: string[];
    tags?: Record<string, string> | undefined;
    description?: string | undefined;
}, {
    severity: AlertSeverity;
    name: string;
    id: string;
    condition: "<" | "<=" | "==" | "!=" | ">=" | ">";
    metric: string;
    threshold: number;
    tags?: Record<string, string> | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    cooldownMinutes?: number | undefined;
    notificationChannels?: string[] | undefined;
}>;
export declare const AlertSchema: z.ZodObject<{
    id: z.ZodString;
    ruleId: z.ZodString;
    status: z.ZodNativeEnum<typeof AlertStatus>;
    severity: z.ZodNativeEnum<typeof AlertSeverity>;
    title: z.ZodString;
    description: z.ZodString;
    metric: z.ZodString;
    currentValue: z.ZodNumber;
    threshold: z.ZodNumber;
    triggeredAt: z.ZodDate;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    acknowledgedAt: z.ZodOptional<z.ZodDate>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    severity: AlertSeverity;
    status: AlertStatus;
    id: string;
    title: string;
    description: string;
    ruleId: string;
    metric: string;
    threshold: number;
    currentValue: number;
    triggeredAt: Date;
    metadata?: Record<string, unknown> | undefined;
    resolvedAt?: Date | undefined;
    acknowledgedAt?: Date | undefined;
    acknowledgedBy?: string | undefined;
}, {
    severity: AlertSeverity;
    status: AlertStatus;
    id: string;
    title: string;
    description: string;
    ruleId: string;
    metric: string;
    threshold: number;
    currentValue: number;
    triggeredAt: Date;
    metadata?: Record<string, unknown> | undefined;
    resolvedAt?: Date | undefined;
    acknowledgedAt?: Date | undefined;
    acknowledgedBy?: string | undefined;
}>;
export declare const HealthCheckSchema: z.ZodObject<{
    service: z.ZodString;
    status: z.ZodNativeEnum<typeof HealthStatus>;
    timestamp: z.ZodDate;
    responseTime: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        service: z.ZodString;
        status: z.ZodNativeEnum<typeof HealthStatus>;
        timestamp: z.ZodDate;
        responseTime: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        service: string;
        status: HealthStatus;
        timestamp: Date;
        responseTime?: number | undefined;
        details?: Record<string, unknown> | undefined;
    }, {
        service: string;
        status: HealthStatus;
        timestamp: Date;
        responseTime?: number | undefined;
        details?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    service: string;
    status: HealthStatus;
    timestamp: Date;
    responseTime?: number | undefined;
    details?: Record<string, unknown> | undefined;
    dependencies?: {
        service: string;
        status: HealthStatus;
        timestamp: Date;
        responseTime?: number | undefined;
        details?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    service: string;
    status: HealthStatus;
    timestamp: Date;
    responseTime?: number | undefined;
    details?: Record<string, unknown> | undefined;
    dependencies?: {
        service: string;
        status: HealthStatus;
        timestamp: Date;
        responseTime?: number | undefined;
        details?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
export declare const PerformanceMetricsSchema: z.ZodObject<{
    functionName: z.ZodString;
    executionTime: z.ZodNumber;
    memoryUsed: z.ZodNumber;
    cpuUsed: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodDate;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    timestamp: Date;
    memoryUsed: number;
    functionName: string;
    executionTime: number;
    error?: string | undefined;
    organizationId?: string | undefined;
    userId?: string | undefined;
    cpuUsed?: number | undefined;
}, {
    success: boolean;
    timestamp: Date;
    memoryUsed: number;
    functionName: string;
    executionTime: number;
    error?: string | undefined;
    organizationId?: string | undefined;
    userId?: string | undefined;
    cpuUsed?: number | undefined;
}>;
export interface LogEntry extends z.infer<typeof LogEntrySchema> {
}
export interface Metric extends z.infer<typeof MetricSchema> {
}
export interface AlertRule extends z.infer<typeof AlertRuleSchema> {
}
export interface Alert extends z.infer<typeof AlertSchema> {
}
export interface HealthCheck extends z.infer<typeof HealthCheckSchema> {
    id?: string;
    name?: string;
    message?: string;
    metadata?: Record<string, unknown>;
}
export interface PerformanceMetrics extends z.infer<typeof PerformanceMetricsSchema> {
}
export interface ComponentHealth {
    name: string;
    status: HealthStatus;
    message?: string;
    responseTime?: number;
    metadata?: Record<string, unknown>;
}
export interface SystemHealth {
    status: HealthStatus;
    timestamp: Date;
    responseTime: number;
    components: ComponentHealth[];
    metadata?: Record<string, unknown>;
}
export interface HealthCheckConfig {
    name: string;
    description?: string;
    intervalSeconds: number;
    timeoutSeconds: number;
    enabled: boolean;
    critical?: boolean;
    metadata?: Record<string, unknown>;
}
export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        load: number[];
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
}
export interface ApplicationMetrics {
    timestamp: Date;
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    errors: {
        total: number;
        rate: number;
        byType: Record<string, number>;
    };
    database: {
        connections: number;
        queries: number;
        averageQueryTime: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}
export interface MonitoringDashboard {
    period: string;
    systemHealth: HealthStatus;
    activeAlerts: number;
    criticalAlerts: number;
    systemMetrics: SystemMetrics;
    applicationMetrics: ApplicationMetrics;
    topErrors: Array<{
        error: string;
        count: number;
        lastOccurrence: Date;
    }>;
    performanceTrends: Array<{
        timestamp: Date;
        averageResponseTime: number;
        errorRate: number;
        throughput: number;
    }>;
}
export interface MonitoringConfig {
    logging: {
        level: LogLevel;
        structured: boolean;
        includeStackTrace: boolean;
        maxLogSize: number;
        retentionDays: number;
    };
    metrics: {
        enabled: boolean;
        collectionInterval: number;
        retentionDays: number;
        customMetrics: string[];
    };
    alerts: {
        enabled: boolean;
        defaultCooldown: number;
        notificationChannels: string[];
        escalationRules: Array<{
            severity: AlertSeverity;
            delayMinutes: number;
            channels: string[];
        }>;
    };
    healthChecks: {
        enabled: boolean;
        interval: number;
        timeout: number;
        endpoints: string[];
    };
}
export interface CreateLogEntryRequest {
    level: LogLevel;
    message: string;
    service: string;
    function?: string;
    metadata?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
}
export interface GetLogsQuery {
    level?: LogLevel;
    service?: string;
    function?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    search?: string;
}
export interface CreateMetricRequest {
    name: string;
    type: MetricType;
    value: number;
    tags?: Record<string, string>;
    unit?: string;
    description?: string;
}
export interface GetMetricsQuery {
    name?: string;
    type?: MetricType;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string>;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    interval?: string;
}
export interface CreateAlertRuleRequest {
    name: string;
    description?: string;
    metric: string;
    condition: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    severity: AlertSeverity;
    cooldownMinutes?: number;
    notificationChannels?: string[];
    tags?: Record<string, string>;
}
export interface GetAlertsQuery {
    status?: AlertStatus;
    severity?: AlertSeverity;
    ruleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export interface NotificationChannel {
    id: string;
    type: 'email' | 'slack' | 'webhook' | 'sms';
    name: string;
    config: Record<string, unknown>;
    enabled: boolean;
}
export interface AlertNotification {
    alert: Alert;
    channel: NotificationChannel;
    sentAt: Date;
    success: boolean;
    error?: string;
}
export interface MonitoringReport {
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalLogs: number;
        errorRate: number;
        averageResponseTime: number;
        uptime: number;
        alertsTriggered: number;
    };
    trends: {
        performance: Array<{
            timestamp: Date;
            responseTime: number;
            errorRate: number;
        }>;
        usage: Array<{
            timestamp: Date;
            requests: number;
            users: number;
        }>;
    };
    topErrors: Array<{
        error: string;
        count: number;
        impact: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
}
