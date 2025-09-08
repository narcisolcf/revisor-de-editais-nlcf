/**
 * Firestore Schema: Analysis Collection
 *
 * Collection: /analyses/{analysisId}/
 * Structure for independent analysis records and history
 */
import { z } from 'zod';
export declare const AnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    organizationId: z.ZodString;
    userId: z.ZodString;
    analysisType: z.ZodEnum<["FULL", "QUICK", "CUSTOM", "COMPLIANCE_ONLY"]>;
    configurationId: z.ZodString;
    templateId: z.ZodOptional<z.ZodString>;
    request: z.ZodObject<{
        priority: z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
        options: z.ZodObject<{
            includeAI: z.ZodBoolean;
            generateRecommendations: z.ZodBoolean;
            detailedMetrics: z.ZodBoolean;
            customRules: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        }, {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        }>;
        webhook: z.ZodOptional<z.ZodString>;
        timeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        options: {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        };
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        timeout: number;
        webhook?: string | undefined;
    }, {
        options: {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        };
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
        webhook?: string | undefined;
        timeout?: number | undefined;
    }>;
    processing: z.ZodObject<{
        status: z.ZodEnum<["PENDING", "INITIALIZING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "TIMEOUT"]>;
        progress: z.ZodNumber;
        currentStep: z.ZodOptional<z.ZodString>;
        estimatedTimeRemaining: z.ZodOptional<z.ZodNumber>;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        metrics: z.ZodOptional<z.ZodObject<{
            totalProcessingTime: z.ZodOptional<z.ZodNumber>;
            preprocessingTime: z.ZodOptional<z.ZodNumber>;
            analysisTime: z.ZodOptional<z.ZodNumber>;
            postprocessingTime: z.ZodOptional<z.ZodNumber>;
            cpuTime: z.ZodOptional<z.ZodNumber>;
            memoryUsed: z.ZodOptional<z.ZodNumber>;
            apiCallsCount: z.ZodOptional<z.ZodNumber>;
            rulesProcessed: z.ZodOptional<z.ZodNumber>;
            sectionsAnalyzed: z.ZodOptional<z.ZodNumber>;
            patternsMatched: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        }, {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        }>>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            stack: z.ZodOptional<z.ZodString>;
            retryCount: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            message: string;
            retryCount: number;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }, {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
            retryCount?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status: "PROCESSING" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INITIALIZING" | "TIMEOUT";
        progress: number;
        error?: {
            code: string;
            message: string;
            retryCount: number;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        metrics?: {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        } | undefined;
        estimatedTimeRemaining?: number | undefined;
    }, {
        status: "PROCESSING" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INITIALIZING" | "TIMEOUT";
        progress: number;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
            retryCount?: number | undefined;
        } | undefined;
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        metrics?: {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        } | undefined;
        estimatedTimeRemaining?: number | undefined;
    }>;
    results: z.ZodOptional<z.ZodObject<{
        scores: z.ZodObject<{
            overall: z.ZodNumber;
            structural: z.ZodNumber;
            legal: z.ZodNumber;
            clarity: z.ZodNumber;
            abnt: z.ZodNumber;
            weightedStructural: z.ZodNumber;
            weightedLegal: z.ZodNumber;
            weightedClarity: z.ZodNumber;
            weightedAbnt: z.ZodNumber;
            confidence: z.ZodNumber;
            reliability: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        }, {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        }>;
        problems: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ruleId: z.ZodOptional<z.ZodString>;
            category: z.ZodEnum<["ESTRUTURAL", "JURIDICO", "CLAREZA", "ABNT", "CONFORMIDADE", "COMPLETUDE"]>;
            severity: z.ZodEnum<["CRITICA", "ALTA", "MEDIA", "BAIXA"]>;
            title: z.ZodString;
            description: z.ZodString;
            suggestion: z.ZodOptional<z.ZodString>;
            location: z.ZodOptional<z.ZodObject<{
                page: z.ZodOptional<z.ZodNumber>;
                paragraph: z.ZodOptional<z.ZodNumber>;
                section: z.ZodOptional<z.ZodString>;
                startPosition: z.ZodOptional<z.ZodNumber>;
                endPosition: z.ZodOptional<z.ZodNumber>;
                context: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            }, {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            }>>;
            impact: z.ZodNumber;
            confidence: z.ZodNumber;
            autoFixAvailable: z.ZodDefault<z.ZodBoolean>;
            status: z.ZodDefault<z.ZodEnum<["OPEN", "ACKNOWLEDGED", "FIXED", "IGNORED", "FALSE_POSITIVE"]>>;
            resolvedBy: z.ZodOptional<z.ZodString>;
            resolvedAt: z.ZodOptional<z.ZodDate>;
            resolution: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            autoFixAvailable: boolean;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            resolution?: string | undefined;
        }, {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            status?: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE" | undefined;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            autoFixAvailable?: boolean | undefined;
            resolution?: string | undefined;
        }>, "many">;
        recommendations: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            priority: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
            category: z.ZodString;
            actionRequired: z.ZodString;
            estimatedEffort: z.ZodOptional<z.ZodString>;
            expectedImprovement: z.ZodOptional<z.ZodNumber>;
            complianceImprovement: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }, {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
            complianceImprovement?: boolean | undefined;
        }>, "many">;
        compliance: z.ZodOptional<z.ZodObject<{
            overallCompliance: z.ZodNumber;
            requiredItems: z.ZodArray<z.ZodObject<{
                item: z.ZodString;
                present: z.ZodBoolean;
                location: z.ZodOptional<z.ZodString>;
                notes: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }, {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }>, "many">;
            missingRequirements: z.ZodArray<z.ZodString, "many">;
            additionalNotes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        }, {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        }>>;
        quality: z.ZodOptional<z.ZodObject<{
            readability: z.ZodNumber;
            consistency: z.ZodNumber;
            completeness: z.ZodNumber;
            clarity: z.ZodNumber;
            averageSentenceLength: z.ZodOptional<z.ZodNumber>;
            complexWordsPercentage: z.ZodOptional<z.ZodNumber>;
            passiveVoicePercentage: z.ZodOptional<z.ZodNumber>;
            wordCount: z.ZodNumber;
            sentenceCount: z.ZodNumber;
            paragraphCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        }, {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        }>>;
        executiveSummary: z.ZodOptional<z.ZodObject<{
            overallAssessment: z.ZodString;
            keyFindings: z.ZodArray<z.ZodString, "many">;
            keyRisks: z.ZodArray<z.ZodString, "many">;
            priorityRecommendations: z.ZodArray<z.ZodString, "many">;
            nextSteps: z.ZodArray<z.ZodString, "many">;
            conclusion: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        }, {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        recommendations: {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }[];
        scores: {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        };
        problems: {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            autoFixAvailable: boolean;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            resolution?: string | undefined;
        }[];
        compliance?: {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        } | undefined;
        quality?: {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        } | undefined;
        executiveSummary?: {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        } | undefined;
    }, {
        recommendations: {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
            complianceImprovement?: boolean | undefined;
        }[];
        scores: {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        };
        problems: {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            status?: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE" | undefined;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            autoFixAvailable?: boolean | undefined;
            resolution?: string | undefined;
        }[];
        compliance?: {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        } | undefined;
        quality?: {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        } | undefined;
        executiveSummary?: {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        } | undefined;
    }>>;
    engine: z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        cloudRunEndpoint: z.ZodOptional<z.ZodString>;
        fallbackUsed: z.ZodDefault<z.ZodBoolean>;
        cacheHit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
        fallbackUsed: boolean;
        cacheHit: boolean;
        cloudRunEndpoint?: string | undefined;
    }, {
        name?: string | undefined;
        version?: string | undefined;
        cloudRunEndpoint?: string | undefined;
        fallbackUsed?: boolean | undefined;
        cacheHit?: boolean | undefined;
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    createdBy: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    documentId: string;
    processing: {
        status: "PROCESSING" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INITIALIZING" | "TIMEOUT";
        progress: number;
        error?: {
            code: string;
            message: string;
            retryCount: number;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        metrics?: {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        } | undefined;
        estimatedTimeRemaining?: number | undefined;
    };
    analysisType: "CUSTOM" | "FULL" | "QUICK" | "COMPLIANCE_ONLY";
    userId: string;
    configurationId: string;
    engine: {
        name: string;
        version: string;
        fallbackUsed: boolean;
        cacheHit: boolean;
        cloudRunEndpoint?: string | undefined;
    };
    request: {
        options: {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        };
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        timeout: number;
        webhook?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
    templateId?: string | undefined;
    results?: {
        recommendations: {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }[];
        scores: {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        };
        problems: {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            autoFixAvailable: boolean;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            resolution?: string | undefined;
        }[];
        compliance?: {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        } | undefined;
        quality?: {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        } | undefined;
        executiveSummary?: {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        } | undefined;
    } | undefined;
}, {
    organizationId: string;
    id: string;
    createdBy: string;
    documentId: string;
    processing: {
        status: "PROCESSING" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INITIALIZING" | "TIMEOUT";
        progress: number;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
            retryCount?: number | undefined;
        } | undefined;
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        metrics?: {
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
            patternsMatched?: number | undefined;
            sectionsAnalyzed?: number | undefined;
            preprocessingTime?: number | undefined;
            postprocessingTime?: number | undefined;
            rulesProcessed?: number | undefined;
        } | undefined;
        estimatedTimeRemaining?: number | undefined;
    };
    analysisType: "CUSTOM" | "FULL" | "QUICK" | "COMPLIANCE_ONLY";
    userId: string;
    configurationId: string;
    engine: {
        name?: string | undefined;
        version?: string | undefined;
        cloudRunEndpoint?: string | undefined;
        fallbackUsed?: boolean | undefined;
        cacheHit?: boolean | undefined;
    };
    request: {
        options: {
            generateRecommendations: boolean;
            customRules: string[];
            includeAI: boolean;
            detailedMetrics: boolean;
        };
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
        webhook?: string | undefined;
        timeout?: number | undefined;
    };
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    templateId?: string | undefined;
    results?: {
        recommendations: {
            category: string;
            id: string;
            title: string;
            description: string;
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            actionRequired: string;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
            complianceImprovement?: boolean | undefined;
        }[];
        scores: {
            structural: number;
            legal: number;
            clarity: number;
            abnt: number;
            overall: number;
            weightedStructural: number;
            weightedLegal: number;
            weightedClarity: number;
            weightedAbnt: number;
            confidence: number;
            reliability?: number | undefined;
        };
        problems: {
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
            id: string;
            title: string;
            description: string;
            confidence: number;
            impact: number;
            status?: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE" | undefined;
            suggestion?: string | undefined;
            location?: {
                page?: number | undefined;
                paragraph?: number | undefined;
                section?: string | undefined;
                startPosition?: number | undefined;
                endPosition?: number | undefined;
                context?: string | undefined;
            } | undefined;
            resolvedAt?: Date | undefined;
            resolvedBy?: string | undefined;
            ruleId?: string | undefined;
            autoFixAvailable?: boolean | undefined;
            resolution?: string | undefined;
        }[];
        compliance?: {
            overallCompliance: number;
            requiredItems: {
                item: string;
                present: boolean;
                location?: string | undefined;
                notes?: string | undefined;
            }[];
            missingRequirements: string[];
            additionalNotes?: string | undefined;
        } | undefined;
        quality?: {
            wordCount: number;
            clarity: number;
            readability: number;
            consistency: number;
            completeness: number;
            sentenceCount: number;
            paragraphCount: number;
            averageSentenceLength?: number | undefined;
            complexWordsPercentage?: number | undefined;
            passiveVoicePercentage?: number | undefined;
        } | undefined;
        executiveSummary?: {
            overallAssessment: string;
            keyFindings: string[];
            keyRisks: string[];
            priorityRecommendations: string[];
            nextSteps: string[];
            conclusion: string;
        } | undefined;
    } | undefined;
}>;
export declare const AnalysisHistoryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    analysisId: z.ZodString;
    documentId: z.ZodString;
    organizationId: z.ZodString;
    changeType: z.ZodEnum<["STATUS_CHANGE", "PROGRESS_UPDATE", "ERROR_OCCURRED", "RESULT_UPDATED", "CANCELLED"]>;
    previousValue: z.ZodOptional<z.ZodAny>;
    newValue: z.ZodOptional<z.ZodAny>;
    description: z.ZodString;
    triggeredBy: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    description: string;
    documentId: string;
    timestamp: Date;
    analysisId: string;
    changeType: "CANCELLED" | "STATUS_CHANGE" | "PROGRESS_UPDATE" | "ERROR_OCCURRED" | "RESULT_UPDATED";
    triggeredBy: string;
    metadata?: Record<string, any> | undefined;
    previousValue?: any;
    newValue?: any;
}, {
    organizationId: string;
    id: string;
    description: string;
    documentId: string;
    timestamp: Date;
    analysisId: string;
    changeType: "CANCELLED" | "STATUS_CHANGE" | "PROGRESS_UPDATE" | "ERROR_OCCURRED" | "RESULT_UPDATED";
    triggeredBy: string;
    metadata?: Record<string, any> | undefined;
    previousValue?: any;
    newValue?: any;
}>;
export declare const AnalysisStatisticsSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    period: z.ZodEnum<["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    totalAnalyses: z.ZodNumber;
    completedAnalyses: z.ZodNumber;
    failedAnalyses: z.ZodNumber;
    cancelledAnalyses: z.ZodNumber;
    averageProcessingTime: z.ZodNumber;
    averageScore: z.ZodNumber;
    scoreDistribution: z.ZodObject<{
        excellent: z.ZodNumber;
        good: z.ZodNumber;
        acceptable: z.ZodNumber;
        poor: z.ZodNumber;
        critical: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    }, {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    }>;
    commonProblems: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        type: z.ZodString;
        count: z.ZodNumber;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        category: string;
        type: string;
        count: number;
        percentage: number;
    }, {
        category: string;
        type: string;
        count: number;
        percentage: number;
    }>, "many">;
    analysisTypeDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    peakUsageHours: z.ZodArray<z.ZodNumber, "many">;
    generatedAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    generatedAt: Date;
    averageScore: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate: Date;
    endDate: Date;
    totalAnalyses: number;
    completedAnalyses: number;
    failedAnalyses: number;
    cancelledAnalyses: number;
    averageProcessingTime: number;
    scoreDistribution: {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    };
    commonProblems: {
        category: string;
        type: string;
        count: number;
        percentage: number;
    }[];
    analysisTypeDistribution: Record<string, number>;
    peakUsageHours: number[];
    metadata?: Record<string, any> | undefined;
}, {
    organizationId: string;
    id: string;
    generatedAt: Date;
    averageScore: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate: Date;
    endDate: Date;
    totalAnalyses: number;
    completedAnalyses: number;
    failedAnalyses: number;
    cancelledAnalyses: number;
    averageProcessingTime: number;
    scoreDistribution: {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    };
    commonProblems: {
        category: string;
        type: string;
        count: number;
        percentage: number;
    }[];
    analysisTypeDistribution: Record<string, number>;
    peakUsageHours: number[];
    metadata?: Record<string, any> | undefined;
}>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type AnalysisHistoryEntry = z.infer<typeof AnalysisHistoryEntrySchema>;
export type AnalysisStatistics = z.infer<typeof AnalysisStatisticsSchema>;
export declare const ANALYSIS_COLLECTIONS: {
    readonly ANALYSES: "analyses";
    readonly HISTORY: "analysis_history";
    readonly STATISTICS: "analysis_statistics";
};
