import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { safeGetCurrentUrl, safeReload, safeNavigate, safeNavigator } from '@/lib/browser-utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Gera um ID único para o erro
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro para monitoramento
    const nav = safeNavigator();
    console.error('Dashboard Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: nav?.userAgent || 'unknown',
      url: safeGetCurrentUrl(),
    });

    // Callback personalizado para tratamento de erro
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    safeReload();
  };

  handleGoHome = () => {
    safeNavigate('/');
  };

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Poderia mostrar um toast aqui
        console.log('Detalhes do erro copiados para a área de transferência');
      })
      .catch((err) => {
        console.error('Erro ao copiar detalhes:', err);
      });
  };

  render() {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, use-o
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderiza a UI de erro padrão
      return (
        <AnimatedContainer animation="fadeIn" className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Algo deu errado
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Encontramos um problema inesperado no dashboard. Nossa equipe foi notificada.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Informações do erro */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Detalhes do Erro</h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {this.state.errorId}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Mensagem:</span>
                    <p className="text-gray-600 mt-1 font-mono text-xs bg-white p-2 rounded border">
                      {this.state.error?.message || 'Erro desconhecido'}
                    </p>
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                    <div>
                      <span className="font-medium text-gray-700">Stack Trace:</span>
                      <pre className="text-gray-600 mt-1 font-mono text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Página
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Início
                </Button>
              </div>

              {/* Ação de suporte */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Precisa de ajuda?</h4>
                    <p className="text-sm text-gray-600">
                      Copie os detalhes do erro e entre em contato com o suporte.
                    </p>
                  </div>
                  <Button 
                    onClick={this.copyErrorDetails}
                    variant="ghost"
                    size="sm"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Copiar Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      );
    }

    return this.props.children;
  }
}

// Hook para usar o Error Boundary de forma mais funcional
export function useDashboardErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Log personalizado ou envio para serviço de monitoramento
    console.error('Dashboard Error:', { error, errorInfo });
    
    // Aqui você poderia integrar com serviços como Sentry, LogRocket, etc.
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }, []);

  return { handleError };
}

// Componente de erro simples para casos específicos
export function DashboardErrorFallback({ 
  error, 
  resetError, 
  title = "Erro no Dashboard",
  description = "Ocorreu um erro ao carregar esta seção."
}: {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <AnimatedContainer animation="fadeIn">
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="p-3 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 text-center mb-4">{description}</p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="w-full mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer mb-2">
                Detalhes técnicos
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.message}\n{error.stack}
              </pre>
            </details>
          )}
          
          {resetError && (
            <Button onClick={resetError} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

export default DashboardErrorBoundary;