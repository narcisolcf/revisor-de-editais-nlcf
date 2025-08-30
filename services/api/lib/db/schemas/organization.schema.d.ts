/**
 * Firestore Schema: Organizations Collection
 *
 * Collection: /organizations/{orgId}/
 * Structure for organization-level data including profile, templates, rules, and parameters
 */
import { z } from 'zod';
export declare const OrganizationProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    cnpj: z.ZodString;
    governmentLevel: z.ZodEnum<["FEDERAL", "ESTADUAL", "MUNICIPAL"]>;
    organizationType: z.ZodEnum<["TRIBUNAL_CONTAS", "PREFEITURA", "GOVERNO_ESTADUAL", "MINISTERIO", "AUTARQUIA", "FUNDACAO", "EMPRESA_PUBLICA", "OUTROS"]>;
    contact: z.ZodObject<{
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            zipCode: z.ZodString;
            country: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        }, {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        } | undefined;
    }, {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string | undefined;
        } | undefined;
    }>;
    settings: z.ZodObject<{
        timezone: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        defaultAnalysisPreset: z.ZodDefault<z.ZodEnum<["RIGOROUS", "STANDARD", "TECHNICAL", "FAST", "CUSTOM"]>>;
        enableAIAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableCustomRules: z.ZodDefault<z.ZodBoolean>;
        strictMode: z.ZodDefault<z.ZodBoolean>;
        autoApproval: z.ZodDefault<z.ZodBoolean>;
        requireDualApproval: z.ZodDefault<z.ZodBoolean>;
        retentionDays: z.ZodDefault<z.ZodNumber>;
        maxDocumentSize: z.ZodDefault<z.ZodNumber>;
        allowedDocumentTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
        timezone: string;
        defaultAnalysisPreset: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM";
    }, {
        language?: string | undefined;
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
        timezone?: string | undefined;
        defaultAnalysisPreset?: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM" | undefined;
    }>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_APPROVAL"]>>;
    subscriptionTier: z.ZodDefault<z.ZodEnum<["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
    id: string;
    createdBy: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    name: string;
    settings: {
        language: string;
        enableAIAnalysis: boolean;
        enableCustomRules: boolean;
        strictMode: boolean;
        autoApproval: boolean;
        requireDualApproval: boolean;
        maxDocumentSize: number;
        allowedDocumentTypes: string[];
        retentionDays: number;
        timezone: string;
        defaultAnalysisPreset: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM";
    };
    cnpj: string;
    governmentLevel: "FEDERAL" | "ESTADUAL" | "MUNICIPAL";
    organizationType: "TRIBUNAL_CONTAS" | "PREFEITURA" | "GOVERNO_ESTADUAL" | "MINISTERIO" | "AUTARQUIA" | "FUNDACAO" | "EMPRESA_PUBLICA" | "OUTROS";
    contact: {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        } | undefined;
    };
    subscriptionTier: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    lastModifiedBy?: string | undefined;
    displayName?: string | undefined;
}, {
    id: string;
    createdBy: string;
    name: string;
    settings: {
        language?: string | undefined;
        enableAIAnalysis?: boolean | undefined;
        enableCustomRules?: boolean | undefined;
        strictMode?: boolean | undefined;
        autoApproval?: boolean | undefined;
        requireDualApproval?: boolean | undefined;
        maxDocumentSize?: number | undefined;
        allowedDocumentTypes?: string[] | undefined;
        retentionDays?: number | undefined;
        timezone?: string | undefined;
        defaultAnalysisPreset?: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM" | undefined;
    };
    cnpj: string;
    governmentLevel: "FEDERAL" | "ESTADUAL" | "MUNICIPAL";
    organizationType: "TRIBUNAL_CONTAS" | "PREFEITURA" | "GOVERNO_ESTADUAL" | "MINISTERIO" | "AUTARQUIA" | "FUNDACAO" | "EMPRESA_PUBLICA" | "OUTROS";
    contact: {
        email: string;
        phone?: string | undefined;
        website?: string | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string | undefined;
        } | undefined;
    };
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_APPROVAL" | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | undefined;
    lastModifiedBy?: string | undefined;
    displayName?: string | undefined;
    subscriptionTier?: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE" | undefined;
}>;
export declare const DocumentTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    documentType: z.ZodEnum<["EDITAL", "TERMO_REFERENCIA", "ATA_SESSAO", "CONTRATO", "PROJETO_BASICO", "RECURSO", "IMPUGNACAO", "ESCLARECIMENTO"]>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
        required: z.ZodDefault<z.ZodBoolean>;
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["TEXT", "NUMBER", "DATE", "BOOLEAN", "SELECT", "MULTISELECT", "FILE"]>;
            required: z.ZodDefault<z.ZodBoolean>;
            description: z.ZodOptional<z.ZodString>;
            placeholder: z.ZodOptional<z.ZodString>;
            validation: z.ZodOptional<z.ZodObject<{
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
                pattern: z.ZodOptional<z.ZodString>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            }, {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            }>>;
            defaultValue: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            required: boolean;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }, {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }>, "many">;
        validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        conditionalLogic: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        validationRules: string[];
        order: number;
        required: boolean;
        fields: {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            required: boolean;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }[];
        description?: string | undefined;
        conditionalLogic?: Record<string, any> | undefined;
    }, {
        id: string;
        name: string;
        order: number;
        fields: {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }[];
        description?: string | undefined;
        validationRules?: string[] | undefined;
        required?: boolean | undefined;
        conditionalLogic?: Record<string, any> | undefined;
    }>, "many">;
    analysisRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    requiredFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "ACTIVE", "ARCHIVED", "DEPRECATED"]>>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    usage: z.ZodOptional<z.ZodObject<{
        documentsCreated: z.ZodDefault<z.ZodNumber>;
        lastUsed: z.ZodOptional<z.ZodDate>;
        averageCompletionTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        documentsCreated: number;
        lastUsed?: Date | undefined;
        averageCompletionTime?: number | undefined;
    }, {
        documentsCreated?: number | undefined;
        lastUsed?: Date | undefined;
        averageCompletionTime?: number | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    status: "DRAFT" | "ARCHIVED" | "DEPRECATED" | "ACTIVE";
    documentType: "EDITAL" | "TERMO_REFERENCIA" | "PROJETO_BASICO" | "ATA_SESSAO" | "CONTRATO" | "RECURSO" | "IMPUGNACAO" | "ESCLARECIMENTO";
    id: string;
    createdBy: string;
    version: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    name: string;
    requiredFields: string[];
    sections: {
        id: string;
        name: string;
        validationRules: string[];
        order: number;
        required: boolean;
        fields: {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            required: boolean;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }[];
        description?: string | undefined;
        conditionalLogic?: Record<string, any> | undefined;
    }[];
    analysisRules: string[];
    isDefault: boolean;
    isPublic: boolean;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    lastModifiedBy?: string | undefined;
    usage?: {
        documentsCreated: number;
        lastUsed?: Date | undefined;
        averageCompletionTime?: number | undefined;
    } | undefined;
}, {
    organizationId: string;
    documentType: "EDITAL" | "TERMO_REFERENCIA" | "PROJETO_BASICO" | "ATA_SESSAO" | "CONTRATO" | "RECURSO" | "IMPUGNACAO" | "ESCLARECIMENTO";
    id: string;
    createdBy: string;
    name: string;
    sections: {
        id: string;
        name: string;
        order: number;
        fields: {
            type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "FILE";
            id: string;
            name: string;
            validation?: {
                options?: string[] | undefined;
                pattern?: string | undefined;
                max?: number | undefined;
                minLength?: number | undefined;
                maxLength?: number | undefined;
                min?: number | undefined;
            } | undefined;
            description?: string | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
            defaultValue?: any;
        }[];
        description?: string | undefined;
        validationRules?: string[] | undefined;
        required?: boolean | undefined;
        conditionalLogic?: Record<string, any> | undefined;
    }[];
    status?: "DRAFT" | "ARCHIVED" | "DEPRECATED" | "ACTIVE" | undefined;
    metadata?: Record<string, any> | undefined;
    version?: string | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | undefined;
    requiredFields?: string[] | undefined;
    lastModifiedBy?: string | undefined;
    analysisRules?: string[] | undefined;
    isDefault?: boolean | undefined;
    isPublic?: boolean | undefined;
    usage?: {
        documentsCreated?: number | undefined;
        lastUsed?: Date | undefined;
        averageCompletionTime?: number | undefined;
    } | undefined;
}>;
export declare const AnalysisRuleSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["ESTRUTURAL", "JURIDICO", "CLAREZA", "ABNT", "CONFORMIDADE", "COMPLETUDE"]>;
    severity: z.ZodEnum<["CRITICA", "ALTA", "MEDIA", "BAIXA"]>;
    pattern: z.ZodString;
    patternType: z.ZodDefault<z.ZodEnum<["regex", "keyword", "phrase", "nlp"]>>;
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
    condition: z.ZodObject<{
        type: z.ZodEnum<["CONTAINS", "NOT_CONTAINS", "MATCHES", "NOT_MATCHES", "CUSTOM"]>;
        value: z.ZodString;
        flags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "CUSTOM" | "CONTAINS" | "NOT_CONTAINS" | "MATCHES" | "NOT_MATCHES";
        flags?: string[] | undefined;
    }, {
        value: string;
        type: "CUSTOM" | "CONTAINS" | "NOT_CONTAINS" | "MATCHES" | "NOT_MATCHES";
        flags?: string[] | undefined;
    }>;
    action: z.ZodObject<{
        type: z.ZodEnum<["FLAG", "SUGGEST", "AUTO_FIX", "BLOCK"]>;
        message: z.ZodString;
        suggestion: z.ZodOptional<z.ZodString>;
        autoFixTemplate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: "FLAG" | "SUGGEST" | "AUTO_FIX" | "BLOCK";
        suggestion?: string | undefined;
        autoFixTemplate?: string | undefined;
    }, {
        message: string;
        type: "FLAG" | "SUGGEST" | "AUTO_FIX" | "BLOCK";
        suggestion?: string | undefined;
        autoFixTemplate?: string | undefined;
    }>;
    appliesToDocumentTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    appliesToSections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    weight: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    testMode: z.ZodDefault<z.ZodBoolean>;
    performance: z.ZodOptional<z.ZodObject<{
        executionCount: z.ZodDefault<z.ZodNumber>;
        averageExecutionTime: z.ZodDefault<z.ZodNumber>;
        falsePositiveRate: z.ZodOptional<z.ZodNumber>;
        lastExecuted: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        executionCount: number;
        averageExecutionTime: number;
        falsePositiveRate?: number | undefined;
        lastExecuted?: Date | undefined;
    }, {
        executionCount?: number | undefined;
        averageExecutionTime?: number | undefined;
        falsePositiveRate?: number | undefined;
        lastExecuted?: Date | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    id: string;
    createdBy: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    name: string;
    category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
    severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
    description: string;
    priority: number;
    pattern: string;
    patternType: "regex" | "keyword" | "phrase" | "nlp";
    weight: number;
    action: {
        message: string;
        type: "FLAG" | "SUGGEST" | "AUTO_FIX" | "BLOCK";
        suggestion?: string | undefined;
        autoFixTemplate?: string | undefined;
    };
    caseSensitive: boolean;
    condition: {
        value: string;
        type: "CUSTOM" | "CONTAINS" | "NOT_CONTAINS" | "MATCHES" | "NOT_MATCHES";
        flags?: string[] | undefined;
    };
    enabled: boolean;
    testMode: boolean;
    metadata?: Record<string, any> | undefined;
    appliesToDocumentTypes?: string[] | undefined;
    lastModifiedBy?: string | undefined;
    appliesToSections?: string[] | undefined;
    performance?: {
        executionCount: number;
        averageExecutionTime: number;
        falsePositiveRate?: number | undefined;
        lastExecuted?: Date | undefined;
    } | undefined;
}, {
    organizationId: string;
    id: string;
    createdBy: string;
    name: string;
    category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
    severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
    description: string;
    pattern: string;
    action: {
        message: string;
        type: "FLAG" | "SUGGEST" | "AUTO_FIX" | "BLOCK";
        suggestion?: string | undefined;
        autoFixTemplate?: string | undefined;
    };
    condition: {
        value: string;
        type: "CUSTOM" | "CONTAINS" | "NOT_CONTAINS" | "MATCHES" | "NOT_MATCHES";
        flags?: string[] | undefined;
    };
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    priority?: number | undefined;
    patternType?: "regex" | "keyword" | "phrase" | "nlp" | undefined;
    appliesToDocumentTypes?: string[] | undefined;
    weight?: number | undefined;
    lastModifiedBy?: string | undefined;
    caseSensitive?: boolean | undefined;
    appliesToSections?: string[] | undefined;
    enabled?: boolean | undefined;
    testMode?: boolean | undefined;
    performance?: {
        executionCount?: number | undefined;
        averageExecutionTime?: number | undefined;
        falsePositiveRate?: number | undefined;
        lastExecuted?: Date | undefined;
    } | undefined;
}>;
export declare const CustomParametersSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
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
    presetType: z.ZodEnum<["RIGOROUS", "STANDARD", "TECHNICAL", "FAST", "CUSTOM"]>;
    thresholds: z.ZodObject<{
        excellent: z.ZodDefault<z.ZodNumber>;
        good: z.ZodDefault<z.ZodNumber>;
        acceptable: z.ZodDefault<z.ZodNumber>;
        poor: z.ZodDefault<z.ZodNumber>;
        critical: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    }, {
        excellent?: number | undefined;
        good?: number | undefined;
        poor?: number | undefined;
        critical?: number | undefined;
        acceptable?: number | undefined;
    }>;
    advanced: z.ZodOptional<z.ZodObject<{
        enableContextualAnalysis: z.ZodDefault<z.ZodBoolean>;
        enableSemanticAnalysis: z.ZodDefault<z.ZodBoolean>;
        strictCompliance: z.ZodDefault<z.ZodBoolean>;
        autoCorrection: z.ZodDefault<z.ZodBoolean>;
        analysisTimeout: z.ZodDefault<z.ZodNumber>;
        maxRetries: z.ZodDefault<z.ZodNumber>;
        batchSize: z.ZodDefault<z.ZodNumber>;
        parallelProcessing: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enableContextualAnalysis: boolean;
        enableSemanticAnalysis: boolean;
        strictCompliance: boolean;
        autoCorrection: boolean;
        analysisTimeout: number;
        maxRetries: number;
        batchSize: number;
        parallelProcessing: boolean;
    }, {
        enableContextualAnalysis?: boolean | undefined;
        enableSemanticAnalysis?: boolean | undefined;
        strictCompliance?: boolean | undefined;
        autoCorrection?: boolean | undefined;
        analysisTimeout?: number | undefined;
        maxRetries?: number | undefined;
        batchSize?: number | undefined;
        parallelProcessing?: boolean | undefined;
    }>>;
    customRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "ACTIVE", "ARCHIVED"]>>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    usage: z.ZodOptional<z.ZodObject<{
        documentsAnalyzed: z.ZodDefault<z.ZodNumber>;
        totalAnalysisTime: z.ZodDefault<z.ZodNumber>;
        averageScore: z.ZodOptional<z.ZodNumber>;
        lastUsed: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        documentsAnalyzed: number;
        totalAnalysisTime: number;
        lastUsed?: Date | undefined;
        averageScore?: number | undefined;
    }, {
        lastUsed?: Date | undefined;
        documentsAnalyzed?: number | undefined;
        totalAnalysisTime?: number | undefined;
        averageScore?: number | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    status: "DRAFT" | "ARCHIVED" | "ACTIVE";
    id: string;
    createdBy: string;
    version: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    name: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    presetType: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM";
    customRules: string[];
    isDefault: boolean;
    thresholds: {
        excellent: number;
        good: number;
        poor: number;
        critical: number;
        acceptable: number;
    };
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    lastModifiedBy?: string | undefined;
    usage?: {
        documentsAnalyzed: number;
        totalAnalysisTime: number;
        lastUsed?: Date | undefined;
        averageScore?: number | undefined;
    } | undefined;
    advanced?: {
        enableContextualAnalysis: boolean;
        enableSemanticAnalysis: boolean;
        strictCompliance: boolean;
        autoCorrection: boolean;
        analysisTimeout: number;
        maxRetries: number;
        batchSize: number;
        parallelProcessing: boolean;
    } | undefined;
}, {
    organizationId: string;
    id: string;
    createdBy: string;
    name: string;
    weights: {
        structural: number;
        legal: number;
        clarity: number;
        abnt: number;
    };
    presetType: "RIGOROUS" | "STANDARD" | "TECHNICAL" | "FAST" | "CUSTOM";
    thresholds: {
        excellent?: number | undefined;
        good?: number | undefined;
        poor?: number | undefined;
        critical?: number | undefined;
        acceptable?: number | undefined;
    };
    status?: "DRAFT" | "ARCHIVED" | "ACTIVE" | undefined;
    metadata?: Record<string, any> | undefined;
    version?: string | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    description?: string | undefined;
    customRules?: string[] | undefined;
    lastModifiedBy?: string | undefined;
    isDefault?: boolean | undefined;
    usage?: {
        lastUsed?: Date | undefined;
        documentsAnalyzed?: number | undefined;
        totalAnalysisTime?: number | undefined;
        averageScore?: number | undefined;
    } | undefined;
    advanced?: {
        enableContextualAnalysis?: boolean | undefined;
        enableSemanticAnalysis?: boolean | undefined;
        strictCompliance?: boolean | undefined;
        autoCorrection?: boolean | undefined;
        analysisTimeout?: number | undefined;
        maxRetries?: number | undefined;
        batchSize?: number | undefined;
        parallelProcessing?: boolean | undefined;
    } | undefined;
}>;
export declare const OrganizationUserSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    uid: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    photoURL: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["OWNER", "ADMIN", "EDITOR", "VIEWER", "GUEST"]>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodEnum<["READ_DOCUMENTS", "WRITE_DOCUMENTS", "DELETE_DOCUMENTS", "MANAGE_TEMPLATES", "MANAGE_RULES", "MANAGE_CONFIGS", "MANAGE_USERS", "VIEW_ANALYTICS", "EXPORT_DATA", "MANAGE_BILLING"]>, "many">>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE", "PENDING_INVITATION", "SUSPENDED"]>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        emailNotifications: z.ZodDefault<z.ZodBoolean>;
        dashboardLayout: z.ZodOptional<z.ZodString>;
        defaultView: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        timezone: string;
        emailNotifications: boolean;
        dashboardLayout?: string | undefined;
        defaultView?: string | undefined;
    }, {
        language?: string | undefined;
        timezone?: string | undefined;
        emailNotifications?: boolean | undefined;
        dashboardLayout?: string | undefined;
        defaultView?: string | undefined;
    }>>;
    activity: z.ZodOptional<z.ZodObject<{
        lastLogin: z.ZodOptional<z.ZodDate>;
        documentCount: z.ZodDefault<z.ZodNumber>;
        analysisCount: z.ZodDefault<z.ZodNumber>;
        averageSessionTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        analysisCount: number;
        documentCount: number;
        lastLogin?: Date | undefined;
        averageSessionTime?: number | undefined;
    }, {
        analysisCount?: number | undefined;
        lastLogin?: Date | undefined;
        documentCount?: number | undefined;
        averageSessionTime?: number | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    invitedBy: z.ZodOptional<z.ZodString>;
    invitedAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_INVITATION";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    uid: string;
    permissions: ("READ_DOCUMENTS" | "WRITE_DOCUMENTS" | "DELETE_DOCUMENTS" | "MANAGE_TEMPLATES" | "MANAGE_RULES" | "MANAGE_CONFIGS" | "MANAGE_USERS" | "VIEW_ANALYTICS" | "EXPORT_DATA" | "MANAGE_BILLING")[];
    role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "GUEST";
    metadata?: Record<string, any> | undefined;
    displayName?: string | undefined;
    photoURL?: string | undefined;
    preferences?: {
        language: string;
        timezone: string;
        emailNotifications: boolean;
        dashboardLayout?: string | undefined;
        defaultView?: string | undefined;
    } | undefined;
    activity?: {
        analysisCount: number;
        documentCount: number;
        lastLogin?: Date | undefined;
        averageSessionTime?: number | undefined;
    } | undefined;
    invitedBy?: string | undefined;
    invitedAt?: Date | undefined;
}, {
    organizationId: string;
    id: string;
    email: string;
    uid: string;
    role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "GUEST";
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_INVITATION" | undefined;
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    permissions?: ("READ_DOCUMENTS" | "WRITE_DOCUMENTS" | "DELETE_DOCUMENTS" | "MANAGE_TEMPLATES" | "MANAGE_RULES" | "MANAGE_CONFIGS" | "MANAGE_USERS" | "VIEW_ANALYTICS" | "EXPORT_DATA" | "MANAGE_BILLING")[] | undefined;
    displayName?: string | undefined;
    photoURL?: string | undefined;
    preferences?: {
        language?: string | undefined;
        timezone?: string | undefined;
        emailNotifications?: boolean | undefined;
        dashboardLayout?: string | undefined;
        defaultView?: string | undefined;
    } | undefined;
    activity?: {
        analysisCount?: number | undefined;
        lastLogin?: Date | undefined;
        documentCount?: number | undefined;
        averageSessionTime?: number | undefined;
    } | undefined;
    invitedBy?: string | undefined;
    invitedAt?: Date | undefined;
}>;
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;
export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;
export type AnalysisRule = z.infer<typeof AnalysisRuleSchema>;
export type CustomParameters = z.infer<typeof CustomParametersSchema>;
export type OrganizationUser = z.infer<typeof OrganizationUserSchema>;
export declare const ORGANIZATION_COLLECTIONS: {
    readonly PROFILE: "profile";
    readonly TEMPLATES: "templates";
    readonly ANALYSIS_RULES: "analysis_rules";
    readonly CUSTOM_PARAMS: "custom_params";
    readonly USERS: "users";
};
