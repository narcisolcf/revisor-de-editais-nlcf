/**
 * Documents API - Document CRUD operations
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { collections } from "../config/firebase";
import { 
  Document,
  DocumentSchema,
  CreateDocumentRequestSchema,
  UpdateDocumentRequestSchema,
  DocumentSummary,
  DocumentStatus,
  DocumentType,
  PaginatedResponse,
  UserContext
} from "../types";

import {
  authenticateUser,
  requireOrganization,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";

// Authenticated Request type
interface AuthenticatedRequest extends express.Request {
  user: UserContext;
  requestId: string;
  services?: {
    db: FirebaseFirestore.Firestore;
    loggingService: LoggingService;
    metricsService: MetricsService;
    securityManager: any;
  };
}
import {
  initializeSecurity,
  securityHeaders,
  rateLimit,
  attackProtection,
  auditAccess
} from "../middleware/security";
import { LoggingService } from "../services/LoggingService";
import { MetricsService } from "../services/MetricsService";
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

/**
 * GET /health
 * Health check endpoint (sem middlewares)
 */
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    service: "documentsApi",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Inicializar serviços (lazy loading)
let db: FirebaseFirestore.Firestore;
let loggingService: LoggingService;
let metricsService: MetricsService;
let securityManager: any;

function initializeServices() {
  if (!db) {
    db = getFirestore();
    loggingService = new LoggingService('documents-api');
    metricsService = new MetricsService('documents-api');
    
    // Inicializar middleware de segurança
    securityManager = initializeSecurity(db, loggingService, metricsService, {
      rateLimit: {
        windowMs: config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutos
        maxRequests: config.rateLimitMax || 100 // máximo 100 requests por IP por janela
      },
      audit: {
        enabled: true,
        sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
        excludePaths: []
      }
    });
  }
  return { db, loggingService, metricsService, securityManager };
}

// Middleware básico
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));

// Middleware para inicializar serviços sob demanda
app.use((req, res, next) => {
  // Pular inicialização para health check
  if (req.path === '/health') {
    return next();
  }
  
  // Inicializar serviços para outras rotas
  const services = initializeServices();
  (req as any).services = services;
  next();
});

// Aplicar middlewares de segurança (apenas para rotas que não sejam /health)
 app.use((req, res, next) => {
   if (req.path === '/health') {
     return next();
   }
   
   const services = initializeServices();
   securityHeaders(req, res, () => {
     services.securityManager.rateLimit(req, res, () => {
       services.securityManager.attackProtection(req, res, () => {
         services.securityManager.auditAccess(req, res, next);
       });
     });
   });
 });

// Request ID middleware
app.use((req, res, next) => {
  (req as any).requestId = generateRequestId();
  res.setHeader("X-Request-ID", (req as any).requestId);
  next();
});

// Authentication middleware
app.use(authenticateUser);
app.use(requireOrganization);

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas PDFs e documentos Word
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Apenas PDF e Word são aceitos.'));
    }
  }
});

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

/**
 * POST /upload
 * Upload de documento com análise automática
 */
app.post(
  "/upload",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  upload.single('document'),
  async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Nenhum arquivo foi enviado",
          undefined,
          req.requestId
        ));
      }

      const { organizationId, uid: userId } = (req as AuthenticatedRequest).user!;
      const file = req.file;
      const documentId = uuidv4();
      const fileName = `${documentId}_${file.originalname}`;
      const storagePath = `organizations/${organizationId}/documents/${fileName}`;

      // Verificar se deve iniciar análise automática
      const autoAnalyze = req.body.autoAnalyze === 'true' || req.body.autoAnalyze === true;
      const analysisOptions = {
        includeAI: req.body.includeAI === 'true' || req.body.includeAI === true,
        generateRecommendations: req.body.generateRecommendations !== 'false',
        detailedMetrics: req.body.detailedMetrics === 'true' || req.body.detailedMetrics === true,
        priority: req.body.priority || 'normal'
      };

      // Upload para Firebase Storage
      const bucket = getStorage().bucket();
      const fileRef = bucket.file(storagePath);
      
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            originalName: file.originalname,
            documentId: documentId
          }
        }
      });

      // Criar documento no Firestore
      const now = new Date();
      const document: Omit<Document, 'id'> = {
        title: file.originalname,
        content: '', // Será preenchido após processamento
        classification: {
          primaryCategory: 'documento',
          documentType: getDocumentTypeFromMimeType(file.mimetype),
          complexityLevel: 'media'
        },
        status: autoAnalyze ? DocumentStatus.PROCESSING : DocumentStatus.UPLOADED,
        organizationId,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: [],
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          language: 'pt-BR',
          organizationId,
          uploadedBy: userId,
          uploadedAt: now
        }
      };

      await collections.documents.doc(documentId).set(document);

      // Log da ação
      await loggingService.audit(
            'document_uploaded',
            {
              user: { uid: userId, organizationId },
              requestId: req.requestId,
              resourceId: documentId,
              metadata: {
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
              }
            }
          );

      // Métricas
      await metricsService.incrementCounter('documents_uploaded', 1, {
        organizationId,
        documentType: document.classification.documentType
      });

      let analysisId = null;
      
      // Se análise automática estiver habilitada, iniciar via AnalysisOrchestrator
      if (autoAnalyze) {
        try {
          // Inicializar AnalysisOrchestrator
          const { AnalysisOrchestrator } = await import('../services/AnalysisOrchestrator');
          const orchestrator = new AnalysisOrchestrator(
            db,
            process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
            process.env.GOOGLE_CLOUD_PROJECT || 'default-project',
            {
              projectId: process.env.GOOGLE_CLOUD_PROJECT,
              serviceAccountEmail: process.env.CLOUD_RUN_SERVICE_ACCOUNT_EMAIL,
              serviceAccountKeyFile: process.env.CLOUD_RUN_SERVICE_ACCOUNT_KEY_FILE,
              audience: process.env.CLOUD_RUN_IAP_AUDIENCE,
              scopes: ['https://www.googleapis.com/auth/cloud-platform']
            }
          );

          // Usar o novo método startAnalysisWithUpload
          const analysisResult = await orchestrator.startAnalysisWithUpload(
            file.buffer,
            file.originalname,
            organizationId,
            userId,
            analysisOptions,
            analysisOptions.priority || 'normal'
          );

          if (analysisResult.success && analysisResult.analysisId) {
            analysisId = analysisResult.analysisId;

            await loggingService.audit(
               'analysis_started',
               {
                 user: (req as AuthenticatedRequest).user!,
                 requestId: req.requestId,
                 resourceId: analysisResult.analysisId,
                 metadata: {
                   documentId,
                   fileName: file.originalname,
                   analysisOptions,
                   ipAddress: req.ip,
                   userAgent: req.get('User-Agent')
                 }
               }
             );
          }
        } catch (analysisError) {
          console.error('Error starting automatic analysis:', analysisError);
          // Não falhar o upload se a análise falhar
        }
      }

      res.status(201).json(createSuccessResponse(
        {
          id: documentId,
          ...document,
          analysisId,
          downloadUrl: await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
          }).then(urls => urls[0])
        },
        req.requestId
      ));

    } catch (error) {
      console.error("Error uploading document:", error);
      
      if (error instanceof Error && error.message.includes('Tipo de arquivo')) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          error.message,
          undefined,
          req.requestId
        ));
      }
      
      res.status(500).json(createErrorResponse(
        "UPLOAD_ERROR",
        "Failed to upload document",
        { error: (error as Error).message },
        req.requestId
      ));
    }
  }
);

/**
 * GET /documents/:id/status
 * Verificar status de processamento de um documento
 */
app.get(
  "/documents/:id/status",
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = (req as AuthenticatedRequest).user;

      // Buscar documento
      const docRef = collections.documents.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json(createErrorResponse(
          "NOT_FOUND",
          "Documento não encontrado",
          undefined,
          req.requestId
        ));
      }

      const document = { id: docSnap.id, ...docSnap.data() } as Document;

      // Verificar permissão de organização
      if (document.organizationId !== organizationId) {
        return res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Acesso negado",
          undefined,
          req.requestId
        ));
      }

      // Buscar informações de processamento se existirem
      let processingInfo = null;
      if (document.status === DocumentStatus.PROCESSING || document.status === DocumentStatus.ANALYSIS_COMPLETE) {
        const analysisQuery = await collections.analysis
          .where('documentId', '==', id)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!analysisQuery.empty) {
          const analysisDoc = analysisQuery.docs[0];
          processingInfo = {
            analysisId: analysisDoc.id,
            ...analysisDoc.data(),
            progress: analysisDoc.data().status === 'completed' ? 100 : 
                     analysisDoc.data().status === 'processing' ? 50 : 0
          };
        }
      }

      // Buscar tarefas de processamento na fila
      let queueInfo = null;
      if (document.status === DocumentStatus.PROCESSING) {
        const queueQuery = await db
          .collection('processing_queue')
          .where('documentId', '==', id)
          .where('status', 'in', ['pending', 'processing'])
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!queueQuery.empty) {
          const queueDoc = queueQuery.docs[0];
          queueInfo = {
            taskId: queueDoc.id,
            status: queueDoc.data().status,
            createdAt: queueDoc.data().createdAt,
            estimatedCompletion: queueDoc.data().estimatedCompletion
          };
        }
      }

      res.json(createSuccessResponse(
        {
          document: {
            id: document.id,
            title: document.title,
            status: document.status,
            uploadedAt: document.metadata.uploadedAt,
            updatedAt: document.updatedAt
          },
          processing: processingInfo,
          queue: queueInfo,
          statusHistory: [
            {
              status: DocumentStatus.UPLOADED,
              timestamp: document.metadata.uploadedAt,
              description: 'Documento carregado com sucesso'
            },
            ...(document.status !== DocumentStatus.UPLOADED ? [{
              status: document.status,
              timestamp: document.updatedAt,
              description: getStatusDescription(document.status)
            }] : [])
          ]
        },
        req.requestId
      ));

    } catch (error) {
      console.error("Error getting document status:", error);
      res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Erro interno do servidor",
        process.env.NODE_ENV === "development" ? { error: (error as Error).message } : undefined,
        req.requestId
      ));
    }
  }
);

// Função auxiliar para determinar tipo de documento baseado no MIME type
function getDocumentTypeFromMimeType(mimeType: string): DocumentType {
  switch (mimeType) {
    case 'application/pdf':
      return DocumentType.EDITAL;
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return DocumentType.TERMO_REFERENCIA;
    default:
      return DocumentType.ANEXO_TECNICO;
  }
}

// Função auxiliar para descrição de status
function getStatusDescription(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.UPLOADED:
      return 'Documento carregado com sucesso';
    case DocumentStatus.PROCESSING:
      return 'Documento sendo processado';
    case DocumentStatus.ANALYSIS_COMPLETE:
      return 'Análise concluída';
    case DocumentStatus.ERROR:
      return 'Erro no processamento';
    case DocumentStatus.ARCHIVED:
      return 'Documento arquivado';
    default:
      return 'Status desconhecido';
  }
}



// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response) => {
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