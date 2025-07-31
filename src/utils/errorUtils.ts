import { ErrorInfo } from 'react';
import { ErrorRecord, ErrorContext, ErrorCategory, ErrorSeverity } from '@/types/error';

export function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `error_${timestamp}_${random}`;
}

export function classifyError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || name.includes('networkerror')) {
    return 'network';
  }
  
  if (message.includes('validation') || message.includes('invalid') || name.includes('validationerror')) {
    return 'validation';
  }
  
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'authentication';
  }
  
  if (message.includes('render') || name.includes('syntaxerror') || message.includes('component')) {
    return 'ui_rendering';
  }

  return 'unknown';
}

export function getErrorSeverity(error: Error): ErrorSeverity {
  const category = classifyError(error);
  const message = error.message.toLowerCase();

  // Critical errors
  if (category === 'authentication' || message.includes('critical') || message.includes('fatal')) {
    return 'critical';
  }

  // High severity
  if (category === 'network' || category === 'business_logic' || message.includes('failed')) {
    return 'high';
  }

  // Medium severity
  if (category === 'validation' || category === 'ui_rendering') {
    return 'medium';
  }

  // Low severity for unknown or minor issues
  return 'low';
}

export function createErrorRecord(
  error: Error,
  errorInfo?: ErrorInfo,
  context?: ErrorContext
): ErrorRecord {
  return {
    id: generateErrorId(),
    error,
    errorInfo,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };
}

export function sanitizeErrorForLogging(error: Error): Record<string, any> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    category: classifyError(error),
    severity: getErrorSeverity(error),
  };
}

export function getErrorDisplayMessage(error: Error): string {
  const category = classifyError(error);
  
  switch (category) {
    case 'network':
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    case 'validation':
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    case 'authentication':
      return 'Sessão expirada. Faça login novamente.';
    case 'business_logic':
      return 'Erro no processamento. Tente novamente em alguns instantes.';
    case 'ui_rendering':
      return 'Erro na interface. Recarregue a página.';
    default:
      return 'Algo deu errado. Nossa equipe foi notificada.';
  }
}