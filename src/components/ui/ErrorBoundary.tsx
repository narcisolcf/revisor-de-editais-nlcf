import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, FileText, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Salva a informação do erro no state
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro para debug
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Chama callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Opcional: Enviar erro para serviço de monitoramento
    // this.reportErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });
  };

  handleShowDetails = () => {
    this.setState(prevState => ({
      showErrorDetails: !prevState.showErrorDetails,
    }));
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    if (!error || !errorInfo) return;

    const errorReport = `
RELATÓRIO DE ERRO
================

Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

ERROR MESSAGE:
${error.message}

ERROR STACK:
${error.stack}

COMPONENT STACK:
${errorInfo.componentStack}

ADDITIONAL INFO:
${JSON.stringify({
  name: error.name,
  cause: error.cause,
}, null, 2)}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorReport);
      // Opcional: Mostrar toast de sucesso
      console.log('Error report copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error report:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback customizada
      const { error, errorInfo, showErrorDetails } = this.state;

      // Se um fallback customizado foi fornecido via props, use-o
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-900">
                Opa, algo deu errado
              </CardTitle>
              <p className="text-red-700 mt-2">
                Encontramos um problema inesperado. Você pode tentar novamente ou gerar um relatório 
                de erro para nos ajudar a resolver o problema.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button
                  onClick={this.handleShowDetails}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showErrorDetails ? 'Ocultar' : 'Gerar'} Relatório de Erro
                  {showErrorDetails ? 
                    <ChevronUp className="h-4 w-4 ml-2" /> : 
                    <ChevronDown className="h-4 w-4 ml-2" />
                  }
                </Button>
              </div>

              {/* Área de detalhes do erro (condicional) */}
              {showErrorDetails && (
                <div className="mt-6 space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      <strong>Detalhes técnicos do erro:</strong> As informações abaixo podem 
                      ajudar desenvolvedores a diagnosticar o problema.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Informações do Erro</h4>
                      <Button
                        onClick={this.handleCopyError}
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                    </div>

                    {error && (
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-red-900 mb-1">Mensagem do Erro:</h5>
                          <pre className="bg-red-100 p-2 rounded text-sm text-red-800 whitespace-pre-wrap border">
                            {error.message}
                          </pre>
                        </div>

                        {error.stack && (
                          <div>
                            <h5 className="font-medium text-red-900 mb-1">Stack Trace:</h5>
                            <pre className="bg-gray-100 p-2 rounded text-xs text-gray-700 whitespace-pre-wrap border max-h-32 overflow-y-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}

                        {errorInfo?.componentStack && (
                          <div>
                            <h5 className="font-medium text-red-900 mb-1">Component Stack:</h5>
                            <pre className="bg-blue-100 p-2 rounded text-xs text-blue-800 whitespace-pre-wrap border max-h-32 overflow-y-auto">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        <div className="text-xs text-gray-600 pt-2 border-t">
                          <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                          <p><strong>URL:</strong> {window.location.href}</p>
                          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;