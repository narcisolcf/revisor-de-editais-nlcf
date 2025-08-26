import { AnalysisContext, AnalysisResult } from '../analyzers/BaseAnalyzer';

export interface FallbackConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number; // milissegundos
  enableBasicAnalysis: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  fallbackStrategies: FallbackStrategy[];
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  enabled: boolean;
  conditions: FallbackCondition[];
  actions: FallbackAction[];
}

export interface FallbackCondition {
  type: 'error_type' | 'error_count' | 'timeout' | 'performance' | 'custom';
  value: string | number | boolean;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
}

export interface FallbackAction {
  type: 'retry' | 'use_basic_analyzer' | 'use_cached_result' | 'return_error' | 'custom';
  config: Record<string, unknown>;
}

export interface FallbackMetrics {
  totalFallbacks: number;
  successfulFallbacks: number;
  failedFallbacks: number;
  averageFallbackTime: number;
  fallbackReasons: Record<string, number>;
  strategyUsage: Record<string, number>;
}

export interface FallbackLogEntry {
  timestamp: Date;
  context: string;
  error: Error;
  strategy: string;
  action: string;
  result: 'success' | 'failure';
  duration: number;
  metadata: Record<string, unknown>;
}

export class FallbackSystem {
  private config: FallbackConfig;
  private metrics: FallbackMetrics;
  private logs: FallbackLogEntry[] = [];
  private errorCounts: Map<string, number> = new Map();
  private basicAnalyzers: Map<string, BasicAnalyzer> = new Map();

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableBasicAnalysis: true,
      enableLogging: true,
      enableMetrics: true,
      fallbackStrategies: this.getDefaultStrategies(),
      ...config
    };

    this.metrics = {
      totalFallbacks: 0,
      successfulFallbacks: 0,
      failedFallbacks: 0,
      averageFallbackTime: 0,
      fallbackReasons: {},
      strategyUsage: {}
    };

    this.initializeBasicAnalyzers();
  }

  async executeWithFallback<T>(operation: () => Promise<T>, context: AnalysisContext): Promise<T> {
    const startTime = Date.now();

    try {
      // Tentar operação principal
      return await operation();
    } catch (error) {
      this.recordError(error as Error, context);
      
      // Executar estratégias de fallback
      const fallbackResult = await this.executeFallbackStrategies(context, error as Error);
      
      if (fallbackResult) {
        this.recordSuccessfulFallback(context, fallbackResult.strategy, Date.now() - startTime);
        return fallbackResult.result as T;
      }
      
      // Se nenhum fallback funcionou, registrar falha
      this.recordFailedFallback(context, error as Error, Date.now() - startTime);
      throw error;
    }
  }

  async executeFallbackStrategies(context: AnalysisContext, error: Error): Promise<{ result: unknown; strategy: string } | null> {
    // Ordenar estratégias por prioridade
    const sortedStrategies = [...this.config.fallbackStrategies]
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      if (this.shouldExecuteStrategy(strategy, context, error)) {
        try {
          const result = await this.executeStrategy(strategy, context, error);
          if (result) {
            this.updateStrategyUsage(strategy.name);
            return { result, strategy: strategy.name };
          }
        } catch (strategyError) {
          this.logFallbackError(strategy.name, strategyError, context);
        }
      }
    }

    return null;
  }

  private shouldExecuteStrategy(strategy: FallbackStrategy, context: AnalysisContext, error: Error): boolean {
    return strategy.conditions.every(condition => {
      switch (condition.type) {
        case 'error_type':
          return this.evaluateCondition(error.constructor.name, condition);
        case 'error_count': {
          const errorKey = this.getErrorKey(context);
          const count = this.errorCounts.get(errorKey) || 0;
          return this.evaluateCondition(count, condition);
        }
        case 'timeout':
          return error.message.includes('timeout') && this.evaluateCondition(true, condition);
        case 'performance':
          // Implementar lógica de performance se necessário
          return true;
        case 'custom':
          return this.evaluateCustomCondition(condition, context, error);
        default:
          return true;
      }
    });
  }

  private evaluateCondition(value: string | number | boolean, condition: FallbackCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'regex':
        return new RegExp(String(condition.value)).test(String(value));
      default:
        return true;
    }
  }

  private evaluateCustomCondition(_condition: FallbackCondition, _context: AnalysisContext, _error: Error): boolean {
    // Implementar lógica customizada se necessário
    return true;
  }

  private async executeStrategy(strategy: FallbackStrategy, context: AnalysisContext, error: Error): Promise<unknown> {
    for (const action of strategy.actions) {
      try {
        const result = await this.executeAction(action, context, error);
        if (result) return result;
      } catch (actionError) {
        this.logFallbackError(`${strategy.name}:${action.type}`, actionError, context);
      }
    }
    return null;
  }

  private async executeAction(action: FallbackAction, context: AnalysisContext, error: Error): Promise<unknown> {
    switch (action.type) {
      case 'retry':
        return await this.retryOperation(context, action.config);
      case 'use_basic_analyzer':
        return await this.useBasicAnalyzer(context, action.config);
      case 'use_cached_result':
        return await this.useCachedResult(context, action.config);
      case 'return_error':
        return this.createErrorResult(error, action.config);
      case 'custom':
        return await this.executeCustomAction(action, context, error);
      default:
        return null;
    }
  }

  private async retryOperation(context: AnalysisContext, config: Record<string, unknown>): Promise<unknown> {
    const maxRetries = Number(config.maxRetries) || this.config.maxRetries;
    const delay = Number(config.delay) || this.config.retryDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.delay(delay * attempt); // Backoff exponencial
        // Aqui você implementaria a retry da operação original
        // Por enquanto, retornamos null para indicar que não foi possível
        return null;
      } catch (retryError) {
        if (attempt === maxRetries) {
          throw retryError;
        }
      }
    }
    return null;
  }

  private async useBasicAnalyzer(context: AnalysisContext, config: Record<string, any>): Promise<AnalysisResult> {
    const analyzerType = config.analyzerType || 'general';
    const analyzer = this.basicAnalyzers.get(analyzerType);
    
    if (!analyzer) {
      throw new Error(`Analisador básico '${analyzerType}' não encontrado`);
    }

    return await analyzer.analyze(context);
  }

  private async useCachedResult(_context: AnalysisContext, _config: Record<string, unknown>): Promise<unknown> {
    // Implementar lógica para buscar resultado em cache
    // Por enquanto, retornamos null
    return null;
  }

  private createErrorResult(error: Error, _config: Record<string, any>): AnalysisResult {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: `Erro na análise: ${error.message}`,
        gravidade: 'baixa',
        localizacao: 'Sistema de análise',
        sugestaoCorrecao: 'Verificar configurações e tentar novamente',
        categoria: 'formal'
      }],
      metrics: {},
      score: 50,
      confidence: 20,
      processingTime: 0
    };
  }

  private async executeCustomAction(_action: FallbackAction, _context: AnalysisContext, _error: Error): Promise<unknown> {
    // Implementar ações customizadas se necessário
    return null;
  }

  private initializeBasicAnalyzers(): void {
    this.basicAnalyzers.set('general', new GeneralBasicAnalyzer());
    this.basicAnalyzers.set('structural', new StructuralBasicAnalyzer());
    this.basicAnalyzers.set('legal', new LegalBasicAnalyzer());
  }

  private recordError(error: Error, _context: AnalysisContext): void {
    const errorKey = this.getErrorKey(_context);
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  private recordSuccessfulFallback(context: AnalysisContext, strategy: string, duration: number): void {
    this.metrics.totalFallbacks++;
    this.metrics.successfulFallbacks++;
    this.metrics.averageFallbackTime = 
      (this.metrics.averageFallbackTime * (this.metrics.totalFallbacks - 1) + duration) / this.metrics.totalFallbacks;
    
    if (this.config.enableLogging) {
      this.logs.push({
        timestamp: new Date(),
        context: this.getContextSummary(context),
        error: new Error('Fallback successful'),
        strategy,
        action: 'success',
        result: 'success',
        duration,
        metadata: { strategy, context: this.getContextSummary(context) }
      });
    }
  }

  private recordFailedFallback(context: AnalysisContext, error: Error, duration: number): void {
    this.metrics.totalFallbacks++;
    this.metrics.failedFallbacks++;
    this.metrics.averageFallbackTime = 
      (this.metrics.averageFallbackTime * (this.metrics.totalFallbacks - 1) + duration) / this.metrics.totalFallbacks;
    
    if (this.config.enableLogging) {
      this.logs.push({
        timestamp: new Date(),
        context: this.getContextSummary(context),
        error,
        strategy: 'none',
        action: 'failed',
        result: 'failure',
        duration,
        metadata: { error: error.message, context: this.getContextSummary(context) }
      });
    }
  }

  private updateStrategyUsage(strategyName: string): void {
    this.metrics.strategyUsage[strategyName] = (this.metrics.strategyUsage[strategyName] || 0) + 1;
  }

  private logFallbackError(strategy: string, error: Error, context: AnalysisContext): void {
    if (this.config.enableLogging) {
      this.logs.push({
        timestamp: new Date(),
        context: this.getContextSummary(context),
        error,
        strategy,
        action: 'error',
        result: 'failure',
        duration: 0,
        metadata: { strategy, error: error.message }
      });
    }
  }

  private getErrorKey(context: AnalysisContext): string {
    return `${context.classification.tipoDocumento}_${context.classification.modalidadePrincipal}`;
  }

  private getContextSummary(context: AnalysisContext): string {
    return `${context.classification.tipoDocumento} (${context.text.length} chars)`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDefaultStrategies(): FallbackStrategy[] {
    return [
      {
        name: 'retry_strategy',
        priority: 1,
        enabled: true,
        conditions: [
          { type: 'error_count', value: 1, operator: 'less_than' }
        ],
        actions: [
          { type: 'retry', config: { maxRetries: 2, delay: 1000 } }
        ]
      },
      {
        name: 'basic_analysis_strategy',
        priority: 2,
        enabled: true,
        conditions: [
          { type: 'error_count', value: 2, operator: 'greater_than' }
        ],
        actions: [
          { type: 'use_basic_analyzer', config: { analyzerType: 'general' } }
        ]
      },
      {
        name: 'error_result_strategy',
        priority: 3,
        enabled: true,
        conditions: [
          { type: 'error_count', value: 5, operator: 'greater_than' }
        ],
        actions: [
          { type: 'return_error', config: { includeDetails: false } }
        ]
      }
    ];
  }

  getMetrics(): FallbackMetrics {
    return { ...this.metrics };
  }

  getLogs(limit: number = 100): FallbackLogEntry[] {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Analisadores básicos para fallback
abstract class BasicAnalyzer {
  abstract analyze(context: AnalysisContext): Promise<AnalysisResult>;
}

class GeneralBasicAnalyzer extends BasicAnalyzer {
  async analyze(_context: AnalysisContext): Promise<AnalysisResult> {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise básica executada devido a falha no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise',
        sugestaoCorrecao: 'Verificar configurações e tentar novamente',
        categoria: 'formal'
      }],
      metrics: {},
      score: 60,
      confidence: 40,
      processingTime: 0
    };
  }
}

class StructuralBasicAnalyzer extends BasicAnalyzer {
  async analyze(_context: AnalysisContext): Promise<AnalysisResult> {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise estrutural básica executada devido a falha no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise estrutural',
        sugestaoCorrecao: 'Verificar configurações do analisador estrutural',
        categoria: 'formal'
      }],
      metrics: {},
      score: 65,
      confidence: 35,
      processingTime: 0
    };
  }
}

class LegalBasicAnalyzer extends BasicAnalyzer {
  async analyze(_context: AnalysisContext): Promise<AnalysisResult> {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise legal básica executada devido a falha no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise legal',
        sugestaoCorrecao: 'Verificar configurações do analisador legal',
        categoria: 'juridico'
      }],
      metrics: {},
      score: 55,
      confidence: 30,
      processingTime: 0
    };
  }
}
