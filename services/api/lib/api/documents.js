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
        const query = (0, utils_1.validateQueryParams)(utils_1.PaginationSchema.extend({
            status: z.nativeEnum(types_1.DocumentStatus).optional(),
            documentType: z.string().optional(),
            search: z.string().optional()
        }), req);
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
        const offset = (query.page - 1) * query.limit;
        firestoreQuery = firestoreQuery.offset(offset).limit(query.limit);
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
        const totalPages = Math.ceil(total / query.limit);
        const response = {
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
    }
    catch (error) {
        console.error("Error listing documents:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while listing documents", null, req.requestId));
        }
    }
});
/**
 * GET /documents/:id
 * Get document by ID
 */
app.get("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = Object.assign({ id: doc.id }, doc.data());
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        res.json((0, utils_1.createSuccessResponse)(document, undefined, req.requestId));
    }
    catch (error) {
        console.error("Error getting document:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while getting document", null, req.requestId));
        }
    }
});
/**
 * POST /documents
 * Create new document
 */
app.post("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const documentData = (0, utils_1.validateRequestBody)(types_1.CreateDocumentRequestSchema)(req);
        // Validate organization access
        if (documentData.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Cannot create document for different organization", { requestedOrg: documentData.organizationId, userOrg: req.user.organizationId }, req.requestId));
            return;
        }
        const document = Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, documentData), { status: types_1.DocumentStatus.DRAFT, version: 1, createdAt: new Date(), updatedAt: new Date() });
        // Validate complete document
        const validation = types_1.DocumentSchema.safeParse(document);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("Invalid document data", validation.error.errors, req.requestId));
            return;
        }
        // Save to Firestore
        await firebase_1.collections.documents.doc(document.id).set(document);
        res.status(201).json((0, utils_1.createSuccessResponse)(document, "Document created successfully", req.requestId));
    }
    catch (error) {
        console.error("Error creating document:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while creating document", null, req.requestId));
        }
    }
});
/**
 * PUT /documents/:id
 * Update document
 */
app.put("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const updateData = (0, utils_1.validateRequestBody)(types_1.UpdateDocumentRequestSchema)(req);
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Document not found", { documentId: id }, req.requestId));
            return;
        }
        const existingDocument = Object.assign({ id: doc.id }, doc.data());
        // Verify organization access
        if (existingDocument.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        // Prepare updated document
        const updatedDocument = Object.assign(Object.assign(Object.assign({}, existingDocument), updateData), { id: existingDocument.id, organizationId: existingDocument.organizationId, updatedAt: new Date() });
        // Validate updated document
        const validation = types_1.DocumentSchema.safeParse(updatedDocument);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("Invalid document update data", validation.error.errors, req.requestId));
            return;
        }
        // Update in Firestore
        await docRef.set(updatedDocument);
        res.json((0, utils_1.createSuccessResponse)(updatedDocument, "Document updated successfully", req.requestId));
    }
    catch (error) {
        console.error("Error updating document:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while updating document", null, req.requestId));
        }
    }
});
/**
 * DELETE /documents/:id
 * Delete document (soft delete by setting status to ARCHIVED)
 */
app.delete("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_DELETE]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = Object.assign({ id: doc.id }, doc.data());
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        // Soft delete by archiving
        await docRef.update({
            status: types_1.DocumentStatus.ARCHIVED,
            updatedAt: new Date()
        });
        res.json((0, utils_1.createSuccessResponse)({ id, status: types_1.DocumentStatus.ARCHIVED }, "Document archived successfully", req.requestId));
    }
    catch (error) {
        console.error("Error deleting document:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while deleting document", null, req.requestId));
        }
    }
});
/**
 * PATCH /documents/:id/status
 * Update document status
 */
app.patch("/:id/status", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const { status } = (0, utils_1.validateRequestBody)(z.object({ status: z.nativeEnum(types_1.DocumentStatus) }))(req);
        const docRef = firebase_1.collections.documents.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Document not found", { documentId: id }, req.requestId));
            return;
        }
        const document = Object.assign({ id: doc.id }, doc.data());
        // Verify organization access
        if (document.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to document", { documentId: id }, req.requestId));
            return;
        }
        await docRef.update({
            status,
            updatedAt: new Date()
        });
        res.json((0, utils_1.createSuccessResponse)({ id, status }, "Document status updated successfully", req.requestId));
    }
    catch (error) {
        console.error("Error updating document status:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while updating document status", null, req.requestId));
        }
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Unhandled error in documents API:", error);
    res.status(500).json((0, utils_1.createErrorResponse)("Internal server error", process.env.NODE_ENV === "development" ? error.stack : null, req.requestId));
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