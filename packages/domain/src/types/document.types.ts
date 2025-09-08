/**
 * Document Types
 * Tipos relacionados a documentos
 */

import { z } from 'zod';

// Enums
/* eslint-disable no-unused-vars */
export enum DocumentType {
  EDITAL = 'edital',
  TERMO_REFERENCIA = 'termo_referencia',
  ETP = 'etp',
  MAPA_RISCOS = 'mapa_riscos',
  MINUTA_CONTRATO = 'minuta_contrato',
  ANEXO_TECNICO = 'anexo_tecnico',
  PROJETO_BASICO = 'projeto_basico'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum LicitationModality {
  CONCORRENCIA = 'concorrencia',
  TOMADA_PRECOS = 'tomada_precos',
  CONVITE = 'convite',
  CONCURSO = 'concurso',
  LEILAO = 'leilao',
  PREGAO = 'pregao',
  RDC = 'rdc',
  DIALOGO_COMPETITIVO = 'dialogo_competitivo'
}
/* eslint-enable no-unused-vars */

// Schemas
export const DocumentMetadataSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  checksum: z.string().optional(),
  ocrConfidence: z.number().min(0).max(1).optional(),
  extractionMethod: z.enum(['ocr', 'text', 'hybrid']).optional(),
  language: z.string().default('pt-BR'),
  organizationId: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.date().default(() => new Date()),
  processingStartedAt: z.date().optional(),
  processingCompletedAt: z.date().optional()
});

export const DocumentClassificationSchema = z.object({
  primaryCategory: z.string(),
  secondaryCategory: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  modality: z.nativeEnum(LicitationModality).optional(),
  complexityLevel: z.enum(['baixa', 'media', 'alta']).default('media'),
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
  status: z.nativeEnum(DocumentStatus).default(DocumentStatus.DRAFT),
  version: z.number().int().positive().default(1),
  parentDocumentId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional()
});

// Types
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;
export type Document = z.infer<typeof DocumentSchema>;

// Utility functions
export const validateDocumentType = (type: string): DocumentType | null => {
  return Object.values(DocumentType).includes(type as DocumentType) 
    ? type as DocumentType 
    : null;
};

export const getDocumentTypeDisplayName = (type: DocumentType): string => {
  const displayNames = {
    [DocumentType.EDITAL]: 'Edital de Licitação',
    [DocumentType.TERMO_REFERENCIA]: 'Termo de Referência', 
    [DocumentType.ETP]: 'Estudo Técnico Preliminar',
    [DocumentType.MAPA_RISCOS]: 'Mapa de Riscos',
    [DocumentType.MINUTA_CONTRATO]: 'Minuta de Contrato',
    [DocumentType.ANEXO_TECNICO]: 'Anexo Técnico',
    [DocumentType.PROJETO_BASICO]: 'Projeto Básico'
  };
  return displayNames[type] || type;
};

// Upload types
export interface DocumentUploadRequest {
  file: File;
  title?: string;
  documentType?: DocumentType;
  organizationId: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  uploadUrl?: string;
  status: DocumentStatus;
}