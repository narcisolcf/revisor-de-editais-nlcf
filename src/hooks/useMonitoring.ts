import { useCallback } from 'react';
import { monitoringService } from '@/services/monitoringService';
import { ErrorContext } from '@/types/error';

export function useMonitoring() {
  const reportError = useCallback((error: Error, context?: ErrorContext) => {
    monitoringService.reportError(error, context);
  }, []);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    // Future: Track custom events
    if (import.meta.env.DEV) {
      console.log('📊 Event tracked:', { eventName, properties });
    }
  }, []);

  const setUserContext = useCallback((userId: string, userInfo?: Record<string, any>) => {
    // Future: Set user context for monitoring
    if (import.meta.env.DEV) {
      console.log('👤 User context set:', { userId, userInfo });
    }
  }, []);

  const getErrorStats = useCallback(() => {
    return monitoringService.getErrorStats();
  }, []);

  const getConsoleStats = useCallback(() => {
    return monitoringService.getConsoleStats();
  }, []);

  const clearErrors = useCallback(() => {
    monitoringService.clearErrorQueue();
  }, []);

  const clearConsole = useCallback(() => {
    monitoringService.clearConsoleQueue();
  }, []);

  const initializeConsoleCapture = useCallback(() => {
    monitoringService.initializeConsoleInterceptor();
  }, []);

  return {
    reportError,
    trackEvent,
    setUserContext,
    getErrorStats,
    getConsoleStats,
    clearErrors,
    clearConsole,
    initializeConsoleCapture,
  };
}