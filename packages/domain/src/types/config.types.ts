/**
 * Configuration Types - 🚀 CORE DIFFERENTIATOR
 * 
 * Types for the personalized analysis parameters system,
 * which is the main competitive advantage of LicitaReview.
 */

import { z } from 'zod';
import { DocumentType } from './document.types';

// Enums
/* eslint-disable no-unused-vars */
export enum AnalysisPreset {
  RIGOROUS = 'RIGOROUS',
  STANDARD = 'STANDARD', 
  TECHNICAL = 'TECHNICAL',
  FAST = 'FAST',
  CUSTOM = 'CUSTOM'
}

export enum WeightDistributionType {
  BALANCED = 'BALANCED',
  LEGAL_FOCUSED = 'LEGAL_FOCUSED',
  TECHNICAL_FOCUSED = 'TECHNICAL_FOCUSED',
  STRUCTURAL_FOCUSED = 'STRUCTURAL_FOCUSED',
  CUSTOM = 'CUSTOM'
}

export enum ProblemCategory {
  ESTRUTURAL = 'ESTRUTURAL',
  JURIDICO = 'JURIDICO',
  CLAREZA = 'CLAREZA',
  ABNT = 'ABNT',
  CONFORMIDADE = 'CONFORMIDADE',
  COMPLETUDE = 'COMPLETUDE'
}
/* eslint-enable no-unused-vars */

// Zod Schemas
export const AnalysisPresetSchema = z.nativeEnum(AnalysisPreset);
export const WeightDistributionTypeSchema = z.nativeEnum(WeightDistributionType);
export const ProblemCategorySchema = z.nativeEnum(ProblemCategory);

// 🚀 CORE DIFFERENTIATOR: Analysis Weights
export const AnalysisWeightsSchema = z.object({
  structural: z.number().min(0).max(100),
  legal: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  abnt: z.number().min(0).max(100)
}).refine(
  (data) => {
    const total = data.structural + data.legal + data.clarity + data.abnt;
    return Math.abs(total - 100) < 0.01;
  },
  {
    message: 'Analysis weights must sum to exactly 100%',
    path: ['weights']
  }
);

export const CustomRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  pattern: z.string(),
  patternType: z.enum(['regex', 'keyword', 'phrase']).default('regex'),
  severity: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  category: ProblemCategorySchema,
  message: z.string(),
  suggestion: z.string().optional(),
  appliesToDocumentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  isActive: z.boolean().default(true),
  weight: z.number().min(0).max(10).default(1),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const TemplateSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()).default([]),
  validationRules: z.array(z.string()).default([]),
  order: z.number().int().min(0)
});

export const OrganizationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  sections: z.array(TemplateSectionSchema),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// 🚀 CORE: Organization Configuration
export const OrganizationConfigSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  weights: AnalysisWeightsSchema,
  presetType: AnalysisPresetSchema,
  customRules: z.array(CustomRuleSchema).default([]),
  templates: z.array(OrganizationTemplateSchema).default([]),
  settings: z.object({
    enableAIAnalysis: z.boolean().default(false),
    enableCustomRules: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    autoApproval: z.boolean().default(false),
    requireDualApproval: z.boolean().default(false),
    maxDocumentSize: z.number().positive().default(52428800), // 50MB
    allowedDocumentTypes: z.array(z.string()).default(['pdf', 'doc', 'docx']),
    retentionDays: z.number().int().positive().default(365)
  }).optional(),
  metadata: z.record(z.any()).optional(),
  version: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional()
});

// TypeScript Types (inferred from schemas)
export type AnalysisWeights = z.infer<typeof AnalysisWeightsSchema>;
export type CustomRule = z.infer<typeof CustomRuleSchema>;
export type TemplateSection = z.infer<typeof TemplateSectionSchema>;
export type OrganizationTemplate = z.infer<typeof OrganizationTemplateSchema>;
export type OrganizationConfig = z.infer<typeof OrganizationConfigSchema>;

// API Request/Response Types
export const CreateConfigRequestSchema = OrganizationConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true
});

export const UpdateConfigRequestSchema = OrganizationConfigSchema.partial().omit({
  id: true,
  createdAt: true,
  organizationId: true
});

export const ConfigSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  presetType: AnalysisPresetSchema,
  dominantCategory: z.string(),
  distributionType: WeightDistributionTypeSchema,
  totalCustomRules: z.number().int().min(0),
  isActive: z.boolean(),
  version: z.number().int().positive(),
  lastModified: z.date()
});

export type CreateConfigRequest = z.infer<typeof CreateConfigRequestSchema>;
export type UpdateConfigRequest = z.infer<typeof UpdateConfigRequestSchema>;
export type ConfigSummary = z.infer<typeof ConfigSummarySchema>;

// Preset Configurations
export const PRESET_WEIGHTS: Record<AnalysisPreset, AnalysisWeights> = {
  [AnalysisPreset.RIGOROUS]: {
    structural: 15.0,
    legal: 60.0,
    clarity: 20.0,
    abnt: 5.0
  },
  [AnalysisPreset.STANDARD]: {
    structural: 25.0,
    legal: 25.0,
    clarity: 25.0,
    abnt: 25.0
  },
  [AnalysisPreset.TECHNICAL]: {
    structural: 35.0,
    legal: 25.0,
    clarity: 15.0,
    abnt: 25.0
  },
  [AnalysisPreset.FAST]: {
    structural: 30.0,
    legal: 40.0,
    clarity: 20.0,
    abnt: 10.0
  },
  [AnalysisPreset.CUSTOM]: {
    structural: 25.0,
    legal: 25.0,
    clarity: 25.0,
    abnt: 25.0
  }
};