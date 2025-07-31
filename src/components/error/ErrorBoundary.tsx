import React, { Component, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '@/types/error';
import { createErrorRecord, sanitizeErrorForLogging } from '@/utils/errorUtils';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: '', // Will be set in componentDidCatch
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorRecord = createErrorRecord(error, errorInfo);
    
    this.setState({
      errorId: errorRecord.id,
      errorInfo,
    });

    // Log error to console with structured data
    console.group(`🚨 Error Boundary Caught Error [${errorRecord.id}]`);
    console.error('Error:', sanitizeErrorForLogging(error));
    console.error('Error Info:', errorInfo);
    console.error('Context:', {
      url: errorRecord.url,
      timestamp: errorRecord.timestamp,
      userAgent: errorRecord.userAgent,
    });
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-reset after 30 seconds to allow recovery
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, 30000);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  handleReport = (errorId: string) => {
    console.log(`📊 User requested to report error: ${errorId}`);
    // Future: Open error report dialog
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId}
          resetError={this.resetError}
          onReport={this.handleReport}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;