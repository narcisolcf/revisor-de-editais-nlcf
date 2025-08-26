/**
 * Documents API - Document CRUD operations
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { collections } from "../config/firebase";
import { 
  Document,
  DocumentSchema,
  CreateDocumentRequestSchema,
  UpdateDocumentRequestSchema,
  DocumentSummary,
  DocumentStatus,
  PaginatedResponse
} from "../types";
import {
  authenticateUser,
  requireOrganization,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  validateData,
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  UUIDSchema,
  PaginationSchema
} from "../utils";
import { config } from "../config";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// Authentication middleware
app.use(authenticateUser);
app.use(requireOrganization);

/**
 * GET /documents
 * List documents for organization with pagination and filtering
 */
app.get("/", 
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req, res) => {
    try {
      const querySchema = PaginationSchema.extend({
        status: z.nativeEnum(DocumentStatus).optional(),
        documentType: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['title', 'status', 'createdAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      });
      
      const validation = validateData(querySchema, req.query);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid query parameters',
          validation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = validation.data!;
      
      let firestoreQuery = collections.documents
        .where("organizationId", "==", req.user!.organizationId);
      
      // Apply filters
      if (query.status) {
        firestoreQuery = firestoreQuery.where("status", "==", query.status);
      }
      
      if (query.documentType) {
        firestoreQuery = firestoreQuery.where("classification.documentType", "==", query.documentType);
      }
      
      // Apply sorting
      const sortField = query.sortBy === "title" ? "title" : 
                       query.sortBy === "status" ? "status" : "createdAt";
      firestoreQuery = firestoreQuery.orderBy(sortField, query.sortOrder);
      
      // Count total documents for pagination
      const countQuery = await firestoreQuery.count().get();
      const total = countQuery.data().count;
      
      // Apply pagination
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;
      firestoreQuery = firestoreQuery.offset(offset).limit(limit);
      
      const snapshot = await firestoreQuery.get();
      
      const documents: DocumentSummary[] = snapshot.docs.map(doc => {
        const data = doc.data() as Document;
        return {
          id: doc.id,
          title: data.title,
          documentType: data.classification.documentType,
          status: data.status,
          organizationId: data.organizationId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          fileInfo: {
            name: data.metadata.fileName,
            size: data.metadata.fileSize,
            type: data.metadata.fileType
          }
        };
      });
      
      // Apply text search if needed (post-processing for now)
      let filteredDocuments = documents;
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredDocuments = documents.filter(doc => 
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.fileInfo.name.toLowerCase().includes(searchTerm)
        );
      }
      
      const totalPages = Math.ceil(total / limit);
      
      const response: PaginatedResponse<DocumentSummary> = {
        success: true,
        data: filteredDocuments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error listing documents:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          (error as any).message,
          (error as any).details,
          req.requestId
        ));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while listing documents",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * GET /documents/:id
 * Get document by ID
 */
app.get("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req, res) => {
    try {
      const pathValidation = validateData(z.object({ id: UUIDSchema }), req.params);
      if (!pathValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const { id } = pathValidation.data!;
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
          "DOCUMENT_NOT_FOUND",
          "Document not found",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      const document = { id: doc.id, ...doc.data() } as Document;
      
      // Verify organization access
      if (document.organizationId !== req.user!.organizationId && 
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "ACCESS_DENIED",
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      return res.json(createSuccessResponse(document, req.requestId));
    } catch (error) {
      console.error("Error getting document:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while getting documents",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * POST /documents
 * Create new document
 */
app.post("/",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const bodyValidation = validateData(CreateDocumentRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          bodyValidation.details as Record<string, unknown>,
          req.requestId
        ));
      }
      
      const documentData = bodyValidation.data!;
      
      // Validate organization access
      if (documentData.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        return res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Cannot create document for different organization",
          { requestedOrg: documentData.organizationId, userOrg: req.user!.organizationId },
          req.requestId
        ));
      }
      
      const document: Document = {
        id: uuidv4(),
        ...documentData,
        status: DocumentStatus.DRAFT,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ensure required fields are not undefined
        classification: {
          ...documentData.classification,
          complexityLevel: documentData.classification.complexityLevel || 'media'
        },
        metadata: {
          ...documentData.metadata,
          language: documentData.metadata?.language || 'pt-BR',
          uploadedAt: documentData.metadata?.uploadedAt || new Date()
        },
        tags: documentData.tags || []
      };
      
      // Validate complete document
      const docValidation = DocumentSchema.safeParse(document);
      if (!docValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid document data",
          { errors: docValidation.error.errors },
          req.requestId
        ));
      }
      
      // Save to Firestore
      await collections.documents.doc(document.id).set(document);
      
      return res.status(201).json(createSuccessResponse(
        document,
        req.requestId
      ));
    } catch (error) {
      console.error("Error creating document:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while creating document",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * PUT /documents/:id
 * Update document
 */
app.put("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(z.object({ id: UUIDSchema }), req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
      }
      const { id } = pathValidation.data!;
      
      const bodyValidation = validateData(UpdateDocumentRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid request body",
          bodyValidation.details as Record<string, unknown>,
          req.requestId
        ));
      }
      const updateData = bodyValidation.data;
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json(createErrorResponse(
          "NOT_FOUND",
          "Document not found",
          { documentId: id },
          req.requestId
        ));
      }
      
      const existingDocument = { id: doc.id, ...doc.data() } as Document;
      
      // Verify organization access
      if (existingDocument.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        return res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
      }
      
      // Prepare updated document
      const updatedDocument: Document = {
        ...existingDocument,
        ...(updateData || {}),
        id: existingDocument.id, // Ensure ID doesn't change
        organizationId: existingDocument.organizationId, // Prevent org change
        updatedAt: new Date(),
        // Ensure required fields are not undefined
        classification: {
          ...existingDocument.classification,
          ...(updateData?.classification || {}),
          complexityLevel: updateData?.classification?.complexityLevel || existingDocument.classification.complexityLevel || 'media'
        },
        metadata: {
          ...existingDocument.metadata,
          ...(updateData?.metadata || {}),
          language: updateData?.metadata?.language || existingDocument.metadata?.language || 'pt-BR'
        }
      };
      
      // Validate updated document
      const validation = DocumentSchema.safeParse(updatedDocument);
      if (!validation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid document update data",
          validation.error.errors as unknown as Record<string, unknown>,
          req.requestId
        ));
      }
      
      // Update in Firestore
      await docRef.set(updatedDocument);
      
      return res.json(createSuccessResponse(
        updatedDocument,
        req.requestId
      ));
    } catch (error) {
      console.error("Error updating document:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
          return res.status(500).json(createErrorResponse(
            "INTERNAL_ERROR",
            "Internal server error while updating document",
            undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * DELETE /documents/:id
 * Delete document (soft delete by setting status to ARCHIVED)
 */
app.delete("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_DELETE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(z.object({ id: UUIDSchema }), req.params);
      if (!pathValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const { id } = pathValidation.data!;
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
          "NOT_FOUND",
          "Document not found",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      const document = { id: doc.id, ...doc.data() } as Document;
      
      // Verify organization access
      if (document.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      // Soft delete by archiving
      await docRef.update({
        status: DocumentStatus.ARCHIVED,
        updatedAt: new Date()
      });
      
      res.json(createSuccessResponse(
        { id, status: DocumentStatus.ARCHIVED },
        req.requestId
      ));
    } catch (error) {
      console.error("Error deleting document:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while deleting document",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * PATCH /documents/:id/status
 * Update document status
 */
app.patch("/:id/status",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(z.object({ id: UUIDSchema }), req.params);
      if (!pathValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const { id } = pathValidation.data!;
      
      const bodyValidation = validateData(z.object({
        status: z.nativeEnum(DocumentStatus)
      }), req.body);
      if (!bodyValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid request body",
          bodyValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const { status } = bodyValidation.data!;
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
          "NOT_FOUND",
          "Document not found",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      const document = { id: doc.id, ...doc.data() } as Document;
      
      // Verify organization access
      if (document.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      await docRef.update({
        status,
        updatedAt: new Date()
      });
      
      res.json(createSuccessResponse(
        { id, status },
        req.requestId
      ));
    } catch (error) {
      console.error("Error updating document status:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while updating document status",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error in documents API:", error);
  
  res.status(500).json(createErrorResponse(
    "INTERNAL_ERROR",
    "Internal server error",
    process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined,
    req.requestId
  ));
});

// Export Cloud Function
export const documentsApi = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 300,
  maxInstances: 100,
  cors: config.corsOrigin
}, app);