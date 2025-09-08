export interface AnalysisWeights {
  structural: number;
  legal: number;
  clarity: number;
  abnt: number;
  budgetary: number;
  formal: number;
  general: number;
}

export interface CustomRule {
  id: string;
  name: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationConfig {
  id: string;
  organizationId: string;
  weights: AnalysisWeights;
  customRules: CustomRule[];
  preset: AnalysisPreset;
  enabledFeatures: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AnalysisPreset {
  STRICT = 'strict',
  BALANCED = 'balanced',
  LENIENT = 'lenient',
  CUSTOM = 'custom'
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WeightValidationResult {
  isValid: boolean;
  totalWeight: number;
  errors: string[];
}