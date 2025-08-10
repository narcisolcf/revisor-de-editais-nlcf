import React, { useState } from 'react';
import { ErrorFallbackProps } from '@/types/error';
import { getErrorDisplayMessage } from '@/utils/errorUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import ErrorReportDialog from './ErrorReportDialog';

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  resetError,
  onReport,
}) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const displayMessage = error ? getErrorDisplayMessage(error) : 'Algo deu errado inesperadamente.';

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReport = () => {
    setIsReportDialogOpen(true);
    if (onReport) {
      onReport(errorId);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Oops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {displayMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error ID for support */}
          {errorId && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">
                ID do Erro (para suporte):
              </p>
              <code className="text-xs font-mono text-foreground">
                {errorId}
              </code>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={resetError}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleReport}
                variant="outline"
                className="flex-1"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Reportar
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Início
              </Button>
            </div>
            
            <Button 
              onClick={handleReload}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Recarregar Página
            </Button>
          </div>

          {/* Development info */}
          {import.meta.env.DEV && error && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
      
      <ErrorReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        errorId={errorId}
        error={error}
      />
    </div>
  );
};

export default ErrorFallback;