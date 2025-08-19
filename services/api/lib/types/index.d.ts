/**
 * Types Index - Export all type definitions
 * LicitaReview Cloud Functions
 */
export * from "./document.types";
export * from "./analysis.types";
export * from "./config.types";
export * from "./comissoes.types";
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    requestId?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface ErrorResponse extends ApiResponse {
    success: false;
    error: string;
    details?: any;
    stack?: string;
}
export interface AuditLog {
    id: string;
    userId: string;
    organizationId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
export interface UserContext {
    uid: string;
    email?: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
}
export interface FileUploadResult {
    fileName: string;
    originalName: string;
    size: number;
    type: string;
    url: string;
    path: string;
    uploadedAt: Date;
}
export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    organizationId: string;
    timestamp: Date;
    source: string;
}
export interface TaskPayload {
    id: string;
    type: string;
    data: any;
    priority: "low" | "normal" | "high";
    maxRetries: number;
    currentRetries: number;
    scheduledAt?: Date;
    createdAt: Date;
}
export interface NotificationPayload {
    userId: string;
    organizationId?: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    data?: any;
    channels: ("email" | "push" | "webhook")[];
}
export interface HealthCheckResult {
    service: string;
    status: "healthy" | "unhealthy" | "degraded";
    timestamp: Date;
    responseTime?: number;
    details?: Record<string, any>;
    dependencies?: HealthCheckResult[];
}
export interface SystemHealth {
    overall: "healthy" | "unhealthy" | "degraded";
    services: HealthCheckResult[];
    timestamp: Date;
    version: string;
    uptime: number;
}
export interface UsageMetrics {
    organizationId: string;
    period: string;
    documentsProcessed: number;
    analysesCompleted: number;
    storageUsed: number;
    apiCalls: number;
    errorRate: number;
    averageProcessingTime: number;
    activeUsers: number;
}
export interface PerformanceMetrics {
    functionName: string;
    executionTime: number;
    memoryUsed: number;
    timestamp: Date;
    success: boolean;
    error?: string;
}
export interface RateLimit {
    windowMs: number;
    max: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
export type Timestamp = {
    createdAt: Date;
    updatedAt: Date;
};
export type WithId<T> = T & {
    id: string;
};
export type WithTimestamp<T> = T & Timestamp;
export type WithMetadata<T> = T & {
    metadata?: Record<string, any>;
};
export interface Environment {
    nodeEnv: "development" | "staging" | "production";
    projectId: string;
    region: string;
    version: string;
    logLevel: "debug" | "info" | "warn" | "error";
}
//# sourceMappingURL=index.d.ts.map