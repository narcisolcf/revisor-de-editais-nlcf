"use strict";
/**
 * Analysis Types - TypeScript equivalent to Python AnalysisModels
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExecutiveSummary = exports.groupFindingsByCategory = exports.groupFindingsBySeverity = exports.getSeverityWeight = exports.getSeverityColor = exports.getCategoryRating = exports.calculateWeightedScore = exports.calculateOverallScore = exports.AnalysisExecutiveSummarySchema = exports.AnalysisRequestSchema = exports.AnalysisResultSchema = exports.AnalysisFindingSchema = exports.ConformityScoreSchema = exports.ProblemCategorySchema = exports.ProblemSeveritySchema = exports.ProblemCategory = exports.ProblemSeverity = void 0;
const zod_1 = require("zod");
// Enums
var ProblemSeverity;
(function (ProblemSeverity) {
    ProblemSeverity["CRITICA"] = "CRITICA";
    ProblemSeverity["ALTA"] = "ALTA";
    ProblemSeverity["MEDIA"] = "MEDIA";
    ProblemSeverity["BAIXA"] = "BAIXA";
})(ProblemSeverity || (exports.ProblemSeverity = ProblemSeverity = {}));
var ProblemCategory;
(function (ProblemCategory) {
    ProblemCategory["ESTRUTURAL"] = "ESTRUTURAL";
    ProblemCategory["JURIDICO"] = "JURIDICO";
    ProblemCategory["CLAREZA"] = "CLAREZA";
    ProblemCategory["ABNT"] = "ABNT";
    ProblemCategory["CONFORMIDADE"] = "CONFORMIDADE";
    ProblemCategory["COMPLETUDE"] = "COMPLETUDE";
})(ProblemCategory || (exports.ProblemCategory = ProblemCategory = {}));
// Zod Schemas
exports.ProblemSeveritySchema = zod_1.z.nativeEnum(ProblemSeverity);
exports.ProblemCategorySchema = zod_1.z.nativeEnum(ProblemCategory);
exports.ConformityScoreSchema = zod_1.z.object({
    structural: zod_1.z.number().min(0).max(100),
    legal: zod_1.z.number().min(0).max(100),
    clarity: zod_1.z.number().min(0).max(100),
    abnt: zod_1.z.number().min(0).max(100),
    overall: zod_1.z.number().min(0).max(100),
    calculatedAt: zod_1.z.date().default(() => new Date())
});
exports.AnalysisFindingSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    category: exports.ProblemCategorySchema,
    severity: exports.ProblemSeveritySchema,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    suggestion: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    regulatoryReference: zod_1.z.string().optional(),
    impactScore: zod_1.z.number().min(0).max(10),
    isResolved: zod_1.z.boolean().default(false),
    resolvedAt: zod_1.z.date().optional(),
    resolvedBy: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    foundAt: zod_1.z.date().default(() => new Date())
});
exports.AnalysisResultSchema = zod_1.z.object({
    id: zod_1.z.string(),
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    conformityScores: exports.ConformityScoreSchema,
    weightedScore: zod_1.z.number().min(0).max(100),
    findings: zod_1.z.array(exports.AnalysisFindingSchema),
    recommendations: zod_1.z.array(zod_1.z.string()),
    appliedConfigId: zod_1.z.string(),
    appliedConfigHash: zod_1.z.string(),
    status: zod_1.z.enum(["pending", "processing", "completed", "error"]).default("pending"),
    executionTimeSeconds: zod_1.z.number().positive(),
    analysisMetadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
    completedAt: zod_1.z.date().optional(),
    error: zod_1.z.string().optional()
});
exports.AnalysisRequestSchema = zod_1.z.object({
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    configId: zod_1.z.string().optional(),
    priority: zod_1.z.enum(["low", "normal", "high"]).default("normal"),
    analysisType: zod_1.z.enum(["quick", "standard", "deep"]).default("standard"),
    options: zod_1.z.object({
        includeAIAnalysis: zod_1.z.boolean().default(false),
        runCustomRules: zod_1.z.boolean().default(true),
        generateRecommendations: zod_1.z.boolean().default(true),
        extractKeyMetrics: zod_1.z.boolean().default(true)
    }).optional(),
    requestedBy: zod_1.z.string(),
    requestedAt: zod_1.z.date().default(() => new Date())
});
// API Response Types
exports.AnalysisExecutiveSummarySchema = zod_1.z.object({
    documentId: zod_1.z.string(),
    overallScore: zod_1.z.number().min(0).max(100),
    weightedScore: zod_1.z.number().min(0).max(100),
    totalFindings: zod_1.z.number().int().min(0),
    criticalIssues: zod_1.z.number().int().min(0),
    highPriorityIssues: zod_1.z.number().int().min(0),
    mediumPriorityIssues: zod_1.z.number().int().min(0),
    lowPriorityIssues: zod_1.z.number().int().min(0),
    recommendations: zod_1.z.array(zod_1.z.string()),
    topConcerns: zod_1.z.array(zod_1.z.string()),
    completionPercentage: zod_1.z.number().min(0).max(100),
    estimatedResolutionTime: zod_1.z.string().optional(),
    analysisQuality: zod_1.z.enum(["excellent", "good", "fair", "poor"]),
    generatedAt: zod_1.z.date().default(() => new Date())
});
// Utility functions
const calculateOverallScore = (scores) => {
    return (scores.structural + scores.legal + scores.clarity + scores.abnt) / 4;
};
exports.calculateOverallScore = calculateOverallScore;
const calculateWeightedScore = (scores, weights) => {
    const totalWeight = weights.structural + weights.legal + weights.clarity + weights.abnt;
    if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error(`Weights must sum to 100%. Current sum: ${totalWeight}%`);
    }
    return ((scores.structural * weights.structural / 100) +
        (scores.legal * weights.legal / 100) +
        (scores.clarity * weights.clarity / 100) +
        (scores.abnt * weights.abnt / 100));
};
exports.calculateWeightedScore = calculateWeightedScore;
const getCategoryRating = (score) => {
    if (score >= 90)
        return "Excelente";
    if (score >= 80)
        return "Boa";
    if (score >= 70)
        return "Regular";
    if (score >= 60)
        return "Ruim";
    return "Crítica";
};
exports.getCategoryRating = getCategoryRating;
const getSeverityColor = (severity) => {
    const colors = {
        [ProblemSeverity.CRITICA]: "#dc2626",
        [ProblemSeverity.ALTA]: "#ea580c",
        [ProblemSeverity.MEDIA]: "#d97706",
        [ProblemSeverity.BAIXA]: "#65a30d"
    };
    return colors[severity];
};
exports.getSeverityColor = getSeverityColor;
const getSeverityWeight = (severity) => {
    const weights = {
        [ProblemSeverity.CRITICA]: 10,
        [ProblemSeverity.ALTA]: 7,
        [ProblemSeverity.MEDIA]: 5,
        [ProblemSeverity.BAIXA]: 2
    };
    return weights[severity];
};
exports.getSeverityWeight = getSeverityWeight;
const groupFindingsBySeverity = (findings) => {
    return findings.reduce((groups, finding) => {
        const severity = finding.severity;
        if (!groups[severity]) {
            groups[severity] = [];
        }
        groups[severity].push(finding);
        return groups;
    }, {});
};
exports.groupFindingsBySeverity = groupFindingsBySeverity;
const groupFindingsByCategory = (findings) => {
    return findings.reduce((groups, finding) => {
        const category = finding.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(finding);
        return groups;
    }, {});
};
exports.groupFindingsByCategory = groupFindingsByCategory;
const generateExecutiveSummary = (result) => {
    var _a, _b, _c, _d;
    const findingsBySeverity = (0, exports.groupFindingsBySeverity)(result.findings);
    return {
        documentId: result.documentId,
        overallScore: result.conformityScores.overall,
        weightedScore: result.weightedScore,
        totalFindings: result.findings.length,
        criticalIssues: ((_a = findingsBySeverity[ProblemSeverity.CRITICA]) === null || _a === void 0 ? void 0 : _a.length) || 0,
        highPriorityIssues: ((_b = findingsBySeverity[ProblemSeverity.ALTA]) === null || _b === void 0 ? void 0 : _b.length) || 0,
        mediumPriorityIssues: ((_c = findingsBySeverity[ProblemSeverity.MEDIA]) === null || _c === void 0 ? void 0 : _c.length) || 0,
        lowPriorityIssues: ((_d = findingsBySeverity[ProblemSeverity.BAIXA]) === null || _d === void 0 ? void 0 : _d.length) || 0,
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
exports.generateExecutiveSummary = generateExecutiveSummary;
//# sourceMappingURL=analysis.types.js.map