/**
 * Tipos para Sistema de Monitoramento
 * 
 * Define interfaces para logging estruturado, métricas de performance,
 * alertas e monitoramento de saúde do sistema.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ACKNOWLEDGED = 'acknowledged',
  SUPPRESSED = 'suppressed'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

export const LogEntrySchema = z.object({
  timestamp: z.date(),
  level: z.nativeEnum(LogLevel),
  message: z.string(),
  service: z.string(),
  function: z.string().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  performance: z.object({
    duration: z.number(),
    memoryUsed: z.number().optional(),
    cpuUsed: z.number().optional()
  }).optional()
});

export const MetricSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(MetricType),
  value: z.number(),
  timestamp: z.date(),
  tags: z.record(z.string()).optional(),
  unit: z.string().optional(),
  description: z.string().optional()
});

export const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  metric: z.string(),
  condition: z.enum(['>', '<', '>=', '<=', '==', '!=']),
  threshold: z.number(),
  severity: z.nativeEnum(AlertSeverity),
  enabled: z.boolean().default(true),
  cooldownMinutes: z.number().default(5),
  notificationChannels: z.array(z.string()).default([]),
  tags: z.record(z.string()).optional()
});

export const AlertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  status: z.nativeEnum(AlertStatus),
  severity: z.nativeEnum(AlertSeverity),
  title: z.string(),
  description: z.string(),
  metric: z.string(),
  currentValue: z.number(),
  threshold: z.number(),
  triggeredAt: z.date(),
  resolvedAt: z.date().optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const HealthCheckSchema = z.object({
  service: z.string(),
  status: z.nativeEnum(HealthStatus),
  timestamp: z.date(),
  responseTime: z.number().optional(),
  details: z.record(z.unknown()).optional(),
  dependencies: z.array(z.object({
    service: z.string(),
    status: z.nativeEnum(HealthStatus),
    timestamp: z.date(),
    responseTime: z.number().optional(),
    details: z.record(z.unknown()).optional()
  })).optional()
});

export const PerformanceMetricsSchema = z.object({
  functionName: z.string(),
  executionTime: z.number(),
  memoryUsed: z.number(),
  cpuUsed: z.number().optional(),
  timestamp: z.date(),
  success: z.boolean(),
  error: z.string().optional(),
  organizationId: z.string().optional(),
  userId: z.string().optional()
});

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

export interface LogEntry extends z.infer<typeof LogEntrySchema> {}
export interface Metric extends z.infer<typeof MetricSchema> {}
export interface AlertRule extends z.infer<typeof AlertRuleSchema> {}
export interface Alert extends z.infer<typeof AlertSchema> {}
export interface HealthCheck extends z.infer<typeof HealthCheckSchema> {
  id?: string;
  name?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}
export interface PerformanceMetrics extends z.infer<typeof PerformanceMetricsSchema> {}

// ============================================================================
// INTERFACES ADICIONAIS PARA HEALTH CHECK
// ============================================================================

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

// ============================================================================
// TIPOS PARA ANÁLISE E RELATÓRIOS
// ============================================================================

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

// ============================================================================
// TIPOS PARA CONFIGURAÇÃO
// ============================================================================

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

// ============================================================================
// TIPOS PARA API
// ============================================================================

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

// ============================================================================
// TIPOS PARA NOTIFICAÇÕES
// ============================================================================

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

// ============================================================================
// TIPOS PARA RELATÓRIOS
// ============================================================================

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