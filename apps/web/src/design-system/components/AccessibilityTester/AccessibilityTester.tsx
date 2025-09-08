import React, { useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle, Info, XCircle, Play, FileText, Palette, Keyboard } from 'lucide-react';
import {
  useAccessibilityTesting,
  useColorContrastMonitor,
  useFormAccessibilityValidation,
  type AccessibilityTestReturn,
} from '../../hooks/useAccessibilityTesting';
import { type AccessibilityTestResult } from '../../utils/accessibility-testing';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';

const accessibilityTesterVariants = cva(
  'w-full space-y-4',
  {
    variants: {
      variant: {
        default: 'bg-white border border-gray-200',
        compact: 'bg-gray-50 border border-gray-100',
        detailed: 'bg-white border-2 border-blue-200',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4 text-base',
        lg: 'p-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const resultItemVariants = cva(
  'flex items-start gap-3 p-3 rounded-lg border',
  {
    variants: {
      severity: {
        error: 'bg-red-50 border-red-200 text-red-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        success: 'bg-green-50 border-green-200 text-green-900',
      },
    },
    defaultVariants: {
      severity: 'info',
    },
  }
);

export interface AccessibilityTesterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accessibilityTesterVariants> {
  /** Elemento alvo para testes */
  targetElement?: Element;
  /** Se deve executar testes automaticamente */
  autoTest?: boolean;
  /** Se deve mostrar detalhes dos resultados */
  showDetails?: boolean;
  /** Se deve mostrar controles de teste */
  showControls?: boolean;
  /** Callback para resultados */
  onResults?: (results: AccessibilityTestResult[]) => void;
}

/**
 * Componente para testar e exibir resultados de acessibilidade
 * 
 * Fornece uma interface visual para executar testes de conformidade WCAG 2.1 AA
 * e exibir os resultados de forma acessível e compreensível.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const targetRef = useRef<HTMLDivElement>(null);
 * 
 *   return (
 *     <div>
 *       <div ref={targetRef}>
 *         <h1>Conteúdo para testar</h1>
 *         <button>Botão sem label</button>
 *       </div>
 *       
 *       <AccessibilityTester
 *         targetElement={targetRef.current}
 *         autoTest
 *         showDetails
 *         onResults={(results) => console.log(results)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function AccessibilityTester({
  className,
  variant,
  size,
  targetElement,
  autoTest = false,
  showDetails = true,
  showControls = true,
  onResults,
  ...props
}: AccessibilityTesterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'contrast' | 'keyboard'>('overview');
  const [contrastColors, setContrastColors] = useState({
    foreground: '#000000',
    background: '#ffffff',
  });

  const {
    results,
    summary,
    isTesting,
    runTests,
    clearResults,
    generateReport,
    testColorContrast,
    testKeyboard,
  } = useAccessibilityTesting({
    autoTest,
    announceResults: true,
    minimumLevel: 'AA',
    onResults,
  });

  const { contrastResult, isAccessible } = useColorContrastMonitor({
    foregroundColor: contrastColors.foreground,
    backgroundColor: contrastColors.background,
    minimumRatio: 4.5,
  });

  const handleRunTests = () => {
    const target = targetElement || containerRef.current?.parentElement || document.body;
    runTests(target);
  };

  const handleTestKeyboard = () => {
    const target = targetElement || containerRef.current?.parentElement || document.body;
    const keyboardResult = testKeyboard(target);
    console.log('Resultado do teste de teclado:', keyboardResult);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error' as const;
      case 'warning':
        return 'warning' as const;
      case 'success':
        return 'success' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <div
      ref={containerRef}
      className={accessibilityTesterVariants({ variant, size, className })}
      {...props}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Teste de Acessibilidade
        </h3>
        {showControls && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunTests}
              disabled={isTesting}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isTesting ? 'Testando...' : 'Executar Testes'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResults}
              disabled={results.length === 0}
            >
              Limpar
            </Button>
          </div>
        )}
      </div>

      {/* Resumo */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            <div className="text-sm text-gray-600">Aprovados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
            <div className="text-sm text-gray-600">Erros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            <div className="text-sm text-gray-600">Avisos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-gray-600">Falharam</div>
          </div>
        </div>
      </Card>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Info },
            { id: 'details', label: 'Detalhes', icon: FileText },
            { id: 'contrast', label: 'Contraste', icon: Palette },
            { id: 'keyboard', label: 'Teclado', icon: Keyboard },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-4">
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Execute os testes para ver os resultados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    className={resultItemVariants({ severity: result.severity as any })}
                  >
                    {getSeverityIcon(result.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.criterion}</span>
                        <Badge
                          variant={getSeverityBadgeVariant(result.severity)}
                          size="sm"
                        >
                          {result.level}
                        </Badge>
                      </div>
                      <p className="text-sm">{result.message}</p>
                    </div>
                  </div>
                ))}
                {results.length > 5 && (
                  <p className="text-sm text-gray-600 text-center">
                    E mais {results.length - 5} resultado{results.length - 5 > 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'details' && showDetails && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum resultado detalhado disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(result.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{result.criterion}</h4>
                          <Badge
                            variant={getSeverityBadgeVariant(result.severity)}
                            size="sm"
                          >
                            {result.level}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {result.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                        {result.element && (
                          <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                            {result.element.tagName.toLowerCase()}
                            {result.element.className && `.${result.element.className.split(' ').join('.')}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {results.length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const report = generateReport();
                    console.log(report);
                    // Aqui você poderia baixar o relatório ou copiá-lo
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Relatório
                </Button>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'contrast' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-4">Teste de Contraste de Cores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor do Texto
                  </label>
                  <input
                    type="color"
                    value={contrastColors.foreground}
                    onChange={(e) =>
                      setContrastColors(prev => ({ ...prev, foreground: e.target.value }))
                    }
                    className="w-full h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={contrastColors.foreground}
                    onChange={(e) =>
                      setContrastColors(prev => ({ ...prev, foreground: e.target.value }))
                    }
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor de Fundo
                  </label>
                  <input
                    type="color"
                    value={contrastColors.background}
                    onChange={(e) =>
                      setContrastColors(prev => ({ ...prev, background: e.target.value }))
                    }
                    className="w-full h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={contrastColors.background}
                    onChange={(e) =>
                      setContrastColors(prev => ({ ...prev, background: e.target.value }))
                    }
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                  />
                </div>
              </div>
              
              {contrastResult && (
                <div className="mt-4 p-4 rounded-lg border" style={{
                  backgroundColor: contrastColors.background,
                  color: contrastColors.foreground,
                }}>
                  <div className="mb-4">
                    <h5 className="font-medium">Exemplo de Texto</h5>
                    <p>Este é um exemplo de como o texto apareceria com essas cores.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Razão de Contraste:</strong>
                      <div className="text-lg font-bold">{contrastResult.ratio}:1</div>
                    </div>
                    <div>
                      <strong>Nível WCAG:</strong>
                      <Badge
                        variant={isAccessible ? 'success' : 'error'}
                        className="ml-2"
                      >
                        {contrastResult.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <div className={isAccessible ? 'text-green-600' : 'text-red-600'}>
                        {isAccessible ? 'Acessível' : 'Não Acessível'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {selectedTab === 'keyboard' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-4">Teste de Navegação por Teclado</h4>
              <p className="text-sm text-gray-600 mb-4">
                Teste se todos os elementos interativos podem ser acessados e operados usando apenas o teclado.
              </p>
              <Button
                onClick={handleTestKeyboard}
                className="flex items-center gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Testar Navegação por Teclado
              </Button>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Dicas para Teste Manual:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use Tab para navegar entre elementos</li>
                  <li>• Use Shift+Tab para navegar para trás</li>
                  <li>• Use Enter ou Space para ativar botões</li>
                  <li>• Use setas para navegar em menus e listas</li>
                  <li>• Use Escape para fechar modais e menus</li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Tipos já exportados acima