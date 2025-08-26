import { ComponentType, ErrorInfo, ReactNode } from 'react';

export interface ErrorRecord {
  id: string;
  error: Error;
  errorInfo?: ErrorInfo;
  timestamp: Date;
  url: string;
  userAgent: string;
  userId?: string;
  context?: ErrorContext;
}

export interface ConsoleRecord {
  id: string;
  type: 'warn' | 'error' | 'log';
  message: string;
  args: unknown[];
  timestamp: Date;
  url: string;
  userAgent: string;
  stack?: string;
  category: ConsoleCategory;
  severity: ErrorSeverity;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export interface ErrorBoundaryProps {
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorId: string;
  resetError: () => void;
  onReport?: (errorId: string) => void;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory = 
  | 'network'
  | 'validation' 
  | 'authentication'
  | 'business_logic'
  | 'ui_rendering'
  | 'unknown';

export type ConsoleCategory = 
  | 'react_warning'
  | 'performance_warning'
  | 'console_warning'
  | 'developer_log'
  | 'unknown';