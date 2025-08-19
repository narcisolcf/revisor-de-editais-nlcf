/**
 * Document Types - TypeScript equivalent to Python DocumentModels
 * LicitaReview Cloud Functions
 */

import { z } from "zod";

// Enums
/* eslint-disable no-unused-vars */
export enum DocumentType {
  EDITAL = "EDITAL",
  TERMO_REFERENCIA = "TERMO_REFERENCIA", 
  ETP = "ETP",
  MAPA_RISCOS = "MAPA_RISCOS",
  MINUTA_CONTRATO = "MINUTA_CONTRATO",
  ANEXO_TECNICO = "ANEXO_TECNICO",
  PROJETO_BASICO = "PROJETO_BASICO"
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  UPLOADED = "UPLOADED", 
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE",
  ERROR = "ERROR",
  ARCHIVED = "ARCHIVED"
}

export enum LicitationModality {
  PREGAO_ELETRONICO = "PREGAO_ELETRONICO",
  PREGAO_PRESENCIAL = "PREGAO_PRESENCIAL",
  CONCORRENCIA = "CONCORRENCIA", 
  TOMADA_PRECOS = "TOMADA_PRECOS",
  CARTA_CONVITE = "CARTA_CONVITE",
  DIALOGO_COMPETITIVO = "DIALOGO_COMPETITIVO",
  LEILAO = "LEILAO",
  CREDENCIAMENTO = "CREDENCIAMENTO"
}
/* eslint-enable no-unused-vars */

// Zod Schemas
export const DocumentTypeSchema = z.nativeEnum(DocumentType);
export const DocumentStatusSchema = z.nativeEnum(DocumentStatus);
export const LicitationModalitySchema = z.nativeEnum(LicitationModality);

export const DocumentMetadataSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().positive(),
  fileType: z.string(),
  pageCount: z.number().int().positive().optional(),
  wordCount: z.number().int().positive().optional(),
  ocrConfidence: z.number().min(0).max(1).optional(),
  extractionMethod: z.enum(["ocr", "text", "hybrid"]).optional(),
  language: z.string().default("pt-BR"),
  organizationId: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.date().default(() => new Date()),
  processingStartedAt: z.date().optional(),
  processingCompletedAt: z.date().optional()
});

export const DocumentClassificationSchema = z.object({
  primaryCategory: z.string(),
  secondaryCategory: z.string().optional(),
  documentType: DocumentTypeSchema,
  modality: LicitationModalitySchema.optional(),
  complexityLevel: z.enum(["baixa", "media", "alta"]).default("media"),
  confidenceScore: z.number().min(0).max(1).optional()
});

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  classification: DocumentClassificationSchema,
  metadata: DocumentMetadataSchema,
  organizationId: z.string(),
  createdBy: z.string(),
  status: DocumentStatusSchema.default(DocumentStatus.DRAFT),
  version: z.number().int().positive().default(1),
  parentDocumentId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional()
});

// TypeScript Types (inferred from schemas)
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;
export type Document = z.infer<typeof DocumentSchema>;

// API Request/Response Types
export const CreateDocumentRequestSchema = DocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateDocumentRequestSchema = DocumentSchema.partial().omit({
  id: true,
  createdAt: true
});

export const DocumentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  documentType: DocumentTypeSchema,
  status: DocumentStatusSchema,
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  fileInfo: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string()
  })
});

export type CreateDocumentRequest = z.infer<typeof CreateDocumentRequestSchema>;
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>;
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;

// Utility functions
export const createDocumentSummary = (doc: Document): DocumentSummary => ({
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

export const validateDocumentType = (type: string): DocumentType | null => {
  return Object.values(DocumentType).includes(type as DocumentType) 
    ? type as DocumentType 
    : null;
};

export const getDocumentTypeDisplayName = (type: DocumentType): string => {
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