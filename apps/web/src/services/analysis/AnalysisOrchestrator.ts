import { DocumentClassification, Problem, AnalysisMetrics } from '@/types/document';
import { BaseAnalyzer, AnalysisContext, AnalysisResult } from './analyzers/BaseAnalyzer';
import { StructuralAnalyzer } from './analyzers/StructuralAnalyzer';
import { LegalAnalyzer } from './analyzers/LegalAnalyzer';
import { ClarityAnalyzer } from './analyzers/ClarityAnalyzer';
import { ABNTAnalyzer } from './analyzers/ABNTAnalyzer';
import { IntelligentCache } from './cache/IntelligentCache';
import { FallbackSystem } from './fallback/FallbackSystem';

export interface OrchestratorConfig {
  enableCache: boolean;
  enableFallback: boolean;
  enableParallelProcessing: boolean;
  maxConcurrentAnalyses: number;
  timeout: number;
  enableMetrics: boolean;
  enableLogging: boolean;
}

export interface ComprehensiveAnalysisResult {
  overallScore: number;
  overallConfidence: number;
  totalProcessingTime: number;
  problems: Problem[];
  metrics: Record<string, any>;
  categoryResults: {
    structural: AnalysisResult;
    legal: AnalysisResult;
    clarity: AnalysisResult;
    abnt: AnalysisResult;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  fallbackStats: {
    totalFallbacks: number;
    successfulFallbacks: number;
    failedFallbacks: number;
  };
}

export class AnalysisOrchestrator {
  private analyzers: Map<string, BaseAnalyzer> = new Map();
  private cache: IntelligentCache;
  private fallbackSystem: FallbackSystem;
  private config: OrchestratorConfig;
  private activeAnalyses: Set<string> = new Set();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      enableCache: true,
      enableFallback: true,
      enableParallelProcessing: true,
      maxConcurrentAnalyses: 5,
      timeout: 30000,
      enableMetrics: true,
      enableLogging: true,
      ...config
    };

    this.initializeAnalyzers();
    this.cache = new IntelligentCache();
    this.fallbackSystem = new FallbackSystem();
  }

  async analyzeDocument(
    text: string,
    classification: DocumentClassification,
    parameters: Record<string, any> = {}
  ): Promise<ComprehensiveAnalysisResult> {
    const analysisId = this.generateAnalysisId();
    
    try {
      // Verificar limite de análises concorrentes
      if (this.activeAnalyses.size >= this.config.maxConcurrentAnalyses) {
        throw new Error('Limite de análises concorrentes atingido');
      }

      this.activeAnalyses.add(analysisId);
      const startTime = Date.now();

      // Criar contexto de análise
      const context: AnalysisContext = {
        text,
        classification,
        parameters,
        cacheEnabled: this.config.enableCache
      };

      // Verificar cache primeiro
      let cachedResult: AnalysisResult | null = null;
      if (this.config.enableCache) {
        cachedResult = await this.cache.get(context);
      }

      if (cachedResult) {
        // Retornar resultado do cache
        const cacheStats = this.cache.getCacheStats();
        return this.createComprehensiveResult(
          cachedResult,
          { structural: cachedResult, legal: cachedResult, clarity: cachedResult, abnt: cachedResult },
          Date.now() - startTime,
          cacheStats,
          { totalFallbacks: 0, successfulFallbacks: 0, failedFallbacks: 0 }
        );
      }

      // Executar análises
      let results: Record<string, AnalysisResult>;
      
      if (this.config.enableParallelProcessing) {
        results = await this.executeParallelAnalysis(context);
      } else {
        results = await this.executeSequentialAnalysis(context);
      }

      // Calcular resultado geral
      const overallResult = this.calculateOverallResult(results);

      // Salvar no cache
      if (this.config.enableCache) {
        await this.cache.set(context, overallResult);
      }

      // Obter estatísticas
      const cacheStats = this.cache.getCacheStats();
      const fallbackStats = this.fallbackSystem.getMetrics();

      return this.createComprehensiveResult(
        overallResult,
        results,
        Date.now() - startTime,
        cacheStats,
        fallbackStats
      );

    } catch (error) {
      // Executar com fallback se habilitado
      if (this.config.enableFallback) {
        return await this.executeWithFallback(text, classification, parameters, error as Error);
      }
      
      throw error;
    } finally {
      this.activeAnalyses.delete(analysisId);
    }
  }

  private async executeParallelAnalysis(context: AnalysisContext): Promise<Record<string, AnalysisResult>> {
    const analysisPromises = [
      this.executeAnalyzerWithFallback('structural', context),
      this.executeAnalyzerWithFallback('legal', context),
      this.executeAnalyzerWithFallback('clarity', context),
      this.executeAnalyzerWithFallback('abnt', context)
    ];

    const results = await Promise.allSettled(analysisPromises);
    
    return {
      structural: this.handleAnalysisResult(results[0], 'structural'),
      legal: this.handleAnalysisResult(results[1], 'legal'),
      clarity: this.handleAnalysisResult(results[2], 'clarity'),
      abnt: this.handleAnalysisResult(results[3], 'abnt')
    };
  }

  private async executeSequentialAnalysis(context: AnalysisContext): Promise<Record<string, AnalysisResult>> {
    const results: Record<string, AnalysisResult> = {};

    results.structural = await this.executeAnalyzerWithFallback('structural', context);
    results.legal = await this.executeAnalyzerWithFallback('legal', context);
    results.clarity = await this.executeAnalyzerWithFallback('clarity', context);
    results.abnt = await this.executeAnalyzerWithFallback('abnt', context);

    return results;
  }

  private async executeAnalyzerWithFallback(
    analyzerType: string,
    context: AnalysisContext
  ): Promise<AnalysisResult> {
    const analyzer = this.analyzers.get(analyzerType);
    if (!analyzer) {
      throw new Error(`Analisador '${analyzerType}' não encontrado`);
    }

    try {
      return await analyzer.analyzeWithFallback(context);
    } catch (error) {
      if (this.config.enableFallback) {
        return await this.fallbackSystem.executeWithFallback(
          () => analyzer.analyzeWithFallback(context),
          context,
          error as Error
        );
      }
      throw error;
    }
  }

  private handleAnalysisResult(
    result: PromiseSettledResult<AnalysisResult>,
    analyzerType: string
  ): AnalysisResult {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Criar resultado de fallback para análise falhada
      return {
        problems: [{
          tipo: 'inconsistencia',
          descricao: `Análise ${analyzerType} falhou: ${result.reason.message}`,
          gravidade: 'baixa',
          localizacao: `Analisador ${analyzerType}`,
          sugestaoCorrecao: 'Verificar configurações do analisador',
          categoria: 'formal'
        }],
        metrics: { 
          totalClauses: 0,
          validClauses: 0,
          missingClauses: 0,
          inconsistencies: 1,
          processingTime: 0
        },
        score: 50,
        confidence: 20,
        processingTime: 0
      };
    }
  }

  private async executeWithFallback(
    text: string,
    classification: DocumentClassification,
    parameters: Record<string, any>,
    error: Error
  ): Promise<ComprehensiveAnalysisResult> {
    const context: AnalysisContext = {
      text,
      classification,
      parameters,
      cacheEnabled: false
    };

    // Executar análise básica com fallback
    const basicResult = await this.fallbackSystem.executeWithFallback(
      async () => {
        // Tentar análise básica
        const structuralAnalyzer = this.analyzers.get('structural');
        if (structuralAnalyzer) {
          return await structuralAnalyzer.analyzeWithFallback(context);
        }
        throw new Error('Nenhum analisador disponível');
      },
      context,
      error
    );

    // Criar resultado básico
    const basicResults = {
      structural: basicResult,
      legal: basicResult,
      clarity: basicResult,
      abnt: basicResult
    };

    const overallResult = this.calculateOverallResult(basicResults);
    const fallbackStats = this.fallbackSystem.getMetrics();

    return this.createComprehensiveResult(
      overallResult,
      basicResults,
      0,
      { hits: 0, misses: 0, hitRate: 0 },
      fallbackStats
    );
  }

  private calculateOverallResult(results: Record<string, AnalysisResult>): AnalysisResult {
    const allProblems: Problem[] = [];
    const allMetrics: Record<string, any> = {};
    let totalScore = 0;
    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let validResults = 0;

    Object.values(results).forEach(result => {
      if (result && result.problems) {
        allProblems.push(...result.problems);
        totalScore += result.score;
        totalConfidence += result.confidence;
        totalProcessingTime += result.processingTime;
        validResults++;

        // Mesclar métricas
        Object.assign(allMetrics, result.metrics);
      }
    });

    if (validResults === 0) {
      return {
        problems: [{
          tipo: 'inconsistencia',
          descricao: 'Todas as análises falharam',
          gravidade: 'critica',
          localizacao: 'Sistema de análise',
          sugestaoCorrecao: 'Verificar configurações dos analisadores',
          categoria: 'formal'
        }],
        metrics: { 
          totalClauses: 0,
          validClauses: 0,
          missingClauses: 0,
          inconsistencies: 1,
          processingTime: 0
        },
        score: 0,
        confidence: 0,
        processingTime: 0
      };
    }

    // Calcular médias
    const avgScore = totalScore / validResults;
    const avgConfidence = totalConfidence / validResults;

    // Ajustar score baseado no número de problemas
    const adjustedScore = Math.max(0, avgScore - (allProblems.length * 2));

    return {
      problems: allProblems,
      metrics: allMetrics,
      score: adjustedScore,
      confidence: avgConfidence,
      processingTime: totalProcessingTime
    };
  }

  private createComprehensiveResult(
    overallResult: AnalysisResult,
    categoryResults: Record<string, AnalysisResult>,
    totalProcessingTime: number,
    cacheStats: { hits: number; misses: number; hitRate: number },
    fallbackStats: { totalFallbacks: number; successfulFallbacks: number; failedFallbacks: number }
  ): ComprehensiveAnalysisResult {
    return {
      overallScore: overallResult.score,
      overallConfidence: overallResult.confidence,
      totalProcessingTime,
      problems: overallResult.problems,
      metrics: overallResult.metrics,
      categoryResults: {
        structural: categoryResults.structural,
        legal: categoryResults.legal,
        clarity: categoryResults.clarity,
        abnt: categoryResults.abnt
      },
      cacheStats,
      fallbackStats
    };
  }

  private initializeAnalyzers(): void {
    this.analyzers.set('structural', new StructuralAnalyzer());
    this.analyzers.set('legal', new LegalAnalyzer());
    this.analyzers.set('clarity', new ClarityAnalyzer());
    this.analyzers.set('abnt', new ABNTAnalyzer());
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos de gerenciamento e monitoramento
  async invalidateCache(parameters?: Record<string, any>): Promise<number> {
    if (parameters) {
      return await this.cache.invalidateByParameters(parameters);
    }
    
    this.cache.clear();
    return 0;
  }

  async invalidateCacheByClassification(classification: DocumentClassification): Promise<number> {
    return await this.cache.invalidateByClassification(classification);
  }

  getCacheMetrics() {
    return this.cache.getMetrics();
  }

  getFallbackMetrics() {
    return this.fallbackSystem.getMetrics();
  }

  getFallbackLogs(limit: number = 100) {
    return this.fallbackSystem.getLogs(limit);
  }

  getAnalyzerHealthStatus(): Record<string, { healthy: boolean; errorCount: number; lastError?: string }> {
    const status: Record<string, { healthy: boolean; errorCount: number; lastError?: string }> = {};
    
    for (const [name, analyzer] of this.analyzers.entries()) {
      status[name] = analyzer.getHealthStatus();
    }
    
    return status;
  }

  updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getActiveAnalysesCount(): number {
    return this.activeAnalyses.size;
  }

  // Métodos para análise específica por categoria
  async analyzeStructural(text: string, classification: DocumentClassification, parameters: Record<string, any> = {}): Promise<AnalysisResult> {
    const context: AnalysisContext = { text, classification, parameters, cacheEnabled: this.config.enableCache };
    const analyzer = this.analyzers.get('structural');
    
    if (!analyzer) {
      throw new Error('Analisador estrutural não encontrado');
    }

    return await analyzer.analyzeWithFallback(context);
  }

  async analyzeLegal(text: string, classification: DocumentClassification, parameters: Record<string, any> = {}): Promise<AnalysisResult> {
    const context: AnalysisContext = { text, classification, parameters, cacheEnabled: this.config.enableCache };
    const analyzer = this.analyzers.get('legal');
    
    if (!analyzer) {
      throw new Error('Analisador legal não encontrado');
    }

    return await analyzer.analyzeWithFallback(context);
  }

  async analyzeClarity(text: string, classification: DocumentClassification, parameters: Record<string, any> = {}): Promise<AnalysisResult> {
    const context: AnalysisContext = { text, classification, parameters, cacheEnabled: this.config.enableCache };
    const analyzer = this.analyzers.get('clarity');
    
    if (!analyzer) {
      throw new Error('Analisador de clareza não encontrado');
    }

    return await analyzer.analyzeWithFallback(context);
  }

  async analyzeABNT(text: string, classification: DocumentClassification, parameters: Record<string, any> = {}): Promise<AnalysisResult> {
    const context: AnalysisContext = { text, classification, parameters, cacheEnabled: this.config.enableCache };
    const analyzer = this.analyzers.get('abnt');
    
    if (!analyzer) {
      throw new Error('Analisador ABNT não encontrado');
    }

    return await analyzer.analyzeWithFallback(context);
  }
}
