"use strict";
/**
 * Organization Configuration API
 * Cloud Functions para gerenciar configurações organizacionais
 * Conecta configurações do Firestore com serviço de análise do Cloud Run
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationConfig = void 0;
const https_1 = require("firebase-functions/v2/https");
const zod_1 = require("zod");
const firebase_1 = require("../config/firebase");
const OrganizationConfigService_1 = require("../services/OrganizationConfigService");
const utils_1 = require("../utils");
const auth_1 = require("../middleware/auth");
const firebase_functions_1 = require("firebase-functions");
// Schemas de validação
const OrganizationIdSchema = zod_1.z.object({
    organizationId: utils_1.CommonSchemas.uuid
});
const ConfigDataSchema = zod_1.z.object({
    weights: zod_1.z.object({
        structural: zod_1.z.number().min(0).max(100).optional(),
        legal: zod_1.z.number().min(0).max(100).optional(),
        clarity: zod_1.z.number().min(0).max(100).optional(),
        abnt: zod_1.z.number().min(0).max(100).optional()
    }).optional(),
    maxRetries: zod_1.z.number().int().min(1).max(10).optional(),
    customRules: zod_1.z.array(zod_1.z.any()).optional(),
    preset: zod_1.z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']).optional(),
    timeout: zod_1.z.number().int().min(30).max(600).optional()
});
// Inicializar serviço
const analyzerConfig = {
    baseUrl: process.env.ANALYZER_SERVICE_URL || 'http://localhost:8080',
    apiKey: process.env.ANALYZER_API_KEY || '',
    timeout: 30000
};
const configService = new OrganizationConfigService_1.OrganizationConfigService(firebase_1.firestore, analyzerConfig);
/**
 * Handler principal para configurações organizacionais
 */
exports.organizationConfig = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB"
}, async (req, res) => {
    try {
        // Adicionar request ID
        req.requestId = (0, utils_1.generateRequestId)();
        // Log da requisição
        firebase_functions_1.logger.info(`Organization Config API - ${req.method} ${req.path}`, {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
        // Roteamento baseado no método e path
        const method = req.method;
        const path = req.path;
        if (method === 'GET' && path.match(/^\/organizations\/[^/]+\/config$/)) {
            return await getOrganizationConfig(req, res);
        }
        if (method === 'POST' && path.match(/^\/organizations\/[^/]+\/config\/sync$/)) {
            return await syncConfig(req, res);
        }
        if (method === 'POST' && path.match(/^\/organizations\/[^/]+\/config\/validate$/)) {
            return await validateConfig(req, res);
        }
        if (method === 'GET' && path.match(/^\/organizations\/[^/]+\/presets$/)) {
            return await getPresets(req, res);
        }
        if (method === 'POST' && path.match(/^\/organizations\/[^/]+\/presets$/)) {
            return await createPreset(req, res);
        }
        if (method === 'DELETE' && path.match(/^\/organizations\/[^/]+\/cache$/)) {
            return await clearCache(req, res);
        }
        if (method === 'GET' && path.match(/^\/organizations\/[^/]+\/stats$/)) {
            return await getUsageStats(req, res);
        }
        // Rota não encontrada
        res.status(404).json((0, utils_1.createErrorResponse)("ROUTE_NOT_FOUND", "Endpoint not found", { method, path }, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Organization Config API Error:', {
            error: String(error),
            requestId: req.requestId,
            method: req.method,
            path: req.path
        });
        res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error", undefined, req.requestId));
    }
});
/**
 * GET /organizations/:organizationId/config
 * Obter configurações de análise da organização
 */
async function getOrganizationConfig(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse({ organizationId: req.params.organizationId });
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        const config = await configService.getAnalysisConfig(organizationId);
        res.json((0, utils_1.createSuccessResponse)(config, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Get organization config error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("CONFIG_FETCH_ERROR", "Failed to fetch organization config", undefined, req.requestId));
    }
}
/**
 * POST /organizations/:organizationId/config/sync
 * Sincronizar configurações com o serviço de análise
 */
async function syncConfig(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        const result = await configService.syncWithAnalyzer(organizationId);
        res.json((0, utils_1.createSuccessResponse)(result, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Sync config error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("CONFIG_SYNC_ERROR", "Failed to sync configuration", undefined, req.requestId));
    }
}
/**
 * POST /organizations/:organizationId/config/validate
 * Validar configurações de análise
 */
async function validateConfig(req, res) {
    var _a, _b, _c, _d;
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        // Validar corpo da requisição
        const configValidation = ConfigDataSchema.safeParse(req.body);
        if (!configValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_CONFIG", "Invalid configuration data", configValidation.error.errors, req.requestId));
            return;
        }
        const configData = {
            organizationId: paramsValidation.data.organizationId,
            weights: {
                structural: ((_a = configValidation.data.weights) === null || _a === void 0 ? void 0 : _a.structural) || 25,
                legal: ((_b = configValidation.data.weights) === null || _b === void 0 ? void 0 : _b.legal) || 25,
                clarity: ((_c = configValidation.data.weights) === null || _c === void 0 ? void 0 : _c.clarity) || 25,
                abnt: ((_d = configValidation.data.weights) === null || _d === void 0 ? void 0 : _d.abnt) || 25
            },
            maxRetries: configValidation.data.maxRetries || 3,
            customRules: configValidation.data.customRules || [],
            preset: (configValidation.data.preset || 'STANDARD').toLowerCase(),
            timeout: configValidation.data.timeout || 300
        };
        const validation = await configService.validateConfig(configData);
        res.json((0, utils_1.createSuccessResponse)(validation, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Validate config error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("CONFIG_VALIDATION_ERROR", "Failed to validate configuration", undefined, req.requestId));
    }
}
/**
 * GET /organizations/:organizationId/presets
 * Obter presets de configuração disponíveis
 */
async function getPresets(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        const presets = await configService.getPresets(organizationId);
        res.json((0, utils_1.createSuccessResponse)(presets, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Get presets error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("PRESETS_FETCH_ERROR", "Failed to fetch presets", undefined, req.requestId));
    }
}
/**
 * POST /organizations/:organizationId/presets
 * Criar novo preset de configuração
 */
async function createPreset(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        const preset = await configService.createPreset(organizationId, req.body);
        res.status(201).json((0, utils_1.createSuccessResponse)(preset, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Create preset error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("PRESET_CREATE_ERROR", "Failed to create preset", undefined, req.requestId));
    }
}
/**
 * DELETE /organizations/:organizationId/cache
 * Limpar cache de configurações
 */
async function clearCache(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        await configService.clearCache(organizationId);
        res.json((0, utils_1.createSuccessResponse)({ cleared: true }, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Clear cache error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("CACHE_CLEAR_ERROR", "Failed to clear cache", undefined, req.requestId));
    }
}
/**
 * GET /organizations/:organizationId/stats
 * Obter estatísticas de uso das configurações
 */
async function getUsageStats(req, res) {
    try {
        // Autenticação e autorização
        await (0, auth_1.authenticateUser)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requireOrganization)(req, res, () => { });
        if (res.headersSent)
            return;
        await (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ])(req, res, () => { });
        if (res.headersSent)
            return;
        // Validar parâmetros
        const paramsValidation = OrganizationIdSchema.safeParse(req.params);
        if (!paramsValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("INVALID_PARAMS", "Invalid organization ID", paramsValidation.error.errors, req.requestId));
            return;
        }
        const { organizationId } = paramsValidation.data;
        const stats = await configService.getUsageStats(organizationId);
        res.json((0, utils_1.createSuccessResponse)(stats, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error('Get usage stats error:', {
            error: String(error),
            organizationId: req.params.organizationId,
            requestId: req.requestId
        });
        res.status(500).json((0, utils_1.createErrorResponse)("STATS_FETCH_ERROR", "Failed to fetch usage statistics", undefined, req.requestId));
    }
}
//# sourceMappingURL=organization-config.js.map