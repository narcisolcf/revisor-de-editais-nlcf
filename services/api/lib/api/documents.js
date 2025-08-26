"use strict";
/**
 * Documents API - Document CRUD operations
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const config_1 = require("../config");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin }));
app.use(express_1.default.json({ limit: config_1.config.maxRequestSize }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: config_1.config.rateLimitMax,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = (0, utils_1.generateRequestId)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
// Authentication middleware
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
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
// Error handling middleware
app.use((error, req, res, next) => {
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