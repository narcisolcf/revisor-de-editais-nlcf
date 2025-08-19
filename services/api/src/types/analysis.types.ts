/**
 * Analysis Types - TypeScript equivalent to Python AnalysisModels
 * LicitaReview Cloud Functions
 */

import { z } from "zod";

// Enums
/* eslint-disable no-unused-vars */
export enum ProblemSeverity {
  CRITICA = "CRITICA",
  ALTA = "ALTA", 
  MEDIA = "MEDIA",
  BAIXA = "BAIXA"
}

export enum ProblemCategory {
  ESTRUTURAL = "ESTRUTURAL",
  JURIDICO = "JURIDICO",
  CLAREZA = "CLAREZA", 
  ABNT = "ABNT",
  CONFORMIDADE = "CONFORMIDADE",
  COMPLETUDE = "COMPLETUDE"
}
/* eslint-enable no-unused-vars */

// Zod Schemas
export const ProblemSeveritySchema = z.nativeEnum(ProblemSeverity);
export const ProblemCategorySchema = z.nativeEnum(ProblemCategory);

export const ConformityScoreSchema = z.object({
  structural: z.number().min(0).max(100),
  legal: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  abnt: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  calculatedAt: z.date().default(() => new Date())
});

export const AnalysisFindingSchema = z.object({
  id: z.string().optional(),
  category: ProblemCategorySchema,
  severity: ProblemSeveritySchema,
  title: z.string().min(1),
  description: z.string(),
  suggestion: z.string().optional(),
  location: z.string().optional(),
  regulatoryReference: z.string().optional(),
  impactScore: z.number().min(0).max(10),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  foundAt: z.date().default(() => new Date())
});

export const AnalysisResultSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  organizationId: z.string(),
  conformityScores: ConformityScoreSchema,
  weightedScore: z.number().min(0).max(100),
  findings: z.array(AnalysisFindingSchema),
  recommendations: z.array(z.string()),
  appliedConfigId: z.string(),
  appliedConfigHash: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]).default("pending"),
  executionTimeSeconds: z.number().positive(),
  analysisMetadata: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  error: z.string().optional()
});

export const AnalysisRequestSchema = z.object({
  documentId: z.string(),
  organizationId: z.string(),
  configId: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  analysisType: z.enum(["quick", "standard", "deep"]).default("standard"),
  options: z.object({
    includeAIAnalysis: z.boolean().default(false),
    runCustomRules: z.boolean().default(true),
    generateRecommendations: z.boolean().default(true),
    extractKeyMetrics: z.boolean().default(true)
  }).optional(),
  requestedBy: z.string(),
  requestedAt: z.date().default(() => new Date())
});

// TypeScript Types
export type ConformityScore = z.infer<typeof ConformityScoreSchema>;
export type AnalysisFinding = z.infer<typeof AnalysisFindingSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

// API Response Types
export const AnalysisExecutiveSummarySchema = z.object({
  documentId: z.string(),
  overallScore: z.number().min(0).max(100),
  weightedScore: z.number().min(0).max(100),
  totalFindings: z.number().int().min(0),
  criticalIssues: z.number().int().min(0),
  highPriorityIssues: z.number().int().min(0),
  mediumPriorityIssues: z.number().int().min(0),
  lowPriorityIssues: z.number().int().min(0),
  recommendations: z.array(z.string()),
  topConcerns: z.array(z.string()),
  completionPercentage: z.number().min(0).max(100),
  estimatedResolutionTime: z.string().optional(),
  analysisQuality: z.enum(["excellent", "good", "fair", "poor"]),
  generatedAt: z.date().default(() => new Date())
});

export type AnalysisExecutiveSummary = z.infer<typeof AnalysisExecutiveSummarySchema>;

// Utility functions
export const calculateOverallScore = (scores: ConformityScore): number => {
  return (scores.structural + scores.legal + scores.clarity + scores.abnt) / 4;
};

export const calculateWeightedScore = (
  scores: ConformityScore,
  weights: { structural: number; legal: number; clarity: number; abnt: number }
): number => {
  const totalWeight = weights.structural + weights.legal + weights.clarity + weights.abnt;
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error(`Weights must sum to 100%. Current sum: ${totalWeight}%`);
  }
  
  return (
    (scores.structural * weights.structural / 100) +
    (scores.legal * weights.legal / 100) +
    (scores.clarity * weights.clarity / 100) +
    (scores.abnt * weights.abnt / 100)
  );
};

export const getCategoryRating = (score: number): string => {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Boa";
  if (score >= 70) return "Regular";
  if (score >= 60) return "Ruim";
  return "Crítica";
};

export const getSeverityColor = (severity: ProblemSeverity): string => {
  const colors = {
    [ProblemSeverity.CRITICA]: "#dc2626",
    [ProblemSeverity.ALTA]: "#ea580c",
    [ProblemSeverity.MEDIA]: "#d97706",
    [ProblemSeverity.BAIXA]: "#65a30d"
  };
  return colors[severity];
};

export const getSeverityWeight = (severity: ProblemSeverity): number => {
  const weights = {
    [ProblemSeverity.CRITICA]: 10,
    [ProblemSeverity.ALTA]: 7,
    [ProblemSeverity.MEDIA]: 5,
    [ProblemSeverity.BAIXA]: 2
  };
  return weights[severity];
};

export const groupFindingsBySeverity = (findings: AnalysisFinding[]) => {
  return findings.reduce((groups, finding) => {
    const severity = finding.severity;
    if (!groups[severity]) {
      groups[severity] = [];
    }
    groups[severity].push(finding);
    return groups;
  }, {} as Record<ProblemSeverity, AnalysisFinding[]>);
};

export const groupFindingsByCategory = (findings: AnalysisFinding[]) => {
  return findings.reduce((groups, finding) => {
    const category = finding.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(finding);
    return groups;
  }, {} as Record<ProblemCategory, AnalysisFinding[]>);
};

export const generateExecutiveSummary = (result: AnalysisResult): AnalysisExecutiveSummary => {
  const findingsBySeverity = groupFindingsBySeverity(result.findings);
  
  return {
    documentId: result.documentId,
    overallScore: result.conformityScores.overall,
    weightedScore: result.weightedScore,
    totalFindings: result.findings.length,
    criticalIssues: findingsBySeverity[ProblemSeverity.CRITICA]?.length || 0,
    highPriorityIssues: findingsBySeverity[ProblemSeverity.ALTA]?.length || 0,
    mediumPriorityIssues: findingsBySeverity[ProblemSeverity.MEDIA]?.length || 0,
    lowPriorityIssues: findingsBySeverity[ProblemSeverity.BAIXA]?.length || 0,
    recommendations: result.recommendations,
    topConcerns: result.findings
      .filter(f => f.severity === ProblemSeverity.CRITICA || f.severity === ProblemSeverity.ALTA)
      .slice(0, 5)
      .map(f => f.title),
    completionPercentage: Math.round(result.weightedScore),
    analysisQuality: result.weightedScore >= 85 ? "excellent" : 
                    result.weightedScore >= 70 ? "good" :
                    result.weightedScore >= 50 ? "fair" : "poor",
    generatedAt: new Date()
  };
};