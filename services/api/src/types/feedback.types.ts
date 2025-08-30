/**
 * Tipos para Sistema de Validação de Negócio e Feedback
 * 
 * Este arquivo define as interfaces para coleta de feedback dos usuários,
 * métricas de satisfação e tracking de uso de parâmetros personalizados.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

/** Tipos de feedback que podem ser coletados */
export enum FeedbackType {
  ANALYSIS_QUALITY = 'analysis_quality',
  PARAMETER_USEFULNESS = 'parameter_usefulness',
  SYSTEM_USABILITY = 'system_usability',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  GENERAL = 'general'
}

/** Status do feedback */
export enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

/** Escala de satisfação (1-5) */
export enum SatisfactionRating {
  VERY_DISSATISFIED = 1,
  DISSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5
}

// ============================================================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ============================================================================

/** Schema para feedback do usuário */
export const FeedbackSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  organizationId: z.string(),
  analysisId: z.string().optional(), // Opcional para feedback geral
  type: z.nativeEnum(FeedbackType),
  rating: z.nativeEnum(SatisfactionRating),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  metadata: z.record(z.any()).optional(), // Dados contextuais adicionais
  status: z.nativeEnum(FeedbackStatus).default(FeedbackStatus.PENDING),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  response: z.string().optional() // Resposta da equipe
});

/** Schema para métricas de uso de parâmetros */
export const ParameterUsageSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  organizationId: z.string(),
  analysisId: z.string(),
  parameterId: z.string(),
  parameterName: z.string(),
  parameterType: z.string(), // 'custom' | 'default' | 'template'
  usageCount: z.number().default(1),
  lastUsed: z.date().default(() => new Date()),
  effectiveness: z.number().min(0).max(1).optional(), // 0-1 baseado em feedback
  createdAt: z.date().default(() => new Date())
});

/** Schema para métricas de satisfação agregadas */
export const SatisfactionMetricsSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  period: z.string(), // 'daily' | 'weekly' | 'monthly'
  date: z.date(),
  totalFeedbacks: z.number().default(0),
  averageRating: z.number().min(1).max(5).default(0),
  npsScore: z.number().min(-100).max(100).default(0), // Net Promoter Score
  satisfactionDistribution: z.object({
    veryDissatisfied: z.number().default(0),
    dissatisfied: z.number().default(0),
    neutral: z.number().default(0),
    satisfied: z.number().default(0),
    verySatisfied: z.number().default(0)
  }),
  topIssues: z.array(z.string()).default([]),
  topFeatureRequests: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

/** Schema para tracking de eventos de negócio */
export const BusinessEventSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  organizationId: z.string(),
  eventType: z.string(), // 'parameter_created', 'analysis_completed', etc.
  eventData: z.record(z.any()),
  sessionId: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

export interface Feedback extends z.infer<typeof FeedbackSchema> {}
export interface ParameterUsage extends z.infer<typeof ParameterUsageSchema> {}
export interface SatisfactionMetrics extends z.infer<typeof SatisfactionMetricsSchema> {}
export interface BusinessEvent extends z.infer<typeof BusinessEventSchema> {}

// ============================================================================
// TIPOS PARA ANÁLISE E RELATÓRIOS
// ============================================================================

/** Dados para análise de valor de parâmetros personalizados */
export interface ParameterValueAnalysis {
  parameterId: string;
  parameterName: string;
  usageFrequency: number;
  averageSatisfaction: number;
  adoptionRate: number; // % de usuários que usam este parâmetro
  retentionRate: number; // % de usuários que continuam usando
  effectivenessScore: number; // Baseado em feedback e resultados
  trends: {
    weekly: number[];
    monthly: number[];
  };
}

/** Relatório de validação de hipóteses de negócio */
export interface BusinessValidationReport {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  hypotheses: {
    customParametersValue: {
      validated: boolean;
      confidence: number; // 0-1
      evidence: string[];
      metrics: ParameterValueAnalysis[];
    };
    userSatisfaction: {
      target: number; // Meta de NPS
      actual: number; // NPS atual
      trend: 'improving' | 'stable' | 'declining';
    };
    featureAdoption: {
      customParameters: number; // % de usuários usando
      advancedFeatures: number;
      overallEngagement: number;
    };
  };
  recommendations: string[];
  nextActions: string[];
}

/** Configuração para coleta de feedback */
export interface FeedbackConfig {
  organizationId: string;
  enabled: boolean;
  triggers: {
    afterAnalysis: boolean;
    onParameterCreation: boolean;
    onError: boolean;
    periodic: boolean;
  };
  frequency: {
    maxPerDay: number;
    cooldownHours: number;
  };
  customQuestions: {
    id: string;
    question: string;
    type: 'rating' | 'text' | 'multiple_choice';
    required: boolean;
    options?: string[];
  }[];
}

// ============================================================================
// SCHEMAS PARA REQUESTS DA API
// ============================================================================

/** Schema para criação de feedback */
export const CreateFeedbackRequestSchema = z.object({
  analysisId: z.string().optional(),
  type: z.nativeEnum(FeedbackType),
  rating: z.nativeEnum(SatisfactionRating),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

/** Schema para query de feedback */
export const GetFeedbackQuerySchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  type: z.nativeEnum(FeedbackType).optional(),
  status: z.nativeEnum(FeedbackStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

/** Schema para tracking de uso de parâmetros */
export const TrackParameterUsageSchema = z.object({
  analysisId: z.string(),
  parameterId: z.string(),
  parameterName: z.string(),
  parameterType: z.string(),
  effectiveness: z.number().min(0).max(1).optional()
});

/** Schema para análise de valor de parâmetros */
export const AnalyzeParameterValueSchema = z.object({
  parameterId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

/** Schema para query de relatório de negócio */
export const BusinessReportQuerySchema = z.object({
  organizationId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  includeHypotheses: z.boolean().optional(),
  includeRecommendations: z.boolean().optional()
});

/** Schema para configuração de feedback */
export const FeedbackConfigSchema = z.object({
  organizationId: z.string(),
  enabled: z.boolean(),
  triggers: z.object({
    afterAnalysis: z.boolean(),
    onParameterCreation: z.boolean(),
    onError: z.boolean(),
    periodic: z.boolean()
  }),
  frequency: z.object({
    maxPerDay: z.number().min(1),
    cooldownHours: z.number().min(1)
  }),
  customQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(['rating', 'text', 'multiple_choice']),
    required: z.boolean(),
    options: z.array(z.string()).optional()
  })).optional()
});

// ============================================================================
// TIPOS PARA REQUESTS E RESPONSES DA API
// ============================================================================

export interface CreateFeedbackRequest extends z.infer<typeof CreateFeedbackRequestSchema> {}
export type GetFeedbackQuery = z.infer<typeof GetFeedbackQuerySchema>;
export interface TrackParameterUsage extends z.infer<typeof TrackParameterUsageSchema> {}
export interface AnalyzeParameterValue extends z.infer<typeof AnalyzeParameterValueSchema> {}
export interface BusinessReportQuery extends z.infer<typeof BusinessReportQuerySchema> {}
export interface FeedbackConfig extends z.infer<typeof FeedbackConfigSchema> {}

export interface FeedbackResponse {
  id: string;
  status: FeedbackStatus;
  createdAt: Date;
  message: string;
}



export interface BusinessMetricsResponse {
  satisfaction: SatisfactionMetrics;
  parameterUsage: ParameterUsage[];
  validationReport: BusinessValidationReport;
  trends: {
    userGrowth: number[];
    engagementRate: number[];
    satisfactionTrend: number[];
  };
}