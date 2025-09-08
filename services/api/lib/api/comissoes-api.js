"use strict";
/**
 * Comissões API - Comissões CRUD operations
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
exports.comissoesApi = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const security_1 = require("../middleware/security");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
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
// Inicializar serviços de segurança
const db = (0, firestore_1.getFirestore)();
const loggingService = new LoggingService_1.LoggingService('comissoes-api');
const metricsService = new MetricsService_1.MetricsService('comissoes-api');
// Inicializar middleware de segurança
const securityManager = (0, security_1.initializeSecurity)(db, loggingService, metricsService, {
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
const app = (0, express_1.default)();
// Middleware básico
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin }));
app.use(express_1.default.json({ limit: config_1.config.maxRequestSize }));
// Aplicar middlewares de segurança
app.use(security_1.securityHeaders);
app.use(security_1.rateLimit);
app.use(security_1.attackProtection);
app.use(security_1.auditAccess);
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
app.use((error, req, res) => {
    console.error('Comissões API Error:', error);
    const errorResponse = (0, utils_1.createErrorResponse)("INTERNAL_ERROR", error.message || 'Erro interno do servidor', error instanceof utils_1.ValidationError ? error.details : {}, req.headers['x-request-id']);
    res.status(error instanceof utils_1.ValidationError ? 400 : 500).json(errorResponse);
});
// Export the Cloud Function
exports.comissoesApi = functions
    .region("us-central1")
    .runWith({
    memory: "1GB",
    timeoutSeconds: 300
})
    .https.onRequest(app);
//# sourceMappingURL=comissoes-api.js.map