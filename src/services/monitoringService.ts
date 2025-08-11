import { ErrorRecord, ErrorContext, ConsoleRecord } from '@/types/error';
import { createErrorRecord, sanitizeErrorForLogging, createConsoleRecord, shouldReportConsoleMessage } from '@/utils/errorUtils';
import { ErrorReportData } from '@/hooks/useErrorReport';

class MonitoringService {
  private errorQueue: ErrorRecord[] = [];
  private consoleQueue: ConsoleRecord[] = [];
  private readonly maxQueueSize = 50;
  private readonly isDevelopment = import.meta.env.DEV;
  private consoleInterceptorInitialized = false;
  private originalConsole = {
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    log: console.log.bind(console),
  };
  private isCapturingConsole = false;

  async reportError(error: Error, context?: ErrorContext): Promise<void> {
    const errorRecord = createErrorRecord(error, undefined, context);
    
    // Log to console in development
    if (this.isDevelopment) {
      console.group('🚨 Error Report');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Record:', errorRecord);
      console.groupEnd();
    }

    // Add to queue
    this.addToQueue(errorRecord);

    // Future: Send to external monitoring service
    await this.sendToMonitoringService(errorRecord);
  }

  async submitUserReport(reportData: ErrorReportData): Promise<void> {
    const { errorId, error, userFeedback } = reportData;
    
    // Find the original error record if it exists
    const originalRecord = this.errorQueue.find(record => record.id === errorId);
    
    const reportRecord = {
      id: `report_${errorId}`,
      type: 'user_report',
      errorId,
      originalError: error ? sanitizeErrorForLogging(error) : null,
      userFeedback,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (this.isDevelopment) {
      console.group('📝 User Report Submitted');
      console.log('Report:', reportRecord);
      console.log('Original Record:', originalRecord);
      console.groupEnd();
    }

    // Future: Send user report to backend
    await this.sendUserReportToBackend(reportRecord);
  }

  private addToQueue(errorRecord: ErrorRecord): void {
    this.errorQueue.unshift(errorRecord);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }
  }

  private async sendToMonitoringService(errorRecord: ErrorRecord): Promise<void> {
    // Future implementation for external services like Sentry
    // For now, we just store locally and log
    
    try {
      // Simulate API call
      if (!this.isDevelopment) {
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(sanitizeErrorForLogging(errorRecord.error))
        // });
      }
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  private async sendUserReportToBackend(reportRecord: Record<string, unknown>): Promise<void> {
    // Future implementation for user report submission
    try {
      // Simulate API call
      if (!this.isDevelopment) {
        // await fetch('/api/error-reports', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(reportRecord)
        // });
      }
    } catch (error) {
      console.error('Failed to send user report to backend:', error);
    }
  }

  // Development helpers
  getErrorQueue(): ErrorRecord[] {
    return [...this.errorQueue];
  }

  clearErrorQueue(): void {
    this.errorQueue = [];
  }

initializeConsoleInterceptor(): void {
  if (this.consoleInterceptorInitialized) return;

  const oc = this.originalConsole;

  // Intercept console.warn
  console.warn = (...args: unknown[]) => {
    oc.warn(...args);
    if (this.isCapturingConsole) return;
    this.isCapturingConsole = true;
    try {
      this.captureConsoleMessage('warn', args);
    } finally {
      this.isCapturingConsole = false;
    }
  };

  // Intercept console.error
  console.error = (...args: unknown[]) => {
    oc.error(...args);
    if (this.isCapturingConsole) return;
    this.isCapturingConsole = true;
    try {
      this.captureConsoleMessage('error', args);
    } finally {
      this.isCapturingConsole = false;
    }
  };

  // Optionally intercept console.log in development
  if (this.isDevelopment) {
    console.log = (...args: unknown[]) => {
      oc.log(...args);
      if (this.isCapturingConsole) return;
      this.isCapturingConsole = true;
      try {
        this.captureConsoleMessage('log', args);
      } finally {
        this.isCapturingConsole = false;
      }
    };
  }

  this.consoleInterceptorInitialized = true;
}

  private captureConsoleMessage(type: 'warn' | 'error' | 'log', args: unknown[]): void {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    const record = createConsoleRecord(type, message, args);
    
    // Only process if it should be reported
    if (shouldReportConsoleMessage(record)) {
      this.addToConsoleQueue(record);
      
if (this.isDevelopment) {
  console.group(`📊 Console ${type.toUpperCase()} captured`);
  this.originalConsole.log('Record:', record);
  console.groupEnd();
}
    }
  }

  private addToConsoleQueue(record: ConsoleRecord): void {
    this.consoleQueue.unshift(record);
    
    if (this.consoleQueue.length > this.maxQueueSize) {
      this.consoleQueue = this.consoleQueue.slice(0, this.maxQueueSize);
    }
  }

  getConsoleStats(): { total: number; byCategory: Record<string, number>; byType: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    this.consoleQueue.forEach(record => {
      byCategory[record.category] = (byCategory[record.category] || 0) + 1;
      byType[record.type] = (byType[record.type] || 0) + 1;
    });

    return {
      total: this.consoleQueue.length,
      byCategory,
      byType,
    };
  }

  getErrorStats(): { total: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    
    this.errorQueue.forEach(record => {
      const category = record.context?.metadata?.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      byCategory,
    };
  }

  getConsoleQueue(): ConsoleRecord[] {
    return [...this.consoleQueue];
  }

  clearConsoleQueue(): void {
    this.consoleQueue = [];
  }
}

export const monitoringService = new MonitoringService();
