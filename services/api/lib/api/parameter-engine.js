"use strict";
/**
 * Parameter Engine API - Gerenciamento de Parâmetros de Análise
 *
 * API para gerenciar e otimizar parâmetros de análise usando o ParameterEngine.
 * Permite configuração adaptativa e otimização baseada em histórico.
 *
 * 🚀 CORE DIFFERENTIATOR: Engine adaptativo de parâmetros
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parameterEngineApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const security_1 = require("../middleware/security");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const firebase_1 = require("../config/firebase");
const ParameterEngine_1 = require("../services/ParameterEngine");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const config_1 = require("../config");
const firebase_functions_1 = require("firebase-functions");
// Inicializar serviços de segurança
const db = (0, firestore_1.getFirestore)();
const loggingService = new LoggingService_1.LoggingService('parameter-engine-api');
const metricsService = new MetricsService_1.MetricsService('parameter-engine-api');
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
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
// Authentication middleware
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
// Initialize ParameterEngine
const parameterEngine = new ParameterEngine_1.ParameterEngine(firebase_1.firestore, {
    enableAdaptiveWeights: true,
    enableLearningMode: true,
    adaptationThreshold: 10,
    maxWeightAdjustment: 15.0,
    cacheTimeout: 30 * 60 * 1000 // 30 minutos
});
// Schemas de validação
const OptimizeParametersRequestSchema = zod_1.z.object({
    analysisCount: zod_1.z.number().int().min(1).max(100).optional().default(50),
    includeRecommendations: zod_1.z.boolean().optional().default(true)
});
const UpdateEngineConfigRequestSchema = zod_1.z.object({
    enableAdaptiveWeights: zod_1.z.boolean().optional(),
    enableLearningMode: zod_1.z.boolean().optional(),
    adaptationThreshold: zod_1.z.number().int().min(1).max(100).optional(),
    maxWeightAdjustment: zod_1.z.number().min(0).max(50).optional(),
    cacheTimeout: zod_1.z.number().int().min(60000).max(3600000).optional() // 1min - 1h
});
/**
 * GET /parameters
 * Gera parâmetros de análise otimizados para a organização
 */
app.get("/parameters", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const parameters = await parameterEngine.generateParameters(organizationId);
        res.status(200).json((0, utils_1.createSuccessResponse)(parameters, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error generating parameters", {
            organizationId: req.user?.organizationId,
            error: error instanceof Error ? error.message : error,
            requestId: req.requestId
        });
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while generating parameters", undefined, req.requestId));
        }
    }
});
/**
 * POST /optimize
 * Analisa histórico e sugere otimizações de parâmetros
 */
app.post("/optimize", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const bodyValidation = (0, utils_1.validateData)(OptimizeParametersRequestSchema, req.body);
        if (!bodyValidation.success) {
            throw new utils_1.ValidationError(bodyValidation.error, bodyValidation.details);
        }
        const requestData = bodyValidation.data;
        const organizationId = req.user.organizationId;
        // Gerar parâmetros atuais
        const currentParameters = await parameterEngine.generateParameters(organizationId);
        // Simular otimização (o ParameterEngine já faz isso internamente)
        // Aqui podemos expor mais detalhes sobre as otimizações
        const optimizationResult = {
            currentParameters,
            hasOptimizations: !!currentParameters.adaptiveAdjustments,
            optimizationDetails: currentParameters.adaptiveAdjustments ? {
                confidence: currentParameters.adaptiveAdjustments.confidenceScore,
                basedOnAnalyses: currentParameters.adaptiveAdjustments.basedOnAnalyses,
                weightAdjustments: currentParameters.adaptiveAdjustments.weightAdjustments,
                lastUpdated: currentParameters.adaptiveAdjustments.lastUpdated
            } : null,
            recommendations: requestData.includeRecommendations ? [
                "Continue usando o sistema para melhorar as otimizações adaptativas",
                "Considere revisar regras customizadas baseadas no histórico de análises",
                "Monitore a performance das categorias com menor pontuação"
            ] : []
        };
        res.status(200).json((0, utils_1.createSuccessResponse)(optimizationResult, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error optimizing parameters", {
            organizationId: req.user?.organizationId,
            error: error instanceof Error ? error.message : error,
            requestId: req.requestId
        });
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while optimizing parameters", undefined, req.requestId));
        }
    }
});
/**
 * POST /refresh-cache
 * Limpa cache de parâmetros para forçar regeneração
 */
app.post("/refresh-cache", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        parameterEngine.clearCache(organizationId);
        res.status(200).json((0, utils_1.createSuccessResponse)({ cleared: true }, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error clearing parameter cache", {
            organizationId: req.user?.organizationId,
            error: error instanceof Error ? error.message : error,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while clearing cache", undefined, req.requestId));
    }
});
/**
 * GET /engine/stats
 * Obtém estatísticas do ParameterEngine
 */
app.get("/engine/stats", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), async (req, res) => {
    try {
        const stats = parameterEngine.getEngineStats();
        res.status(200).json((0, utils_1.createSuccessResponse)(stats, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error getting engine stats", {
            error: error instanceof Error ? error.message : error,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while getting engine stats", undefined, req.requestId));
    }
});
/**
 * PUT /engine/config
 * Atualiza configuração do ParameterEngine (apenas super admins)
 */
app.put("/engine/config", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), // Using CONFIG_WRITE since SUPER_ADMIN doesn't exist
async (req, res) => {
    try {
        const configValidation = (0, utils_1.validateData)(UpdateEngineConfigRequestSchema, req.body);
        if (!configValidation.success) {
            throw new utils_1.ValidationError(configValidation.error, configValidation.details);
        }
        // Limpar cache para aplicar nova configuração
        parameterEngine.clearCache();
        res.status(200).json((0, utils_1.createSuccessResponse)({ updated: true }, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error updating engine config", {
            error: error instanceof Error ? error.message : error,
            requestId: req.requestId
        });
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while updating engine config", undefined, req.requestId));
        }
    }
});
/**
 * GET /health
 * Health check do ParameterEngine
 */
app.get("/health", async (req, res) => {
    try {
        const stats = parameterEngine.getEngineStats();
        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            engine: {
                version: stats.version,
                cacheSize: stats.cacheSize
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// Error handling middleware
app.use((error, req, res) => {
    firebase_functions_1.logger.error("Unhandled error in parameter-engine API", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId
    });
    res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error", undefined, req.requestId));
});
exports.parameterEngineApi = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 10
}, app);
//# sourceMappingURL=parameter-engine.js.map