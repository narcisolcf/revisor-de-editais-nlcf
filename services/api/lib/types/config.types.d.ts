/**
 * Config Types - TypeScript equivalent to Python ConfigModels (CORE DIFFERENTIATOR)
 * LicitaReview Cloud Functions
 */
import { z } from "zod";
import { DocumentType } from "./document.types";
import { ProblemSeverity, ProblemCategory } from "./analysis.types";
export declare enum AnalysisStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum AnalysisPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH"
}
export declare enum AnalysisPreset {
    RIGOROUS = "RIGOROUS",
    STANDARD = "STANDARD",
    TECHNICAL = "TECHNICAL",
    FAST = "FAST",
    CUSTOM = "CUSTOM"
}
export declare enum WeightDistributionType {
    BALANCED = "BALANCED",
    LEGAL_FOCUSED = "LEGAL_FOCUSED",
    TECHNICAL_FOCUSED = "TECHNICAL_FOCUSED",
    STRUCTURAL_FOCUSED = "STRUCTURAL_FOCUSED",
    CUSTOM = "CUSTOM"
}
export declare const AnalysisStatusSchema: z.ZodNativeEnum<typeof AnalysisStatus>;
export declare const AnalysisPrioritySchema: z.ZodNativeEnum<typeof AnalysisPriority>;
export declare const AnalysisPresetSchema: z.ZodNativeEnum<typeof AnalysisPreset>;
export declare const WeightDistributionTypeSchema: z.ZodNativeEnum<typeof WeightDistributionType>;
export declare const AnalysisWeightsSchema: z.ZodEffects<z.ZodObject<{
    structural: z.ZodNumber;
    legal: z.ZodNumber;
    clarity: z.ZodNumber;
    abnt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
}, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
}>, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
}, {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
}>;
export declare const CustomRuleSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    pattern: z.ZodString;
    patternType: z.ZodDefault<z.ZodEnum<["regex", "keyword", "phrase"]>>;
    severity: z.ZodNativeEnum<typeof ProblemSeverity>;
    category: z.ZodNativeEnum<typeof ProblemCategory>;
    message: z.ZodString;
    suggestion: z.ZodOptional<z.ZodString>;
    appliesToDocumentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof DocumentType>, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    weight: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    message: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    pattern: string;
    patternType: "regex" | "keyword" | "phrase";
    isActive: boolean;
    weight: number;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    suggestion?: string | undefined;
    appliesToDocumentTypes?: DocumentType[] | undefined;
}, {
    message: string;
    name: string;
    category: ProblemCategory;
    severity: ProblemSeverity;
    description: string;
    pattern: string;
    id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    suggestion?: string | undefined;
    patternType?: "regex" | "keyword" | "phrase" | undefined;
    appliesToDocumentTypes?: DocumentType[] | undefined;
    isActive?: boolean | undefined;
    weight?: number | undefined;
}>;
export declare const TemplateSectionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requiredFields: z.ZodArray<z.ZodString, "many">;
    optionalFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    requiredFields: string[];
    optionalFields: string[];
    validationRules: string[];
    order: number;
    description?: string | undefined;
}, {
    name: string;
    id: string;
    requiredFields: string[];
    order: number;
    description?: string | undefined;
    optionalFields?: string[] | undefined;
    validationRules?: string[] | undefined;
}>;
export declare const OrganizationTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    documentType: z.ZodNativeEnum<typeof DocumentType>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        requiredFields: z.ZodArray<z.ZodString, "many">;
        optionalFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        requiredFields: string[];
        optionalFields: string[];
        validationRules: string[];
        order: number;
        description?: string | undefined;
    }, {
        name: string;
        id: string;
        requiredFields: string[];
        order: number;
        description?: string | undefined;
        optionalFields?: string[] | undefined;
        validationRules?: string[] | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    documentType: DocumentType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    sections: {
        name: string;
        id: string;
        requiredFields: string[];
        optionalFields: string[];
        validationRules: string[];
        order: number;
        description?: string | undefined;
    }[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    name: string;
    documentType: DocumentType;
    id: string;
    sections: {
        name: string;
        id: string;
        requiredFields: string[];
        order: number;
        description?: string | undefined;
        optionalFields?: string[] | undefined;
        validationRules?: string[] | undefined;
    }[];
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const OrganizationConfigSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    organizationName: z.ZodString;
    weights: z.ZodEffects<z.ZodObject<{
        structural: z.ZodNumber;
        legal: z.ZodNumber;
        clarity: z.ZodNumber;
        abnt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>;
    presetType: z.ZodNativeEnum<typeof AnalysisPreset>;
    customRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodString;
        pattern: z.ZodString;
        patternType: z.ZodDefault<z.ZodEnum<["regex", "keyword", "phrase"]>>;
        severity: z.ZodNativeEnum<typeof ProblemSeverity>;
        category: z.ZodNativeEnum<typeof ProblemCategory>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        appliesToDocumentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof DocumentType>, "many">>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        weight: z.ZodDefault<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }, {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }>, "many">>;
    templates: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            requiredFields: z.ZodArray<z.ZodString, "many">;
            optionalFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }, {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }, {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodObject<{
        enableAIAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableCustomRules: z.ZodDefault<z.ZodBoolean>;
        strictMode: z.ZodDefault<z.ZodBoolean>;
        autoApproval: z.ZodDefault<z.ZodBoolean>;
        requireDualApproval: z.ZodDefault<z.ZodBoolean>;
        maxDocumentSize: z.ZodDefault<z.ZodNumber>;
        allowedDocumentTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        retentionDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    }, {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    version: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    createdBy: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    isActive: boolean;
    organizationName: string;
    presetType: AnalysisPreset;
    customRules: {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }[];
    templates: {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }[];
    metadata?: Record<string, any> | undefined;
    settings?: {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    } | undefined;
    lastModifiedBy?: string | undefined;
}, {
    organizationId: string;
    id: string;
    createdBy: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    organizationName: string;
    presetType: AnalysisPreset;
    metadata?: Record<string, any> | undefined;
    version?: number | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    isActive?: boolean | undefined;
    customRules?: {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }[] | undefined;
    templates?: {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }[] | undefined;
    settings?: {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
}>;
export type AnalysisWeights = z.infer<typeof AnalysisWeightsSchema>;
export type CustomRule = z.infer<typeof CustomRuleSchema>;
export type TemplateSection = z.infer<typeof TemplateSectionSchema>;
export type OrganizationTemplate = z.infer<typeof OrganizationTemplateSchema>;
export type OrganizationConfig = z.infer<typeof OrganizationConfigSchema>;
export declare const CreateConfigRequestSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    organizationId: z.ZodString;
    organizationName: z.ZodString;
    weights: z.ZodEffects<z.ZodObject<{
        structural: z.ZodNumber;
        legal: z.ZodNumber;
        clarity: z.ZodNumber;
        abnt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>;
    presetType: z.ZodNativeEnum<typeof AnalysisPreset>;
    customRules: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodString;
        pattern: z.ZodString;
        patternType: z.ZodDefault<z.ZodEnum<["regex", "keyword", "phrase"]>>;
        severity: z.ZodNativeEnum<typeof ProblemSeverity>;
        category: z.ZodNativeEnum<typeof ProblemCategory>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        appliesToDocumentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof DocumentType>, "many">>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        weight: z.ZodDefault<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }, {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }>, "many">>;
    templates: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            requiredFields: z.ZodArray<z.ZodString, "many">;
            optionalFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }, {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }, {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodObject<{
        enableAIAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableCustomRules: z.ZodDefault<z.ZodBoolean>;
        strictMode: z.ZodDefault<z.ZodBoolean>;
        autoApproval: z.ZodDefault<z.ZodBoolean>;
        requireDualApproval: z.ZodDefault<z.ZodBoolean>;
        maxDocumentSize: z.ZodDefault<z.ZodNumber>;
        allowedDocumentTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        retentionDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    }, {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    version: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
}, "id" | "version" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    organizationId: string;
    createdBy: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    isActive: boolean;
    organizationName: string;
    presetType: AnalysisPreset;
    customRules: {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }[];
    templates: {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }[];
    metadata?: Record<string, any> | undefined;
    settings?: {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    } | undefined;
    lastModifiedBy?: string | undefined;
}, {
    organizationId: string;
    createdBy: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    organizationName: string;
    presetType: AnalysisPreset;
    metadata?: Record<string, any> | undefined;
    isActive?: boolean | undefined;
    customRules?: {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }[] | undefined;
    templates?: {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }[] | undefined;
    settings?: {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
}>;
export declare const UpdateConfigRequestSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    organizationName: z.ZodOptional<z.ZodString>;
    weights: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        structural: z.ZodNumber;
        legal: z.ZodNumber;
        clarity: z.ZodNumber;
        abnt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }, {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    }>>;
    presetType: z.ZodOptional<z.ZodNativeEnum<typeof AnalysisPreset>>;
    customRules: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodString;
        pattern: z.ZodString;
        patternType: z.ZodDefault<z.ZodEnum<["regex", "keyword", "phrase"]>>;
        severity: z.ZodNativeEnum<typeof ProblemSeverity>;
        category: z.ZodNativeEnum<typeof ProblemCategory>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        appliesToDocumentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof DocumentType>, "many">>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        weight: z.ZodDefault<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }, {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }>, "many">>>;
    templates: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            requiredFields: z.ZodArray<z.ZodString, "many">;
            optionalFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }, {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodDefault<z.ZodDate>;
        updatedAt: z.ZodDefault<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }, {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }>, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        enableAIAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableCustomRules: z.ZodDefault<z.ZodBoolean>;
        strictMode: z.ZodDefault<z.ZodBoolean>;
        autoApproval: z.ZodDefault<z.ZodBoolean>;
        requireDualApproval: z.ZodDefault<z.ZodBoolean>;
        maxDocumentSize: z.ZodDefault<z.ZodNumber>;
        allowedDocumentTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        retentionDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    }, {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    }>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    version: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    createdAt: z.ZodOptional<z.ZodDefault<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodDefault<z.ZodDate>>;
    createdBy: z.ZodOptional<z.ZodString>;
    lastModifiedBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "organizationId" | "id" | "createdAt">, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any> | undefined;
    createdBy?: string | undefined;
    version?: number | undefined;
    updatedAt?: Date | undefined;
    weights?: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    } | undefined;
    isActive?: boolean | undefined;
    organizationName?: string | undefined;
    presetType?: AnalysisPreset | undefined;
    customRules?: {
        message: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        patternType: "regex" | "keyword" | "phrase";
        isActive: boolean;
        weight: number;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        suggestion?: string | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
    }[] | undefined;
    templates?: {
        name: string;
        documentType: DocumentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            optionalFields: string[];
            validationRules: string[];
            order: number;
            description?: string | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
    }[] | undefined;
    settings?: {
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
    } | undefined;
    lastModifiedBy?: string | undefined;
}, {
    metadata?: Record<string, any> | undefined;
    createdBy?: string | undefined;
    version?: number | undefined;
    updatedAt?: Date | undefined;
    weights?: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    } | undefined;
    isActive?: boolean | undefined;
    organizationName?: string | undefined;
    presetType?: AnalysisPreset | undefined;
    customRules?: {
        message: string;
        name: string;
        category: ProblemCategory;
        severity: ProblemSeverity;
        description: string;
        pattern: string;
        id?: string | undefined;
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        suggestion?: string | undefined;
        patternType?: "regex" | "keyword" | "phrase" | undefined;
        appliesToDocumentTypes?: DocumentType[] | undefined;
        isActive?: boolean | undefined;
        weight?: number | undefined;
    }[] | undefined;
    templates?: {
        name: string;
        documentType: DocumentType;
        id: string;
        sections: {
            name: string;
            id: string;
            requiredFields: string[];
            order: number;
            description?: string | undefined;
            optionalFields?: string[] | undefined;
            validationRules?: string[] | undefined;
        }[];
        metadata?: Record<string, any> | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
    }[] | undefined;
    settings?: {
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
}>;
export declare const ConfigSummarySchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    organizationName: z.ZodString;
    presetType: z.ZodNativeEnum<typeof AnalysisPreset>;
    dominantCategory: z.ZodString;
    distributionType: z.ZodNativeEnum<typeof WeightDistributionType>;
    totalCustomRules: z.ZodNumber;
    isActive: z.ZodBoolean;
    version: z.ZodNumber;
    lastModified: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    version: number;
    isActive: boolean;
    organizationName: string;
    presetType: AnalysisPreset;
    dominantCategory: string;
    distributionType: WeightDistributionType;
    totalCustomRules: number;
    lastModified: Date;
}, {
    organizationId: string;
    id: string;
    version: number;
    isActive: boolean;
    organizationName: string;
    presetType: AnalysisPreset;
    dominantCategory: string;
    distributionType: WeightDistributionType;
    totalCustomRules: number;
    lastModified: Date;
}>;
export type CreateConfigRequest = z.infer<typeof CreateConfigRequestSchema>;
export type UpdateConfigRequest = z.infer<typeof UpdateConfigRequestSchema>;
export type ConfigSummary = z.infer<typeof ConfigSummarySchema>;
export declare const PRESET_WEIGHTS: Record<AnalysisPreset, AnalysisWeights>;
export declare const createDefaultConfig: (organizationId: string, organizationName: string, preset: AnalysisPreset, createdBy: string) => Omit<OrganizationConfig, "id">;
export declare const calculateWeightsSum: (weights: AnalysisWeights) => number;
export declare const validateWeights: (weights: AnalysisWeights) => boolean;
export declare const getDominantCategory: (weights: AnalysisWeights) => string;
export declare const getWeightDistributionType: (weights: AnalysisWeights) => WeightDistributionType;
export declare const toPercentageDict: (weights: AnalysisWeights) => Record<string, string>;
export declare const generateConfigHash: (config: OrganizationConfig) => string;
export declare const createConfigSummary: (config: OrganizationConfig) => ConfigSummary;
export declare const testPatternMatch: (rule: CustomRule, text: string) => boolean;
//# sourceMappingURL=config.types.d.ts.map