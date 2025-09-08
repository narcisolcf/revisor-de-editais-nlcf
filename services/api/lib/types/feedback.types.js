"use strict";
/**
 * Tipos para Sistema de Validação de Negócio e Feedback
 *
 * Este arquivo define as interfaces para coleta de feedback dos usuários,
 * métricas de satisfação e tracking de uso de parâmetros personalizados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackConfigSchema = exports.BusinessReportQuerySchema = exports.AnalyzeParameterValueSchema = exports.TrackParameterUsageSchema = exports.GetFeedbackQuerySchema = exports.CreateFeedbackRequestSchema = exports.BusinessEventSchema = exports.SatisfactionMetricsSchema = exports.ParameterUsageSchema = exports.FeedbackSchema = exports.SatisfactionRating = exports.FeedbackStatus = exports.FeedbackType = void 0;
const zod_1 = require("zod");
// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================
/** Tipos de feedback que podem ser coletados */
var FeedbackType;
(function (FeedbackType) {
    FeedbackType["ANALYSIS_QUALITY"] = "analysis_quality";
    FeedbackType["PARAMETER_USEFULNESS"] = "parameter_usefulness";
    FeedbackType["SYSTEM_USABILITY"] = "system_usability";
    FeedbackType["FEATURE_REQUEST"] = "feature_request";
    FeedbackType["BUG_REPORT"] = "bug_report";
    FeedbackType["GENERAL"] = "general";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
/** Status do feedback */
var FeedbackStatus;
(function (FeedbackStatus) {
    FeedbackStatus["PENDING"] = "pending";
    FeedbackStatus["REVIEWED"] = "reviewed";
    FeedbackStatus["RESOLVED"] = "resolved";
    FeedbackStatus["DISMISSED"] = "dismissed";
})(FeedbackStatus || (exports.FeedbackStatus = FeedbackStatus = {}));
/** Escala de satisfação (1-5) */
var SatisfactionRating;
(function (SatisfactionRating) {
    SatisfactionRating[SatisfactionRating["VERY_DISSATISFIED"] = 1] = "VERY_DISSATISFIED";
    SatisfactionRating[SatisfactionRating["DISSATISFIED"] = 2] = "DISSATISFIED";
    SatisfactionRating[SatisfactionRating["NEUTRAL"] = 3] = "NEUTRAL";
    SatisfactionRating[SatisfactionRating["SATISFIED"] = 4] = "SATISFIED";
    SatisfactionRating[SatisfactionRating["VERY_SATISFIED"] = 5] = "VERY_SATISFIED";
})(SatisfactionRating || (exports.SatisfactionRating = SatisfactionRating = {}));
// ============================================================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ============================================================================
/** Schema para feedback do usuário */
exports.FeedbackSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    analysisId: zod_1.z.string().optional(), // Opcional para feedback geral
    type: zod_1.z.nativeEnum(FeedbackType),
    rating: zod_1.z.nativeEnum(SatisfactionRating),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    metadata: zod_1.z.record(zod_1.z.any()).optional(), // Dados contextuais adicionais
    status: zod_1.z.nativeEnum(FeedbackStatus).default(FeedbackStatus.PENDING),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    reviewedBy: zod_1.z.string().optional(),
    reviewedAt: zod_1.z.date().optional(),
    response: zod_1.z.string().optional() // Resposta da equipe
});
/** Schema para métricas de uso de parâmetros */
exports.ParameterUsageSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    analysisId: zod_1.z.string(),
    parameterId: zod_1.z.string(),
    parameterName: zod_1.z.string(),
    parameterType: zod_1.z.string(), // 'custom' | 'default' | 'template'
    usageCount: zod_1.z.number().default(1),
    lastUsed: zod_1.z.date().default(() => new Date()),
    effectiveness: zod_1.z.number().min(0).max(1).optional(), // 0-1 baseado em feedback
    createdAt: zod_1.z.date().default(() => new Date())
});
/** Schema para métricas de satisfação agregadas */
exports.SatisfactionMetricsSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    organizationId: zod_1.z.string(),
    period: zod_1.z.string(), // 'daily' | 'weekly' | 'monthly'
    date: zod_1.z.date(),
    totalFeedbacks: zod_1.z.number().default(0),
    averageRating: zod_1.z.number().min(1).max(5).default(0),
    npsScore: zod_1.z.number().min(-100).max(100).default(0), // Net Promoter Score
    satisfactionDistribution: zod_1.z.object({
        veryDissatisfied: zod_1.z.number().default(0),
        dissatisfied: zod_1.z.number().default(0),
        neutral: zod_1.z.number().default(0),
        satisfied: zod_1.z.number().default(0),
        verySatisfied: zod_1.z.number().default(0)
    }),
    topIssues: zod_1.z.array(zod_1.z.string()).default([]),
    topFeatureRequests: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date())
});
/** Schema para tracking de eventos de negócio */
exports.BusinessEventSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    eventType: zod_1.z.string(), // 'parameter_created', 'analysis_completed', etc.
    eventData: zod_1.z.record(zod_1.z.any()),
    sessionId: zod_1.z.string().optional(),
    timestamp: zod_1.z.date().default(() => new Date()),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// ============================================================================
// SCHEMAS PARA REQUESTS DA API
// ============================================================================
/** Schema para criação de feedback */
exports.CreateFeedbackRequestSchema = zod_1.z.object({
    analysisId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(FeedbackType),
    rating: zod_1.z.nativeEnum(SatisfactionRating),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
/** Schema para query de feedback */
exports.GetFeedbackQuerySchema = zod_1.z.object({
    organizationId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(FeedbackType).optional(),
    status: zod_1.z.nativeEnum(FeedbackStatus).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.number().min(1).max(100).optional(),
    offset: zod_1.z.number().min(0).optional()
});
/** Schema para tracking de uso de parâmetros */
exports.TrackParameterUsageSchema = zod_1.z.object({
    analysisId: zod_1.z.string(),
    parameterId: zod_1.z.string(),
    parameterName: zod_1.z.string(),
    parameterType: zod_1.z.string(),
    effectiveness: zod_1.z.number().min(0).max(1).optional()
});
/** Schema para análise de valor de parâmetros */
exports.AnalyzeParameterValueSchema = zod_1.z.object({
    parameterId: zod_1.z.string(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional()
});
/** Schema para query de relatório de negócio */
exports.BusinessReportQuerySchema = zod_1.z.object({
    organizationId: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    includeHypotheses: zod_1.z.boolean().optional(),
    includeRecommendations: zod_1.z.boolean().optional()
});
/** Schema para configuração de feedback */
exports.FeedbackConfigSchema = zod_1.z.object({
    organizationId: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    triggers: zod_1.z.object({
        afterAnalysis: zod_1.z.boolean(),
        onParameterCreation: zod_1.z.boolean(),
        onError: zod_1.z.boolean(),
        periodic: zod_1.z.boolean()
    }),
    frequency: zod_1.z.object({
        maxPerDay: zod_1.z.number().min(1),
        cooldownHours: zod_1.z.number().min(1)
    }),
    customQuestions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        question: zod_1.z.string(),
        type: zod_1.z.enum(['rating', 'text', 'multiple_choice']),
        required: zod_1.z.boolean(),
        options: zod_1.z.array(zod_1.z.string()).optional()
    })).optional()
});
//# sourceMappingURL=feedback.types.js.map