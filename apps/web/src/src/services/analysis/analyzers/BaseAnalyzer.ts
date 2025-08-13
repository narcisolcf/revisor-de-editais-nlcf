import { DocumentClassification, Problem, AnalysisMetrics } from '@/types/document';

export interface AnalysisResult {
  problems: Problem[];
  metrics: Partial<AnalysisMetrics>;
  score: number;
  confidence: number;
  processingTime: number;
  cacheKey?: string;
}

export interface AnalysisContext {
  text: string;
  classification: DocumentClassification;
  parameters: Record<string, any>;
  cacheEnabled: boolean;
}

export interface AnalyzerConfig {
  name: string;
  version: string;
  enabled: boolean;
  priority: number;
  timeout: number;
  fallbackEnabled: boolean;
}

export abstract class BaseAnalyzer {
  protected config: AnalyzerConfig;
  protected cache: Map<string, AnalysisResult> = new Map();
  protected errorCount: number = 0;
  protected lastError?: Error;

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  abstract analyze(context: AnalysisContext): Promise<AnalysisResult>;

  protected abstract getCacheKey(context: AnalysisContext): string;

  protected abstract validateInput(context: AnalysisContext): boolean;

  protected abstract createFallbackResult(context: AnalysisContext): AnalysisResult;

  async analyzeWithFallback(context: AnalysisContext): Promise<AnalysisResult> {
    try {
      // Verificar cache primeiro
      if (context.cacheEnabled) {
        const cached = this.getFromCache(context);
        if (cached) {
          return { ...cached, cacheKey: this.getCacheKey(context) };
        }
      }

      // Validar entrada
      if (!this.validateInput(context)) {
        throw new Error(`Entrada inválida para o analisador ${this.config.name}`);
      }

      // Executar análise principal
      const startTime = Date.now();
      const result = await this.analyze(context);
      const processingTime = Date.now() - startTime;

      const finalResult: AnalysisResult = {
        ...result,
        processingTime,
        cacheKey: this.getCacheKey(context)
      };

      // Salvar no cache
      if (context.cacheEnabled) {
        this.setCache(context, finalResult);
      }

      // Resetar contador de erros em caso de sucesso
      this.errorCount = 0;
      this.lastError = undefined;

      return finalResult;

    } catch (error) {
      this.handleError(error as Error, context);
      
      // Retornar fallback se habilitado
      if (this.config.fallbackEnabled) {
        return this.createFallbackResult(context);
      }
      
      throw error;
    }
  }

  protected getFromCache(context: AnalysisContext): AnalysisResult | null {
    const key = this.getCacheKey(context);
    return this.cache.get(key) || null;
  }

  protected setCache(context: AnalysisContext, result: AnalysisResult): void {
    const key = this.getCacheKey(context);
    this.cache.set(key, result);
    
    // Limitar tamanho do cache (máximo 100 entradas)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  protected handleError(error: Error, context: AnalysisContext): void {
    this.errorCount++;
    this.lastError = error;
    
    console.error(`Erro no analisador ${this.config.name}:`, {
      error: error.message,
      stack: error.stack,
      context: {
        classification: context.classification,
        textLength: context.text.length,
        parameters: context.parameters
      },
      errorCount: this.errorCount,
      timestamp: new Date().toISOString()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implementar cálculo de hit rate
    };
  }

  getHealthStatus(): { healthy: boolean; errorCount: number; lastError?: string } {
    return {
      healthy: this.errorCount < 5,
      errorCount: this.errorCount,
      lastError: this.lastError?.message
    };
  }
}
