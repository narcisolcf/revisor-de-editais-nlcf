"use strict";
/**
 * Analysis Configuration API - CORE DIFFERENTIATOR
 * Manage organization-specific analysis configurations
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisConfigApi = void 0;
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
 * GET /configs
 * List organization configurations (admin only)
 */
app.get("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), async (req, res) => {
    try {
        // Validate query parameters
        const queryValidation = (0, utils_1.validateData)(utils_1.PaginationSchema, req.query);
        if (!queryValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de consulta inválidos", queryValidation.details, req.requestId));
        }
        const { page = 1, limit = 10 } = queryValidation.data || {};
        // Super admin can see all configs, others only their org
        let firestoreQuery = firebase_1.collections.configs;
        if (!req.user.roles.includes("super_admin")) {
            firestoreQuery = firestoreQuery.where("organizationId", "==", req.user.organizationId);
        }
        // Apply sorting
        firestoreQuery = firestoreQuery.orderBy("updatedAt", "desc");
        // Count total
        const countQuery = await firestoreQuery.count().get();
        const total = countQuery.data().count;
        // Apply pagination
        const offset = (page - 1) * limit;
        firestoreQuery = firestoreQuery.offset(offset).limit(limit);
        const snapshot = await firestoreQuery.get();
        const configs = snapshot.docs.map((doc) => {
            const data = { id: doc.id, ...doc.data() };
            return (0, types_1.createConfigSummary)(data);
        });
        const totalPages = Math.ceil(total / limit);
        res.json((0, utils_1.createSuccessResponse)({
            configs,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        }, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error listing configs:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", undefined, req.requestId));
        }
    }
});
/**
 * GET /configs/current
 * Get current organization's configuration
 */
app.get("/current", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), async (req, res) => {
    try {
        const snapshot = await firebase_1.collections.configs
            .where("organizationId", "==", req.user.organizationId)
            .where("isActive", "==", true)
            .orderBy("version", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            // Create default config if none exists
            const defaultConfig = (0, types_1.createDefaultConfig)(req.user.organizationId, req.user.organizationId, // Use org ID as name for now
            types_1.AnalysisPreset.STANDARD, req.user.uid);
            const configWithId = { id: (0, uuid_1.v4)(), ...defaultConfig };
            await firebase_1.collections.configs.doc(configWithId.id).set(configWithId);
            res.json((0, utils_1.createSuccessResponse)(configWithId, req.requestId));
            return;
        }
        const configDoc = snapshot.docs[0];
        const config = { id: configDoc.id, ...configDoc.data() };
        res.json((0, utils_1.createSuccessResponse)(config, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error getting current config:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", undefined, req.requestId));
    }
});
/**
 * GET /configs/:id
 * Get configuration by ID
 */
app.get("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), (0, auth_1.validateOrganizationAccess)("organizationId"), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
        }
        if (!pathValidation.data) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", {}, req.requestId));
        }
        const { id } = pathValidation.data;
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const config = { id: configDoc.id, ...configDoc.data() };
        // Verify organization access
        if (config.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        res.json((0, utils_1.createSuccessResponse)(config, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error getting config:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", undefined, req.requestId));
        }
    }
});
/**
 * POST /configs
 * Create new organization configuration
 */
app.post("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const bodyValidation = (0, utils_1.validateData)(types_1.CreateConfigRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        const configData = bodyValidation.data;
        // Validate organization access
        if (configData?.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Cannot create config for different organization", { requestedOrg: configData?.organizationId, userOrg: req.user.organizationId }, req.requestId));
            return;
        }
        // Check if active config already exists
        const existingSnapshot = await firebase_1.collections.configs
            .where("organizationId", "==", configData?.organizationId)
            .where("isActive", "==", true)
            .get();
        if (!existingSnapshot.empty && !req.body.allowMultiple) {
            res.status(409).json((0, utils_1.createErrorResponse)("CONFLICT", "Active configuration already exists for organization", {
                existingConfigId: existingSnapshot.docs[0].id,
                suggestion: "Update existing config or set allowMultiple=true"
            }, req.requestId));
            return;
        }
        if (!configData) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Dados de configuração inválidos"));
            return;
        }
        const config = {
            id: (0, uuid_1.v4)(),
            ...configData,
            version: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Ensure customRules have required properties
            customRules: configData.customRules?.map(rule => ({
                ...rule,
                createdAt: rule.createdAt || new Date(),
                updatedAt: rule.updatedAt || new Date(),
                patternType: rule.patternType || 'regex',
                isActive: rule.isActive !== undefined ? rule.isActive : true,
                weight: rule.weight !== undefined ? rule.weight : 1
            })) || [],
            // Ensure templates have required properties
            templates: configData.templates?.map(template => ({
                ...template,
                createdAt: template.createdAt || new Date(),
                updatedAt: template.updatedAt || new Date(),
                isActive: template.isActive !== undefined ? template.isActive : true,
                sections: template.sections.map(section => ({
                    ...section,
                    optionalFields: section.optionalFields || [],
                    validationRules: section.validationRules || []
                }))
            })) || [],
            // Ensure settings have required properties
            settings: {
                enableAIAnalysis: configData.settings?.enableAIAnalysis ?? false,
                enableCustomRules: configData.settings?.enableCustomRules ?? true,
                strictMode: configData.settings?.strictMode ?? false,
                autoApproval: configData.settings?.autoApproval ?? false,
                requireDualApproval: configData.settings?.requireDualApproval ?? false,
                maxDocumentSize: configData.settings?.maxDocumentSize ?? 52428800,
                allowedDocumentTypes: configData.settings?.allowedDocumentTypes ?? ["pdf", "doc", "docx"],
                retentionDays: configData.settings?.retentionDays ?? 365
            }
        };
        // Validate complete config
        const validation = types_1.OrganizationConfigSchema.safeParse(config);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Dados de configuração inválidos"));
            return;
        }
        // Deactivate existing configs if creating new active one
        if (config.isActive && !existingSnapshot.empty) {
            const batch = firebase_1.firestore.batch();
            existingSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
            });
            await batch.commit();
        }
        // Save new config
        await firebase_1.collections.configs.doc(config.id).set(config);
        res.status(201).json((0, utils_1.createSuccessResponse)(config, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error creating config:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Erro interno do servidor", undefined, req.requestId));
        }
    }
});
/**
 * PUT /configs/:id
 * Update configuration
 */
app.put("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters", pathValidation.details, req.requestId));
        }
        if (!pathValidation.data) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Parâmetros de caminho inválidos", {}, req.requestId));
        }
        const { id } = pathValidation.data;
        const bodyValidation = (0, utils_1.validateData)(types_1.UpdateConfigRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        if (!bodyValidation.data) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Dados de atualização inválidos", {}, req.requestId));
        }
        const updateData = bodyValidation.data;
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const existingConfig = { id: configDoc.id, ...configDoc.data() };
        // Verify organization access
        if (existingConfig.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        // Prepare updated config
        const updatedConfig = {
            ...existingConfig,
            ...updateData,
            id: existingConfig.id,
            organizationId: existingConfig.organizationId,
            version: existingConfig.version + 1,
            updatedAt: new Date(),
            lastModifiedBy: req.user.uid,
            // Ensure customRules have required dates and properties
            customRules: updateData.customRules?.map(rule => ({
                ...rule,
                createdAt: rule.createdAt || new Date(),
                updatedAt: rule.updatedAt || new Date(),
                patternType: rule.patternType || 'regex',
                isActive: rule.isActive !== undefined ? rule.isActive : true,
                weight: rule.weight !== undefined ? rule.weight : 1
            })) || existingConfig.customRules,
            // Ensure templates have required dates and properties
            templates: updateData.templates?.map(template => ({
                ...template,
                createdAt: template.createdAt || new Date(),
                updatedAt: template.updatedAt || new Date(),
                isActive: template.isActive !== undefined ? template.isActive : true,
                sections: template.sections.map(section => ({
                    ...section,
                    optionalFields: section.optionalFields || [],
                    validationRules: section.validationRules || []
                }))
            })) || existingConfig.templates,
            // Ensure settings have required properties
            settings: {
                enableAIAnalysis: updateData.settings?.enableAIAnalysis ?? existingConfig.settings?.enableAIAnalysis ?? false,
                enableCustomRules: updateData.settings?.enableCustomRules ?? existingConfig.settings?.enableCustomRules ?? true,
                strictMode: updateData.settings?.strictMode ?? existingConfig.settings?.strictMode ?? false,
                autoApproval: updateData.settings?.autoApproval ?? existingConfig.settings?.autoApproval ?? false,
                requireDualApproval: updateData.settings?.requireDualApproval ?? existingConfig.settings?.requireDualApproval ?? false,
                maxDocumentSize: updateData.settings?.maxDocumentSize ?? existingConfig.settings?.maxDocumentSize ?? 52428800,
                allowedDocumentTypes: updateData.settings?.allowedDocumentTypes ?? existingConfig.settings?.allowedDocumentTypes ?? ["pdf", "doc", "docx"],
                retentionDays: updateData.settings?.retentionDays ?? existingConfig.settings?.retentionDays ?? 365
            }
        };
        // Validate updated config
        const validation = types_1.OrganizationConfigSchema.safeParse(updatedConfig);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid configuration update data", { errors: validation.error.errors }, req.requestId));
            return;
        }
        // Update in Firestore
        await configDoc.ref.set(updatedConfig);
        res.json((0, utils_1.createSuccessResponse)(updatedConfig, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error updating config:", error);
        if (error instanceof utils_1.ValidationError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, error.details, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while updating config", undefined, req.requestId));
        }
    }
});
/**
 * POST /configs/:id/clone
 * Clone configuration to new version
 */
app.post("/:id/clone", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const pathValidation = (0, utils_1.validateData)(zod_1.z.object({ id: utils_1.UUIDSchema }), req.params);
        if (!pathValidation.success || !pathValidation.data) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid path parameters"));
        }
        const { id } = pathValidation.data;
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("NOT_FOUND", "Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const sourceConfig = { id: configDoc.id, ...configDoc.data() };
        // Verify organization access
        if (sourceConfig.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("FORBIDDEN", "Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        // Create cloned config
        const clonedConfig = {
            ...sourceConfig,
            id: (0, uuid_1.v4)(),
            version: sourceConfig.version + 1,
            isActive: false, // Cloned configs start as inactive
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: req.user.uid,
            lastModifiedBy: req.user.uid
        };
        // Save cloned config
        await firebase_1.collections.configs.doc(clonedConfig.id).set(clonedConfig);
        res.status(201).json((0, utils_1.createSuccessResponse)(clonedConfig, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error cloning config:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error while cloning config", undefined, req.requestId));
    }
});
/**
 * GET /presets
 * Get available analysis presets
 */
app.get("/presets", (req, res) => {
    const presets = Object.entries(types_1.PRESET_WEIGHTS).map(([preset, weights]) => ({
        preset: preset,
        weights,
        name: preset.charAt(0).toUpperCase() + preset.slice(1).toLowerCase(),
        description: getPresetDescription(preset)
    }));
    res.json((0, utils_1.createSuccessResponse)(presets, req.requestId));
    return;
});
/**
 * POST /validate-weights
 * Validate analysis weights
 */
app.post("/validate-weights", (req, res) => {
    try {
        const weightsSchema = zod_1.z.object({
            structural: zod_1.z.number().min(0).max(100),
            legal: zod_1.z.number().min(0).max(100),
            clarity: zod_1.z.number().min(0).max(100),
            abnt: zod_1.z.number().min(0).max(100)
        });
        const weights = weightsSchema.parse(req.body);
        const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
        const isValid = Math.abs(total - 100) < 0.01;
        res.json((0, utils_1.createSuccessResponse)({
            isValid,
            total,
            weights,
            error: !isValid ? `Weights must sum to 100%. Current sum: ${total.toFixed(2)}%` : null
        }, req.requestId));
        return;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid weights format", { issues: error.issues }, req.requestId));
        }
        else {
            return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Error validating weights", undefined, req.requestId));
        }
    }
});
/**
 * POST /test-rule
 * Test custom rule pattern against text
 */
app.post("/test-rule", (req, res) => {
    try {
        const validation = zod_1.z.object({
            pattern: zod_1.z.string(),
            text: zod_1.z.string(),
            patternType: zod_1.z.enum(["regex", "keyword", "phrase"]).default("regex")
        }).safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid request body", { issues: validation.error.errors }, req.requestId));
        }
        const { pattern, text, patternType } = validation.data;
        let matches = false;
        let error = null;
        try {
            if (patternType === "regex") {
                const regex = new RegExp(pattern, "gi");
                matches = regex.test(text);
            }
            else if (patternType === "keyword" || patternType === "phrase") {
                matches = text.toLowerCase().includes(pattern.toLowerCase());
            }
        }
        catch (err) {
            error = `Invalid pattern: ${err.message}`;
        }
        res.json((0, utils_1.createSuccessResponse)({
            matches,
            pattern,
            text: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
            patternType,
            error
        }, req.requestId));
        return;
    }
    catch (error) {
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Error testing rule", undefined, req.requestId));
    }
});
// Helper function for preset descriptions
function getPresetDescription(preset) {
    const descriptions = {
        [types_1.AnalysisPreset.RIGOROUS]: "Foco em conformidade legal rigorosa",
        [types_1.AnalysisPreset.STANDARD]: "Análise balanceada para uso geral",
        [types_1.AnalysisPreset.TECHNICAL]: "Foco em especificações técnicas detalhadas",
        [types_1.AnalysisPreset.FAST]: "Análise rápida com foco em aspectos essenciais",
        [types_1.AnalysisPreset.CUSTOM]: "Configuração completamente personalizada"
    };
    return descriptions[preset] || "Preset personalizado";
}
// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Unhandled error in analysis-config API:", error);
    res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Internal server error", process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined, req.requestId));
});
// Export Cloud Function
exports.analysisConfigApi = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300,
    maxInstances: 50,
    cors: config_1.config.corsOrigin
}, app);
//# sourceMappingURL=analysis-config.js.map