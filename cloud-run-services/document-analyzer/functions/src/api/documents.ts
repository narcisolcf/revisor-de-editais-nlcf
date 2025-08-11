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

import { collections } from "../config/firebase";
import { 
  Document,
  DocumentSchema,
  CreateDocumentRequest,
  CreateDocumentRequestSchema,
  UpdateDocumentRequest,
  UpdateDocumentRequestSchema,
  DocumentSummary,
  DocumentStatus,
  PaginatedResponse
} from "../types";
import {
  authenticateUser,
  requireOrganization,
  validateOrganizationAccess,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
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
      const query = validateQueryParams(
        PaginationSchema.extend({
          status: z.nativeEnum(DocumentStatus).optional(),
          documentType: z.string().optional(),
          search: z.string().optional()
        }),
        req
      );
      
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
      const offset = (query.page - 1) * query.limit;
      firestoreQuery = firestoreQuery.offset(offset).limit(query.limit);
      
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
      
      const totalPages = Math.ceil(total / query.limit);
      
      const response: PaginatedResponse<DocumentSummary> = {
        success: true,
        data: filteredDocuments,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error listing documents:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while listing documents",
          null,
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
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
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
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      res.json(createSuccessResponse(document, undefined, req.requestId));
    } catch (error) {
      console.error("Error getting document:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while getting document",
          null,
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
      const documentData = validateRequestBody(CreateDocumentRequestSchema)(req);
      
      // Validate organization access
      if (documentData.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Cannot create document for different organization",
          { requestedOrg: documentData.organizationId, userOrg: req.user!.organizationId },
          req.requestId
        ));
        return;
      }
      
      const document: Document = {
        id: uuidv4(),
        ...documentData,
        status: DocumentStatus.DRAFT,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Validate complete document
      const validation = DocumentSchema.safeParse(document);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "Invalid document data",
          validation.error.errors,
          req.requestId
        ));
        return;
      }
      
      // Save to Firestore
      await collections.documents.doc(document.id).set(document);
      
      res.status(201).json(createSuccessResponse(
        document,
        "Document created successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error creating document:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while creating document",
          null,
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
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const updateData = validateRequestBody(UpdateDocumentRequestSchema)(req);
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
          "Document not found",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      const existingDocument = { id: doc.id, ...doc.data() } as Document;
      
      // Verify organization access
      if (existingDocument.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Access denied to document",
          { documentId: id },
          req.requestId
        ));
        return;
      }
      
      // Prepare updated document
      const updatedDocument: Document = {
        ...existingDocument,
        ...updateData,
        id: existingDocument.id, // Ensure ID doesn't change
        organizationId: existingDocument.organizationId, // Prevent org change
        updatedAt: new Date()
      };
      
      // Validate updated document
      const validation = DocumentSchema.safeParse(updatedDocument);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "Invalid document update data",
          validation.error.errors,
          req.requestId
        ));
        return;
      }
      
      // Update in Firestore
      await docRef.set(updatedDocument);
      
      res.json(createSuccessResponse(
        updatedDocument,
        "Document updated successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error updating document:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while updating document",
          null,
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
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
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
        "Document archived successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error deleting document:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while deleting document",
          null,
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
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const { status } = validateRequestBody(
        z.object({ status: z.nativeEnum(DocumentStatus) })
      )(req);
      
      const docRef = collections.documents.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        res.status(404).json(createErrorResponse(
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
        "Document status updated successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error updating document status:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while updating document status",
          null,
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
    "Internal server error",
    process.env.NODE_ENV === "development" ? error.stack : null,
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