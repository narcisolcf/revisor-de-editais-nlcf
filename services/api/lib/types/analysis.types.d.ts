/**
 * Analysis Types - TypeScript equivalent to Python AnalysisModels
 * LicitaReview Cloud Functions
 */
import { z } from "zod";
export declare enum ProblemSeverity {
    CRITICA = "CRITICA",
    ALTA = "ALTA",
    MEDIA = "MEDIA",
    BAIXA = "BAIXA"
}
export declare enum ProblemCategory {
    ESTRUTURAL = "ESTRUTURAL",
    JURIDICO = "JURIDICO",
    CLAREZA = "CLAREZA",
    ABNT = "ABNT",
    CONFORMIDADE = "CONFORMIDADE",
    COMPLETUDE = "COMPLETUDE"
}
export declare const ProblemSeveritySchema: z.ZodNativeEnum<typeof ProblemSeverity>;
export declare const ProblemCategorySchema: z.ZodNativeEnum<typeof ProblemCategory>;
export declare const ConformityScoreSchema: z.ZodObject<{
    structural: z.ZodNumber;
    legal: z.ZodNumber;
    clarity: z.ZodNumber;
    abnt: z.ZodNumber;
    overall: z.ZodNumber;
    calculatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
    overall: number;
    calculatedAt: Date;
}, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
    overall: number;
    calculatedAt?: Date | undefined;
}>;
export declare const AnalysisFindingSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    category: z.ZodNativeEnum<typeof ProblemCategory>;
    severity: z.ZodNativeEnum<typeof ProblemSeverity>;
    title: z.ZodString;
    description: z.ZodString;
    suggestion: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    regulatoryReference: z.ZodOptional<z.ZodString>;
    impactScore: z.ZodNumber;
    isResolved: z.ZodDefault<z.ZodBoolean>;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    resolvedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    foundAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    impactScore: number;
    isResolved: boolean;
    foundAt: Date;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    suggestion?: string | undefined;
    location?: string | undefined;
    regulatoryReference?: string | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
}, {
    title: string;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    impactScore: number;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    suggestion?: string | undefined;
    location?: string | undefined;
    regulatoryReference?: string | undefined;
    isResolved?: boolean | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
    foundAt?: Date | undefined;
}>;
export declare const AnalysisResultSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    organizationId: z.ZodString;
    conformityScores: z.ZodObject<{
        structural: z.ZodNumber;
        legal: z.ZodNumber;
        clarity: z.ZodNumber;
        abnt: z.ZodNumber;
        overall: z.ZodNumber;
        calculatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
        overall: number;
        calculatedAt: Date;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
        overall: number;
        calculatedAt?: Date | undefined;
    }>;
    weightedScore: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        category: z.ZodNativeEnum<typeof ProblemCategory>;
        severity: z.ZodNativeEnum<typeof ProblemSeverity>;
        title: z.ZodString;
        description: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        regulatoryReference: z.ZodOptional<z.ZodString>;
        impactScore: z.ZodNumber;
        isResolved: z.ZodDefault<z.ZodBoolean>;
        resolvedAt: z.ZodOptional<z.ZodDate>;
        resolvedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        foundAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        impactScore: number;
        isResolved: boolean;
        foundAt: Date;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        location?: string | undefined;
        regulatoryReference?: string | undefined;
        resolvedAt?: Date | undefined;
        resolvedBy?: string | undefined;
    }, {
        title: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        impactScore: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        location?: string | undefined;
        regulatoryReference?: string | undefined;
        isResolved?: boolean | undefined;
        resolvedAt?: Date | undefined;
        resolvedBy?: string | undefined;
        foundAt?: Date | undefined;
    }>, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
    appliedConfigId: z.ZodString;
    appliedConfigHash: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["pending", "processing", "completed", "error"]>>;
    executionTimeSeconds: z.ZodNumber;
    analysisMetadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    status: "error" | "pending" | "processing" | "completed";
    organizationId: string;
    id: string;
    createdAt: Date;
    conformityScores: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
        overall: number;
        calculatedAt: Date;
    };
    weightedScore: number;
    findings: {
        title: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        impactScore: number;
        isResolved: boolean;
        foundAt: Date;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        location?: string | undefined;
        regulatoryReference?: string | undefined;
        resolvedAt?: Date | undefined;
        resolvedBy?: string | undefined;
    }[];
    recommendations: string[];
    appliedConfigId: string;
    appliedConfigHash: string;
    executionTimeSeconds: number;
    error?: string | undefined;
    analysisMetadata?: Record<string, any> | undefined;
    completedAt?: Date | undefined;
}, {
    documentId: string;
    organizationId: string;
    id: string;
    conformityScores: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
        overall: number;
        calculatedAt?: Date | undefined;
    };
    weightedScore: number;
    findings: {
        title: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        impactScore: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        location?: string | undefined;
        regulatoryReference?: string | undefined;
        isResolved?: boolean | undefined;
        resolvedAt?: Date | undefined;
        resolvedBy?: string | undefined;
        foundAt?: Date | undefined;
    }[];
    recommendations: string[];
    appliedConfigId: string;
    appliedConfigHash: string;
    executionTimeSeconds: number;
    status?: "error" | "pending" | "processing" | "completed" | undefined;
    error?: string | undefined;
    createdAt?: Date | undefined;
    analysisMetadata?: Record<string, any> | undefined;
    completedAt?: Date | undefined;
}>;
export declare const AnalysisRequestSchema: z.ZodObject<{
    documentId: z.ZodString;
    organizationId: z.ZodString;
    configId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
    analysisType: z.ZodDefault<z.ZodEnum<["quick", "standard", "deep"]>>;
    options: z.ZodOptional<z.ZodObject<{
        includeAIAnalysis: z.ZodDefault<z.ZodBoolean>;
        runCustomRules: z.ZodDefault<z.ZodBoolean>;
        generateRecommendations: z.ZodDefault<z.ZodBoolean>;
        extractKeyMetrics: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        generateRecommendations: boolean;
        includeAIAnalysis: boolean;
        runCustomRules: boolean;
        extractKeyMetrics: boolean;
    }, {
        generateRecommendations?: boolean | undefined;
        includeAIAnalysis?: boolean | undefined;
        runCustomRules?: boolean | undefined;
        extractKeyMetrics?: boolean | undefined;
    }>>;
    requestedBy: z.ZodString;
    requestedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    priority: "low" | "normal" | "high";
    analysisType: "quick" | "standard" | "deep";
    organizationId: string;
    requestedBy: string;
    requestedAt: Date;
    options?: {
        generateRecommendations: boolean;
        includeAIAnalysis: boolean;
        runCustomRules: boolean;
        extractKeyMetrics: boolean;
    } | undefined;
    configId?: string | undefined;
}, {
    documentId: string;
    organizationId: string;
    requestedBy: string;
    options?: {
        generateRecommendations?: boolean | undefined;
        includeAIAnalysis?: boolean | undefined;
        runCustomRules?: boolean | undefined;
        extractKeyMetrics?: boolean | undefined;
    } | undefined;
    priority?: "low" | "normal" | "high" | undefined;
    analysisType?: "quick" | "standard" | "deep" | undefined;
    configId?: string | undefined;
    requestedAt?: Date | undefined;
}>;
export type ConformityScore = z.infer<typeof ConformityScoreSchema>;
export type AnalysisFinding = z.infer<typeof AnalysisFindingSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export declare const AnalysisExecutiveSummarySchema: z.ZodObject<{
    documentId: z.ZodString;
    overallScore: z.ZodNumber;
    weightedScore: z.ZodNumber;
    totalFindings: z.ZodNumber;
    criticalIssues: z.ZodNumber;
    highPriorityIssues: z.ZodNumber;
    mediumPriorityIssues: z.ZodNumber;
    lowPriorityIssues: z.ZodNumber;
    recommendations: z.ZodArray<z.ZodString, "many">;
    topConcerns: z.ZodArray<z.ZodString, "many">;
    completionPercentage: z.ZodNumber;
    estimatedResolutionTime: z.ZodOptional<z.ZodString>;
    analysisQuality: z.ZodEnum<["excellent", "good", "fair", "poor"]>;
    generatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    weightedScore: number;
    recommendations: string[];
    overallScore: number;
    totalFindings: number;
    criticalIssues: number;
    highPriorityIssues: number;
    mediumPriorityIssues: number;
    lowPriorityIssues: number;
    topConcerns: string[];
    completionPercentage: number;
    analysisQuality: "excellent" | "good" | "fair" | "poor";
    generatedAt: Date;
    estimatedResolutionTime?: string | undefined;
}, {
    documentId: string;
    weightedScore: number;
    recommendations: string[];
    overallScore: number;
    totalFindings: number;
    criticalIssues: number;
    highPriorityIssues: number;
    mediumPriorityIssues: number;
    lowPriorityIssues: number;
    topConcerns: string[];
    completionPercentage: number;
    analysisQuality: "excellent" | "good" | "fair" | "poor";
    estimatedResolutionTime?: string | undefined;
    generatedAt?: Date | undefined;
}>;
export type AnalysisExecutiveSummary = z.infer<typeof AnalysisExecutiveSummarySchema>;
export declare const calculateOverallScore: (scores: ConformityScore) => number;
export declare const calculateWeightedScore: (scores: ConformityScore, weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
}) => number;
export declare const getCategoryRating: (score: number) => string;
export declare const getSeverityColor: (severity: ProblemSeverity) => string;
export declare const getSeverityWeight: (severity: ProblemSeverity) => number;
export declare const groupFindingsBySeverity: (findings: AnalysisFinding[]) => Record<ProblemSeverity, {
    title: string;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    impactScore: number;
    isResolved: boolean;
    foundAt: Date;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    suggestion?: string | undefined;
    location?: string | undefined;
    regulatoryReference?: string | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
}[]>;
export declare const groupFindingsByCategory: (findings: AnalysisFinding[]) => Record<ProblemCategory, {
    title: string;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    impactScore: number;
    isResolved: boolean;
    foundAt: Date;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    suggestion?: string | undefined;
    location?: string | undefined;
    regulatoryReference?: string | undefined;
    resolvedAt?: Date | undefined;
    resolvedBy?: string | undefined;
}[]>;
export declare const generateExecutiveSummary: (result: AnalysisResult) => AnalysisExecutiveSummary;
//# sourceMappingURL=analysis.types.d.ts.map