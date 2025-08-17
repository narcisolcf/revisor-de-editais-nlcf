// Serviços de Análise Adaptativa
export { AnalysisConfigService, analysisConfigService } from './AnalysisConfigService';

// Tipos relacionados aos serviços
export type {
  CreateConfigRequest,
  UpdateConfigRequest,
  BatchUpdateRequest,
  ConfigValidationResult,
  ConfigImpactAnalysis
} from './AnalysisConfigService';

// Re-exportar serviços de análise existentes
export * from './analysis';
export * from './documentAnalysisService';
