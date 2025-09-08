"use strict";
/**
 * Tipos para Sistema de Monitoramento
 *
 * Define interfaces para logging estruturado, métricas de performance,
 * alertas e monitoramento de saúde do sistema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetricsSchema = exports.HealthCheckSchema = exports.AlertSchema = exports.AlertRuleSchema = exports.MetricSchema = exports.LogEntrySchema = exports.HealthStatus = exports.AlertStatus = exports.AlertSeverity = exports.MetricType = exports.LogLevel = void 0;
const zod_1 = require("zod");
// ============================================================================
// ENUMS
// ============================================================================
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "counter";
    MetricType["GAUGE"] = "gauge";
    MetricType["HISTOGRAM"] = "histogram";
    MetricType["TIMER"] = "timer";
})(MetricType || (exports.MetricType = MetricType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["SUPPRESSED"] = "suppressed";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
// ============================================================================
// SCHEMAS ZOD
// ============================================================================
exports.LogEntrySchema = zod_1.z.object({
    timestamp: zod_1.z.date(),
    level: zod_1.z.nativeEnum(LogLevel),
    message: zod_1.z.string(),
    service: zod_1.z.string(),
    function: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().optional(),
    requestId: zod_1.z.string().optional(),
    correlationId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    error: zod_1.z.object({
        name: zod_1.z.string(),
        message: zod_1.z.string(),
        stack: zod_1.z.string().optional(),
        code: zod_1.z.string().optional()
    }).optional(),
    performance: zod_1.z.object({
        duration: zod_1.z.number(),
        memoryUsed: zod_1.z.number().optional(),
        cpuUsed: zod_1.z.number().optional()
    }).optional()
});
exports.MetricSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.nativeEnum(MetricType),
    value: zod_1.z.number(),
    timestamp: zod_1.z.date(),
    tags: zod_1.z.record(zod_1.z.string()).optional(),
    unit: zod_1.z.string().optional(),
    description: zod_1.z.string().optional()
});
exports.AlertRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    metric: zod_1.z.string(),
    condition: zod_1.z.enum(['>', '<', '>=', '<=', '==', '!=']),
    threshold: zod_1.z.number(),
    severity: zod_1.z.nativeEnum(AlertSeverity),
    enabled: zod_1.z.boolean().default(true),
    cooldownMinutes: zod_1.z.number().default(5),
    notificationChannels: zod_1.z.array(zod_1.z.string()).default([]),
    tags: zod_1.z.record(zod_1.z.string()).optional()
});
exports.AlertSchema = zod_1.z.object({
    id: zod_1.z.string(),
    ruleId: zod_1.z.string(),
    status: zod_1.z.nativeEnum(AlertStatus),
    severity: zod_1.z.nativeEnum(AlertSeverity),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    metric: zod_1.z.string(),
    currentValue: zod_1.z.number(),
    threshold: zod_1.z.number(),
    triggeredAt: zod_1.z.date(),
    resolvedAt: zod_1.z.date().optional(),
    acknowledgedAt: zod_1.z.date().optional(),
    acknowledgedBy: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
exports.HealthCheckSchema = zod_1.z.object({
    service: zod_1.z.string(),
    status: zod_1.z.nativeEnum(HealthStatus),
    timestamp: zod_1.z.date(),
    responseTime: zod_1.z.number().optional(),
    details: zod_1.z.record(zod_1.z.unknown()).optional(),
    dependencies: zod_1.z.array(zod_1.z.object({
        service: zod_1.z.string(),
        status: zod_1.z.nativeEnum(HealthStatus),
        timestamp: zod_1.z.date(),
        responseTime: zod_1.z.number().optional(),
        details: zod_1.z.record(zod_1.z.unknown()).optional()
    })).optional()
});
exports.PerformanceMetricsSchema = zod_1.z.object({
    functionName: zod_1.z.string(),
    executionTime: zod_1.z.number(),
    memoryUsed: zod_1.z.number(),
    cpuUsed: zod_1.z.number().optional(),
    timestamp: zod_1.z.date(),
    success: zod_1.z.boolean(),
    error: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional()
});
//# sourceMappingURL=monitoring.types.js.map