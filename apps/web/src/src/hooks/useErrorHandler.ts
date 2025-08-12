import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { monitoringService } from '@/services/monitoringService';
import { ErrorContext } from '@/types/error';
import { getErrorDisplayMessage } from '@/utils/errorUtils';

export function useErrorHandler() {
  const { toast } = useToast();

  const logError = useCallback((error: Error, context?: ErrorContext) => {
    console.error('🚨 Error logged via useErrorHandler:', error);
    monitoringService.reportError(error, context);
    
    toast({
      variant: "destructive",
      title: "Erro detectado",
      description: getErrorDisplayMessage(error),
    });
  }, [toast]);

  const handleAsyncError = useCallback(<T>(
    asyncOperation: () => Promise<T>,
    context?: ErrorContext,
    customErrorMessage?: string
  ) => {
    return async (): Promise<T | undefined> => {
      try {
        return await asyncOperation();
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        console.error('🚨 Async error caught:', errorInstance);
        monitoringService.reportError(errorInstance, context);
        
        toast({
          variant: "destructive",
          title: "Erro na operação",
          description: customErrorMessage || getErrorDisplayMessage(errorInstance),
        });
        
        return undefined;
      }
    };
  }, [toast]);

  const wrapAsync = useCallback(<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context?: ErrorContext,
    customErrorMessage?: string
  ) => {
    return async (...args: TArgs): Promise<TReturn | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        console.error('🚨 Wrapped async function error:', errorInstance);
        monitoringService.reportError(errorInstance, {
          ...context,
          metadata: {
            ...context?.metadata,
            functionName: fn.name,
            arguments: args,
          },
        });
        
        toast({
          variant: "destructive",
          title: "Erro na operação",
          description: customErrorMessage || getErrorDisplayMessage(errorInstance),
        });
        
        return undefined;
      }
    };
  }, [toast]);

  const reportManualError = useCallback((
    message: string,
    context?: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const error = new Error(message);
    error.name = 'ManualError';
    
    console.warn('📝 Manual error report:', { message, context, severity });
    monitoringService.reportError(error, {
      ...context,
      metadata: {
        ...context?.metadata,
        isManual: true,
        severity,
      },
    });
    
    toast({
      variant: severity === 'critical' ? "destructive" : "default",
      title: severity === 'critical' ? "Erro crítico" : "Problema reportado",
      description: message,
    });
  }, [toast]);

  return {
    logError,
    handleAsyncError,
    wrapAsync,
    reportManualError,
  };
}