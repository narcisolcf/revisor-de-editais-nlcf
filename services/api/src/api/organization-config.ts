/**
 * Organization Configuration API
 * Cloud Functions para gerenciar configurações organizacionais
 * Conecta configurações do Firestore com serviço de análise do Cloud Run
 */

import * as functions from 'firebase-functions/v1';
import { Request, Response } from "express";
import { z } from "zod";

import { firestore } from '../config/firebase';
import { OrganizationConfigService } from '../services/OrganizationConfigService';
import { createSuccessResponse, createErrorResponse, CommonSchemas, generateRequestId } from '../utils';
import { authenticateUser, requireOrganization, requirePermissions, PERMISSIONS } from '../middleware/auth';
import { logger } from 'firebase-functions';


// Schemas de validação
const OrganizationIdSchema = z.object({
  organizationId: CommonSchemas.uuid
});

const ConfigDataSchema = z.object({
  weights: z.object({
    structural: z.number().min(0).max(100).optional(),
    legal: z.number().min(0).max(100).optional(),
    clarity: z.number().min(0).max(100).optional(),
    abnt: z.number().min(0).max(100).optional()
  }).optional(),
  maxRetries: z.number().int().min(1).max(10).optional(),
  customRules: z.array(z.any()).optional(),
  preset: z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']).optional(),
  timeout: z.number().int().min(30).max(600).optional()
});

// Inicializar serviço
const analyzerConfig = {
  baseUrl: process.env.ANALYZER_SERVICE_URL || 'http://localhost:8080',
  apiKey: process.env.ANALYZER_API_KEY || '',
  timeout: 30000
};
const configService = new OrganizationConfigService(firestore, analyzerConfig);

/**
 * Handler principal para configurações organizacionais
 */
export const organizationConfig = functions
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    try {
      // Adicionar request ID
      req.requestId = generateRequestId();
      
      // Log da requisição
      logger.info(`Organization Config API - ${req.method} ${req.path}`, {
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
      res.status(404).json(createErrorResponse(
        "ROUTE_NOT_FOUND",
        "Endpoint not found",
        { method, path },
        req.requestId
      ));
      
    } catch (error) {
      logger.error('Organization Config API Error:', {
        error: String(error),
        requestId: req.requestId,
        method: req.method,
        path: req.path
      });
      
      res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Internal server error",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /organizations/:organizationId/config
 * Obter configurações de análise da organização
 */
async function getOrganizationConfig(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_READ])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse({ organizationId: req.params.organizationId });
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    const config = await configService.getAnalysisConfig(organizationId);
    
    res.json(createSuccessResponse(config, req.requestId));
    
  } catch (error) {
    logger.error('Get organization config error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "CONFIG_FETCH_ERROR",
      "Failed to fetch organization config",
      undefined,
      req.requestId
    ));
  }
}

/**
 * POST /organizations/:organizationId/config/sync
 * Sincronizar configurações com o serviço de análise
 */
async function syncConfig(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_WRITE])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    const result = await configService.syncWithAnalyzer(organizationId);
    
    res.json(createSuccessResponse(result, req.requestId));
    
  } catch (error) {
    logger.error('Sync config error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "CONFIG_SYNC_ERROR",
      "Failed to sync configuration",
      undefined,
      req.requestId
    ));
  }
}

/**
 * POST /organizations/:organizationId/config/validate
 * Validar configurações de análise
 */
async function validateConfig(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_READ])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    // Validar corpo da requisição
    const configValidation = ConfigDataSchema.safeParse(req.body);
    if (!configValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_CONFIG",
        "Invalid configuration data",
        configValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const configData = {
      organizationId: paramsValidation.data.organizationId,
      weights: {
        structural: configValidation.data.weights?.structural || 25,
        legal: configValidation.data.weights?.legal || 25,
        clarity: configValidation.data.weights?.clarity || 25,
        abnt: configValidation.data.weights?.abnt || 25
      },
      maxRetries: configValidation.data.maxRetries || 3,
      customRules: configValidation.data.customRules || [],
      preset: (configValidation.data.preset || 'STANDARD').toLowerCase() as 'custom' | 'rigorous' | 'standard' | 'technical' | 'flexible',
      timeout: configValidation.data.timeout || 300
    };

    const validation = await configService.validateConfig(configData);
    
    res.json(createSuccessResponse(validation, req.requestId));
    
  } catch (error) {
    logger.error('Validate config error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "CONFIG_VALIDATION_ERROR",
      "Failed to validate configuration",
      undefined,
      req.requestId
    ));
  }
}

/**
 * GET /organizations/:organizationId/presets
 * Obter presets de configuração disponíveis
 */
async function getPresets(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_READ])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    const presets = await configService.getPresets(organizationId);
    
    res.json(createSuccessResponse(presets, req.requestId));
    
  } catch (error) {
    logger.error('Get presets error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "PRESETS_FETCH_ERROR",
      "Failed to fetch presets",
      undefined,
      req.requestId
    ));
  }
}

/**
 * POST /organizations/:organizationId/presets
 * Criar novo preset de configuração
 */
async function createPreset(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_WRITE])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    const preset = await configService.createPreset(organizationId, req.body);
    
    res.status(201).json(createSuccessResponse(preset, req.requestId));
    
  } catch (error) {
    logger.error('Create preset error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "PRESET_CREATE_ERROR",
      "Failed to create preset",
      undefined,
      req.requestId
    ));
  }
}

/**
 * DELETE /organizations/:organizationId/cache
 * Limpar cache de configurações
 */
async function clearCache(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_WRITE])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    await configService.clearCache(organizationId);
    
    res.json(createSuccessResponse({ cleared: true }, req.requestId));
    
  } catch (error) {
    logger.error('Clear cache error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "CACHE_CLEAR_ERROR",
      "Failed to clear cache",
      undefined,
      req.requestId
    ));
  }
}

/**
 * GET /organizations/:organizationId/stats
 * Obter estatísticas de uso das configurações
 */
async function getUsageStats(req: Request, res: Response): Promise<void> {
  try {
    // Autenticação e autorização
    await authenticateUser(req, res, () => {});
    if (res.headersSent) return;
    
    await requireOrganization(req, res, () => {});
    if (res.headersSent) return;
    
    await requirePermissions([PERMISSIONS.CONFIG_READ])(req, res, () => {});
    if (res.headersSent) return;

    // Validar parâmetros
    const paramsValidation = OrganizationIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json(createErrorResponse(
        "INVALID_PARAMS",
        "Invalid organization ID",
        paramsValidation.error.errors as unknown as Record<string, unknown>,
        req.requestId
      ));
      return;
    }

    const { organizationId } = paramsValidation.data;
    const stats = await configService.getUsageStats(organizationId);
    
    res.json(createSuccessResponse(stats, req.requestId));
    
  } catch (error) {
    logger.error('Get usage stats error:', {
      error: String(error),
      organizationId: req.params.organizationId,
      requestId: req.requestId
    });
    
    res.status(500).json(createErrorResponse(
      "STATS_FETCH_ERROR",
      "Failed to fetch usage statistics",
      undefined,
      req.requestId
    ));
  }
}