/**
 * Common Types
 * Tipos utilitários e comuns usados em toda a aplicação
 */

import { z } from 'zod';

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedEntity extends BaseEntity {
  version: number;
  lastModifiedBy?: string;
}

// Common Status Types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'info' | 'warning' | 'error' | 'critical';

// Generic Response Types
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface CommonErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> = SuccessResponse<T> | CommonErrorResponse;

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

// Sorting
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Filtering
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

// Search
export interface SearchConfig {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

// Date Range
export interface DateRange {
  start: Date;
  end: Date;
}

// File Types
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  url?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
}

// Theme
export type Theme = 'light' | 'dark' | 'system';

// Language
export type Language = 'pt-BR' | 'en-US' | 'es-ES';

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event Types
export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
}

// Configuration
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: Record<string, boolean>;
  limits: {
    maxFileSize: number;
    maxDocuments: number;
    maxUsers: number;
  };
}

// Metrics
export interface Metrics {
  timestamp: Date;
  values: Record<string, number>;
  labels?: Record<string, string>;
}

// Health Status
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'up' | 'down';
    responseTime?: number;
    error?: string;
  }>;
  timestamp: Date;
}

// Validation Schemas
export const IdSchema = z.string().min(1);
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const DateSchema = z.date();
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});