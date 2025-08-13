// Sistema de Análise por Categoria
export { BaseAnalyzer, AnalysisContext, AnalysisResult, AnalyzerConfig } from './analyzers/BaseAnalyzer';
export { StructuralAnalyzer } from './analyzers/StructuralAnalyzer';
export { LegalAnalyzer } from './analyzers/LegalAnalyzer';
export { ClarityAnalyzer } from './analyzers/ClarityAnalyzer';
export { ABNTAnalyzer } from './analyzers/ABNTAnalyzer';

// Sistema de Cache Inteligente
export { IntelligentCache, CacheConfig, CacheMetrics, CacheEntry } from './cache/IntelligentCache';

// Sistema de Fallback
export { 
  FallbackSystem, 
  FallbackConfig, 
  FallbackStrategy, 
  FallbackMetrics, 
  FallbackLogEntry 
} from './fallback/FallbackSystem';

// Orquestrador Principal
export { 
  AnalysisOrchestrator, 
  OrchestratorConfig, 
  ComprehensiveAnalysisResult 
} from './AnalysisOrchestrator';

// Tipos e interfaces comuns
export type {
  Problem,
  DocumentClassification,
  AnalysisMetrics
} from '@/types/document';
