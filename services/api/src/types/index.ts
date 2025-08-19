/**
 * Types Index - Export all type definitions
 * LicitaReview Cloud Functions
 */

// Document Types
export * from "./document.types";

// Analysis Types  
export * from "./analysis.types";

// Config Types (CORE DIFFERENTIATOR)
export * from "./config.types";

// Comissões Types
export * from "./comissoes.types";

// Common API Types
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
  stack?: string; // Only in development
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// Audit Log Types
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

// User Context
export interface UserContext {
  uid: string;
  email?: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}

// File Upload Types
export interface FileUploadResult {
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  organizationId: string;
  timestamp: Date;
  source: string;
}

// Queue/Task Types
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

// Notification Types
export interface NotificationPayload {
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  data?: any;
  channels: ("email" | "push" | "webhook")[];
}

// Health Check Types
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

// Analytics Types
export interface UsageMetrics {
  organizationId: string;
  period: string; // ISO date string
  documentsProcessed: number;
  analysesCompleted: number;
  storageUsed: number; // bytes
  apiCalls: number;
  errorRate: number;
  averageProcessingTime: number; // milliseconds
  activeUsers: number;
}

export interface PerformanceMetrics {
  functionName: string;
  executionTime: number; // milliseconds
  memoryUsed: number; // bytes
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Rate Limiting Types
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

// Common Utility Types
export type Timestamp = {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & { id: string };

export type WithTimestamp<T> = T & Timestamp;

export type WithMetadata<T> = T & {
  metadata?: Record<string, any>;
};

// Status Types
export type Status = 'active' | 'inactive' | 'pending' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'info' | 'warning' | 'error' | 'critical';

// Environment Types
export interface Environment {
  nodeEnv: "development" | "staging" | "production";
  projectId: string;
  region: string;
  version: string;
  logLevel: "debug" | "info" | "warn" | "error";
}