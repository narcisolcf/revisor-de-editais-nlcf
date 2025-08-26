// Sistema de Análise por Categoria
export { BaseAnalyzer } from './analyzers/BaseAnalyzer';
export type { AnalysisContext, AnalysisResult, AnalyzerConfig } from './analyzers/BaseAnalyzer';
export { StructuralAnalyzer } from './analyzers/StructuralAnalyzer';
export { LegalAnalyzer } from './analyzers/LegalAnalyzer';
export { ClarityAnalyzer } from './analyzers/ClarityAnalyzer';
export { ABNTAnalyzer } from './analyzers/ABNTAnalyzer';

// Sistema de Cache Inteligente
export { IntelligentCache } from './cache/IntelligentCache';
export type { CacheConfig, CacheMetrics, CacheEntry } from './cache/IntelligentCache';

// Sistema de Fallback
export { FallbackSystem } from './fallback/FallbackSystem';
export type { 
  FallbackConfig, 
  FallbackStrategy, 
  FallbackMetrics, 
  FallbackLogEntry 
} from './fallback/FallbackSystem';

// Orquestrador Principal
export { AnalysisOrchestrator } from './AnalysisOrchestrator';
export type { 
  OrchestratorConfig, 
  ComprehensiveAnalysisResult 
} from './AnalysisOrchestrator';

// Tipos e interfaces comuns
export type {
  Problem,
  DocumentClassification,
  AnalysisMetrics
} from '@/types/document';
