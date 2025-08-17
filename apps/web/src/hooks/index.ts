// Hooks de Análise Adaptativa
export { useAnalysisConfig } from './useAnalysisConfig';
export { useAdaptiveAnalysis } from './useAdaptiveAnalysis';

// Hooks de Template
export { useTemplateManager } from './useTemplateManager';

// Tipos relacionados
export type {
  AnalysisParameter,
  AnalysisRule,
  OrganizationConfig,
  ConfigTemplate,
  AnalysisConfigFilters
} from './useAnalysisConfig';

export type {
  AdaptiveAnalysisRequest,
  AnalysisStatus,
  AnalysisProgress,
  AdaptiveAnalysisResult,
  AnalysisComparison
} from './useAdaptiveAnalysis';
