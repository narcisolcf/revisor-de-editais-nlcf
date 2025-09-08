/**
 * Document Types - TypeScript equivalent to Python DocumentModels
 * LicitaReview Cloud Functions
 */
import { z } from "zod";
export declare enum DocumentType {
    EDITAL = "EDITAL",
    TERMO_REFERENCIA = "TERMO_REFERENCIA",
    ETP = "ETP",
    MAPA_RISCOS = "MAPA_RISCOS",
    MINUTA_CONTRATO = "MINUTA_CONTRATO",
    ANEXO_TECNICO = "ANEXO_TECNICO",
    PROJETO_BASICO = "PROJETO_BASICO"
}
export declare enum DocumentStatus {
    DRAFT = "DRAFT",
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    PROCESSED = "PROCESSED",
    ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
    ERROR = "ERROR",
    ARCHIVED = "ARCHIVED"
}
export declare enum LicitationModality {
    PREGAO_ELETRONICO = "PREGAO_ELETRONICO",
    PREGAO_PRESENCIAL = "PREGAO_PRESENCIAL",
    CONCORRENCIA = "CONCORRENCIA",
    TOMADA_PRECOS = "TOMADA_PRECOS",
    CARTA_CONVITE = "CARTA_CONVITE",
    DIALOGO_COMPETITIVO = "DIALOGO_COMPETITIVO",
    LEILAO = "LEILAO",
    CREDENCIAMENTO = "CREDENCIAMENTO"
}
export declare const DocumentTypeSchema: z.ZodNativeEnum<typeof DocumentType>;
export declare const DocumentStatusSchema: z.ZodNativeEnum<typeof DocumentStatus>;
export declare const LicitationModalitySchema: z.ZodNativeEnum<typeof LicitationModality>;
export declare const DocumentMetadataSchema: z.ZodObject<{
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    fileType: z.ZodString;
    pageCount: z.ZodOptional<z.ZodNumber>;
    wordCount: z.ZodOptional<z.ZodNumber>;
    ocrConfidence: z.ZodOptional<z.ZodNumber>;
    extractionMethod: z.ZodOptional<z.ZodEnum<["ocr", "text", "hybrid"]>>;
    language: z.ZodDefault<z.ZodString>;
    organizationId: z.ZodString;
    uploadedBy: z.ZodString;
    uploadedAt: z.ZodDefault<z.ZodDate>;
    processingStartedAt: z.ZodOptional<z.ZodDate>;
    processingCompletedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    fileSize: number;
    fileType: string;
    language: string;
    organizationId: string;
    uploadedBy: string;
    uploadedAt: Date;
    pageCount?: number | undefined;
    wordCount?: number | undefined;
    ocrConfidence?: number | undefined;
    extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
    processingStartedAt?: Date | undefined;
    processingCompletedAt?: Date | undefined;
}, {
    fileName: string;
    fileSize: number;
    fileType: string;
    organizationId: string;
    uploadedBy: string;
    pageCount?: number | undefined;
    wordCount?: number | undefined;
    ocrConfidence?: number | undefined;
    extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
    language?: string | undefined;
    uploadedAt?: Date | undefined;
    processingStartedAt?: Date | undefined;
    processingCompletedAt?: Date | undefined;
}>;
export declare const DocumentClassificationSchema: z.ZodObject<{
    primaryCategory: z.ZodString;
    secondaryCategory: z.ZodOptional<z.ZodString>;
    documentType: z.ZodNativeEnum<typeof DocumentType>;
    modality: z.ZodOptional<z.ZodNativeEnum<typeof LicitationModality>>;
    complexityLevel: z.ZodDefault<z.ZodEnum<["baixa", "media", "alta"]>>;
    confidenceScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    primaryCategory: string;
    documentType: DocumentType;
    complexityLevel: "baixa" | "media" | "alta";
    secondaryCategory?: string | undefined;
    modality?: LicitationModality | undefined;
    confidenceScore?: number | undefined;
}, {
    primaryCategory: string;
    documentType: DocumentType;
    secondaryCategory?: string | undefined;
    modality?: LicitationModality | undefined;
    complexityLevel?: "baixa" | "media" | "alta" | undefined;
    confidenceScore?: number | undefined;
}>;
export declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    classification: z.ZodObject<{
        primaryCategory: z.ZodString;
        secondaryCategory: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        modality: z.ZodOptional<z.ZodNativeEnum<typeof LicitationModality>>;
        complexityLevel: z.ZodDefault<z.ZodEnum<["baixa", "media", "alta"]>>;
        confidenceScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    }, {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    }>;
    metadata: z.ZodObject<{
        fileName: z.ZodString;
        fileSize: z.ZodNumber;
        fileType: z.ZodString;
        pageCount: z.ZodOptional<z.ZodNumber>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        ocrConfidence: z.ZodOptional<z.ZodNumber>;
        extractionMethod: z.ZodOptional<z.ZodEnum<["ocr", "text", "hybrid"]>>;
        language: z.ZodDefault<z.ZodString>;
        organizationId: z.ZodString;
        uploadedBy: z.ZodString;
        uploadedAt: z.ZodDefault<z.ZodDate>;
        processingStartedAt: z.ZodOptional<z.ZodDate>;
        processingCompletedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }, {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }>;
    organizationId: z.ZodString;
    createdBy: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<typeof DocumentStatus>>;
    version: z.ZodDefault<z.ZodNumber>;
    parentDocumentId: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: DocumentStatus;
    organizationId: string;
    id: string;
    title: string;
    content: string;
    classification: {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    };
    metadata: {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    };
    createdBy: string;
    version: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    parentDocumentId?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    organizationId: string;
    id: string;
    title: string;
    content: string;
    classification: {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    };
    metadata: {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    };
    createdBy: string;
    status?: DocumentStatus | undefined;
    version?: number | undefined;
    parentDocumentId?: string | undefined;
    tags?: string[] | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    expiresAt?: Date | undefined;
}>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export declare const CreateDocumentRequestSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    classification: z.ZodObject<{
        primaryCategory: z.ZodString;
        secondaryCategory: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        modality: z.ZodOptional<z.ZodNativeEnum<typeof LicitationModality>>;
        complexityLevel: z.ZodDefault<z.ZodEnum<["baixa", "media", "alta"]>>;
        confidenceScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    }, {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    }>;
    metadata: z.ZodObject<{
        fileName: z.ZodString;
        fileSize: z.ZodNumber;
        fileType: z.ZodString;
        pageCount: z.ZodOptional<z.ZodNumber>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        ocrConfidence: z.ZodOptional<z.ZodNumber>;
        extractionMethod: z.ZodOptional<z.ZodEnum<["ocr", "text", "hybrid"]>>;
        language: z.ZodDefault<z.ZodString>;
        organizationId: z.ZodString;
        uploadedBy: z.ZodString;
        uploadedAt: z.ZodDefault<z.ZodDate>;
        processingStartedAt: z.ZodOptional<z.ZodDate>;
        processingCompletedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }, {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }>;
    organizationId: z.ZodString;
    createdBy: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<typeof DocumentStatus>>;
    version: z.ZodDefault<z.ZodNumber>;
    parentDocumentId: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    status: DocumentStatus;
    organizationId: string;
    title: string;
    content: string;
    classification: {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    };
    metadata: {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    };
    createdBy: string;
    version: number;
    tags: string[];
    parentDocumentId?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    organizationId: string;
    title: string;
    content: string;
    classification: {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    };
    metadata: {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    };
    createdBy: string;
    status?: DocumentStatus | undefined;
    version?: number | undefined;
    parentDocumentId?: string | undefined;
    tags?: string[] | undefined;
    expiresAt?: Date | undefined;
}>;
export declare const UpdateDocumentRequestSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    classification: z.ZodOptional<z.ZodObject<{
        primaryCategory: z.ZodString;
        secondaryCategory: z.ZodOptional<z.ZodString>;
        documentType: z.ZodNativeEnum<typeof DocumentType>;
        modality: z.ZodOptional<z.ZodNativeEnum<typeof LicitationModality>>;
        complexityLevel: z.ZodDefault<z.ZodEnum<["baixa", "media", "alta"]>>;
        confidenceScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    }, {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        fileName: z.ZodString;
        fileSize: z.ZodNumber;
        fileType: z.ZodString;
        pageCount: z.ZodOptional<z.ZodNumber>;
        wordCount: z.ZodOptional<z.ZodNumber>;
        ocrConfidence: z.ZodOptional<z.ZodNumber>;
        extractionMethod: z.ZodOptional<z.ZodEnum<["ocr", "text", "hybrid"]>>;
        language: z.ZodDefault<z.ZodString>;
        organizationId: z.ZodString;
        uploadedBy: z.ZodString;
        uploadedAt: z.ZodDefault<z.ZodDate>;
        processingStartedAt: z.ZodOptional<z.ZodDate>;
        processingCompletedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }, {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    }>>;
    organizationId: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof DocumentStatus>>>;
    version: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    parentDocumentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    createdAt: z.ZodOptional<z.ZodDefault<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodDefault<z.ZodDate>>;
    expiresAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    status?: DocumentStatus | undefined;
    organizationId?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    classification?: {
        primaryCategory: string;
        documentType: DocumentType;
        complexityLevel: "baixa" | "media" | "alta";
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        confidenceScore?: number | undefined;
    } | undefined;
    metadata?: {
        fileName: string;
        fileSize: number;
        fileType: string;
        language: string;
        organizationId: string;
        uploadedBy: string;
        uploadedAt: Date;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    } | undefined;
    createdBy?: string | undefined;
    version?: number | undefined;
    parentDocumentId?: string | undefined;
    tags?: string[] | undefined;
    updatedAt?: Date | undefined;
    expiresAt?: Date | undefined;
}, {
    status?: DocumentStatus | undefined;
    organizationId?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    classification?: {
        primaryCategory: string;
        documentType: DocumentType;
        secondaryCategory?: string | undefined;
        modality?: LicitationModality | undefined;
        complexityLevel?: "baixa" | "media" | "alta" | undefined;
        confidenceScore?: number | undefined;
    } | undefined;
    metadata?: {
        fileName: string;
        fileSize: number;
        fileType: string;
        organizationId: string;
        uploadedBy: string;
        pageCount?: number | undefined;
        wordCount?: number | undefined;
        ocrConfidence?: number | undefined;
        extractionMethod?: "ocr" | "text" | "hybrid" | undefined;
        language?: string | undefined;
        uploadedAt?: Date | undefined;
        processingStartedAt?: Date | undefined;
        processingCompletedAt?: Date | undefined;
    } | undefined;
    createdBy?: string | undefined;
    version?: number | undefined;
    parentDocumentId?: string | undefined;
    tags?: string[] | undefined;
    updatedAt?: Date | undefined;
    expiresAt?: Date | undefined;
}>;
export declare const DocumentSummarySchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    documentType: z.ZodNativeEnum<typeof DocumentType>;
    status: z.ZodNativeEnum<typeof DocumentStatus>;
    organizationId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    fileInfo: z.ZodObject<{
        name: z.ZodString;
        size: z.ZodNumber;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        size: number;
    }, {
        name: string;
        type: string;
        size: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: DocumentStatus;
    organizationId: string;
    documentType: DocumentType;
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    fileInfo: {
        name: string;
        type: string;
        size: number;
    };
}, {
    status: DocumentStatus;
    organizationId: string;
    documentType: DocumentType;
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    fileInfo: {
        name: string;
        type: string;
        size: number;
    };
}>;
export type CreateDocumentRequest = z.infer<typeof CreateDocumentRequestSchema>;
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>;
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;
export declare const createDocumentSummary: (doc: Document) => DocumentSummary;
export declare const validateDocumentType: (type: string) => DocumentType | null;
export declare const getDocumentTypeDisplayName: (type: DocumentType) => string;
