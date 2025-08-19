"use strict";
/**
 * Firestore Schema: Documents Collection
 *
 * Collection: /documents/{docId}/
 * Structure for document-level data including metadata, analyses, versions, and comments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_COLLECTIONS = exports.ReviewCommentSchema = exports.DocumentVersionSchema = exports.AnalysisResultSchema = exports.DocumentMetadataSchema = void 0;
const zod_1 = require("zod");
// Document Metadata Schema
exports.DocumentMetadataSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    title: zod_1.z.string().min(1, 'Document title is required'),
    description: zod_1.z.string().optional(),
    // Document Classification
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
    category: zod_1.z.string().optional(),
    subcategory: zod_1.z.string().optional(),
    // File Information
    file: zod_1.z.object({
        originalName: zod_1.z.string(),
        filename: zod_1.z.string(), // Stored filename
        mimeType: zod_1.z.string(),
        size: zod_1.z.number().int().positive(),
        extension: zod_1.z.string(),
        // Storage Information
        storagePath: zod_1.z.string(),
        downloadURL: zod_1.z.string().url(),
        // File Processing
        checksum: zod_1.z.string().optional(), // MD5 or SHA256
        encoding: zod_1.z.string().optional(),
        // OCR Results
        extractedText: zod_1.z.string().optional(),
        ocrConfidence: zod_1.z.number().min(0).max(1).optional(),
        pageCount: zod_1.z.number().int().min(1).optional()
    }),
    // Document Status
    status: zod_1.z.enum([
        'UPLOADED',
        'PROCESSING',
        'ANALYZED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'ARCHIVED',
        'DELETED'
    ]).default('UPLOADED'),
    // Processing Information
    processing: zod_1.z.object({
        currentStep: zod_1.z.string().optional(),
        progress: zod_1.z.number().min(0).max(100).default(0),
        startedAt: zod_1.z.date().optional(),
        completedAt: zod_1.z.date().optional(),
        estimatedCompletion: zod_1.z.date().optional(),
        // Error Handling
        errors: zod_1.z.array(zod_1.z.object({
            code: zod_1.z.string(),
            message: zod_1.z.string(),
            timestamp: zod_1.z.date(),
            step: zod_1.z.string().optional()
        })).default([]),
        // Processing Metrics
        metrics: zod_1.z.object({
            ocrTime: zod_1.z.number().optional(), // milliseconds
            analysisTime: zod_1.z.number().optional(),
            totalProcessingTime: zod_1.z.number().optional()
        }).optional()
    }).optional(),
    // Template Reference
    templateId: zod_1.z.string().optional(),
    templateVersion: zod_1.z.string().optional(),
    // Tags & Classification
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    keywords: zod_1.z.array(zod_1.z.string()).default([]),
    // Compliance & Legal
    compliance: zod_1.z.object({
        requiredByLaw: zod_1.z.boolean().default(false),
        legalBasis: zod_1.z.array(zod_1.z.string()).default([]), // Legal references
        complianceStatus: zod_1.z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'UNDER_REVIEW']).optional(),
        expirationDate: zod_1.z.date().optional(),
        retentionPeriod: zod_1.z.number().int().positive().optional() // days
    }).optional(),
    // Workflow Information
    workflow: zod_1.z.object({
        currentStage: zod_1.z.string().optional(),
        assignedTo: zod_1.z.string().optional(), // User ID
        dueDate: zod_1.z.date().optional(),
        priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
        // Approval Chain
        approvers: zod_1.z.array(zod_1.z.object({
            userId: zod_1.z.string(),
            role: zod_1.z.string(),
            required: zod_1.z.boolean(),
            approvedAt: zod_1.z.date().optional(),
            comments: zod_1.z.string().optional()
        })).default([])
    }).optional(),
    // Statistics
    statistics: zod_1.z.object({
        viewCount: zod_1.z.number().int().min(0).default(0),
        downloadCount: zod_1.z.number().int().min(0).default(0),
        analysisCount: zod_1.z.number().int().min(0).default(0),
        commentCount: zod_1.z.number().int().min(0).default(0),
        shareCount: zod_1.z.number().int().min(0).default(0),
        // Timing Statistics
        averageReviewTime: zod_1.z.number().optional(), // minutes
        lastViewed: zod_1.z.date().optional(),
        lastDownloaded: zod_1.z.date().optional()
    }).optional(),
    // Security & Access
    security: zod_1.z.object({
        accessLevel: zod_1.z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL']).default('INTERNAL'),
        encryptionStatus: zod_1.z.boolean().default(false),
        // Access Control
        allowedRoles: zod_1.z.array(zod_1.z.string()).default([]),
        allowedUsers: zod_1.z.array(zod_1.z.string()).default([]),
        // Audit Requirements
        auditRequired: zod_1.z.boolean().default(false),
        dataClassification: zod_1.z.string().optional()
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Version Control
    version: zod_1.z.string().default('1.0.0'),
    parentDocumentId: zod_1.z.string().optional(), // For document revisions
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Analysis Result Schema
exports.AnalysisResultSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    // Analysis Configuration
    analysisType: zod_1.z.enum(['FULL', 'QUICK', 'CUSTOM', 'COMPLIANCE_ONLY']),
    configurationId: zod_1.z.string(), // Custom parameters used
    templateId: zod_1.z.string().optional(),
    // 🚀 CORE: Weighted Scoring System
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
    // Analysis Results
    results: zod_1.z.object({
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
            // Problem Metadata
            impact: zod_1.z.number().min(0).max(10),
            confidence: zod_1.z.number().min(0).max(1),
            autoFixAvailable: zod_1.z.boolean().default(false),
            // Resolution
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
            // Implementation
            actionRequired: zod_1.z.string(),
            estimatedEffort: zod_1.z.string().optional(), // "5 minutes", "1 hour", etc.
            // Benefits
            expectedImprovement: zod_1.z.number().min(0).max(100).optional(),
            complianceImprovement: zod_1.z.boolean().default(false)
        })),
        // Compliance Check
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
            // Detailed Metrics
            averageSentenceLength: zod_1.z.number().optional(),
            complexWordsPercentage: zod_1.z.number().min(0).max(100).optional(),
            passiveVoicePercentage: zod_1.z.number().min(0).max(100).optional(),
            // Text Statistics
            wordCount: zod_1.z.number().int().min(0),
            sentenceCount: zod_1.z.number().int().min(0),
            paragraphCount: zod_1.z.number().int().min(0)
        }).optional()
    }),
    // Analysis Metadata
    analysis: zod_1.z.object({
        // Timing Information
        startedAt: zod_1.z.date(),
        completedAt: zod_1.z.date(),
        duration: zod_1.z.number().min(0), // milliseconds
        // Processing Details
        engine: zod_1.z.string().default('licitareview-v1'),
        engineVersion: zod_1.z.string().default('1.0.0'),
        // Resource Usage
        resourceUsage: zod_1.z.object({
            cpuTime: zod_1.z.number().optional(), // milliseconds
            memoryUsed: zod_1.z.number().optional(), // bytes
            apiCallsCount: zod_1.z.number().int().min(0).optional()
        }).optional(),
        // Analysis Statistics
        rulesApplied: zod_1.z.number().int().min(0),
        patternsMatched: zod_1.z.number().int().min(0),
        sectionsAnalyzed: zod_1.z.number().int().min(0)
    }),
    // Status
    status: zod_1.z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).default('RUNNING'),
    // Error Information
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.any()).optional(),
        stack: zod_1.z.string().optional()
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string()
});
// Document Version Schema
exports.DocumentVersionSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    documentId: zod_1.z.string(),
    versionNumber: zod_1.z.string(), // e.g., "1.0.0", "1.1.0"
    // Version Details
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    changeLog: zod_1.z.string().optional(),
    // File Information
    file: zod_1.z.object({
        filename: zod_1.z.string(),
        size: zod_1.z.number().int().positive(),
        checksum: zod_1.z.string(),
        storagePath: zod_1.z.string(),
        downloadURL: zod_1.z.string().url()
    }),
    // Version Type
    versionType: zod_1.z.enum(['MAJOR', 'MINOR', 'PATCH', 'DRAFT']),
    // Comparison Data
    changes: zod_1.z.object({
        addedSections: zod_1.z.array(zod_1.z.string()).default([]),
        modifiedSections: zod_1.z.array(zod_1.z.string()).default([]),
        deletedSections: zod_1.z.array(zod_1.z.string()).default([]),
        // Text Changes
        addedText: zod_1.z.number().int().min(0).default(0), // characters
        deletedText: zod_1.z.number().int().min(0).default(0),
        modifiedText: zod_1.z.number().int().min(0).default(0),
        // Change Summary
        changePercentage: zod_1.z.number().min(0).max(100).optional(),
        significantChanges: zod_1.z.boolean().default(false)
    }).optional(),
    // Status
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED']).default('DRAFT'),
    isActive: zod_1.z.boolean().default(false), // Only one version can be active
    // Approval Information
    approval: zod_1.z.object({
        required: zod_1.z.boolean().default(false),
        approvedBy: zod_1.z.string().optional(),
        approvedAt: zod_1.z.date().optional(),
        approvalNotes: zod_1.z.string().optional()
    }).optional(),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Review Comment Schema
exports.ReviewCommentSchema = zod_1.z.object({
    // Basic Information
    id: zod_1.z.string(),
    documentId: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    // Comment Details
    content: zod_1.z.string().min(1, 'Comment content is required'),
    type: zod_1.z.enum(['GENERAL', 'SUGGESTION', 'ISSUE', 'APPROVAL', 'QUESTION']),
    // Location Information
    location: zod_1.z.object({
        page: zod_1.z.number().int().positive().optional(),
        section: zod_1.z.string().optional(),
        paragraph: zod_1.z.number().int().positive().optional(),
        // Text Selection
        startPosition: zod_1.z.number().int().optional(),
        endPosition: zod_1.z.number().int().optional(),
        selectedText: zod_1.z.string().optional(),
        // Visual Coordinates (for annotations)
        coordinates: zod_1.z.object({
            x: zod_1.z.number(),
            y: zod_1.z.number(),
            width: zod_1.z.number().optional(),
            height: zod_1.z.number().optional()
        }).optional()
    }).optional(),
    // Threading
    parentCommentId: zod_1.z.string().optional(), // For reply threads
    threadId: zod_1.z.string().optional(),
    // Status & Resolution
    status: zod_1.z.enum(['OPEN', 'RESOLVED', 'ACKNOWLEDGED', 'DISMISSED']).default('OPEN'),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    // Resolution Information
    resolution: zod_1.z.object({
        resolvedBy: zod_1.z.string(),
        resolvedAt: zod_1.z.date(),
        resolution: zod_1.z.string(),
        actionTaken: zod_1.z.string().optional()
    }).optional(),
    // Metadata
    visibility: zod_1.z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE']).default('INTERNAL'),
    mentions: zod_1.z.array(zod_1.z.string()).default([]), // User IDs mentioned
    attachments: zod_1.z.array(zod_1.z.object({
        filename: zod_1.z.string(),
        url: zod_1.z.string(),
        size: zod_1.z.number().int().positive(),
        mimeType: zod_1.z.string()
    })).default([]),
    // Audit Fields
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    createdBy: zod_1.z.string(),
    lastModifiedBy: zod_1.z.string().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// Collection References
exports.DOCUMENT_COLLECTIONS = {
    METADATA: 'metadata',
    ANALYSES: 'analyses',
    VERSIONS: 'versions',
    COMMENTS: 'comments'
};
//# sourceMappingURL=document.schema.js.map