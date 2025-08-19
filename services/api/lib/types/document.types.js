"use strict";
/**
 * Document Types - TypeScript equivalent to Python DocumentModels
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentTypeDisplayName = exports.validateDocumentType = exports.createDocumentSummary = exports.DocumentSummarySchema = exports.UpdateDocumentRequestSchema = exports.CreateDocumentRequestSchema = exports.DocumentSchema = exports.DocumentClassificationSchema = exports.DocumentMetadataSchema = exports.LicitationModalitySchema = exports.DocumentStatusSchema = exports.DocumentTypeSchema = exports.LicitationModality = exports.DocumentStatus = exports.DocumentType = void 0;
const zod_1 = require("zod");
// Enums
var DocumentType;
(function (DocumentType) {
    DocumentType["EDITAL"] = "EDITAL";
    DocumentType["TERMO_REFERENCIA"] = "TERMO_REFERENCIA";
    DocumentType["ETP"] = "ETP";
    DocumentType["MAPA_RISCOS"] = "MAPA_RISCOS";
    DocumentType["MINUTA_CONTRATO"] = "MINUTA_CONTRATO";
    DocumentType["ANEXO_TECNICO"] = "ANEXO_TECNICO";
    DocumentType["PROJETO_BASICO"] = "PROJETO_BASICO";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["DRAFT"] = "DRAFT";
    DocumentStatus["UPLOADED"] = "UPLOADED";
    DocumentStatus["PROCESSING"] = "PROCESSING";
    DocumentStatus["PROCESSED"] = "PROCESSED";
    DocumentStatus["ANALYSIS_COMPLETE"] = "ANALYSIS_COMPLETE";
    DocumentStatus["ERROR"] = "ERROR";
    DocumentStatus["ARCHIVED"] = "ARCHIVED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var LicitationModality;
(function (LicitationModality) {
    LicitationModality["PREGAO_ELETRONICO"] = "PREGAO_ELETRONICO";
    LicitationModality["PREGAO_PRESENCIAL"] = "PREGAO_PRESENCIAL";
    LicitationModality["CONCORRENCIA"] = "CONCORRENCIA";
    LicitationModality["TOMADA_PRECOS"] = "TOMADA_PRECOS";
    LicitationModality["CARTA_CONVITE"] = "CARTA_CONVITE";
    LicitationModality["DIALOGO_COMPETITIVO"] = "DIALOGO_COMPETITIVO";
    LicitationModality["LEILAO"] = "LEILAO";
    LicitationModality["CREDENCIAMENTO"] = "CREDENCIAMENTO";
})(LicitationModality || (exports.LicitationModality = LicitationModality = {}));
// Zod Schemas
exports.DocumentTypeSchema = zod_1.z.nativeEnum(DocumentType);
exports.DocumentStatusSchema = zod_1.z.nativeEnum(DocumentStatus);
exports.LicitationModalitySchema = zod_1.z.nativeEnum(LicitationModality);
exports.DocumentMetadataSchema = zod_1.z.object({
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number().positive(),
    fileType: zod_1.z.string(),
    pageCount: zod_1.z.number().int().positive().optional(),
    wordCount: zod_1.z.number().int().positive().optional(),
    ocrConfidence: zod_1.z.number().min(0).max(1).optional(),
    extractionMethod: zod_1.z.enum(["ocr", "text", "hybrid"]).optional(),
    language: zod_1.z.string().default("pt-BR"),
    organizationId: zod_1.z.string(),
    uploadedBy: zod_1.z.string(),
    uploadedAt: zod_1.z.date().default(() => new Date()),
    processingStartedAt: zod_1.z.date().optional(),
    processingCompletedAt: zod_1.z.date().optional()
});
exports.DocumentClassificationSchema = zod_1.z.object({
    primaryCategory: zod_1.z.string(),
    secondaryCategory: zod_1.z.string().optional(),
    documentType: exports.DocumentTypeSchema,
    modality: exports.LicitationModalitySchema.optional(),
    complexityLevel: zod_1.z.enum(["baixa", "media", "alta"]).default("media"),
    confidenceScore: zod_1.z.number().min(0).max(1).optional()
});
exports.DocumentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string(),
    classification: exports.DocumentClassificationSchema,
    metadata: exports.DocumentMetadataSchema,
    organizationId: zod_1.z.string(),
    createdBy: zod_1.z.string(),
    status: exports.DocumentStatusSchema.default(DocumentStatus.DRAFT),
    version: zod_1.z.number().int().positive().default(1),
    parentDocumentId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    expiresAt: zod_1.z.date().optional()
});
// API Request/Response Types
exports.CreateDocumentRequestSchema = exports.DocumentSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateDocumentRequestSchema = exports.DocumentSchema.partial().omit({
    id: true,
    createdAt: true
});
exports.DocumentSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    documentType: exports.DocumentTypeSchema,
    status: exports.DocumentStatusSchema,
    organizationId: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    fileInfo: zod_1.z.object({
        name: zod_1.z.string(),
        size: zod_1.z.number(),
        type: zod_1.z.string()
    })
});
// Utility functions
const createDocumentSummary = (doc) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.classification.documentType,
    status: doc.status,
    organizationId: doc.organizationId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    fileInfo: {
        name: doc.metadata.fileName,
        size: doc.metadata.fileSize,
        type: doc.metadata.fileType
    }
});
exports.createDocumentSummary = createDocumentSummary;
const validateDocumentType = (type) => {
    return Object.values(DocumentType).includes(type)
        ? type
        : null;
};
exports.validateDocumentType = validateDocumentType;
const getDocumentTypeDisplayName = (type) => {
    const displayNames = {
        [DocumentType.EDITAL]: "Edital de Licitação",
        [DocumentType.TERMO_REFERENCIA]: "Termo de Referência",
        [DocumentType.ETP]: "Estudo Técnico Preliminar",
        [DocumentType.MAPA_RISCOS]: "Mapa de Riscos",
        [DocumentType.MINUTA_CONTRATO]: "Minuta de Contrato",
        [DocumentType.ANEXO_TECNICO]: "Anexo Técnico",
        [DocumentType.PROJETO_BASICO]: "Projeto Básico"
    };
    return displayNames[type] || type;
};
exports.getDocumentTypeDisplayName = getDocumentTypeDisplayName;
//# sourceMappingURL=document.types.js.map