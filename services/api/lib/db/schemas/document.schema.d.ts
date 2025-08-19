/**
 * Firestore Schema: Documents Collection
 *
 * Collection: /documents/{docId}/
 * Structure for document-level data including metadata, analyses, versions, and comments
 */
import { z } from 'zod';
export declare const DocumentMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    documentType: z.ZodEnum<["EDITAL", "TERMO_REFERENCIA", "ATA_SESSAO", "CONTRATO", "PROJETO_BASICO", "RECURSO", "IMPUGNACAO", "ESCLARECIMENTO"]>;
    category: z.ZodOptional<z.ZodString>;
    subcategory: z.ZodOptional<z.ZodString>;
    file: z.ZodObject<{
        originalName: z.ZodString;
        filename: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        extension: z.ZodString;
        storagePath: z.ZodString;
        downloadURL: z.ZodString;
        checksum: z.ZodOptional<z.ZodString>;
        encoding: z.ZodOptional<z.ZodString>;
        extractedText: z.ZodOptional<z.ZodString>;
        ocrConfidence: z.ZodOptional<z.ZodNumber>;
        pageCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        size: number;
        originalName: string;
        filename: string;
        mimeType: string;
        extension: string;
        storagePath: string;
        downloadURL: string;
        pageCount?: number | undefined;
        ocrConfidence?: number | undefined;
        checksum?: string | undefined;
        encoding?: string | undefined;
        extractedText?: string | undefined;
    }, {
        size: number;
        originalName: string;
        filename: string;
        mimeType: string;
        extension: string;
        storagePath: string;
        downloadURL: string;
        pageCount?: number | undefined;
        ocrConfidence?: number | undefined;
        checksum?: string | undefined;
        encoding?: string | undefined;
        extractedText?: string | undefined;
    }>;
    status: z.ZodDefault<z.ZodEnum<["UPLOADED", "PROCESSING", "ANALYZED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ARCHIVED", "DELETED"]>>;
    processing: z.ZodOptional<z.ZodObject<{
        currentStep: z.ZodOptional<z.ZodString>;
        progress: z.ZodDefault<z.ZodNumber>;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        estimatedCompletion: z.ZodOptional<z.ZodDate>;
        errors: z.ZodDefault<z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            timestamp: z.ZodDate;
            step: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }, {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }>, "many">>;
        metrics: z.ZodOptional<z.ZodObject<{
            ocrTime: z.ZodOptional<z.ZodNumber>;
            analysisTime: z.ZodOptional<z.ZodNumber>;
            totalProcessingTime: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        }, {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        progress: number;
        errors: {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }[];
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        estimatedCompletion?: Date | undefined;
        metrics?: {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        } | undefined;
    }, {
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        progress?: number | undefined;
        startedAt?: Date | undefined;
        estimatedCompletion?: Date | undefined;
        errors?: {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }[] | undefined;
        metrics?: {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        } | undefined;
    }>>;
    templateId: z.ZodOptional<z.ZodString>;
    templateVersion: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    compliance: z.ZodOptional<z.ZodObject<{
        requiredByLaw: z.ZodDefault<z.ZodBoolean>;
        legalBasis: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        complianceStatus: z.ZodOptional<z.ZodEnum<["COMPLIANT", "NON_COMPLIANT", "PARTIAL", "UNDER_REVIEW"]>>;
        expirationDate: z.ZodOptional<z.ZodDate>;
        retentionPeriod: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requiredByLaw: boolean;
        legalBasis: string[];
        complianceStatus?: "UNDER_REVIEW" | "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL" | undefined;
        expirationDate?: Date | undefined;
        retentionPeriod?: number | undefined;
    }, {
        requiredByLaw?: boolean | undefined;
        legalBasis?: string[] | undefined;
        complianceStatus?: "UNDER_REVIEW" | "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL" | undefined;
        expirationDate?: Date | undefined;
        retentionPeriod?: number | undefined;
    }>>;
    workflow: z.ZodOptional<z.ZodObject<{
        currentStage: z.ZodOptional<z.ZodString>;
        assignedTo: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodDate>;
        priority: z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
        approvers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            role: z.ZodString;
            required: z.ZodBoolean;
            approvedAt: z.ZodOptional<z.ZodDate>;
            comments: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }, {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        approvers: {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }[];
        currentStage?: string | undefined;
        assignedTo?: string | undefined;
        dueDate?: Date | undefined;
    }, {
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
        currentStage?: string | undefined;
        assignedTo?: string | undefined;
        dueDate?: Date | undefined;
        approvers?: {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }[] | undefined;
    }>>;
    statistics: z.ZodOptional<z.ZodObject<{
        viewCount: z.ZodDefault<z.ZodNumber>;
        downloadCount: z.ZodDefault<z.ZodNumber>;
        analysisCount: z.ZodDefault<z.ZodNumber>;
        commentCount: z.ZodDefault<z.ZodNumber>;
        shareCount: z.ZodDefault<z.ZodNumber>;
        averageReviewTime: z.ZodOptional<z.ZodNumber>;
        lastViewed: z.ZodOptional<z.ZodDate>;
        lastDownloaded: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        analysisCount: number;
        viewCount: number;
        downloadCount: number;
        commentCount: number;
        shareCount: number;
        averageReviewTime?: number | undefined;
        lastViewed?: Date | undefined;
        lastDownloaded?: Date | undefined;
    }, {
        analysisCount?: number | undefined;
        viewCount?: number | undefined;
        downloadCount?: number | undefined;
        commentCount?: number | undefined;
        shareCount?: number | undefined;
        averageReviewTime?: number | undefined;
        lastViewed?: Date | undefined;
        lastDownloaded?: Date | undefined;
    }>>;
    security: z.ZodOptional<z.ZodObject<{
        accessLevel: z.ZodDefault<z.ZodEnum<["PUBLIC", "INTERNAL", "RESTRICTED", "CONFIDENTIAL"]>>;
        encryptionStatus: z.ZodDefault<z.ZodBoolean>;
        allowedRoles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allowedUsers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        auditRequired: z.ZodDefault<z.ZodBoolean>;
        dataClassification: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accessLevel: "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL";
        encryptionStatus: boolean;
        allowedRoles: string[];
        allowedUsers: string[];
        auditRequired: boolean;
        dataClassification?: string | undefined;
    }, {
        accessLevel?: "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL" | undefined;
        encryptionStatus?: boolean | undefined;
        allowedRoles?: string[] | undefined;
        allowedUsers?: string[] | undefined;
        auditRequired?: boolean | undefined;
        dataClassification?: string | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    parentDocumentId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "UPLOADED" | "PROCESSING" | "ARCHIVED" | "ANALYZED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DELETED";
    organizationId: string;
    documentType: "EDITAL" | "TERMO_REFERENCIA" | "PROJETO_BASICO" | "ATA_SESSAO" | "CONTRATO" | "RECURSO" | "IMPUGNACAO" | "ESCLARECIMENTO";
    id: string;
    title: string;
    createdBy: string;
    version: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    file: {
        size: number;
        originalName: string;
        filename: string;
        mimeType: string;
        extension: string;
        storagePath: string;
        downloadURL: string;
        pageCount?: number | undefined;
        ocrConfidence?: number | undefined;
        checksum?: string | undefined;
        encoding?: string | undefined;
        extractedText?: string | undefined;
    };
    keywords: string[];
    metadata?: Record<string, any> | undefined;
    parentDocumentId?: string | undefined;
    category?: string | undefined;
    description?: string | undefined;
    processing?: {
        progress: number;
        errors: {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }[];
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        startedAt?: Date | undefined;
        estimatedCompletion?: Date | undefined;
        metrics?: {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        } | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
    subcategory?: string | undefined;
    templateId?: string | undefined;
    templateVersion?: string | undefined;
    compliance?: {
        requiredByLaw: boolean;
        legalBasis: string[];
        complianceStatus?: "UNDER_REVIEW" | "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL" | undefined;
        expirationDate?: Date | undefined;
        retentionPeriod?: number | undefined;
    } | undefined;
    workflow?: {
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        approvers: {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }[];
        currentStage?: string | undefined;
        assignedTo?: string | undefined;
        dueDate?: Date | undefined;
    } | undefined;
    statistics?: {
        analysisCount: number;
        viewCount: number;
        downloadCount: number;
        commentCount: number;
        shareCount: number;
        averageReviewTime?: number | undefined;
        lastViewed?: Date | undefined;
        lastDownloaded?: Date | undefined;
    } | undefined;
    security?: {
        accessLevel: "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL";
        encryptionStatus: boolean;
        allowedRoles: string[];
        allowedUsers: string[];
        auditRequired: boolean;
        dataClassification?: string | undefined;
    } | undefined;
}, {
    organizationId: string;
    documentType: "EDITAL" | "TERMO_REFERENCIA" | "PROJETO_BASICO" | "ATA_SESSAO" | "CONTRATO" | "RECURSO" | "IMPUGNACAO" | "ESCLARECIMENTO";
    id: string;
    title: string;
    createdBy: string;
    file: {
        size: number;
        originalName: string;
        filename: string;
        mimeType: string;
        extension: string;
        storagePath: string;
        downloadURL: string;
        pageCount?: number | undefined;
        ocrConfidence?: number | undefined;
        checksum?: string | undefined;
        encoding?: string | undefined;
        extractedText?: string | undefined;
    };
    status?: "UPLOADED" | "PROCESSING" | "ARCHIVED" | "ANALYZED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DELETED" | undefined;
    metadata?: Record<string, any> | undefined;
    version?: string | undefined;
    parentDocumentId?: string | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    category?: string | undefined;
    description?: string | undefined;
    processing?: {
        completedAt?: Date | undefined;
        currentStep?: string | undefined;
        progress?: number | undefined;
        startedAt?: Date | undefined;
        estimatedCompletion?: Date | undefined;
        errors?: {
            code: string;
            message: string;
            timestamp: Date;
            step?: string | undefined;
        }[] | undefined;
        metrics?: {
            ocrTime?: number | undefined;
            analysisTime?: number | undefined;
            totalProcessingTime?: number | undefined;
        } | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
    subcategory?: string | undefined;
    templateId?: string | undefined;
    templateVersion?: string | undefined;
    keywords?: string[] | undefined;
    compliance?: {
        requiredByLaw?: boolean | undefined;
        legalBasis?: string[] | undefined;
        complianceStatus?: "UNDER_REVIEW" | "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL" | undefined;
        expirationDate?: Date | undefined;
        retentionPeriod?: number | undefined;
    } | undefined;
    workflow?: {
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
        currentStage?: string | undefined;
        assignedTo?: string | undefined;
        dueDate?: Date | undefined;
        approvers?: {
            required: boolean;
            role: string;
            userId: string;
            approvedAt?: Date | undefined;
            comments?: string | undefined;
        }[] | undefined;
    } | undefined;
    statistics?: {
        analysisCount?: number | undefined;
        viewCount?: number | undefined;
        downloadCount?: number | undefined;
        commentCount?: number | undefined;
        shareCount?: number | undefined;
        averageReviewTime?: number | undefined;
        lastViewed?: Date | undefined;
        lastDownloaded?: Date | undefined;
    } | undefined;
    security?: {
        accessLevel?: "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL" | undefined;
        encryptionStatus?: boolean | undefined;
        allowedRoles?: string[] | undefined;
        allowedUsers?: string[] | undefined;
        auditRequired?: boolean | undefined;
        dataClassification?: string | undefined;
    } | undefined;
}>;
export declare const AnalysisResultSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    organizationId: z.ZodString;
    analysisType: z.ZodEnum<["FULL", "QUICK", "CUSTOM", "COMPLIANCE_ONLY"]>;
    configurationId: z.ZodString;
    templateId: z.ZodOptional<z.ZodString>;
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
    results: z.ZodObject<{
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
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }, {
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
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
    }, "strip", z.ZodTypeAny, {
        recommendations: {
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }[];
        problems: {
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
    }, {
        recommendations: {
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
            actionRequired: string;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
            complianceImprovement?: boolean | undefined;
        }[];
        problems: {
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
    }>;
    analysis: z.ZodObject<{
        startedAt: z.ZodDate;
        completedAt: z.ZodDate;
        duration: z.ZodNumber;
        engine: z.ZodDefault<z.ZodString>;
        engineVersion: z.ZodDefault<z.ZodString>;
        resourceUsage: z.ZodOptional<z.ZodObject<{
            cpuTime: z.ZodOptional<z.ZodNumber>;
            memoryUsed: z.ZodOptional<z.ZodNumber>;
            apiCallsCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        }, {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        }>>;
        rulesApplied: z.ZodNumber;
        patternsMatched: z.ZodNumber;
        sectionsAnalyzed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        completedAt: Date;
        startedAt: Date;
        duration: number;
        engine: string;
        engineVersion: string;
        rulesApplied: number;
        patternsMatched: number;
        sectionsAnalyzed: number;
        resourceUsage?: {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        } | undefined;
    }, {
        completedAt: Date;
        startedAt: Date;
        duration: number;
        rulesApplied: number;
        patternsMatched: number;
        sectionsAnalyzed: number;
        engine?: string | undefined;
        engineVersion?: string | undefined;
        resourceUsage?: {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        } | undefined;
    }>;
    status: z.ZodDefault<z.ZodEnum<["RUNNING", "COMPLETED", "FAILED", "CANCELLED"]>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    analysisType: "CUSTOM" | "FULL" | "QUICK" | "COMPLIANCE_ONLY";
    organizationId: string;
    id: string;
    createdBy: string;
    createdAt: Date;
    configurationId: string;
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
    results: {
        recommendations: {
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
            actionRequired: string;
            complianceImprovement: boolean;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
        }[];
        problems: {
            status: "OPEN" | "ACKNOWLEDGED" | "FIXED" | "IGNORED" | "FALSE_POSITIVE";
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
    };
    analysis: {
        completedAt: Date;
        startedAt: Date;
        duration: number;
        engine: string;
        engineVersion: string;
        rulesApplied: number;
        patternsMatched: number;
        sectionsAnalyzed: number;
        resourceUsage?: {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        } | undefined;
    };
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    templateId?: string | undefined;
}, {
    documentId: string;
    analysisType: "CUSTOM" | "FULL" | "QUICK" | "COMPLIANCE_ONLY";
    organizationId: string;
    id: string;
    createdBy: string;
    configurationId: string;
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
    results: {
        recommendations: {
            priority: "LOW" | "HIGH" | "MEDIUM" | "CRITICAL";
            id: string;
            title: string;
            category: string;
            description: string;
            actionRequired: string;
            estimatedEffort?: string | undefined;
            expectedImprovement?: number | undefined;
            complianceImprovement?: boolean | undefined;
        }[];
        problems: {
            id: string;
            title: string;
            category: "ESTRUTURAL" | "JURIDICO" | "CLAREZA" | "ABNT" | "CONFORMIDADE" | "COMPLETUDE";
            severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
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
    };
    analysis: {
        completedAt: Date;
        startedAt: Date;
        duration: number;
        rulesApplied: number;
        patternsMatched: number;
        sectionsAnalyzed: number;
        engine?: string | undefined;
        engineVersion?: string | undefined;
        resourceUsage?: {
            cpuTime?: number | undefined;
            memoryUsed?: number | undefined;
            apiCallsCount?: number | undefined;
        } | undefined;
    };
    status?: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | undefined;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    createdAt?: Date | undefined;
    templateId?: string | undefined;
}>;
export declare const DocumentVersionSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    versionNumber: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    changeLog: z.ZodOptional<z.ZodString>;
    file: z.ZodObject<{
        filename: z.ZodString;
        size: z.ZodNumber;
        checksum: z.ZodString;
        storagePath: z.ZodString;
        downloadURL: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: number;
        filename: string;
        storagePath: string;
        downloadURL: string;
        checksum: string;
    }, {
        size: number;
        filename: string;
        storagePath: string;
        downloadURL: string;
        checksum: string;
    }>;
    versionType: z.ZodEnum<["MAJOR", "MINOR", "PATCH", "DRAFT"]>;
    changes: z.ZodOptional<z.ZodObject<{
        addedSections: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        modifiedSections: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        deletedSections: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        addedText: z.ZodDefault<z.ZodNumber>;
        deletedText: z.ZodDefault<z.ZodNumber>;
        modifiedText: z.ZodDefault<z.ZodNumber>;
        changePercentage: z.ZodOptional<z.ZodNumber>;
        significantChanges: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        addedSections: string[];
        modifiedSections: string[];
        deletedSections: string[];
        addedText: number;
        deletedText: number;
        modifiedText: number;
        significantChanges: boolean;
        changePercentage?: number | undefined;
    }, {
        addedSections?: string[] | undefined;
        modifiedSections?: string[] | undefined;
        deletedSections?: string[] | undefined;
        addedText?: number | undefined;
        deletedText?: number | undefined;
        modifiedText?: number | undefined;
        changePercentage?: number | undefined;
        significantChanges?: boolean | undefined;
    }>>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED", "DEPRECATED"]>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approval: z.ZodOptional<z.ZodObject<{
        required: z.ZodDefault<z.ZodBoolean>;
        approvedBy: z.ZodOptional<z.ZodString>;
        approvedAt: z.ZodOptional<z.ZodDate>;
        approvalNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        approvedAt?: Date | undefined;
        approvedBy?: string | undefined;
        approvalNotes?: string | undefined;
    }, {
        required?: boolean | undefined;
        approvedAt?: Date | undefined;
        approvedBy?: string | undefined;
        approvalNotes?: string | undefined;
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    status: "DRAFT" | "ARCHIVED" | "DEPRECATED" | "PUBLISHED";
    id: string;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
    file: {
        size: number;
        filename: string;
        storagePath: string;
        downloadURL: string;
        checksum: string;
    };
    versionNumber: string;
    versionType: "DRAFT" | "PATCH" | "MAJOR" | "MINOR";
    title?: string | undefined;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    changes?: {
        addedSections: string[];
        modifiedSections: string[];
        deletedSections: string[];
        addedText: number;
        deletedText: number;
        modifiedText: number;
        significantChanges: boolean;
        changePercentage?: number | undefined;
    } | undefined;
    changeLog?: string | undefined;
    approval?: {
        required: boolean;
        approvedAt?: Date | undefined;
        approvedBy?: string | undefined;
        approvalNotes?: string | undefined;
    } | undefined;
}, {
    documentId: string;
    id: string;
    createdBy: string;
    file: {
        size: number;
        filename: string;
        storagePath: string;
        downloadURL: string;
        checksum: string;
    };
    versionNumber: string;
    versionType: "DRAFT" | "PATCH" | "MAJOR" | "MINOR";
    status?: "DRAFT" | "ARCHIVED" | "DEPRECATED" | "PUBLISHED" | undefined;
    title?: string | undefined;
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    changes?: {
        addedSections?: string[] | undefined;
        modifiedSections?: string[] | undefined;
        deletedSections?: string[] | undefined;
        addedText?: number | undefined;
        deletedText?: number | undefined;
        modifiedText?: number | undefined;
        changePercentage?: number | undefined;
        significantChanges?: boolean | undefined;
    } | undefined;
    changeLog?: string | undefined;
    approval?: {
        required?: boolean | undefined;
        approvedAt?: Date | undefined;
        approvedBy?: string | undefined;
        approvalNotes?: string | undefined;
    } | undefined;
}>;
export declare const ReviewCommentSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    organizationId: z.ZodString;
    content: z.ZodString;
    type: z.ZodEnum<["GENERAL", "SUGGESTION", "ISSUE", "APPROVAL", "QUESTION"]>;
    location: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        section: z.ZodOptional<z.ZodString>;
        paragraph: z.ZodOptional<z.ZodNumber>;
        startPosition: z.ZodOptional<z.ZodNumber>;
        endPosition: z.ZodOptional<z.ZodNumber>;
        selectedText: z.ZodOptional<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        page?: number | undefined;
        paragraph?: number | undefined;
        section?: string | undefined;
        startPosition?: number | undefined;
        endPosition?: number | undefined;
        selectedText?: string | undefined;
        coordinates?: {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    }, {
        page?: number | undefined;
        paragraph?: number | undefined;
        section?: string | undefined;
        startPosition?: number | undefined;
        endPosition?: number | undefined;
        selectedText?: string | undefined;
        coordinates?: {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    }>>;
    parentCommentId: z.ZodOptional<z.ZodString>;
    threadId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["OPEN", "RESOLVED", "ACKNOWLEDGED", "DISMISSED"]>>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    resolution: z.ZodOptional<z.ZodObject<{
        resolvedBy: z.ZodString;
        resolvedAt: z.ZodDate;
        resolution: z.ZodString;
        actionTaken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        resolvedAt: Date;
        resolvedBy: string;
        resolution: string;
        actionTaken?: string | undefined;
    }, {
        resolvedAt: Date;
        resolvedBy: string;
        resolution: string;
        actionTaken?: string | undefined;
    }>>;
    visibility: z.ZodDefault<z.ZodEnum<["PUBLIC", "INTERNAL", "PRIVATE"]>>;
    mentions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        url: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
    }, {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
    }>, "many">>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    type: "GENERAL" | "SUGGESTION" | "ISSUE" | "APPROVAL" | "QUESTION";
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    organizationId: string;
    id: string;
    content: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    visibility: "PUBLIC" | "INTERNAL" | "PRIVATE";
    mentions: string[];
    attachments: {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
    }[];
    metadata?: Record<string, any> | undefined;
    location?: {
        page?: number | undefined;
        paragraph?: number | undefined;
        section?: string | undefined;
        startPosition?: number | undefined;
        endPosition?: number | undefined;
        selectedText?: string | undefined;
        coordinates?: {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
    resolution?: {
        resolvedAt: Date;
        resolvedBy: string;
        resolution: string;
        actionTaken?: string | undefined;
    } | undefined;
    parentCommentId?: string | undefined;
    threadId?: string | undefined;
}, {
    documentId: string;
    type: "GENERAL" | "SUGGESTION" | "ISSUE" | "APPROVAL" | "QUESTION";
    organizationId: string;
    id: string;
    content: string;
    createdBy: string;
    status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED" | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    metadata?: Record<string, any> | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    location?: {
        page?: number | undefined;
        paragraph?: number | undefined;
        section?: string | undefined;
        startPosition?: number | undefined;
        endPosition?: number | undefined;
        selectedText?: string | undefined;
        coordinates?: {
            x: number;
            y: number;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    } | undefined;
    lastModifiedBy?: string | undefined;
    resolution?: {
        resolvedAt: Date;
        resolvedBy: string;
        resolution: string;
        actionTaken?: string | undefined;
    } | undefined;
    parentCommentId?: string | undefined;
    threadId?: string | undefined;
    visibility?: "PUBLIC" | "INTERNAL" | "PRIVATE" | undefined;
    mentions?: string[] | undefined;
    attachments?: {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
    }[] | undefined;
}>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export declare const DOCUMENT_COLLECTIONS: {
    readonly METADATA: "metadata";
    readonly ANALYSES: "analyses";
    readonly VERSIONS: "versions";
    readonly COMMENTS: "comments";
};
//# sourceMappingURL=document.schema.d.ts.map