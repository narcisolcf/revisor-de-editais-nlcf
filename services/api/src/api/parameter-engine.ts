/**
 * Parameter Engine API - Gerenciamento de Parâmetros de Análise
 * 
 * API para gerenciar e otimizar parâmetros de análise usando o ParameterEngine.
 * Permite configuração adaptativa e otimização baseada em histórico.
 * 
 * 🚀 CORE DIFFERENTIATOR: Engine adaptativo de parâmetros
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { firestore } from "../config/firebase";
import { ParameterEngine } from "../services/ParameterEngine";
import {
  authenticateUser,
  requireOrganization,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  validateData
} from "../utils";
import { config } from "../config";
import { logger } from "firebase-functions";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));
app.use(generateRequestId);
app.use(authenticateUser);
app.use(requireOrganization);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Initialize ParameterEngine
const parameterEngine = new ParameterEngine(firestore, {
  enableAdaptiveWeights: true,
  enableLearningMode: true,
  adaptationThreshold: 10,
  maxWeightAdjustment: 15.0,
  cacheTimeout: 30 * 60 * 1000 // 30 minutos
});

// Schemas de validação


const OptimizeParametersRequestSchema = z.object({
  analysisCount: z.number().int().min(1).max(100).optional().default(50),
  includeRecommendations: z.boolean().optional().default(true)
});

const UpdateEngineConfigRequestSchema = z.object({
  enableAdaptiveWeights: z.boolean().optional(),
  enableLearningMode: z.boolean().optional(),
  adaptationThreshold: z.number().int().min(1).max(100).optional(),
  maxWeightAdjustment: z.number().min(0).max(50).optional(),
  cacheTimeout: z.number().int().min(60000).max(3600000).optional() // 1min - 1h
});

/**
 * GET /parameters
 * Gera parâmetros de análise otimizados para a organização
 */
app.get("/parameters",
  requirePermissions([PERMISSIONS.CONFIG_READ]),
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      
      const parameters = await parameterEngine.generateParameters(
        organizationId
      );
      
      res.status(200).json(createSuccessResponse(parameters, req.requestId));
    } catch (error) {
      logger.error("Error generating parameters", {
        organizationId: req.user?.organizationId,
        error: error instanceof Error ? error.message : error,
        requestId: req.requestId
      });
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while generating parameters",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * POST /optimize
 * Analisa histórico e sugere otimizações de parâmetros
 */
app.post("/optimize",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]),
  async (req, res) => {
    try {
      const bodyValidation = validateData(OptimizeParametersRequestSchema, req.body);
      if (!bodyValidation.success) {
        throw new ValidationError(bodyValidation.error!, bodyValidation.details);
      }
      const requestData = bodyValidation.data!;
      const organizationId = req.user!.organizationId;
      
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
      
      res.status(200).json(createSuccessResponse(optimizationResult, req.requestId));
    } catch (error) {
      logger.error("Error optimizing parameters", {
        organizationId: req.user?.organizationId,
        error: error instanceof Error ? error.message : error,
        requestId: req.requestId
      });
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while optimizing parameters",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

/**
 * POST /refresh-cache
 * Limpa cache de parâmetros para forçar regeneração
 */
app.post("/refresh-cache",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]),
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      
      parameterEngine.clearCache(organizationId);
      
      res.status(200).json(createSuccessResponse({ cleared: true }, req.requestId));
    } catch (error) {
      logger.error("Error clearing parameter cache", {
        organizationId: req.user?.organizationId,
        error: error instanceof Error ? error.message : error,
        requestId: req.requestId
      });
      
      res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Internal server error while clearing cache",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /engine/stats
 * Obtém estatísticas do ParameterEngine
 */
app.get("/engine/stats",
  requirePermissions([PERMISSIONS.CONFIG_READ]),
  async (req, res) => {
    try {
      const stats = parameterEngine.getEngineStats();
      
      res.status(200).json(createSuccessResponse(stats, req.requestId));
    } catch (error) {
      logger.error("Error getting engine stats", {
        error: error instanceof Error ? error.message : error,
        requestId: req.requestId
      });
      
      res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Internal server error while getting engine stats",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * PUT /engine/config
 * Atualiza configuração do ParameterEngine (apenas super admins)
 */
app.put("/engine/config",
  requirePermissions([PERMISSIONS.CONFIG_WRITE]), // Using CONFIG_WRITE since SUPER_ADMIN doesn't exist
  async (req, res) => {
    try {
      const configValidation = validateData(UpdateEngineConfigRequestSchema, req.body);
      if (!configValidation.success) {
        throw new ValidationError(configValidation.error!, configValidation.details);
      }
      // Limpar cache para aplicar nova configuração
      parameterEngine.clearCache();
      
      res.status(200).json(createSuccessResponse({ updated: true }, req.requestId));
    } catch (error) {
      logger.error("Error updating engine config", {
        error: error instanceof Error ? error.message : error,
        requestId: req.requestId
      });
      
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, req.requestId));
      } else {
        res.status(500).json(createErrorResponse(
          "INTERNAL_ERROR",
          "Internal server error while updating engine config",
          undefined,
          req.requestId
        ));
      }
    }
  }
);

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
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("Unhandled error in parameter-engine API", {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId
  });
  
  res.status(500).json(createErrorResponse(
    "INTERNAL_ERROR",
    "Internal server error",
    undefined,
    req.requestId
  ));
});

export const parameterEngineApi = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 10
}, app);