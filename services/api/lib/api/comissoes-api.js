"use strict";
/**
 * Comissões API - Comissões CRUD operations
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comissoesApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const types_1 = require("../types");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const config_1 = require("../config");
const comissoes_1 = require("./comissoes");
// Validation schemas for path parameters
const ComissaoIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid()
});
const ComissaoServidorSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    servidorId: zod_1.z.string().uuid()
});
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
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// Authentication and authorization
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
/**
 * GET /
 * List comissões with filtering and pagination
 */
app.get("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), // Using existing permission for now
comissoes_1.listComissoes);
/**
 * GET /:id
 * Get comissão by ID with detailed information
 */
app.get("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos', pathValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.getComissaoById)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', error.message, error.details, requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)('INTERNAL_ERROR', 'Erro interno do servidor', {}, requestId));
        }
        return;
    }
});
/**
 * POST /
 * Create new comissão
 */
app.post("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    const bodyValidation = (0, utils_1.validateData)(types_1.CreateComissaoRequestSchema, req.body);
    if (!bodyValidation.success) {
        return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
    }
    await (0, comissoes_1.createComissao)(req, res);
    return;
});
/**
 * PUT /:id
 * Update comissão
 */
app.put("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos', pathValidation.details, req.headers['x-request-id']));
        }
        const bodyValidation = (0, utils_1.validateData)(types_1.UpdateComissaoRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.updateComissao)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", {}, requestId));
        }
        return;
        return;
    }
});
/**
 * DELETE /:id
 * Delete comissão
 */
app.delete("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_DELETE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos', pathValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.deleteComissao)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", {}, requestId));
        }
        return;
    }
});
/**
 * POST /:id/membros
 * Add member to comissão
 */
app.post("/:id/membros", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", pathValidation.details, req.headers['x-request-id']));
        }
        const bodyValidation = (0, utils_1.validateData)(types_1.AdicionarMembroRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.adicionarMembro)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
        }
    }
});
/**
 * DELETE /:id/membros/:servidorId
 * Remove member from comissão
 */
app.delete("/:id/membros/:servidorId", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoServidorSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", pathValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.removerMembro)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
        }
    }
});
/**
 * PATCH /:id/membros/:servidorId
 * Update member in comissão
 */
app.patch("/:id/membros/:servidorId", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoServidorSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", pathValidation.details, req.headers['x-request-id']));
        }
        const bodyValidation = (0, utils_1.validateData)(types_1.AtualizarMembroRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.atualizarMembro)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
        }
    }
});
/**
 * GET /:id/stats
 * Get comissão statistics
 */
app.get("/:id/stats", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", pathValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.getComissaoStats)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
        }
        return;
    }
});
/**
 * GET /:id/history
 * Get comissão history
 */
app.get("/:id/history", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.DOCUMENTS_READ]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(ComissaoIdSchema, req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", pathValidation.details, req.headers['x-request-id']));
        }
        await (0, comissoes_1.getComissaoHistory)(req, res);
        return;
    }
    catch (error) {
        const requestId = req.headers['x-request-id'];
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
        }
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Comissões API Error:', error);
    const errorResponse = (0, utils_1.createErrorResponse)("INTERNAL_ERROR", error.message || 'Erro interno do servidor', error instanceof utils_1.ValidationError ? error.details : {}, req.headers['x-request-id']);
    res.status(error instanceof utils_1.ValidationError ? 400 : 500).json(errorResponse);
});
// Export the Cloud Function
exports.comissoesApi = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300,
    maxInstances: 100,
    cors: config_1.config.corsOrigin
}, app);
//# sourceMappingURL=comissoes-api.js.map