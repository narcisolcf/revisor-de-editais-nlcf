/**
 * Analysis Types
 * Tipos relacionados à análise de documentos
 */

import { z } from 'zod';

// Enums
/* eslint-disable no-unused-vars */
export enum AnalysisStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ProblemSeverity {
  CRITICA = 'CRITICA',
  ALTA = 'ALTA',
  MEDIA = 'MEDIA', 
  BAIXA = 'BAIXA'
}
/* eslint-enable no-unused-vars */

// Schemas
export const AnalysisResultSchema = z.object({
  id: z.string(),
  analysisId: z.string().optional(),
  documentId: z.string(),
  organizationId: z.string(),
  status: z.nativeEnum(AnalysisStatus),
  conformityScore: z.number().min(0).max(100),
  problems: z.array(z.object({
    id: z.string(),
    type: z.string(),
    severity: z.nativeEnum(ProblemSeverity),
    description: z.string(),
    location: z.object({
      page: z.number().optional(),
      section: z.string().optional(),
      line: z.number().optional()
    }).optional(),
    suggestion: z.string().optional(),
    ruleId: z.string().optional()
  })),
  executedAt: z.date(),
  completedAt: z.date().optional(),
  executedBy: z.string(),
  metadata: z.record(z.unknown()).optional()
});

export const AnalysisConfigSchema = z.object({
  rules: z.array(z.string()),
  strictMode: z.boolean().default(false),
  includeWarnings: z.boolean().default(true),
  customParameters: z.record(z.unknown()).optional()
});

// Types
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;
export type Problem = AnalysisResult['problems'][0];

// Request/Response types
export interface AnalysisRequest {
  documentId: string;
  config?: AnalysisConfig;
}

export interface AnalysisResponse {
  analysisId: string;
  status: AnalysisStatus;
  estimatedCompletionTime?: number;
}