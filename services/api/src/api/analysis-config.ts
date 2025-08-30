/**
 * Analysis Configuration API - CORE DIFFERENTIATOR
 * Manage organization-specific analysis configurations
 * LicitaReview Cloud Functions
 */

import * as functions from 'firebase-functions/v1';
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getFirestore } from 'firebase-admin/firestore';
import { 
  initializeSecurity, 
  securityHeaders, 
  rateLimit, 
  attackProtection, 
  auditAccess 
} from '../middleware/security';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';


import { collections, firestore } from "../config/firebase";
import {
  OrganizationConfig,
  OrganizationConfigSchema,
  CreateConfigRequestSchema,
  UpdateConfigRequestSchema,
  ConfigSummary,
  AnalysisPreset,
  createDefaultConfig,
  createConfigSummary,
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
  validateData,
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  UUIDSchema,
  PaginationSchema
} from "../utils";
import { config } from "../config";

// Inicializar serviços de segurança
const db = getFirestore();
const loggingService = new LoggingService('analysis-config-api');
const metricsService = new MetricsService('analysis-config-api');

// Inicializar middleware de segurança
const securityManager = initializeSecurity(db, loggingService, metricsService, {
  rateLimit: {
    windowMs: config.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutos
    maxRequests: config.rateLimitMax || 100 // máximo 100 requests por IP por janela
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    excludePaths: []
  }
});

const app = express();

// Middleware básico
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));

// Aplicar middlewares de segurança
app.use(securityHeaders);
app.use(rateLimit);
app.use(attackProtection);
app.use(auditAccess);

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
      // Validate query parameters
      const queryValidation = validateData(PaginationSchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de consulta inválidos",
          queryValidation.details as Record<string, unknown>,
          req.requestId || generateRequestId()
        ));
      }
      
      const { page = 1, limit = 10 } = queryValidation.data || {};
      
      // Super admin can see all configs, others only their org
      let firestoreQuery: any = collections.configs;
      
      if (!req.user!.roles.includes("super_admin")) {
        firestoreQuery = firestoreQuery.where("organizationId", "==", req.user!.organizationId);
      }
      
      // Apply sorting
      firestoreQuery = firestoreQuery.orderBy("updatedAt", "desc");
      
      // Count total
      const countQuery = await firestoreQuery.count().get();
      const total = countQuery.data().count;
      
      // Apply pagination
      firestoreQuery = firestoreQuery.limit(limit);
      
      // For pages beyond the first, we would need to implement cursor-based pagination
      // For now, we'll just limit the results
      const snapshot = await firestoreQuery.get();
      
      const configs: ConfigSummary[] = snapshot.docs.map((doc: any) => {
        const data = { id: doc.id, ...doc.data() } as OrganizationConfig;
        return createConfigSummary(data);
      });
      
      const totalPages = Math.ceil(total / limit);
      
      res.json(createSuccessResponse({
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
    } catch (error) {
      console.error("Error listing configs:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId || generateRequestId()));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Erro interno do servidor",
          undefined,
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
          req.requestId
        ));
        return;
      }
      
      const configDoc = snapshot.docs[0];
      const config = { id: configDoc.id, ...configDoc.data() } as OrganizationConfig;
      
      res.json(createSuccessResponse(config, req.requestId));
      return;
    } catch (error) {
      console.error("Error getting current config:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Erro interno do servidor",
        undefined,
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
      const pathValidation = validateData(z.object({ id: UUIDSchema }), req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
      }
      
      if (!pathValidation.data) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          {},
          req.requestId
        ));
      }

      const { id } = pathValidation.data;
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "NOT_FOUND",
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
          "FORBIDDEN",
          "Access denied to configuration",
          { configId: id },
          req.requestId
        ));
        return;
      }
      
      res.json(createSuccessResponse(config, req.requestId));
      return;
    } catch (error) {
      console.error("Error getting config:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId || generateRequestId()));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Erro interno do servidor",
          undefined,
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
      const bodyValidation = validateData(CreateConfigRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      const configData = bodyValidation.data;
      
      // Validate organization access
      if (configData && configData.organizationId !== req.user!.organizationId &&
          !req.user!.roles.includes("super_admin")) {
        res.status(403).json(createErrorResponse(
          "FORBIDDEN",
          "Cannot create config for different organization",
          { requestedOrg: configData.organizationId, userOrg: req.user!.organizationId },
          req.requestId
        ));
        return;
      }
      
      if (!configData) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Dados de configuração inválidos",
          {},
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
          "CONFLICT",
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
      const validation = OrganizationConfigSchema.safeParse(config);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Dados de configuração inválidos"
        ));
        return;
      }
      
      // Deactivate existing configs if creating new active one
      if (config.isActive && !existingSnapshot.empty) {
        const batch = firestore.batch();
        existingSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
        });
        await batch.commit();
      }
      
      // Save new config
      await collections.configs.doc(config.id).set(config);
      
      res.status(201).json(createSuccessResponse(
        config,
        req.requestId
      ));
      return;
    } catch (error) {
      console.error("Error creating config:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown> | undefined, req.requestId));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Erro interno do servidor",
          undefined,
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
      const pathValidation = validateData(
        z.object({ id: UUIDSchema }),
        req.params
      );
      
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters",
          pathValidation.details as Record<string, unknown>,
          req.requestId
        ));
      }
      
      if (!pathValidation.data) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          {},
          req.requestId
        ));
      }

      const { id } = pathValidation.data;
      
      const bodyValidation = validateData(UpdateConfigRequestSchema, req.body);
      
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      if (!bodyValidation.data) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Dados de atualização inválidos",
          {},
          req.requestId
        ));
      }

      const updateData = bodyValidation.data;
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "NOT_FOUND",
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
          "FORBIDDEN",
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
        lastModifiedBy: req.user!.uid,
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
      const validation = OrganizationConfigSchema.safeParse(updatedConfig);
      if (!validation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid configuration update data",
          { errors: validation.error.errors as any },
          req.requestId
        ));
        return;
      }
      
      // Update in Firestore
      await configDoc.ref.set(updatedConfig);
      
      res.json(createSuccessResponse(
        updatedConfig,
        req.requestId
      ));
      return;
    } catch (error) {
      console.error("Error updating config:", error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, req.requestId));
      } else {
        return res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while updating config",
          undefined,
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
      const pathValidation = validateData(
        z.object({ id: UUIDSchema }),
        req.params
      );
      if (!pathValidation.success || !pathValidation.data) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid path parameters"
        ));
      }
      const { id } = pathValidation.data;
      
      const configDoc = await collections.configs.doc(id).get();
      
      if (!configDoc.exists) {
        res.status(404).json(createErrorResponse(
          "NOT_FOUND",
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
          "FORBIDDEN",
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
        req.requestId
      ));
      return;
    } catch (error) {
      console.error("Error cloning config:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Internal server error while cloning config",
        undefined,
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
  
  res.json(createSuccessResponse(presets, req.requestId));
  return;
});

/**
 * POST /validate-weights
 * Validate analysis weights
 */
app.post("/validate-weights", (req, res) => {
  try {
    const weightsSchema = z.object({
      structural: z.number().min(0).max(100),
      legal: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      abnt: z.number().min(0).max(100)
    });
    
    const weights = weightsSchema.parse(req.body);
    
    const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
    const isValid = Math.abs(total - 100) < 0.01;
    
    res.json(createSuccessResponse({
      isValid,
      total,
      weights,
      error: !isValid ? `Weights must sum to 100%. Current sum: ${total.toFixed(2)}%` : null
    }, req.requestId));
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Invalid weights format", { issues: error.issues }, req.requestId));
    } else {
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Error validating weights",
        undefined,
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
    const validation = z.object({
      pattern: z.string(),
      text: z.string(),
      patternType: z.enum(["regex", "keyword", "phrase"]).default("regex")
    }).safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json(createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        { issues: validation.error.errors },
        req.requestId
      ));
    }
    
    const { pattern, text, patternType } = validation.data;
    
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
      error = `Invalid pattern: ${(err as Error).message}`;
    }
    
    res.json(createSuccessResponse({
      matches,
      pattern,
      text: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      patternType,
      error
    }, req.requestId));
    return;
  } catch (error) {
    return res.status(500).json(createErrorResponse(
      "INTERNAL_ERROR",
      "Error testing rule",
      undefined,
      req.requestId
    ));
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
app.use((error: Error, req: express.Request, res: express.Response) => {
  console.error("Unhandled error in analysis-config API:", error);
  
  res.status(500).json(createErrorResponse(
    "INTERNAL_ERROR",
    "Internal server error",
    process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined,
    req.requestId
  ));
});

// Export Cloud Function
export const analysisConfigApi = functions
  .region("us-central1")
  .runWith({
    memory: "1GB",
    timeoutSeconds: 300
  })
  .https.onRequest(app);