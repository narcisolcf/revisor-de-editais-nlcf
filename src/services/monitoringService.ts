import { ErrorRecord, ErrorContext } from '@/types/error';
import { createErrorRecord, sanitizeErrorForLogging } from '@/utils/errorUtils';
import { ErrorReportData } from '@/hooks/useErrorReport';

class MonitoringService {
  private errorQueue: ErrorRecord[] = [];
  private readonly maxQueueSize = 50;
  private readonly isDevelopment = import.meta.env.DEV;

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

  private async sendUserReportToBackend(reportRecord: any): Promise<void> {
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
}

export const monitoringService = new MonitoringService();
