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
        const query = (0, utils_1.validateQueryParams)(utils_1.PaginationSchema, req);
        // Super admin can see all configs, others only their org
        let firestoreQuery = firebase_1.collections.configs;
        if (!req.user.roles.includes("super_admin")) {
            firestoreQuery = firestoreQuery.where("organizationId", "==", req.user.organizationId);
        }
        // Apply sorting
        firestoreQuery = firestoreQuery.orderBy("updatedAt", query.sortOrder);
        // Count total
        const countQuery = await firestoreQuery.count().get();
        const total = countQuery.data().count;
        // Apply pagination
        const offset = (query.page - 1) * query.limit;
        firestoreQuery = firestoreQuery.offset(offset).limit(query.limit);
        const snapshot = await firestoreQuery.get();
        const configs = snapshot.docs.map(doc => {
            const data = Object.assign({ id: doc.id }, doc.data());
            return (0, types_1.createConfigSummary)(data);
        });
        const totalPages = Math.ceil(total / query.limit);
        res.json({
            success: true,
            data: configs,
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
        });
    }
    catch (error) {
        console.error("Error listing configs:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while listing configs", null, req.requestId));
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
            const configWithId = Object.assign({ id: (0, uuid_1.v4)() }, defaultConfig);
            await firebase_1.collections.configs.doc(configWithId.id).set(configWithId);
            res.json((0, utils_1.createSuccessResponse)(configWithId, "Default configuration created", req.requestId));
            return;
        }
        const configDoc = snapshot.docs[0];
        const config = Object.assign({ id: configDoc.id }, configDoc.data());
        res.json((0, utils_1.createSuccessResponse)(config, undefined, req.requestId));
    }
    catch (error) {
        console.error("Error getting current config:", error);
        res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while getting config", null, req.requestId));
    }
});
/**
 * GET /configs/:id
 * Get configuration by ID
 */
app.get("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_READ]), (0, auth_1.validateOrganizationAccess)("organizationId"), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const config = Object.assign({ id: configDoc.id }, configDoc.data());
        // Verify organization access
        if (config.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        res.json((0, utils_1.createSuccessResponse)(config, undefined, req.requestId));
    }
    catch (error) {
        console.error("Error getting config:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while getting config", null, req.requestId));
        }
    }
});
/**
 * POST /configs
 * Create new organization configuration
 */
app.post("/", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const configData = (0, utils_1.validateRequestBody)(types_1.CreateConfigRequestSchema)(req);
        // Validate organization access
        if (configData.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Cannot create config for different organization", { requestedOrg: configData.organizationId, userOrg: req.user.organizationId }, req.requestId));
            return;
        }
        // Check if active config already exists
        const existingSnapshot = await firebase_1.collections.configs
            .where("organizationId", "==", configData.organizationId)
            .where("isActive", "==", true)
            .get();
        if (!existingSnapshot.empty && !req.body.allowMultiple) {
            res.status(409).json((0, utils_1.createErrorResponse)("Active configuration already exists for organization", {
                existingConfigId: existingSnapshot.docs[0].id,
                suggestion: "Update existing config or set allowMultiple=true"
            }, req.requestId));
            return;
        }
        const config = Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, configData), { version: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() });
        // Validate complete config
        const validation = types_1.OrganizationConfigSchema.safeParse(config);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("Invalid configuration data", validation.error.errors, req.requestId));
            return;
        }
        // Deactivate existing configs if creating new active one
        if (config.isActive && !existingSnapshot.empty) {
            const batch = firebase_1.collections.configs.firestore.batch();
            existingSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
            });
            await batch.commit();
        }
        // Save new config
        await firebase_1.collections.configs.doc(config.id).set(config);
        res.status(201).json((0, utils_1.createSuccessResponse)(config, "Configuration created successfully", req.requestId));
    }
    catch (error) {
        console.error("Error creating config:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while creating config", null, req.requestId));
        }
    }
});
/**
 * PUT /configs/:id
 * Update configuration
 */
app.put("/:id", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const updateData = (0, utils_1.validateRequestBody)(types_1.UpdateConfigRequestSchema)(req);
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const existingConfig = Object.assign({ id: configDoc.id }, configDoc.data());
        // Verify organization access
        if (existingConfig.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        // Prepare updated config
        const updatedConfig = Object.assign(Object.assign(Object.assign({}, existingConfig), updateData), { id: existingConfig.id, organizationId: existingConfig.organizationId, version: existingConfig.version + 1, updatedAt: new Date(), lastModifiedBy: req.user.uid });
        // Validate updated config
        const validation = types_1.OrganizationConfigSchema.safeParse(updatedConfig);
        if (!validation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("Invalid configuration update data", validation.error.errors, req.requestId));
            return;
        }
        // Update in Firestore
        await configDoc.ref.set(updatedConfig);
        res.json((0, utils_1.createSuccessResponse)(updatedConfig, "Configuration updated successfully", req.requestId));
    }
    catch (error) {
        console.error("Error updating config:", error);
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while updating config", null, req.requestId));
        }
    }
});
/**
 * POST /configs/:id/clone
 * Clone configuration to new version
 */
app.post("/:id/clone", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.CONFIG_WRITE]), async (req, res) => {
    try {
        const { id } = (0, utils_1.validatePathParams)(z.object({ id: utils_1.UUIDSchema }), req.params);
        const configDoc = await firebase_1.collections.configs.doc(id).get();
        if (!configDoc.exists) {
            res.status(404).json((0, utils_1.createErrorResponse)("Configuration not found", { configId: id }, req.requestId));
            return;
        }
        const sourceConfig = Object.assign({ id: configDoc.id }, configDoc.data());
        // Verify organization access
        if (sourceConfig.organizationId !== req.user.organizationId &&
            !req.user.roles.includes("super_admin")) {
            res.status(403).json((0, utils_1.createErrorResponse)("Access denied to configuration", { configId: id }, req.requestId));
            return;
        }
        // Create cloned config
        const clonedConfig = Object.assign(Object.assign({}, sourceConfig), { id: (0, uuid_1.v4)(), version: sourceConfig.version + 1, isActive: false, createdAt: new Date(), updatedAt: new Date(), createdBy: req.user.uid, lastModifiedBy: req.user.uid });
        // Save cloned config
        await firebase_1.collections.configs.doc(clonedConfig.id).set(clonedConfig);
        res.status(201).json((0, utils_1.createSuccessResponse)(clonedConfig, "Configuration cloned successfully", req.requestId));
    }
    catch (error) {
        console.error("Error cloning config:", error);
        res.status(500).json((0, utils_1.createErrorResponse)("Internal server error while cloning config", null, req.requestId));
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
    res.json((0, utils_1.createSuccessResponse)(presets, undefined, req.requestId));
});
/**
 * POST /validate-weights
 * Validate analysis weights
 */
app.post("/validate-weights", (req, res) => {
    try {
        const weights = (0, utils_1.validateRequestBody)(z.object({
            structural: z.number().min(0).max(100),
            legal: z.number().min(0).max(100),
            clarity: z.number().min(0).max(100),
            abnt: z.number().min(0).max(100)
        }))(req);
        const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
        const isValid = Math.abs(total - 100) < 0.01;
        res.json((0, utils_1.createSuccessResponse)({
            isValid,
            total,
            weights,
            error: !isValid ? `Weights must sum to 100%. Current sum: ${total.toFixed(2)}%` : null
        }, undefined, req.requestId));
    }
    catch (error) {
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Error validating weights", null, req.requestId));
        }
    }
});
/**
 * POST /test-rule
 * Test custom rule pattern against text
 */
app.post("/test-rule", (req, res) => {
    try {
        const { pattern, text, patternType } = (0, utils_1.validateRequestBody)(z.object({
            pattern: z.string(),
            text: z.string(),
            patternType: z.enum(["regex", "keyword", "phrase"]).default("regex")
        }))(req);
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
        }, undefined, req.requestId));
    }
    catch (error) {
        if (error instanceof utils_1.ValidationError) {
            res.status(400).json((0, utils_1.createErrorResponse)(error.message, error.details, req.requestId));
        }
        else {
            res.status(500).json((0, utils_1.createErrorResponse)("Error testing rule", null, req.requestId));
        }
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
    res.status(500).json((0, utils_1.createErrorResponse)("Internal server error", process.env.NODE_ENV === "development" ? error.stack : null, req.requestId));
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