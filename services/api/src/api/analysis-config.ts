/**
 * Analysis Configuration API - CORE DIFFERENTIATOR
 * Manage organization-specific analysis configurations
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";

import { collections } from "../config/firebase";
import {
  OrganizationConfig,
  OrganizationConfigSchema,
  CreateConfigRequest,
  CreateConfigRequestSchema,
  UpdateConfigRequest,
  UpdateConfigRequestSchema,
  ConfigSummary,
  AnalysisPreset,
  AnalysisWeights,
  CustomRule,
  createDefaultConfig,
  createConfigSummary,
  generateConfigHash,
  PRESET_WEIGHTS
} from "../types";
import {
  authenticateUser,
  requireOrganization,
  validateOrganizationAccess,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  UUIDSchema,
  PaginationSchema
} from "../utils";
import { config } from "../config";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// Authentication middleware
app.use(authenticateUser);
app.use(requireOrganization);

/**
 * GET /configs
 * List organization configurations (admin only)
 */
app.get("/",
  requirePermissions([PERMISSIONS.CONFIG_READ]),
  async (req, res) => {
    try {
      const query = validateQueryParams(PaginationSchema, req);
      
      // Super admin can see all configs, others only their org
      let firestoreQuery = collections.configs;
      
      if (!req.user!.roles.includes("super_admin")) {
        firestoreQuery = firestoreQuery.where("organizationId", "==", req.user!.organizationId);
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
      
      const configs: ConfigSummary[] = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() } as OrganizationConfig;
        return createConfigSummary(data);
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
    } catch (error) {
      console.error("Error listing configs:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while listing configs",
          null,
          req.requestId
        ));
      }
    }
  }
);

/**
 * GET /configs/current
 * Get current organization's configuration
 */
app.get("/current",
  requirePermissions([PERMISSIONS.CONFIG_READ]),
  async (req, res) => {
    try {
      const snapshot = await collections.configs
        .where("organizationId", "==", req.user!.organizationId)
        .where("isActive", "==", true)
        .orderBy("version", "desc")
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        // Create default config if none exists
        const defaultConfig = createDefaultConfig(
          req.user!.organizationId,
          req.user!.organizationId, // Use org ID as name for now
          AnalysisPreset.STANDARD,
          req.user!.uid
        );
        
        const configWithId = { id: uuidv4(), ...defaultConfig };
        await collections.configs.doc(configWithId.id).set(configWithId);
        
        res.json(createSuccessResponse(
          configWithId,
          "Default configuration created",
          req.requestId
        ));
        return;
      }
      
      const configDoc = snapshot.docs[0];
      const config = { id: configDoc.id, ...configDoc.data() } as OrganizationConfig;
      
      res.json(createSuccessResponse(config, undefined, req.requestId));
    } catch (error) {
      console.error("Error getting current config:", error);
      res.status(500).json(createErrorResponse(
        "Internal server error while getting config",
        null,
        req.requestId
      ));
    }
  }
);

/**
 * GET /configs/:id
 * Get configuration by ID
 */
app.get("/:id",
  requirePermissions([PERMISSIONS.CONFIG_READ]),
  validateOrganizationAccess("organizationId"),
  async (req, res) => {
    try {
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "Configuration not found",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      const config = { id: configDoc.id, ...configDoc.data() } as OrganizationConfig;
      
      // Verify organization access
      if (config.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Access denied to configuration",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      res.json(createSuccessResponse(config, undefined, req.requestId));
    } catch (error) {
      console.error("Error getting config:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while getting config",
          null,
          req.requestId
        ));
      }
    }
  }
);

/**
 * POST /configs
 * Create new organization configuration
 */
app.post("/",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]),
  async (req, res) => {
    try {
      const configData = validateRequestBody(CreateConfigRequestSchema)(req);
      
      // Validate organization access
      if (configData.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Cannot create config for different organization",
          { requestedOrg: configData.organizationId, userOrg: req.user!.organizationId },
          req.requestId
        ));
        return;
      }
      
      // Check if active config already exists
      const existingSnapshot = await collections.configs
        .where("organizationId", "==", configData.organizationId)
        .where("isActive", "==", true)
        .get();
      
      if (!existingSnapshot.empty && !req.body.allowMultiple) {
        res.status(409).json(createErrorResponse(
          "Active configuration already exists for organization",
          { 
            existingConfigId: existingSnapshot.docs[0].id,
            suggestion: "Update existing config or set allowMultiple=true" 
          },
          req.requestId
        ));
        return;
      }
      
      const config: OrganizationConfig = {
        id: uuidv4(),
        ...configData,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Validate complete config
      const validation = OrganizationConfigSchema.safeParse(config);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "Invalid configuration data",
          validation.error.errors,
          req.requestId
        ));
        return;
      }
      
      // Deactivate existing configs if creating new active one
      if (config.isActive && !existingSnapshot.empty) {
        const batch = collections.configs.firestore.batch();
        existingSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
        });
        await batch.commit();
      }
      
      // Save new config
      await collections.configs.doc(config.id).set(config);
      
      res.status(201).json(createSuccessResponse(
        config,
        "Configuration created successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error creating config:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while creating config",
          null,
          req.requestId
        ));
      }
    }
  }
);

/**
 * PUT /configs/:id
 * Update configuration
 */
app.put("/:id",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]),
  async (req, res) => {
    try {
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const updateData = validateRequestBody(UpdateConfigRequestSchema)(req);
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "Configuration not found",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      const existingConfig = { id: configDoc.id, ...configDoc.data() } as OrganizationConfig;
      
      // Verify organization access
      if (existingConfig.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Access denied to configuration",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      // Prepare updated config
      const updatedConfig: OrganizationConfig = {
        ...existingConfig,
        ...updateData,
        id: existingConfig.id,
        organizationId: existingConfig.organizationId,
        version: existingConfig.version + 1,
        updatedAt: new Date(),
        lastModifiedBy: req.user!.uid
      };
      
      // Validate updated config
      const validation = OrganizationConfigSchema.safeParse(updatedConfig);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "Invalid configuration update data",
          validation.error.errors,
          req.requestId
        ));
        return;
      }
      
      // Update in Firestore
      await configDoc.ref.set(updatedConfig);
      
      res.json(createSuccessResponse(
        updatedConfig,
        "Configuration updated successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error updating config:", error);
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "Internal server error while updating config",
          null,
          req.requestId
        ));
      }
    }
  }
);

/**
 * POST /configs/:id/clone
 * Clone configuration to new version
 */
app.post("/:id/clone",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]),
  async (req, res) => {
    try {
      const { id } = validatePathParams(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "Configuration not found",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      const sourceConfig = { id: configDoc.id, ...configDoc.data() } as OrganizationConfig;
      
      // Verify organization access
      if (sourceConfig.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "Access denied to configuration",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      // Create cloned config
      const clonedConfig: OrganizationConfig = {
        ...sourceConfig,
        id: uuidv4(),
        version: sourceConfig.version + 1,
        isActive: false, // Cloned configs start as inactive
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.user!.uid,
        lastModifiedBy: req.user!.uid
      };
      
      // Save cloned config
      await collections.configs.doc(clonedConfig.id).set(clonedConfig);
      
      res.status(201).json(createSuccessResponse(
        clonedConfig,
        "Configuration cloned successfully",
        req.requestId
      ));
    } catch (error) {
      console.error("Error cloning config:", error);
      res.status(500).json(createErrorResponse(
        "Internal server error while cloning config",
        null,
        req.requestId
      ));
    }
  }
);

/**
 * GET /presets
 * Get available analysis presets
 */
app.get("/presets", (req, res) => {
  const presets = Object.entries(PRESET_WEIGHTS).map(([preset, weights]) => ({
    preset: preset as AnalysisPreset,
    weights,
    name: preset.charAt(0).toUpperCase() + preset.slice(1).toLowerCase(),
    description: getPresetDescription(preset as AnalysisPreset)
  }));
  
  res.json(createSuccessResponse(presets, undefined, req.requestId));
});

/**
 * POST /validate-weights
 * Validate analysis weights
 */
app.post("/validate-weights", (req, res) => {
  try {
    const weights = validateRequestBody(
      z.object({
        structural: z.number().min(0).max(100),
        legal: z.number().min(0).max(100),
        clarity: z.number().min(0).max(100),
        abnt: z.number().min(0).max(100)
      })
    )(req);
    
    const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
    const isValid = Math.abs(total - 100) < 0.01;
    
    res.json(createSuccessResponse({
      isValid,
      total,
      weights,
      error: !isValid ? `Weights must sum to 100%. Current sum: ${total.toFixed(2)}%` : null
    }, undefined, req.requestId));
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
    } else {
      res.status(500).json(createErrorResponse(
        "Error validating weights",
        null,
        req.requestId
      ));
    }
  }
});

/**
 * POST /test-rule
 * Test custom rule pattern against text
 */
app.post("/test-rule", (req, res) => {
  try {
    const { pattern, text, patternType } = validateRequestBody(
      z.object({
        pattern: z.string(),
        text: z.string(),
        patternType: z.enum(["regex", "keyword", "phrase"]).default("regex")
      })
    )(req);
    
    let matches = false;
    let error = null;
    
    try {
      if (patternType === "regex") {
        const regex = new RegExp(pattern, "gi");
        matches = regex.test(text);
      } else if (patternType === "keyword" || patternType === "phrase") {
        matches = text.toLowerCase().includes(pattern.toLowerCase());
      }
    } catch (err) {
      error = `Invalid pattern: ${err.message}`;
    }
    
    res.json(createSuccessResponse({
      matches,
      pattern,
      text: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      patternType,
      error
    }, undefined, req.requestId));
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json(createErrorResponse(error.message, error.details, req.requestId));
    } else {
      res.status(500).json(createErrorResponse(
        "Error testing rule",
        null,
        req.requestId
      ));
    }
  }
});

// Helper function for preset descriptions
function getPresetDescription(preset: AnalysisPreset): string {
  const descriptions = {
    [AnalysisPreset.RIGOROUS]: "Foco em conformidade legal rigorosa",
    [AnalysisPreset.STANDARD]: "Análise balanceada para uso geral",
    [AnalysisPreset.TECHNICAL]: "Foco em especificações técnicas detalhadas",
    [AnalysisPreset.FAST]: "Análise rápida com foco em aspectos essenciais",
    [AnalysisPreset.CUSTOM]: "Configuração completamente personalizada"
  };
  return descriptions[preset] || "Preset personalizado";
}

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error in analysis-config API:", error);
  
  res.status(500).json(createErrorResponse(
    "Internal server error",
    process.env.NODE_ENV === "development" ? error.stack : null,
    req.requestId
  ));
});

// Export Cloud Function
export const analysisConfigApi = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 300,
  maxInstances: 50,
  cors: config.corsOrigin
}, app);