/**
 * API Types
 * Tipos relacionados às APIs e comunicação
 */

import { z } from 'zod';

// Common API Response
export interface ApiResponse<T = unknown> {
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
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, unknown>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ListRequest extends PaginationParams, FilterParams {}

// File Upload
export interface FileUploadRequest {
  file: File;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadUrl?: string;
  downloadUrl?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    cache: 'up' | 'down';
    external: 'up' | 'down';
  };
  metrics?: {
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Webhook
export interface WebhookPayload<T = unknown> {
  id: string;
  event: string;
  data: T;
  timestamp: string;
  organizationId: string;
  signature?: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}