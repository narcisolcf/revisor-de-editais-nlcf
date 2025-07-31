import { ErrorInfo } from 'react';
import { ErrorRecord, ErrorContext, ErrorCategory, ErrorSeverity, ConsoleRecord, ConsoleCategory } from '@/types/error';

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

export function classifyConsoleMessage(type: string, message: string, args: any[]): ConsoleCategory {
  const msg = message.toLowerCase();
  
  // React warnings
  if (msg.includes('react') || msg.includes('warning:') || msg.includes('validatedomnesting')) {
    return 'react_warning';
  }
  
  // Performance warnings
  if (msg.includes('preload') || msg.includes('performance') || msg.includes('loading')) {
    return 'performance_warning';
  }
  
  // Developer logs
  if (type === 'log' || msg.includes('debug') || msg.includes('info')) {
    return 'developer_log';
  }
  
  // Generic console warnings
  if (type === 'warn') {
    return 'console_warning';
  }
  
  return 'unknown';
}

export function getConsoleSeverity(category: ConsoleCategory, type: string): ErrorSeverity {
  switch (category) {
    case 'react_warning':
      return 'medium';
    case 'performance_warning':
      return 'low';
    case 'console_warning':
      return 'medium';
    case 'developer_log':
      return 'low';
    default:
      return type === 'error' ? 'high' : 'low';
  }
}

export function createConsoleRecord(
  type: 'warn' | 'error' | 'log',
  message: string,
  args: any[]
): ConsoleRecord {
  const category = classifyConsoleMessage(type, message, args);
  const severity = getConsoleSeverity(category, type);
  
  return {
    id: generateErrorId(),
    type,
    message,
    args,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    stack: type === 'error' ? new Error().stack : undefined,
    category,
    severity,
  };
}

export function shouldReportConsoleMessage(record: ConsoleRecord): boolean {
  // Don't report known non-critical warnings
  const ignoredPatterns = [
    'data-lov-id', // Known Lovable internal attribute
    'preload but not used', // Performance warnings
    '[UTS]', // User tracking scripts
    'hiring!', // Lovable recruitment message
  ];
  
  return !ignoredPatterns.some(pattern => 
    record.message.toLowerCase().includes(pattern.toLowerCase())
  );
}