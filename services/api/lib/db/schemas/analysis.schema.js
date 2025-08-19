"use strict";
/**
 * Firestore Schema: Analysis Collection
 *
 * Collection: /analyses/{analysisId}/
 * Structure for independent analysis records and history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_COLLECTIONS = exports.AnalysisStatisticsSchema = exports.AnalysisHistoryEntrySchema = exports.AnalysisSchema = void 0;
const zod_1 = require("zod");
// Analysis Schema for independent analysis records
exports.AnalysisSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    userId: zod_1.z.string(), // User who requested the analysis
    // Analysis Configuration
    analysisType: zod_1.z.enum(['FULL', 'QUICK', 'CUSTOM', 'COMPLIANCE_ONLY']),
    configurationId: zod_1.z.string(), // Custom parameters used
    templateId: zod_1.z.string().optional(),
    // Analysis Request Details
    request: zod_1.z.object({
        priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
        options: zod_1.z.object({
            includeAI: zod_1.z.boolean(),
            generateRecommendations: zod_1.z.boolean(),
            detailedMetrics: zod_1.z.boolean(),
            customRules: zod_1.z.array(zod_1.z.string()) // Rule IDs
        }),
        webhook: zod_1.z.string().url().optional(),
        timeout: zod_1.z.number().int().positive().default(300) // seconds
    }),
    // Processing Information
    processing: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'INITIALIZING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT']),
        progress: zod_1.z.number().min(0).max(100),
        currentStep: zod_1.z.string().optional(),
        estimatedTimeRemaining: zod_1.z.number().optional(), // seconds
        // Timestamps
        startedAt: zod_1.z.date().optional(),
        completedAt: zod_1.z.date().optional(),
        // Processing Metrics
        metrics: zod_1.z.object({
            totalProcessingTime: zod_1.z.number().optional(), // milliseconds
            preprocessingTime: zod_1.z.number().optional(),
            analysisTime: zod_1.z.number().optional(),
            postprocessingTime: zod_1.z.number().optional(),
            // Resource Usage
            cpuTime: zod_1.z.number().optional(),
            memoryUsed: zod_1.z.number().optional(), // bytes
            apiCallsCount: zod_1.z.number().int().min(0).optional(),
            // Analysis Specific
            rulesProcessed: zod_1.z.number().int().min(0).optional(),
            sectionsAnalyzed: zod_1.z.number().int().min(0).optional(),
            patternsMatched: zod_1.z.number().int().min(0).optional()
        }).optional(),
        // Error Information
        error: zod_1.z.object({
            code: zod_1.z.string(),
            message: zod_1.z.string(),
            details: zod_1.z.record(zod_1.z.any()).optional(),
            stack: zod_1.z.string().optional(),
            retryCount: zod_1.z.number().int().min(0).default(0)
        }).optional()
    }),
    // Analysis Results (when completed)
    results: zod_1.z.object({
        // Overall Scores
        scores: zod_1.z.object({
            overall: zod_1.z.number().min(0).max(100),
            // Category Scores
            structural: zod_1.z.number().min(0).max(100),
            legal: zod_1.z.number().min(0).max(100),
            clarity: zod_1.z.number().min(0).max(100),
            abnt: zod_1.z.number().min(0).max(100),
            // Weighted Scores (using organization weights)
            weightedStructural: zod_1.z.number().min(0).max(100),
            weightedLegal: zod_1.z.number().min(0).max(100),
            weightedClarity: zod_1.z.number().min(0).max(100),
            weightedAbnt: zod_1.z.number().min(0).max(100),
            // Confidence Metrics
            confidence: zod_1.z.number().min(0).max(1),
            reliability: zod_1.z.number().min(0).max(1).optional()
        }),
        // Problems Found
        problems: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            ruleId: zod_1.z.string().optional(),
            category: zod_1.z.enum(['ESTRUTURAL', 'JURIDICO', 'CLAREZA', 'ABNT', 'CONFORMIDADE', 'COMPLETUDE']),
            severity: zod_1.z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
            // Problem Details
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            suggestion: zod_1.z.string().optional(),
            // Location Information
            location: zod_1.z.object({
                page: zod_1.z.number().int().positive().optional(),
                paragraph: zod_1.z.number().int().positive().optional(),
                section: zod_1.z.string().optional(),
                startPosition: zod_1.z.number().int().optional(),
                endPosition: zod_1.z.number().int().optional(),
                context: zod_1.z.string().optional() // Surrounding text
            }).optional(),
            // Impact and Confidence
            impact: zod_1.z.number().min(0).max(10),
            confidence: zod_1.z.number().min(0).max(1),
            autoFixAvailable: zod_1.z.boolean().default(false),
            // Status
            status: zod_1.z.enum(['OPEN', 'ACKNOWLEDGED', 'FIXED', 'IGNORED', 'FALSE_POSITIVE']).default('OPEN'),
            resolvedBy: zod_1.z.string().optional(),
            resolvedAt: zod_1.z.date().optional(),
            resolution: zod_1.z.string().optional()
        })),
        // Recommendations
        recommendations: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            category: zod_1.z.string(),
            // Action Information
            actionRequired: zod_1.z.string(),
            estimatedEffort: zod_1.z.string().optional(), // "5 minutes", "1 hour", etc.
            // Expected Impact
            expectedImprovement: zod_1.z.number().min(0).max(100).optional(),
            complianceImprovement: zod_1.z.boolean().default(false)
        })),
        // Compliance Information
        compliance: zod_1.z.object({
            overallCompliance: zod_1.z.number().min(0).max(100),
            requiredItems: zod_1.z.array(zod_1.z.object({
                item: zod_1.z.string(),
                present: zod_1.z.boolean(),
                location: zod_1.z.string().optional(),
                notes: zod_1.z.string().optional()
            })),
            missingRequirements: zod_1.z.array(zod_1.z.string()),
            additionalNotes: zod_1.z.string().optional()
        }).optional(),
        // Quality Metrics
        quality: zod_1.z.object({
            readability: zod_1.z.number().min(0).max(100),
            consistency: zod_1.z.number().min(0).max(100),
            completeness: zod_1.z.number().min(0).max(100),
            clarity: zod_1.z.number().min(0).max(100),
            // Text Statistics
            averageSentenceLength: zod_1.z.number().optional(),
            complexWordsPercentage: zod_1.z.number().min(0).max(100).optional(),
            passiveVoicePercentage: zod_1.z.number().min(0).max(100).optional(),
            // Document Statistics
            wordCount: zod_1.z.number().int().min(0),
            sentenceCount: zod_1.z.number().int().min(0),
            paragraphCount: zod_1.z.number().int().min(0)
        }).optional(),
        // Executive Summary
        executiveSummary: zod_1.z.object({
            overallAssessment: zod_1.z.string(),
            keyFindings: zod_1.z.array(zod_1.z.string()),
            keyRisks: zod_1.z.array(zod_1.z.string()),
            priorityRecommendations: zod_1.z.array(zod_1.z.string()),
            nextSteps: zod_1.z.array(zod_1.z.string()),
            conclusion: zod_1.z.string()
        }).optional()
    }).optional(),
    // Analysis Engine Information
    engine: zod_1.z.object({
        name: zod_1.z.string().default('licitareview-v2'),
        version: zod_1.z.string().default('2.0.0'),
        cloudRunEndpoint: zod_1.z.string().url().optional(),
        fallbackUsed: zod_1.z.boolean().default(false),
        cacheHit: zod_1.z.boolean().default(false)
    }),
    // Audit and Metadata
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    // Additional Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
// Analysis History Entry Schema
exports.AnalysisHistoryEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    analysisId: zod_1.z.string(),
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    // Change Information
    changeType: zod_1.z.enum(['STATUS_CHANGE', 'PROGRESS_UPDATE', 'ERROR_OCCURRED', 'RESULT_UPDATED', 'CANCELLED']),
    previousValue: zod_1.z.any().optional(),
    newValue: zod_1.z.any().optional(),
    // Context
    description: zod_1.z.string(),
    triggeredBy: zod_1.z.string(), // User ID or system
    // Timestamps
    timestamp: zod_1.z.date(),
    // Additional Data
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Analysis Statistics Schema
exports.AnalysisStatisticsSchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    period: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    // Time Range
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    // Analysis Counts
    totalAnalyses: zod_1.z.number().int().min(0),
    completedAnalyses: zod_1.z.number().int().min(0),
    failedAnalyses: zod_1.z.number().int().min(0),
    cancelledAnalyses: zod_1.z.number().int().min(0),
    // Performance Metrics
    averageProcessingTime: zod_1.z.number().min(0), // seconds
    averageScore: zod_1.z.number().min(0).max(100),
    // Score Distribution
    scoreDistribution: zod_1.z.object({
        excellent: zod_1.z.number().int().min(0), // 90-100
        good: zod_1.z.number().int().min(0), // 75-89
        acceptable: zod_1.z.number().int().min(0), // 60-74
        poor: zod_1.z.number().int().min(0), // 40-59
        critical: zod_1.z.number().int().min(0) // 0-39
    }),
    // Common Issues
    commonProblems: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.string(),
        type: zod_1.z.string(),
        count: zod_1.z.number().int().min(0),
        percentage: zod_1.z.number().min(0).max(100)
    })),
    // Usage Patterns
    analysisTypeDistribution: zod_1.z.record(zod_1.z.number().int().min(0)),
    peakUsageHours: zod_1.z.array(zod_1.z.number().int().min(0).max(23)),
    // Generated timestamp
    generatedAt: zod_1.z.date(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Collection constants
exports.ANALYSIS_COLLECTIONS = {
    ANALYSES: 'analyses',
    HISTORY: 'analysis_history',
    STATISTICS: 'analysis_statistics'
};
//# sourceMappingURL=analysis.schema.js.map