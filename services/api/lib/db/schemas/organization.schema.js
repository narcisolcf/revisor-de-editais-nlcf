"use strict";
/**
 * Firestore Schema: Organizations Collection
 *
 * Collection: /organizations/{orgId}/
 * Structure for organization-level data including profile, templates, rules, and parameters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORGANIZATION_COLLECTIONS = exports.OrganizationUserSchema = exports.CustomParametersSchema = exports.AnalysisRuleSchema = exports.DocumentTemplateSchema = exports.OrganizationProfileSchema = void 0;
const zod_1 = require("zod");
// Base Organization Profile Schema
exports.OrganizationProfileSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Organization name is required'),
    displayName: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    // Government Information
    cnpj: zod_1.z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Invalid CNPJ format'),
    governmentLevel: zod_1.z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL']),
    organizationType: zod_1.z.enum([
        'TRIBUNAL_CONTAS',
        'PREFEITURA',
        'GOVERNO_ESTADUAL',
        'MINISTERIO',
        'AUTARQUIA',
        'FUNDACAO',
        'EMPRESA_PUBLICA',
        'OUTROS'
    ]),
    // Contact Information
    contact: zod_1.z.object({
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(),
        website: zod_1.z.string().url().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string(),
            city: zod_1.z.string(),
            state: zod_1.z.string(),
            zipCode: zod_1.z.string(),
            country: zod_1.z.string().default('BR')
        }).optional()
    }),
    // Settings
    settings: zod_1.z.object({
        timezone: zod_1.z.string().default('America/Sao_Paulo'),
        language: zod_1.z.string().default('pt-BR'),
        defaultAnalysisPreset: zod_1.z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']).default('STANDARD'),
        enableAIAnalysis: zod_1.z.boolean().default(true),
        enableCustomRules: zod_1.z.boolean().default(true),
        strictMode: zod_1.z.boolean().default(false),
        autoApproval: zod_1.z.boolean().default(false),
        requireDualApproval: zod_1.z.boolean().default(false),
        retentionDays: zod_1.z.number().int().positive().default(365),
        maxDocumentSize: zod_1.z.number().positive().default(52428800), // 50MB
        allowedDocumentTypes: zod_1.z.array(zod_1.z.string()).default(['pdf', 'doc', 'docx'])
    }),
    // Status & Metadata
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']).default('PENDING_APPROVAL'),
    subscriptionTier: zod_1.z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).default('FREE'),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
// Document Template Schema
exports.DocumentTemplateSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Template name is required'),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string().default('1.0.0'),
    // Template Configuration
    documentType: zod_1.z.enum([
        'EDITAL',
        'TERMO_REFERENCIA',
        'ATA_SESSAO',
        'CONTRATO',
        'PROJETO_BASICO',
        'RECURSO',
        'IMPUGNACAO',
        'ESCLARECIMENTO'
    ]),
    // Template Structure
    sections: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        order: zod_1.z.number().int().min(0),
        required: zod_1.z.boolean().default(false),
        // Field Definitions
        fields: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            type: zod_1.z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'FILE']),
            required: zod_1.z.boolean().default(false),
            description: zod_1.z.string().optional(),
            placeholder: zod_1.z.string().optional(),
            validation: zod_1.z.object({
                minLength: zod_1.z.number().optional(),
                maxLength: zod_1.z.number().optional(),
                pattern: zod_1.z.string().optional(),
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional(),
                options: zod_1.z.array(zod_1.z.string()).optional()
            }).optional(),
            defaultValue: zod_1.z.any().optional()
        })),
        // Validation Rules for Section
        validationRules: zod_1.z.array(zod_1.z.string()).default([]),
        conditionalLogic: zod_1.z.record(zod_1.z.any()).optional()
    })),
    // Template Rules
    analysisRules: zod_1.z.array(zod_1.z.string()).default([]), // References to analysis rule IDs
    requiredFields: zod_1.z.array(zod_1.z.string()).default([]),
    // Status & Metadata  
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED']).default('DRAFT'),
    isDefault: zod_1.z.boolean().default(false),
    isPublic: zod_1.z.boolean().default(false), // Can be shared with other orgs
    // Usage Statistics
    usage: zod_1.z.object({
        documentsCreated: zod_1.z.number().int().min(0).default(0),
        lastUsed: zod_1.z.date().optional(),
        averageCompletionTime: zod_1.z.number().optional() // in minutes
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
// Analysis Rule Schema  
exports.AnalysisRuleSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Rule name is required'),
    description: zod_1.z.string(),
    // Rule Configuration
    category: zod_1.z.enum(['ESTRUTURAL', 'JURIDICO', 'CLAREZA', 'ABNT', 'CONFORMIDADE', 'COMPLETUDE']),
    severity: zod_1.z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
    // Pattern Matching
    pattern: zod_1.z.string(), // Regex or keyword pattern
    patternType: zod_1.z.enum(['regex', 'keyword', 'phrase', 'nlp']).default('regex'),
    caseSensitive: zod_1.z.boolean().default(false),
    // Rule Logic
    condition: zod_1.z.object({
        type: zod_1.z.enum(['CONTAINS', 'NOT_CONTAINS', 'MATCHES', 'NOT_MATCHES', 'CUSTOM']),
        value: zod_1.z.string(),
        flags: zod_1.z.array(zod_1.z.string()).optional()
    }),
    // Action Configuration
    action: zod_1.z.object({
        type: zod_1.z.enum(['FLAG', 'SUGGEST', 'AUTO_FIX', 'BLOCK']),
        message: zod_1.z.string(),
        suggestion: zod_1.z.string().optional(),
        autoFixTemplate: zod_1.z.string().optional()
    }),
    // Applicability
    appliesToDocumentTypes: zod_1.z.array(zod_1.z.string()).optional(),
    appliesToSections: zod_1.z.array(zod_1.z.string()).optional(),
    // Rule Weighting
    weight: zod_1.z.number().min(0).max(10).default(1),
    priority: zod_1.z.number().int().min(1).max(5).default(3),
    // Advanced Configuration
    enabled: zod_1.z.boolean().default(true),
    testMode: zod_1.z.boolean().default(false), // For testing rules without affecting scores
    // Performance & Statistics
    performance: zod_1.z.object({
        executionCount: zod_1.z.number().int().min(0).default(0),
        averageExecutionTime: zod_1.z.number().min(0).default(0), // milliseconds
        falsePositiveRate: zod_1.z.number().min(0).max(1).optional(),
        lastExecuted: zod_1.z.date().optional()
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
// Custom Parameters Schema (🚀 CORE DIFFERENTIATOR)
exports.CustomParametersSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Configuration name is required'),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string().default('1.0.0'),
    // Analysis Weights (Must sum to 100%)
    weights: zod_1.z.object({
        structural: zod_1.z.number().min(0).max(100),
        legal: zod_1.z.number().min(0).max(100),
        clarity: zod_1.z.number().min(0).max(100),
        abnt: zod_1.z.number().min(0).max(100)
    }).refine((data) => {
        const total = data.structural + data.legal + data.clarity + data.abnt;
        return Math.abs(total - 100) < 0.01;
    }, {
        message: 'Analysis weights must sum to exactly 100%',
        path: ['weights']
    }),
    // Preset Configuration
    presetType: zod_1.z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']),
    // Scoring Thresholds
    thresholds: zod_1.z.object({
        excellent: zod_1.z.number().min(0).max(100).default(90),
        good: zod_1.z.number().min(0).max(100).default(75),
        acceptable: zod_1.z.number().min(0).max(100).default(60),
        poor: zod_1.z.number().min(0).max(100).default(40),
        critical: zod_1.z.number().min(0).max(100).default(25)
    }),
    // Advanced Settings
    advanced: zod_1.z.object({
        enableContextualAnalysis: zod_1.z.boolean().default(true),
        enableSemanticAnalysis: zod_1.z.boolean().default(false),
        strictCompliance: zod_1.z.boolean().default(false),
        autoCorrection: zod_1.z.boolean().default(false),
        // Timeout Settings
        analysisTimeout: zod_1.z.number().int().min(30).max(600).default(300), // seconds
        maxRetries: zod_1.z.number().int().min(0).max(5).default(3),
        // Performance Settings
        batchSize: zod_1.z.number().int().min(1).max(100).default(10),
        parallelProcessing: zod_1.z.boolean().default(true)
    }).optional(),
    // Referenced Rules
    customRules: zod_1.z.array(zod_1.z.string()).default([]), // Array of rule IDs
    // Status & Usage
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
    isDefault: zod_1.z.boolean().default(false),
    // Usage Statistics
    usage: zod_1.z.object({
        documentsAnalyzed: zod_1.z.number().int().min(0).default(0),
        totalAnalysisTime: zod_1.z.number().min(0).default(0), // minutes
        averageScore: zod_1.z.number().min(0).max(100).optional(),
        lastUsed: zod_1.z.date().optional()
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
// Organization User Schema
exports.OrganizationUserSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    uid: zod_1.z.string(), // Firebase Auth UID
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().optional(),
    photoURL: zod_1.z.string().url().optional(),
    // Role & Permissions
    role: zod_1.z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'GUEST']),
    permissions: zod_1.z.array(zod_1.z.enum([
        'READ_DOCUMENTS',
        'WRITE_DOCUMENTS',
        'DELETE_DOCUMENTS',
        'MANAGE_TEMPLATES',
        'MANAGE_RULES',
        'MANAGE_CONFIGS',
        'MANAGE_USERS',
        'VIEW_ANALYTICS',
        'EXPORT_DATA',
        'MANAGE_BILLING'
    ])).default(['READ_DOCUMENTS']),
    // Status
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'PENDING_INVITATION', 'SUSPENDED']).default('PENDING_INVITATION'),
    // User Preferences
    preferences: zod_1.z.object({
        language: zod_1.z.string().default('pt-BR'),
        timezone: zod_1.z.string().default('America/Sao_Paulo'),
        emailNotifications: zod_1.z.boolean().default(true),
        dashboardLayout: zod_1.z.string().optional(),
        defaultView: zod_1.z.string().optional()
    }).optional(),
    // Activity Tracking
    activity: zod_1.z.object({
        lastLogin: zod_1.z.date().optional(),
        documentCount: zod_1.z.number().int().min(0).default(0),
        analysisCount: zod_1.z.number().int().min(0).default(0),
        averageSessionTime: zod_1.z.number().min(0).optional() // minutes
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    invitedBy: zod_1.z.string().optional(),
    invitedAt: zod_1.z.date().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Collection References
exports.ORGANIZATION_COLLECTIONS = {
    PROFILE: 'profile',
    TEMPLATES: 'templates',
    ANALYSIS_RULES: 'analysis_rules',
    CUSTOM_PARAMS: 'custom_params',
    USERS: 'users'
};
//# sourceMappingURL=organization.schema.js.map