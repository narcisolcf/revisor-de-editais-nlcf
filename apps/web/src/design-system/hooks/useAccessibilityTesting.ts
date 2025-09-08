import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runAccessibilityAudit,
  calculateColorContrast,
  testKeyboardAccessibility,
  generateAccessibilityReport,
  type AccessibilityTestResult,
  type ColorContrastResult,
  type KeyboardTestResult,
} from '../utils/accessibility-testing';
import { useAnnouncements } from './useAnnouncements';

export interface AccessibilityTestOptions {
  /** Se deve executar testes automaticamente */
  autoTest?: boolean;
  /** Intervalo para testes automáticos (em ms) */
  testInterval?: number;
  /** Se deve anunciar resultados */
  announceResults?: boolean;
  /** Nível mínimo de conformidade */
  minimumLevel?: 'A' | 'AA' | 'AAA';
  /** Se deve incluir avisos */
  includeWarnings?: boolean;
  /** Callback para resultados */
  onResults?: (results: AccessibilityTestResult[]) => void;
}

export interface AccessibilityTestReturn {
  /** Resultados dos testes */
  results: AccessibilityTestResult[];
  /** Resumo dos testes */
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  };
  /** Se está executando testes */
  isTesting: boolean;
  /** Função para executar testes manualmente */
  runTests: (container?: Element) => void;
  /** Função para limpar resultados */
  clearResults: () => void;
  /** Função para gerar relatório */
  generateReport: () => string;
  /** Função para testar contraste de cores */
  testColorContrast: (foreground: string, background: string) => ColorContrastResult;
  /** Função para testar acessibilidade por teclado */
  testKeyboard: (element: Element) => KeyboardTestResult;
}

/**
 * Hook para testes de acessibilidade em tempo real
 * 
 * Permite executar testes de conformidade WCAG 2.1 AA em componentes
 * e receber feedback em tempo real sobre problemas de acessibilidade.
 * 
 * @example
 * ```tsx
 * function AccessibleComponent() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const {
 *     results,
 *     summary,
 *     runTests,
 *     generateReport
 *   } = useAccessibilityTesting({
 *     autoTest: true,
 *     announceResults: true,
 *     minimumLevel: 'AA'
 *   });
 * 
 *   useEffect(() => {
 *     if (containerRef.current) {
 *       runTests(containerRef.current);
 *     }
 *   }, [runTests]);
 * 
 *   return (
 *     <div ref={containerRef}>
 *       <h1>Título da Página</h1>
 *       <button>Botão Acessível</button>
 *       {summary.errors > 0 && (
 *         <div role="alert">
 *           {summary.errors} erros de acessibilidade encontrados
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibilityTesting({
  autoTest = false,
  testInterval = 5000,
  announceResults = false,
  minimumLevel = 'AA',
  includeWarnings = true,
  onResults,
}: AccessibilityTestOptions = {}): AccessibilityTestReturn {
  const [results, setResults] = useState<AccessibilityTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTestRef = useRef<number>(0);
  
  const { announce, announceError, announceSuccess } = useAnnouncements();

  // Função para executar testes
  const runTests = useCallback(
    (container: Element = document.body) => {
      setIsTesting(true);
      
      try {
        const auditResults = runAccessibilityAudit(container);
        let filteredResults = auditResults.results;
        
        // Filtrar por nível mínimo
        const levelOrder = { 'A': 1, 'AA': 2, 'AAA': 3 };
        const minLevelValue = levelOrder[minimumLevel];
        
        filteredResults = filteredResults.filter(result => {
          const resultLevelValue = levelOrder[result.level];
          return resultLevelValue <= minLevelValue;
        });
        
        // Filtrar avisos se necessário
        if (!includeWarnings) {
          filteredResults = filteredResults.filter(result => result.severity !== 'warning');
        }
        
        setResults(filteredResults);
        lastTestRef.current = Date.now();
        
        // Anunciar resultados se habilitado
        if (announceResults) {
          const errors = filteredResults.filter(r => r.severity === 'error').length;
          const warnings = filteredResults.filter(r => r.severity === 'warning').length;
          
          if (errors > 0) {
            announceError(`${errors} erro${errors > 1 ? 's' : ''} de acessibilidade encontrado${errors > 1 ? 's' : ''}.`);
          } else if (warnings > 0) {
            announce(`${warnings} aviso${warnings > 1 ? 's' : ''} de acessibilidade encontrado${warnings > 1 ? 's' : ''}.`);
          } else {
            announceSuccess('Nenhum problema de acessibilidade encontrado.');
          }
        }
        
        // Callback personalizado
        onResults?.(filteredResults);
      } catch (error) {
        console.error('Erro ao executar testes de acessibilidade:', error);
        if (announceResults) {
          announceError('Erro ao executar testes de acessibilidade.');
        }
      } finally {
        setIsTesting(false);
      }
    },
    [minimumLevel, includeWarnings, announceResults, announce, announceError, announceSuccess, onResults]
  );

  // Função para limpar resultados
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // Função para gerar relatório
  const generateReport = useCallback(() => {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      warnings: results.filter(r => r.severity === 'warning').length,
      errors: results.filter(r => r.severity === 'error').length,
    };
    
    return generateAccessibilityReport({ results, summary });
  }, [results]);

  // Função para testar contraste de cores
  const testColorContrast = useCallback(
    (foreground: string, background: string) => {
      return calculateColorContrast(foreground, background);
    },
    []
  );

  // Função para testar acessibilidade por teclado
  const testKeyboard = useCallback(
    (element: Element) => {
      return testKeyboardAccessibility(element);
    },
    []
  );

  // Calcular resumo
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    warnings: results.filter(r => r.severity === 'warning').length,
    errors: results.filter(r => r.severity === 'error').length,
  };

  // Configurar testes automáticos
  useEffect(() => {
    if (autoTest) {
      intervalRef.current = setInterval(() => {
        runTests();
      }, testInterval);
      
      // Executar teste inicial
      runTests();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoTest, testInterval, runTests]);

  return {
    results,
    summary,
    isTesting,
    runTests,
    clearResults,
    generateReport,
    testColorContrast,
    testKeyboard,
  };
}

/**
 * Hook para monitorar contraste de cores em tempo real
 */
export function useColorContrastMonitor({
  foregroundColor,
  backgroundColor,
  minimumRatio = 4.5,
  announceChanges = false,
}: {
  foregroundColor: string;
  backgroundColor: string;
  minimumRatio?: number;
  announceChanges?: boolean;
}) {
  const [contrastResult, setContrastResult] = useState<ColorContrastResult | null>(null);
  const { announce, announceError, announceSuccess } = useAnnouncements();
  
  useEffect(() => {
    const result = calculateColorContrast(foregroundColor, backgroundColor);
    setContrastResult(result);
    
    if (announceChanges) {
      if (result.ratio >= minimumRatio) {
        announceSuccess(`Contraste adequado: ${result.ratio}:1`);
      } else {
        announceError(`Contraste insuficiente: ${result.ratio}:1 (mínimo: ${minimumRatio}:1)`);
      }
    }
  }, [foregroundColor, backgroundColor, minimumRatio, announceChanges, announce, announceError, announceSuccess]);
  
  return {
    contrastResult,
    isAccessible: contrastResult ? contrastResult.ratio >= minimumRatio : false,
    ratio: contrastResult?.ratio || 0,
    level: contrastResult?.level || 'fail',
  };
}

/**
 * Hook para validar estrutura de formulário acessível
 */
export function useFormAccessibilityValidation(formRef: React.RefObject<HTMLFormElement>) {
  const [validationResults, setValidationResults] = useState<AccessibilityTestResult[]>([]);
  const { announceError, announceSuccess } = useAnnouncements();
  
  const validateForm = useCallback(() => {
    if (!formRef.current) return;
    
    const results: AccessibilityTestResult[] = [];
    const form = formRef.current;
    
    // Verificar labels para inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      
      if (id) {
        const label = form.querySelector(`label[for="${id}"]`);
        hasLabel = !!label;
      }
      
      hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledBy;
      
      results.push({
        passed: hasLabel,
        level: 'A',
        criterion: '3.3.2 Labels or Instructions',
        message: hasLabel
          ? 'Campo de formulário tem label associado'
          : 'Campo de formulário não tem label associado',
        element: input,
        severity: hasLabel ? 'info' : 'error',
      });
    });
    
    // Verificar fieldsets para grupos de radio/checkbox
    const radioGroups = form.querySelectorAll('input[type="radio"]');
    const radioGroupNames = new Set<string>();
    
    radioGroups.forEach(radio => {
      const name = radio.getAttribute('name');
      if (name) radioGroupNames.add(name);
    });
    
    radioGroupNames.forEach(groupName => {
      const radios = form.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
      const fieldset = Array.from(radios).some(radio => 
        radio.closest('fieldset')
      );
      
      if (radios.length > 1) {
        results.push({
          passed: fieldset,
          level: 'A',
          criterion: '1.3.1 Info and Relationships',
          message: fieldset
            ? 'Grupo de radio buttons está em fieldset'
            : 'Grupo de radio buttons deveria estar em fieldset',
          severity: fieldset ? 'info' : 'warning',
        });
      }
    });
    
    setValidationResults(results);
    
    // Anunciar resultados
    const errors = results.filter(r => r.severity === 'error').length;
    if (errors > 0) {
      announceError(`${errors} erro${errors > 1 ? 's' : ''} de acessibilidade no formulário.`);
    } else {
      announceSuccess('Formulário está acessível.');
    }
    
    return results;
  }, [formRef, announceError, announceSuccess]);
  
  useEffect(() => {
    if (formRef.current) {
      validateForm();
    }
  }, [validateForm]);
  
  return {
    validationResults,
    validateForm,
    hasErrors: validationResults.some(r => r.severity === 'error'),
    errorCount: validationResults.filter(r => r.severity === 'error').length,
    warningCount: validationResults.filter(r => r.severity === 'warning').length,
  };
}