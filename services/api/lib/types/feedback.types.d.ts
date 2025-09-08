/**
 * Tipos para Sistema de Validação de Negócio e Feedback
 *
 * Este arquivo define as interfaces para coleta de feedback dos usuários,
 * métricas de satisfação e tracking de uso de parâmetros personalizados.
 */
import { z } from 'zod';
/** Tipos de feedback que podem ser coletados */
export declare enum FeedbackType {
    ANALYSIS_QUALITY = "analysis_quality",
    PARAMETER_USEFULNESS = "parameter_usefulness",
    SYSTEM_USABILITY = "system_usability",
    FEATURE_REQUEST = "feature_request",
    BUG_REPORT = "bug_report",
    GENERAL = "general"
}
/** Status do feedback */
export declare enum FeedbackStatus {
    PENDING = "pending",
    REVIEWED = "reviewed",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
/** Escala de satisfação (1-5) */
export declare enum SatisfactionRating {
    VERY_DISSATISFIED = 1,
    DISSATISFIED = 2,
    NEUTRAL = 3,
    SATISFIED = 4,
    VERY_SATISFIED = 5
}
/** Schema para feedback do usuário */
export declare const FeedbackSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    organizationId: z.ZodString;
    analysisId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof FeedbackType>;
    rating: z.ZodNativeEnum<typeof SatisfactionRating>;
    title: z.ZodString;
    description: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof FeedbackStatus>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    response: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: FeedbackStatus;
    organizationId: string;
    type: FeedbackType;
    title: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description: string;
    userId: string;
    rating: SatisfactionRating;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    analysisId?: string | undefined;
    response?: string | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}, {
    organizationId: string;
    type: FeedbackType;
    title: string;
    description: string;
    userId: string;
    rating: SatisfactionRating;
    status?: FeedbackStatus | undefined;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    analysisId?: string | undefined;
    response?: string | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}>;
/** Schema para métricas de uso de parâmetros */
export declare const ParameterUsageSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    organizationId: z.ZodString;
    analysisId: z.ZodString;
    parameterId: z.ZodString;
    parameterName: z.ZodString;
    parameterType: z.ZodString;
    usageCount: z.ZodDefault<z.ZodNumber>;
    lastUsed: z.ZodDefault<z.ZodDate>;
    effectiveness: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    createdAt: Date;
    userId: string;
    analysisId: string;
    lastUsed: Date;
    parameterId: string;
    parameterName: string;
    parameterType: string;
    usageCount: number;
    id?: string | undefined;
    effectiveness?: number | undefined;
}, {
    organizationId: string;
    userId: string;
    analysisId: string;
    parameterId: string;
    parameterName: string;
    parameterType: string;
    id?: string | undefined;
    createdAt?: Date | undefined;
    lastUsed?: Date | undefined;
    usageCount?: number | undefined;
    effectiveness?: number | undefined;
}>;
/** Schema para métricas de satisfação agregadas */
export declare const SatisfactionMetricsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodString;
    period: z.ZodString;
    date: z.ZodDate;
    totalFeedbacks: z.ZodDefault<z.ZodNumber>;
    averageRating: z.ZodDefault<z.ZodNumber>;
    npsScore: z.ZodDefault<z.ZodNumber>;
    satisfactionDistribution: z.ZodObject<{
        veryDissatisfied: z.ZodDefault<z.ZodNumber>;
        dissatisfied: z.ZodDefault<z.ZodNumber>;
        neutral: z.ZodDefault<z.ZodNumber>;
        satisfied: z.ZodDefault<z.ZodNumber>;
        verySatisfied: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        veryDissatisfied: number;
        dissatisfied: number;
        neutral: number;
        satisfied: number;
        verySatisfied: number;
    }, {
        veryDissatisfied?: number | undefined;
        dissatisfied?: number | undefined;
        neutral?: number | undefined;
        satisfied?: number | undefined;
        verySatisfied?: number | undefined;
    }>;
    topIssues: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    topFeatureRequests: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    period: string;
    totalFeedbacks: number;
    averageRating: number;
    npsScore: number;
    satisfactionDistribution: {
        veryDissatisfied: number;
        dissatisfied: number;
        neutral: number;
        satisfied: number;
        verySatisfied: number;
    };
    topIssues: string[];
    topFeatureRequests: string[];
    id?: string | undefined;
}, {
    organizationId: string;
    date: Date;
    period: string;
    satisfactionDistribution: {
        veryDissatisfied?: number | undefined;
        dissatisfied?: number | undefined;
        neutral?: number | undefined;
        satisfied?: number | undefined;
        verySatisfied?: number | undefined;
    };
    id?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    totalFeedbacks?: number | undefined;
    averageRating?: number | undefined;
    npsScore?: number | undefined;
    topIssues?: string[] | undefined;
    topFeatureRequests?: string[] | undefined;
}>;
/** Schema para tracking de eventos de negócio */
export declare const BusinessEventSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    organizationId: z.ZodString;
    eventType: z.ZodString;
    eventData: z.ZodRecord<z.ZodString, z.ZodAny>;
    sessionId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDefault<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    timestamp: Date;
    userId: string;
    eventType: string;
    eventData: Record<string, any>;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    sessionId?: string | undefined;
}, {
    organizationId: string;
    userId: string;
    eventType: string;
    eventData: Record<string, any>;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    timestamp?: Date | undefined;
    sessionId?: string | undefined;
}>;
export interface Feedback extends z.infer<typeof FeedbackSchema> {
}
export interface ParameterUsage extends z.infer<typeof ParameterUsageSchema> {
}
export interface SatisfactionMetrics extends z.infer<typeof SatisfactionMetricsSchema> {
}
export interface BusinessEvent extends z.infer<typeof BusinessEventSchema> {
}
/** Dados para análise de valor de parâmetros personalizados */
export interface ParameterValueAnalysis {
    parameterId: string;
    parameterName: string;
    usageFrequency: number;
    averageSatisfaction: number;
    adoptionRate: number;
    retentionRate: number;
    effectivenessScore: number;
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
            confidence: number;
            evidence: string[];
            metrics: ParameterValueAnalysis[];
        };
        userSatisfaction: {
            target: number;
            actual: number;
            trend: 'improving' | 'stable' | 'declining';
        };
        featureAdoption: {
            customParameters: number;
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
/** Schema para criação de feedback */
export declare const CreateFeedbackRequestSchema: z.ZodObject<{
    analysisId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof FeedbackType>;
    rating: z.ZodNativeEnum<typeof SatisfactionRating>;
    title: z.ZodString;
    description: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: FeedbackType;
    title: string;
    description: string;
    rating: SatisfactionRating;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    analysisId?: string | undefined;
}, {
    type: FeedbackType;
    title: string;
    description: string;
    rating: SatisfactionRating;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    analysisId?: string | undefined;
}>;
/** Schema para query de feedback */
export declare const GetFeedbackQuerySchema: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof FeedbackStatus>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: FeedbackStatus | undefined;
    organizationId?: string | undefined;
    type?: FeedbackType | undefined;
    limit?: number | undefined;
    userId?: string | undefined;
    offset?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    status?: FeedbackStatus | undefined;
    organizationId?: string | undefined;
    type?: FeedbackType | undefined;
    limit?: number | undefined;
    userId?: string | undefined;
    offset?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
/** Schema para tracking de uso de parâmetros */
export declare const TrackParameterUsageSchema: z.ZodObject<{
    analysisId: z.ZodString;
    parameterId: z.ZodString;
    parameterName: z.ZodString;
    parameterType: z.ZodString;
    effectiveness: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    analysisId: string;
    parameterId: string;
    parameterName: string;
    parameterType: string;
    effectiveness?: number | undefined;
}, {
    analysisId: string;
    parameterId: string;
    parameterName: string;
    parameterType: string;
    effectiveness?: number | undefined;
}>;
/** Schema para análise de valor de parâmetros */
export declare const AnalyzeParameterValueSchema: z.ZodObject<{
    parameterId: z.ZodString;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    parameterId: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    parameterId: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
/** Schema para query de relatório de negócio */
export declare const BusinessReportQuerySchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    includeHypotheses: z.ZodOptional<z.ZodBoolean>;
    includeRecommendations: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    startDate: string;
    endDate: string;
    includeHypotheses?: boolean | undefined;
    includeRecommendations?: boolean | undefined;
}, {
    organizationId: string;
    startDate: string;
    endDate: string;
    includeHypotheses?: boolean | undefined;
    includeRecommendations?: boolean | undefined;
}>;
/** Schema para configuração de feedback */
export declare const FeedbackConfigSchema: z.ZodObject<{
    organizationId: z.ZodString;
    enabled: z.ZodBoolean;
    triggers: z.ZodObject<{
        afterAnalysis: z.ZodBoolean;
        onParameterCreation: z.ZodBoolean;
        onError: z.ZodBoolean;
        periodic: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        afterAnalysis: boolean;
        onParameterCreation: boolean;
        onError: boolean;
        periodic: boolean;
    }, {
        afterAnalysis: boolean;
        onParameterCreation: boolean;
        onError: boolean;
        periodic: boolean;
    }>;
    frequency: z.ZodObject<{
        maxPerDay: z.ZodNumber;
        cooldownHours: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        maxPerDay: number;
        cooldownHours: number;
    }, {
        maxPerDay: number;
        cooldownHours: number;
    }>;
    customQuestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        question: z.ZodString;
        type: z.ZodEnum<["rating", "text", "multiple_choice"]>;
        required: z.ZodBoolean;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "rating" | "multiple_choice";
        id: string;
        required: boolean;
        question: string;
        options?: string[] | undefined;
    }, {
        type: "text" | "rating" | "multiple_choice";
        id: string;
        required: boolean;
        question: string;
        options?: string[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
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
    customQuestions?: {
        type: "text" | "rating" | "multiple_choice";
        id: string;
        required: boolean;
        question: string;
        options?: string[] | undefined;
    }[] | undefined;
}, {
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
    customQuestions?: {
        type: "text" | "rating" | "multiple_choice";
        id: string;
        required: boolean;
        question: string;
        options?: string[] | undefined;
    }[] | undefined;
}>;
export interface CreateFeedbackRequest extends z.infer<typeof CreateFeedbackRequestSchema> {
}
export type GetFeedbackQuery = z.infer<typeof GetFeedbackQuerySchema>;
export interface TrackParameterUsage extends z.infer<typeof TrackParameterUsageSchema> {
}
export interface AnalyzeParameterValue extends z.infer<typeof AnalyzeParameterValueSchema> {
}
export interface BusinessReportQuery extends z.infer<typeof BusinessReportQuerySchema> {
}
export interface FeedbackConfig extends z.infer<typeof FeedbackConfigSchema> {
}
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
