/**
 * Config Types - TypeScript equivalent to Python ConfigModels (CORE DIFFERENTIATOR)
 * LicitaReview Cloud Functions
 */

import { z } from "zod";
import { DocumentType } from "./document.types";
import { ProblemSeverity, ProblemCategory } from "./analysis.types";

// Enums
export enum AnalysisPreset {
  RIGOROUS = "RIGOROUS",
  STANDARD = "STANDARD",
  TECHNICAL = "TECHNICAL", 
  FAST = "FAST",
  CUSTOM = "CUSTOM"
}

export enum WeightDistributionType {
  BALANCED = "BALANCED",
  LEGAL_FOCUSED = "LEGAL_FOCUSED",
  TECHNICAL_FOCUSED = "TECHNICAL_FOCUSED",
  STRUCTURAL_FOCUSED = "STRUCTURAL_FOCUSED",
  CUSTOM = "CUSTOM"
}

// Zod Schemas
export const AnalysisPresetSchema = z.nativeEnum(AnalysisPreset);
export const WeightDistributionTypeSchema = z.nativeEnum(WeightDistributionType);

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
    message: "A soma dos pesos deve ser exatamente 100%",
    path: ["weights"]
  }
);

export const CustomRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  pattern: z.string(),
  patternType: z.enum(["regex", "keyword", "phrase"]).default("regex"),
  severity: z.nativeEnum(ProblemSeverity),
  category: z.nativeEnum(ProblemCategory),
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
    allowedDocumentTypes: z.array(z.string()).default(["pdf", "doc", "docx"]),
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

// TypeScript Types
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

// Utility Functions
export const createDefaultConfig = (
  organizationId: string,
  organizationName: string,
  preset: AnalysisPreset,
  createdBy: string
): Omit<OrganizationConfig, 'id'> => ({
  organizationId,
  organizationName,
  weights: PRESET_WEIGHTS[preset],
  presetType: preset,
  customRules: [],
  templates: [],
  version: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy
});

export const calculateWeightsSum = (weights: AnalysisWeights): number => {
  return weights.structural + weights.legal + weights.clarity + weights.abnt;
};

export const validateWeights = (weights: AnalysisWeights): boolean => {
  const sum = calculateWeightsSum(weights);
  return Math.abs(sum - 100) < 0.01;
};

export const getDominantCategory = (weights: AnalysisWeights): string => {
  const categories = [
    { name: "structural", value: weights.structural },
    { name: "legal", value: weights.legal },
    { name: "clarity", value: weights.clarity },
    { name: "abnt", value: weights.abnt }
  ];
  
  return categories.reduce((max, current) => 
    current.value > max.value ? current : max
  ).name;
};

export const getWeightDistributionType = (weights: AnalysisWeights): WeightDistributionType => {
  const dominant = getDominantCategory(weights);
  const dominantValue = weights[dominant as keyof AnalysisWeights];
  
  // Check if balanced (all weights within 10% of each other)
  const values = [weights.structural, weights.legal, weights.clarity, weights.abnt];
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (max - min <= 10) {
    return WeightDistributionType.BALANCED;
  }
  
  // Check specific focus types
  if (dominant === "legal" && dominantValue >= 50) {
    return WeightDistributionType.LEGAL_FOCUSED;
  }
  
  if ((dominant === "structural" || dominant === "abnt") && dominantValue >= 35) {
    return WeightDistributionType.TECHNICAL_FOCUSED;
  }
  
  if (dominant === "structural" && dominantValue >= 40) {
    return WeightDistributionType.STRUCTURAL_FOCUSED;
  }
  
  return WeightDistributionType.CUSTOM;
};

export const toPercentageDict = (weights: AnalysisWeights): Record<string, string> => ({
  structural: `${weights.structural.toFixed(1)}%`,
  legal: `${weights.legal.toFixed(1)}%`,
  clarity: `${weights.clarity.toFixed(1)}%`,
  abnt: `${weights.abnt.toFixed(1)}%`
});

export const generateConfigHash = (config: OrganizationConfig): string => {
  // Simple hash function for config versioning/caching
  const hashString = JSON.stringify({
    weights: config.weights,
    customRules: config.customRules.map(r => ({ name: r.name, pattern: r.pattern })),
    presetType: config.presetType
  });
  
  // Simple hash implementation (in production, use a proper crypto hash)
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
};

export const createConfigSummary = (config: OrganizationConfig): ConfigSummary => ({
  id: config.id,
  organizationId: config.organizationId,
  organizationName: config.organizationName,
  presetType: config.presetType,
  dominantCategory: getDominantCategory(config.weights),
  distributionType: getWeightDistributionType(config.weights),
  totalCustomRules: config.customRules.length,
  isActive: config.isActive,
  version: config.version,
  lastModified: config.updatedAt
});

export const testPatternMatch = (rule: CustomRule, text: string): boolean => {
  try {
    if (rule.patternType === "regex") {
      const regex = new RegExp(rule.pattern, "gi");
      return regex.test(text);
    } else if (rule.patternType === "keyword") {
      return text.toLowerCase().includes(rule.pattern.toLowerCase());
    } else if (rule.patternType === "phrase") {
      return text.toLowerCase().includes(rule.pattern.toLowerCase());
    }
    return false;
  } catch (error) {
    console.error(`Error testing pattern "${rule.pattern}":`, error);
    return false;
  }
};