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

// Inicializar o orquestrador de análises
const orchestrator = new AnalysisOrchestrator(
  firestore,
  process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
  { projectId: process.env.GOOGLE_CLOUD_PROJECT }
);

// Helper functions
function createSuccessResponse(data: any, requestId?: string) {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString()
  };
}

function createErrorResponse(message: string, details: any = null, requestId?: string) {
  return {
    success: false,
    error: {
      message,
      details
    },
    requestId,
    timestamp: new Date().toISOString()
  };
}

function validateRequestBody(schema: z.ZodSchema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(createErrorResponse(
          'Invalid request body',
          error.errors,
          req.headers['x-request-id'] as string
        ));
      } else {
        next(error);
      }
    }
  };
}

function validatePathParams(schema: z.ZodSchema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(createErrorResponse(
          'Invalid path parameters',
          error.errors,
          req.headers['x-request-id'] as string
        ));
      } else {
        next(error);
      }
    }
  };
}

const router = express.Router();

/**
 * POST /analysis/start
 * Inicia uma nova análise de documento
 */
router.post('/start',
  authenticateUser,
  requireOrganization,
  requirePermissions([PERMISSIONS.ANALYSIS_WRITE]),
  validateRequestBody(StartAnalysisRequestSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { documentId, analysisType, options } = req.body;
      const organizationId = (req as any).user?.organizationId;
      const userId = (req as any).user?.uid;

      if (!organizationId) {
        return res.status(400).json(createErrorResponse(
          'Organization ID is required',
          null,
          req.headers['x-request-id'] as string
        ));
      }

      // Verificar se o documento existe e pertence à organização
      const docSnapshot = await collections.documents.doc(documentId).get();
      if (!docSnapshot.exists) {
        return res.status(404).json(createErrorResponse(
          'Document not found',
          { documentId },
          req.headers['x-request-id'] as string
        ));
      }

      const document = docSnapshot.data();
      if (document?.organizationId !== organizationId) {
        return res.status(403).json(createErrorResponse(
          'Access denied to document',
          { documentId },
          req.headers['x-request-id'] as string
        ));
      }

      // Iniciar análise via AnalysisOrchestrator
      const analysisId = await orchestrator.startAnalysis({
        documentId,
        organizationId,
        userId,
        options: {
          analysisType,
          ...options
        },
        priority: options.priority || 'normal'
      });

      res.status(202).json(createSuccessResponse(
        {
          analysisId,
          status: 'queued',
          message: 'Analysis started successfully'
        },
        req.headers['x-request-id'] as string
      ));
    } catch (error) {
       errorHandler(error as Error, req, res, () => {});
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
  validatePathParams(AnalysisIdSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { analysisId } = req.params;
      const organizationId = (req as any).user?.organizationId;

      const progress = await orchestrator.getAnalysisProgress(analysisId);

      if (!progress) {
        return res.status(404).json(createErrorResponse(
          'Analysis not found',
          { analysisId },
          req.headers['x-request-id'] as string
        ));
      }

      res.json(createSuccessResponse(
        progress,
        req.headers['x-request-id'] as string
      ));
    } catch (error) {
       errorHandler(error as Error, req, res, () => {});
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
  validatePathParams(AnalysisIdSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { analysisId } = req.params;
      const organizationId = (req as any).user?.organizationId;
      const userId = (req as any).user?.uid;

      if (!organizationId) {
        return res.status(400).json(createErrorResponse(
          'Organization ID is required',
          null,
          req.headers['x-request-id'] as string
        ));
      }

      // Verificar se a análise existe
      const activeAnalyses = orchestrator.getActiveAnalyses();
      const analysis = activeAnalyses.find(a => a.analysisId === analysisId);

      if (!analysis) {
        return res.status(404).json(createErrorResponse(
          'Analysis not found or access denied',
          { analysisId },
          req.headers['x-request-id'] as string
        ));
      }

      await orchestrator.cancelAnalysis(analysisId, userId);

      res.json(createSuccessResponse(
        { message: 'Analysis cancelled successfully' },
        req.headers['x-request-id'] as string
      ));
    } catch (error) {
       errorHandler(error as Error, req, res, () => {});
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
      const organizationId = (req as any).user?.organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const status = req.query.status as string;

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
        req.headers['x-request-id'] as string
      ));
    } catch (error) {
       errorHandler(error as Error, req, res, () => {});
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
  validatePathParams(DocumentIdSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { documentId } = req.params;
      const organizationId = (req as any).user?.organizationId;

      // Verificar se o documento pertence à organização
      const docSnapshot = await collections.documents.doc(documentId).get();
      if (!docSnapshot.exists) {
        return res.status(404).json(createErrorResponse(
          'Document not found',
          { documentId },
          req.headers['x-request-id'] as string
        ));
      }

      const document = docSnapshot.data();
      if (document?.organizationId !== organizationId) {
        return res.status(403).json(createErrorResponse(
          'Access denied to document',
          { documentId },
          req.headers['x-request-id'] as string
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
          'Analysis result not found',
          { documentId },
          req.headers['x-request-id'] as string
        ));
      }

      const result = resultQuery.docs[0].data();

      res.json(createSuccessResponse(
        result,
        req.headers['x-request-id'] as string
      ));
    } catch (error) {
       errorHandler(error as Error, req, res, () => {});
     }
  }
);

export default router;