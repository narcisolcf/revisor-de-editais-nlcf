"use strict";
/**
 * Documents API - Document CRUD operations
 * LicitaReview Cloud Functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const auth_1 = require("../middleware/auth");
const security_1 = require("../middleware/security");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const utils_1 = require("../utils");
const config_1 = require("../config");
const app = (0, express_1.default)();
/**
 * GET /health
 * Health check endpoint (sem middlewares)
 */
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "documentsApi",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});
// Inicializar serviços (lazy loading)
let db;
let loggingService;
let metricsService;
let securityManager;
function initializeServices() {
    if (!db) {
        db = (0, firestore_1.getFirestore)();
        loggingService = new LoggingService_1.LoggingService('documents-api');
        metricsService = new MetricsService_1.MetricsService('documents-api');
        // Inicializar middleware de segurança
        securityManager = (0, security_1.initializeSecurity)(db, loggingService, metricsService, {
            rateLimit: {
                windowMs: config_1.config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutos
                maxRequests: config_1.config.rateLimitMax || 100 // máximo 100 requests por IP por janela
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
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin }));
app.use(express_1.default.json({ limit: config_1.config.maxRequestSize }));
// Middleware para inicializar serviços sob demanda
app.use((req, res, next) => {
    // Pular inicialização para health check
    if (req.path === '/health') {
        return next();
    }
    // Inicializar serviços para outras rotas
    const services = initializeServices();
    req.services = services;
    next();
});
// Aplicar middlewares de segurança (apenas para rotas que não sejam /health)
app.use((req, res, next) => {
    if (req.path === '/health') {
        return next();
    }
    const services = initializeServices();
    (0, security_1.securityHeaders)(req, res, () => {
        services.securityManager.rateLimit(req, res, () => {
            services.securityManager.attackProtection(req, res, () => {
                services.securityManager.auditAccess(req, res, next);
            });
        });
    });
});
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = (0, utils_1.generateRequestId)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
// Authentication middleware
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
// Configurar multer para upload de arquivos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('Tipo de arquivo não suportado. Apenas PDF e Word são aceitos.'));
        }
    }
});
/**
 * GET /documents
 * List documents for organization with pagination and filtering
 */
app.get("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const querySchema = utils_1.PaginationSchema.extend({
            status: zod_1.z.nativeEnum(types_1.DocumentStatus).optional(),
            documentType: zod_1.z.string().optional(),
            search: zod_1.z.string().optional(),
            sortBy: zod_1.z.enum(['title', 'status', 'createdAt']).default('createdAt'),
            sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
        });
        const validation = (0, utils_1.validateData)(querySchema, req.query);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid query parameters', validation.details, req.requestId));
            return;
        }
        const query = validation.data;
        let firestoreQuery = firebase_1.collections.documents
            .where("organizationId", "==", req.user.organizationId);
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
        const documents = snapshot.docs.map(doc => {
            const data = doc.data();
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
            filteredDocuments = documents.filter(doc => doc.title.toLowerCase().includes(searchTerm) ||
                doc.fileInfo.name.toLowerCase().includes(searchTerm));
        }
        const totalPages = Math.ceil(total / limit);
        const response = {
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
    }
    catch (error) {
        console.error("Error listing documents:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while listing documents", undefined, req.requestId));
        }
    }
});
/**
 * GET /documents/:id
 * Get document by ID
 */
app.get("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
            return;
        }
        const { id } = pathValidation.data;
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("DOCUMENT_NOT_FOUND", "Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = { id: doc.id, ...doc.data() };
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("ACCESS_DENIED", "Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        return res.json((0, utils_1.createSuccessResponse)(document, req.requestId));
    }
    catch (error) {
        console.error("Error getting document:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while getting documents", undefined, req.requestId));
        }
    }
});
/**
 * POST /documents
 * Create new document
 */
app.post("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const bodyValidation = (0, utils_1.validateData)(types_1.CreateDocumentRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request body', bodyValidation.details, req.requestId));
        }
        const documentData = bodyValidation.data;
        // Validate organization access
        if (documentData.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            return res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Cannot create document for different organization", { requestedOrg: documentData.organizationId, userOrg: req.user.organizationId }, req.requestId));
        }
        const document = {
            id: (0, uuid_1.v4)(),
            ...documentData,
            status: types_1.DocumentStatus.DRAFT,
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
        const docValidation = types_1.DocumentSchema.safeParse(document);
        if (!docValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid document data", { errors: docValidation.error.errors }, req.requestId));
        }
        // Save to Firestore
        await firebase_1.collections.documents.doc(document.id).set(document);
        return res.status(201).json((0, utils_1.createSuccessResponse)(document, req.requestId));
    }
    catch (error) {
        console.error("Error creating document:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while creating document", undefined, req.requestId));
        }
    }
});
/**
 * PUT /documents/:id
 * Update document
 */
app.put("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
        }
        const { id } = pathValidation.data;
        const bodyValidation = (0, utils_1.validateData)(types_1.UpdateDocumentRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid request body", bodyValidation.details, req.requestId));
        }
        const updateData = bodyValidation.data;
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Document not found", { documentId: id }, req.requestId));
        }
        const existingDocument = { id: doc.id, ...doc.data() };
        // Verify organization access
        if (existingDocument.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            return res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to document", { documentId: id }, req.requestId));
        }
        // Prepare updated document
        const updatedDocument = {
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
        const validation = types_1.DocumentSchema.safeParse(updatedDocument);
        if (!validation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid document update data", validation.error.errors, req.requestId));
        }
        // Update in Firestore
        await docRef.set(updatedDocument);
        return res.json((0, utils_1.createSuccessResponse)(updatedDocument, req.requestId));
    }
    catch (error) {
        console.error("Error updating document:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while updating document", undefined, req.requestId));
        }
    }
});
/**
 * DELETE /documents/:id
 * Delete document (soft delete by setting status to ARCHIVED)
 */
app.delete("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_DELETE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
            return;
        }
        const { id } = pathValidation.data;
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = { id: doc.id, ...doc.data() };
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        // Soft delete by archiving
        await docRef.update({
            status: types_1.DocumentStatus.ARCHIVED,
            updatedAt: new Date()
        });
        res.json((0, utils_1.createSuccessResponse)({ id, status: types_1.DocumentStatus.ARCHIVED }, req.requestId));
    }
    catch (error) {
        console.error("Error deleting document:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while deleting document", undefined, req.requestId));
        }
    }
});
/**
 * PATCH /documents/:id/status
 * Update document status
 */
app.patch("/:id/status", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
            return;
        }
        const { id } = pathValidation.data;
        const bodyValidation = (0, utils_1.validateData)(zod_1.z.object({
            status: zod_1.z.nativeEnum(types_1.DocumentStatus)
        }), req.body);
        if (!bodyValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid request body", bodyValidation.details, req.requestId));
            return;
        }
        const { status } = bodyValidation.data;
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = { id: doc.id, ...doc.data() };
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        await docRef.update({
            status,
            updatedAt: new Date()
        });
        res.json((0, utils_1.createSuccessResponse)({ id, status }, req.requestId));
    }
    catch (error) {
        console.error("Error updating document status:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while updating document status", undefined, req.requestId));
        }
    }
});
/**
 * POST /upload
 * Upload de documento com análise automática
 */
app.post("/upload", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Nenhum arquivo foi enviado", undefined, req.requestId));
        }
        const { organizationId, uid: userId } = req.user;
        const file = req.file;
        const documentId = (0, uuid_1.v4)();
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
        const bucket = (0, storage_1.getStorage)().bucket();
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
        const document = {
            title: file.originalname,
            content: '', // Será preenchido após processamento
            classification: {
                primaryCategory: 'documento',
                documentType: getDocumentTypeFromMimeType(file.mimetype),
                complexityLevel: 'media'
            },
            status: autoAnalyze ? types_1.DocumentStatus.PROCESSING : types_1.DocumentStatus.UPLOADED,
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
        await firebase_1.collections.documents.doc(documentId).set(document);
        // Log da ação
        await loggingService.audit('document_uploaded', {
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
        });
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
                const { AnalysisOrchestrator } = await Promise.resolve().then(() => __importStar(require('../services/AnalysisOrchestrator')));
                const orchestrator = new AnalysisOrchestrator(db, process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url', process.env.GOOGLE_CLOUD_PROJECT || 'default-project', {
                    projectId: process.env.GOOGLE_CLOUD_PROJECT,
                    serviceAccountEmail: process.env.CLOUD_RUN_SERVICE_ACCOUNT_EMAIL,
                    serviceAccountKeyFile: process.env.CLOUD_RUN_SERVICE_ACCOUNT_KEY_FILE,
                    audience: process.env.CLOUD_RUN_IAP_AUDIENCE,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
                // Usar o novo método startAnalysisWithUpload
                const analysisResult = await orchestrator.startAnalysisWithUpload(file.buffer, file.originalname, organizationId, userId, analysisOptions, analysisOptions.priority || 'normal');
                if (analysisResult.success && analysisResult.analysisId) {
                    analysisId = analysisResult.analysisId;
                    await loggingService.audit('analysis_started', {
                        user: req.user,
                        requestId: req.requestId,
                        resourceId: analysisResult.analysisId,
                        metadata: {
                            documentId,
                            fileName: file.originalname,
                            analysisOptions,
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        }
                    });
                }
            }
            catch (analysisError) {
                console.error('Error starting automatic analysis:', analysisError);
                // Não falhar o upload se a análise falhar
            }
        }
        res.status(201).json((0, utils_1.createSuccessResponse)({
            id: documentId,
            ...document,
            analysisId,
            downloadUrl: await fileRef.getSignedUrl({
                action: 'read',
                expires: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
            }).then(urls => urls[0])
        }, req.requestId));
    }
    catch (error) {
        console.error("Error uploading document:", error);
        if (error instanceof Error && error.message.includes('Tipo de arquivo')) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, undefined, req.requestId));
        }
        res.status(500).json((0, utils_1.createErrorResponse)("UPLOAD_ERROR", "Failed to upload document", { error: error.message }, req.requestId));
    }
});
/**
 * GET /documents/:id/status
 * Verificar status de processamento de um documento
 */
app.get("/documents/:id/status", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.user;
        // Buscar documento
        const docRef = firebase_1.collections.documents.doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Documento não encontrado", undefined, req.requestId));
        }
        const document = { id: docSnap.id, ...docSnap.data() };
        // Verificar permissão de organização
        if (document.organizationId !== organizationId) {
            return res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Acesso negado", undefined, req.requestId));
        }
        // Buscar informações de processamento se existirem
        let processingInfo = null;
        if (document.status === types_1.DocumentStatus.PROCESSING || document.status === types_1.DocumentStatus.ANALYSIS_COMPLETE) {
            const analysisQuery = await firebase_1.collections.analysis
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
        if (document.status === types_1.DocumentStatus.PROCESSING) {
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
        res.json((0, utils_1.createSuccessResponse)({
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
                    status: types_1.DocumentStatus.UPLOADED,
                    timestamp: document.metadata.uploadedAt,
                    description: 'Documento carregado com sucesso'
                },
                ...(document.status !== types_1.DocumentStatus.UPLOADED ? [{
                        status: document.status,
                        timestamp: document.updatedAt,
                        description: getStatusDescription(document.status)
                    }] : [])
            ]
        }, req.requestId));
    }
    catch (error) {
        console.error("Error getting document status:", error);
        res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", process.env.NODE_ENV === "development" ? { error: error.message } : undefined, req.requestId));
    }
});
// Função auxiliar para determinar tipo de documento baseado no MIME type
function getDocumentTypeFromMimeType(mimeType) {
    switch (mimeType) {
        case 'application/pdf':
            return types_1.DocumentType.EDITAL;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return types_1.DocumentType.TERMO_REFERENCIA;
        default:
            return types_1.DocumentType.ANEXO_TECNICO;
    }
}
// Função auxiliar para descrição de status
function getStatusDescription(status) {
    switch (status) {
        case types_1.DocumentStatus.UPLOADED:
            return 'Documento carregado com sucesso';
        case types_1.DocumentStatus.PROCESSING:
            return 'Documento sendo processado';
        case types_1.DocumentStatus.ANALYSIS_COMPLETE:
            return 'Análise concluída';
        case types_1.DocumentStatus.ERROR:
            return 'Erro no processamento';
        case types_1.DocumentStatus.ARCHIVED:
            return 'Documento arquivado';
        default:
            return 'Status desconhecido';
    }
}
// Error handling middleware
app.use((error, req, res) => {
    console.error("Unhandled error in documents API:", error);
    res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error", process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined, req.requestId));
});
// Export Cloud Function
exports.documentsApi = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300,
    maxInstances: 100,
    cors: config_1.config.corsOrigin
}, app);
//# sourceMappingURL=documents.js.map