import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Componente que pode gerar erros para teste
const ProblematicComponent: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
  if (shouldError) {
    // Simular erro JavaScript
    throw new Error('Este é um erro de teste gerado propositalmente para demonstrar o ErrorBoundary!');
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
      <p className="text-green-800">✅ Componente funcionando normalmente!</p>
    </div>
  );
};

// Componente principal de teste
export const ErrorTestComponent: React.FC = () => {
  const [triggerError, setTriggerError] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do ErrorBoundary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Use os botões abaixo para testar o funcionamento do ErrorBoundary:
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={() => setTriggerError(false)}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 border-green-300"
            >
              ✅ Estado Normal
            </Button>
            <Button
              onClick={() => setTriggerError(true)}
              variant="destructive"
            >
              💥 Gerar Erro
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <h4 className="font-medium mb-2">Componente Protegido pelo ErrorBoundary:</h4>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.log('🚨 ErrorBoundary capturou um erro:', error.message);
                console.log('📍 ComponentStack:', errorInfo.componentStack);
              }}
            >
              <ProblematicComponent shouldError={triggerError} />
            </ErrorBoundary>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>Como testar:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Clique em "Estado Normal" - o componente funciona normalmente</li>
              <li>Clique em "Gerar Erro" - o ErrorBoundary captura o erro e mostra a interface de fallback</li>
              <li>Na tela de erro, clique em "Gerar Relatório de Erro" para ver os detalhes</li>
              <li>Use "Tentar Novamente" para resetar o estado e voltar ao normal</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorTestComponent;