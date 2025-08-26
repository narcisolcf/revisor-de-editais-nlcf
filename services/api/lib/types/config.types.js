"use strict";
/**
 * Config Types - TypeScript equivalent to Python ConfigModels (CORE DIFFERENTIATOR)
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPatternMatch = exports.createConfigSummary = exports.generateConfigHash = exports.toPercentageDict = exports.getWeightDistributionType = exports.getDominantCategory = exports.validateWeights = exports.calculateWeightsSum = exports.createDefaultConfig = exports.PRESET_WEIGHTS = exports.ConfigSummarySchema = exports.UpdateConfigRequestSchema = exports.CreateConfigRequestSchema = exports.OrganizationConfigSchema = exports.OrganizationTemplateSchema = exports.TemplateSectionSchema = exports.CustomRuleSchema = exports.AnalysisWeightsSchema = exports.WeightDistributionTypeSchema = exports.AnalysisPresetSchema = exports.AnalysisPrioritySchema = exports.AnalysisStatusSchema = exports.WeightDistributionType = exports.AnalysisPreset = exports.AnalysisPriority = exports.AnalysisStatus = void 0;
const zod_1 = require("zod");
const document_types_1 = require("./document.types");
const analysis_types_1 = require("./analysis.types");
// Enums
/* eslint-disable no-unused-vars */
var AnalysisStatus;
(function (AnalysisStatus) {
    AnalysisStatus["PENDING"] = "PENDING";
    AnalysisStatus["PROCESSING"] = "PROCESSING";
    AnalysisStatus["COMPLETED"] = "COMPLETED";
    AnalysisStatus["FAILED"] = "FAILED";
    AnalysisStatus["CANCELLED"] = "CANCELLED";
})(AnalysisStatus || (exports.AnalysisStatus = AnalysisStatus = {}));
var AnalysisPriority;
(function (AnalysisPriority) {
    AnalysisPriority["LOW"] = "LOW";
    AnalysisPriority["NORMAL"] = "NORMAL";
    AnalysisPriority["HIGH"] = "HIGH";
})(AnalysisPriority || (exports.AnalysisPriority = AnalysisPriority = {}));
var AnalysisPreset;
(function (AnalysisPreset) {
    AnalysisPreset["RIGOROUS"] = "RIGOROUS";
    AnalysisPreset["STANDARD"] = "STANDARD";
    AnalysisPreset["TECHNICAL"] = "TECHNICAL";
    AnalysisPreset["FAST"] = "FAST";
    AnalysisPreset["CUSTOM"] = "CUSTOM";
})(AnalysisPreset || (exports.AnalysisPreset = AnalysisPreset = {}));
var WeightDistributionType;
(function (WeightDistributionType) {
    WeightDistributionType["BALANCED"] = "BALANCED";
    WeightDistributionType["LEGAL_FOCUSED"] = "LEGAL_FOCUSED";
    WeightDistributionType["TECHNICAL_FOCUSED"] = "TECHNICAL_FOCUSED";
    WeightDistributionType["STRUCTURAL_FOCUSED"] = "STRUCTURAL_FOCUSED";
    WeightDistributionType["CUSTOM"] = "CUSTOM";
})(WeightDistributionType || (exports.WeightDistributionType = WeightDistributionType = {}));
/* eslint-enable no-unused-vars */
// Zod Schemas
exports.AnalysisStatusSchema = zod_1.z.nativeEnum(AnalysisStatus);
exports.AnalysisPrioritySchema = zod_1.z.nativeEnum(AnalysisPriority);
exports.AnalysisPresetSchema = zod_1.z.nativeEnum(AnalysisPreset);
exports.WeightDistributionTypeSchema = zod_1.z.nativeEnum(WeightDistributionType);
// 🚀 CORE DIFFERENTIATOR: Analysis Weights
exports.AnalysisWeightsSchema = zod_1.z.object({
    structural: zod_1.z.number().min(0).max(100),
    legal: zod_1.z.number().min(0).max(100),
    clarity: zod_1.z.number().min(0).max(100),
    abnt: zod_1.z.number().min(0).max(100)
}).refine((data) => {
    const total = data.structural + data.legal + data.clarity + data.abnt;
    return Math.abs(total - 100) < 0.01;
}, {
    message: "A soma dos pesos deve ser exatamente 100%",
    path: ["weights"]
});
exports.CustomRuleSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    pattern: zod_1.z.string(),
    patternType: zod_1.z.enum(["regex", "keyword", "phrase"]).default("regex"),
    severity: zod_1.z.nativeEnum(analysis_types_1.ProblemSeverity),
    category: zod_1.z.nativeEnum(analysis_types_1.ProblemCategory),
    message: zod_1.z.string(),
    suggestion: zod_1.z.string().optional(),
    appliesToDocumentTypes: zod_1.z.array(zod_1.z.nativeEnum(document_types_1.DocumentType)).optional(),
    isActive: zod_1.z.boolean().default(true),
    weight: zod_1.z.number().min(0).max(10).default(1),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date())
});
exports.TemplateSectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    requiredFields: zod_1.z.array(zod_1.z.string()),
    optionalFields: zod_1.z.array(zod_1.z.string()).default([]),
    validationRules: zod_1.z.array(zod_1.z.string()).default([]),
    order: zod_1.z.number().int().min(0)
});
exports.OrganizationTemplateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    documentType: zod_1.z.nativeEnum(document_types_1.DocumentType),
    sections: zod_1.z.array(exports.TemplateSectionSchema),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date())
});
// 🚀 CORE: Organization Configuration
exports.OrganizationConfigSchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    organizationName: zod_1.z.string(),
    weights: exports.AnalysisWeightsSchema,
    presetType: exports.AnalysisPresetSchema,
    customRules: zod_1.z.array(exports.CustomRuleSchema).default([]),
    templates: zod_1.z.array(exports.OrganizationTemplateSchema).default([]),
    settings: zod_1.z.object({
        enableAIAnalysis: zod_1.z.boolean().default(false),
        enableCustomRules: zod_1.z.boolean().default(true),
        strictMode: zod_1.z.boolean().default(false),
        autoApproval: zod_1.z.boolean().default(false),
        requireDualApproval: zod_1.z.boolean().default(false),
        maxDocumentSize: zod_1.z.number().positive().default(52428800), // 50MB
        allowedDocumentTypes: zod_1.z.array(zod_1.z.string()).default(["pdf", "doc", "docx"]),
        retentionDays: zod_1.z.number().int().positive().default(365)
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    version: zod_1.z.number().int().positive().default(1),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional()
});
// API Request/Response Types
exports.CreateConfigRequestSchema = exports.OrganizationConfigSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    version: true
});
exports.UpdateConfigRequestSchema = exports.OrganizationConfigSchema.partial().omit({
    id: true,
    createdAt: true,
    organizationId: true
});
exports.ConfigSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    organizationName: zod_1.z.string(),
    presetType: exports.AnalysisPresetSchema,
    dominantCategory: zod_1.z.string(),
    distributionType: exports.WeightDistributionTypeSchema,
    totalCustomRules: zod_1.z.number().int().min(0),
    isActive: zod_1.z.boolean(),
    version: zod_1.z.number().int().positive(),
    lastModified: zod_1.z.date()
});
// Preset Configurations
exports.PRESET_WEIGHTS = {
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
const createDefaultConfig = (organizationId, organizationName, preset, createdBy) => ({
    organizationId,
    organizationName,
    weights: exports.PRESET_WEIGHTS[preset],
    presetType: preset,
    customRules: [],
    templates: [],
    version: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy
});
exports.createDefaultConfig = createDefaultConfig;
const calculateWeightsSum = (weights) => {
    return weights.structural + weights.legal + weights.clarity + weights.abnt;
};
exports.calculateWeightsSum = calculateWeightsSum;
const validateWeights = (weights) => {
    const sum = (0, exports.calculateWeightsSum)(weights);
    return Math.abs(sum - 100) < 0.01;
};
exports.validateWeights = validateWeights;
const getDominantCategory = (weights) => {
    const categories = [
        { name: "structural", value: weights.structural },
        { name: "legal", value: weights.legal },
        { name: "clarity", value: weights.clarity },
        { name: "abnt", value: weights.abnt }
    ];
    return categories.reduce((max, current) => current.value > max.value ? current : max).name;
};
exports.getDominantCategory = getDominantCategory;
const getWeightDistributionType = (weights) => {
    const dominant = (0, exports.getDominantCategory)(weights);
    const dominantValue = weights[dominant];
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
exports.getWeightDistributionType = getWeightDistributionType;
const toPercentageDict = (weights) => ({
    structural: `${weights.structural.toFixed(1)}%`,
    legal: `${weights.legal.toFixed(1)}%`,
    clarity: `${weights.clarity.toFixed(1)}%`,
    abnt: `${weights.abnt.toFixed(1)}%`
});
exports.toPercentageDict = toPercentageDict;
const generateConfigHash = (config) => {
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
exports.generateConfigHash = generateConfigHash;
const createConfigSummary = (config) => ({
    id: config.id,
    organizationId: config.organizationId,
    organizationName: config.organizationName,
    presetType: config.presetType,
    dominantCategory: (0, exports.getDominantCategory)(config.weights),
    distributionType: (0, exports.getWeightDistributionType)(config.weights),
    totalCustomRules: config.customRules.length,
    isActive: config.isActive,
    version: config.version,
    lastModified: config.updatedAt
});
exports.createConfigSummary = createConfigSummary;
const testPatternMatch = (rule, text) => {
    try {
        if (rule.patternType === "regex") {
            const regex = new RegExp(rule.pattern, "gi");
            return regex.test(text);
        }
        else if (rule.patternType === "keyword") {
            return text.toLowerCase().includes(rule.pattern.toLowerCase());
        }
        else if (rule.patternType === "phrase") {
            return text.toLowerCase().includes(rule.pattern.toLowerCase());
        }
        return false;
    }
    catch (error) {
        console.error(`Error testing pattern "${rule.pattern}":`, error);
        return false;
    }
};
exports.testPatternMatch = testPatternMatch;
//# sourceMappingURL=config.types.js.map