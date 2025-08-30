/**
 * Analysis API - Endpoints para análise de documentos
 * LicitaReview Cloud Functions
 */

import * as express from 'express';
import { PERMISSIONS } from '../middleware/auth';
import { AnalysisOrchestrator } from '../services/AnalysisOrchestrator';
import { firestore, collections } from '../config/firebase';
import { z } from 'zod';
import { errorHandler } from '../middleware/error';
import { authenticateUser, requirePermissions, requireOrganization } from '../middleware/auth';
import { validateData, createSuccessResponse, createErrorResponse, generateRequestId } from '../utils';
import { UserContext } from '../types';
import { 
  initializeSecurity, 
  securityHeaders, 
  rateLimit, 
  auditAccess, 
  attackProtection 
} from '../middleware/security';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';
import { getFirestore } from 'firebase-admin/firestore';


// Authenticated Request type
interface AuthenticatedRequest extends express.Request {
  user: UserContext;
}

// Schemas de validação
const StartAnalysisRequestSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  analysisType: z.enum(['compliance', 'risk', 'completeness', 'all']).default('all'),
  options: z.object({
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    includeRecommendations: z.boolean().default(true),
    detailedReport: z.boolean().default(false)
  }).default({})
});

const AnalysisIdSchema = z.object({
  analysisId: z.string().min(1, 'Analysis ID is required')
});

const DocumentIdSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required')
});

// Inicializar o orquestrador de análises com configuração de autenticação
const orchestrator = new AnalysisOrchestrator(
  firestore,
  process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
  process.env.GOOGLE_CLOUD_PROJECT || 'default-project',
  {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    serviceAccountEmail: process.env.CLOUD_RUN_SERVICE_ACCOUNT_EMAIL,
    serviceAccountKeyFile: process.env.CLOUD_RUN_SERVICE_ACCOUNT_KEY_FILE,
    audience: process.env.CLOUD_RUN_IAP_AUDIENCE,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  }
);

// Helper functions - using imported utilities

// Path validation handled inline with validateData

const router = express.Router();

// Inicializar serviços de segurança
const db = getFirestore();
const loggingService = new LoggingService('analysis-api');
const metricsService = new MetricsService('analysis-api');

// Inicializar middleware de segurança
const securityManager = initializeSecurity(db, loggingService, metricsService, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100 // máximo 100 requests por IP por janela
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    excludePaths: []
  }
});

// Aplicar middlewares de segurança
router.use(securityHeaders);
router.use(rateLimit);
router.use(auditAccess);
router.use(attackProtection);

/**
 * POST /analysis/start
 * Inicia uma nova análise com parâmetros aprimorados
 */
router.post('/start',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_WRITE]),
  async (req: express.Request, res: express.Response) => {
    try {
      const bodyValidation = validateData(StartAnalysisRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.requestId || generateRequestId()
        ));
      }
      const { documentId, options } = bodyValidation.data!;
      const organizationId = (req as AuthenticatedRequest).user?.organizationId;
      const userId = (req as AuthenticatedRequest).user?.uid;

      if (!organizationId) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'ID da organização é obrigatório',
          {},
          req.requestId || generateRequestId()
        ));
      }

      // Verificar se o documento existe e pertence à organização
      const docSnapshot = await collections.documents.doc(documentId).get();
      if (!docSnapshot.exists) {
        return res.status(404).json(createErrorResponse(
          'NOT_FOUND',
          'Documento não encontrado'
        ));
      }

      const document = docSnapshot.data();
      if (document?.organizationId !== organizationId) {
        return res.status(403).json(createErrorResponse(
          'FORBIDDEN',
          'Acesso negado ao documento',
          { documentId },
          req.requestId || generateRequestId()
        ));
      }

      // Obter parâmetros de análise aprimorados
      const enhancedParamsResult = await orchestrator.getEnhancedAnalysisParameters(
        organizationId
      );
      
      const enhancedParams = enhancedParamsResult.success ? enhancedParamsResult.parameters : {};

      // Iniciar análise via AnalysisOrchestrator com parâmetros aprimorados
      const analysisId = await orchestrator.startAnalysis({
        documentId,
        organizationId,
        userId,
        options: {
          includeAI: true,
          generateRecommendations: options?.includeRecommendations ?? true,
          detailedMetrics: options?.detailedReport ?? false,
          customRules: [],
          ...enhancedParams
        },
        priority: options?.priority || enhancedParams.priority || 'normal'
      });

      res.status(202).json(createSuccessResponse(
        {
          analysisId,
          status: 'queued',
          message: 'Analysis started successfully',
          enhancedParameters: enhancedParams,
          cloudRunAvailable: await orchestrator.isCloudRunAvailable()
        },
        req.requestId || generateRequestId()
      ));
      return;
    } catch (error) {
       return errorHandler(error as Error, req, res);
     }
  }
);

/**
 * GET /analysis/:analysisId/progress
 * Obtém o progresso de uma análise
 */
router.get('/:analysisId/progress',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_READ]),
  async (req: express.Request, res: express.Response) => {
    const pathValidation = validateData(AnalysisIdSchema, req.params);
    if (!pathValidation.success) {
      return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Parâmetros de caminho inválidos',
          pathValidation.details as Record<string, unknown>,
          req.requestId || generateRequestId()
        ));
    }
    try {
      const { analysisId } = req.params;

      const progress = await orchestrator.getAnalysisProgress(analysisId);

      if (!progress) {
        return res.status(404).json(createErrorResponse(
          'ANALYSIS_NOT_FOUND',
          'Analysis not found',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      res.json(createSuccessResponse(
        progress,
        req.requestId || generateRequestId()
      ));
      return;
    } catch (error) {
       return errorHandler(error as Error, req, res);
     }
  }
);

/**
 * DELETE /analysis/:analysisId
 * Cancela uma análise em andamento
 */
router.delete('/:analysisId',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_WRITE]),
  async (req: express.Request, res: express.Response) => {
    const pathValidation = validateData(AnalysisIdSchema, req.params);
    if (!pathValidation.success) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Parâmetros de caminho inválidos',
        pathValidation.details as Record<string, unknown>,
        req.requestId || generateRequestId()
      ));
    }
    try {
      const { analysisId } = req.params;
      const organizationId = (req as AuthenticatedRequest).user?.organizationId;
      const userId = (req as AuthenticatedRequest).user?.uid;

      if (!organizationId) {
        return res.status(400).json(createErrorResponse(
          'ORGANIZATION_REQUIRED',
          'Organization ID is required',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      // Verificar se a análise existe
      const activeAnalyses = orchestrator.getActiveAnalyses();
      const analysis = activeAnalyses.find(a => a.analysisId === analysisId);

      if (!analysis) {
        return res.status(404).json(createErrorResponse(
          'ANALYSIS_NOT_FOUND',
          'Analysis not found or access denied',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      await orchestrator.cancelAnalysis(analysisId, userId);

      res.json(createSuccessResponse(
        { message: 'Analysis cancelled successfully' },
        req.requestId || generateRequestId()
      ));
      return;
    } catch (error) {
       return errorHandler(error as Error, req, res);
     }
  }
);

/**
 * GET /analysis/list
 * Lista análises da organização
 */
router.get('/list',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_READ]),
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      // Por enquanto, retornamos as análises ativas
      // TODO: Implementar filtro por organização quando a propriedade estiver disponível
      const allAnalyses = orchestrator.getActiveAnalyses();
      const filteredAnalyses = allAnalyses;

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAnalyses = filteredAnalyses.slice(startIndex, endIndex);

      const analyses = {
        data: paginatedAnalyses,
        total: filteredAnalyses.length,
        page,
        limit,
        totalPages: Math.ceil(filteredAnalyses.length / limit)
      };

      res.json(createSuccessResponse(
        analyses,
        req.requestId || generateRequestId()
      ));
      return;
    } catch (error) {
       return errorHandler(error as Error, req, res);
     }
  }
);

/**
 * GET /analysis/result/:documentId
 * Obtém o resultado da análise de um documento
 */
router.get('/result/:documentId',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_READ]),
  async (req: express.Request, res: express.Response) => {
    const pathValidation = validateData(DocumentIdSchema, req.params);
    if (!pathValidation.success) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Parâmetros de caminho inválidos',
        pathValidation.details as Record<string, unknown>,
        req.requestId || generateRequestId()
      ));
    }
    try {
      const { documentId } = req.params;
      const organizationId = (req as AuthenticatedRequest).user?.organizationId;

      // Verificar se o documento pertence à organização
      const docSnapshot = await collections.documents.doc(documentId).get();
      if (!docSnapshot.exists) {
        return res.status(404).json(createErrorResponse(
          'DOCUMENT_NOT_FOUND',
          'Document not found',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      const document = docSnapshot.data();
      if (document?.organizationId !== organizationId) {
        return res.status(403).json(createErrorResponse(
          'ACCESS_DENIED',
          'Access denied to document',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      // Buscar resultado da análise no Firestore
      const resultQuery = await firestore
        .collection('analysisResults')
        .where('documentId', '==', documentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (resultQuery.empty) {
        return res.status(404).json(createErrorResponse(
          'RESULT_NOT_FOUND',
          'Analysis result not found',
          undefined,
          req.requestId || generateRequestId()
        ));
      }

      const result = resultQuery.docs[0].data();

      res.json(createSuccessResponse(
        result,
        req.requestId || generateRequestId()
      ));
      return;
    } catch (error) {
       return errorHandler(error as Error, req, res);
     }
  }
);

export default router;