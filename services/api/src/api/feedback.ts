/**
 * Feedback API - Sistema de Feedback e Validação de Negócio
 * LicitaReview Cloud Functions
 * 
 * Endpoints para coleta de feedback, tracking de parâmetros,
 * métricas de satisfação e relatórios de validação de negócio.
 */

import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import cors from 'cors';
import { BusinessValidationService } from '../services/BusinessValidationService';
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
import {
  FeedbackType,
  FeedbackStatus,
  SatisfactionRating,
  CreateFeedbackRequest,
  GetFeedbackQuery
} from '../types/feedback.types';
import { 
  authenticateUser, 
  requireOrganization, 
  requirePermissions,
  PERMISSIONS 
} from '../middleware/auth';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import {
  CreateFeedbackRequestSchema,
  GetFeedbackQuerySchema,
  TrackParameterUsageSchema,
  AnalyzeParameterValueSchema,
  BusinessReportQuerySchema,
  FeedbackConfigSchema
} from '../types/feedback.types';
import { createSuccessResponse, createErrorResponse, generateRequestId } from '../utils';
import { errorHandler } from '../middleware/error';
import { z } from 'zod';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Inicializar serviços de segurança
const db = getFirestore();
const loggingService = new LoggingService('feedback-api');
const metricsService = new MetricsService('feedback-api');

// Inicializar middleware de segurança
const securityManager = initializeSecurity(db, loggingService, metricsService, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 50 // máximo 50 requests por IP por janela
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    excludePaths: []
  }
});

// Aplicar middlewares de segurança
app.use(securityHeaders);
app.use(rateLimit);
app.use(auditAccess);
app.use(attackProtection);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Authentication middleware
app.use(authenticateUser);
app.use(requireOrganization);

const businessValidationService = new BusinessValidationService();

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const UpdateFeedbackStatusSchema = z.object({
  status: z.nativeEnum(FeedbackStatus),
  response: z.string().optional()
});

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================================

const validateCreateFeedback = validateRequest({
  body: CreateFeedbackRequestSchema
});

const validateGetFeedback = validateRequest({
  query: GetFeedbackQuerySchema
});

const validateUpdateFeedbackStatus = validateRequest({
  body: UpdateFeedbackStatusSchema
});

const validateTrackParameterUsage = validateRequest({
  body: TrackParameterUsageSchema
});

// ============================================================================
// ROUTES PARA FEEDBACK
// ============================================================================

/**
 * POST /feedback
 * Cria novo feedback do usuário
 */
app.post('/', requirePermissions([PERMISSIONS.ANALYSIS_READ]), validateCreateFeedback, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.uid;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        error: 'Usuário não autenticado ou organização não identificada'
      });
    }

    const feedbackData: CreateFeedbackRequest = req.body;
    
    const result = await businessValidationService.createFeedback(
      userId,
      organizationId,
      feedbackData
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Feedback criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar feedback:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /feedback
 * Lista feedback com filtros
 */
app.get('/', requirePermissions([PERMISSIONS.ANALYSIS_READ]), validateGetFeedback, async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('support');

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    const query: GetFeedbackQuery = {
      organizationId,
      ...req.query,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    // Se não for admin, mostrar apenas feedbacks do próprio usuário
    if (!isAdmin) {
      query.userId = req.user?.uid;
    }

    const feedbacks = await businessValidationService.getFeedbacks(query);

    res.json({
      success: true,
      data: feedbacks,
      total: feedbacks.length
    });
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * PUT /feedback/:id/status
 * Atualiza status do feedback
 */
app.put('/:id/status', requirePermissions([PERMISSIONS.ANALYSIS_WRITE]), validateUpdateFeedbackStatus, async (req: express.Request, res: express.Response) => {
  try {
    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('support');
    
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem atualizar status de feedback'
      });
    }

    const feedbackId = req.params.id;
    const { status, response } = req.body;
    const reviewedBy = req.user?.uid;

    await businessValidationService.updateFeedbackStatus(
      feedbackId,
      status,
      reviewedBy!,
      response
    );

    res.json({
      success: true,
      message: 'Status do feedback atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do feedback:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ============================================================================
// ROUTES PARA TRACKING DE PARÂMETROS
// ============================================================================

/**
 * POST /feedback/track-parameter
 * Registra uso de parâmetro personalizado
 */
app.post('/track-parameter', requirePermissions([PERMISSIONS.ANALYSIS_WRITE]), validateTrackParameterUsage, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.uid;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        error: 'Usuário não autenticado ou organização não identificada'
      });
    }

    const { analysisId, parameterId, parameterName, parameterType } = req.body;

    await businessValidationService.trackParameterUsage(
      userId,
      organizationId,
      analysisId,
      parameterId,
      parameterName,
      parameterType
    );

    res.json({
      success: true,
      message: 'Uso de parâmetro registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar uso de parâmetro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /feedback/parameter-analysis
 * Analisa valor e efetividade dos parâmetros personalizados
 */
app.get('/parameter-analysis', requirePermissions([PERMISSIONS.ANALYSIS_READ]), async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const isAdmin = req.user?.roles?.includes('admin');

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem acessar análise de parâmetros'
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const analysis = await businessValidationService.analyzeParameterValue(organizationId, days);

    res.json({
      success: true,
      data: analysis,
      period: `${days} dias`
    });
  } catch (error) {
    console.error('Erro ao analisar parâmetros:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ============================================================================
// ROUTES PARA RELATÓRIOS E MÉTRICAS
// ============================================================================

/**
 * GET /feedback/business-validation-report
 * Gera relatório de validação de hipóteses de negócio
 */
app.get('/business-validation-report', requirePermissions([PERMISSIONS.ANALYSIS_READ]), async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const isAdmin = req.user?.roles?.includes('admin');

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem acessar relatórios de validação'
      });
    }

    // Definir período (padrão: últimos 30 dias)
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    const report = await businessValidationService.generateBusinessValidationReport(
      organizationId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de validação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /feedback/business-metrics
 * Obtém métricas consolidadas de negócio
 */
app.get('/business-metrics', requirePermissions([PERMISSIONS.ANALYSIS_READ]), async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const isAdmin = req.user?.roles?.includes('admin');

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem acessar métricas de negócio'
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const metrics = await businessValidationService.getBusinessMetrics(organizationId, days);

    res.json({
      success: true,
      data: metrics,
      period: `${days} dias`
    });
  } catch (error) {
    console.error('Erro ao obter métricas de negócio:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ============================================================================
// ROUTES PARA CONFIGURAÇÃO
// ============================================================================

/**
 * GET /feedback/config
 * Obtém configuração de feedback para a organização
 */
app.get('/config', requirePermissions([PERMISSIONS.ANALYSIS_READ]), async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    // Configuração padrão (pode ser personalizada por organização)
    const defaultConfig = {
      organizationId,
      enabled: true,
      triggers: {
        afterAnalysis: true,
        onParameterCreation: true,
        onError: true,
        periodic: false
      },
      frequency: {
        maxPerDay: 3,
        cooldownHours: 8
      },
      customQuestions: [
        {
          id: 'analysis_accuracy',
          question: 'Quão precisa foi a análise realizada?',
          type: 'rating',
          required: true
        },
        {
          id: 'parameter_usefulness',
          question: 'Os parâmetros personalizados foram úteis?',
          type: 'rating',
          required: false
        },
        {
          id: 'improvement_suggestions',
          question: 'Que melhorias você sugere?',
          type: 'text',
          required: false
        }
      ]
    };

    res.json({
      success: true,
      data: defaultConfig
    });
  } catch (error) {
    console.error('Erro ao obter configuração de feedback:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ============================================================================
// ROUTES PARA ESTATÍSTICAS RÁPIDAS
// ============================================================================

/**
 * GET /feedback/stats
 * Obtém estatísticas rápidas de feedback
 */
app.get('/stats', requirePermissions([PERMISSIONS.ANALYSIS_READ]), async (req: express.Request, res: express.Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.uid;
    const isAdmin = req.user?.roles?.includes('admin');

    if (!organizationId) {
      return res.status(401).json({
        error: 'Organização não identificada'
      });
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Buscar feedbacks do período
    const query: GetFeedbackQuery = {
      organizationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    // Se não for admin, mostrar apenas estatísticas do próprio usuário
    if (!isAdmin) {
      query.userId = userId;
    }

    const feedbacks = await businessValidationService.getFeedbacks(query);

    // Calcular estatísticas básicas
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0;

    const ratingDistribution = {
      1: feedbacks.filter(f => f.rating === 1).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      5: feedbacks.filter(f => f.rating === 5).length
    };

    const typeDistribution = Object.values(FeedbackType).reduce((acc, type) => {
      acc[type] = feedbacks.filter(f => f.type === type).length;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.values(FeedbackStatus).reduce((acc, status) => {
      acc[status] = feedbacks.filter(f => f.status === status).length;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        period: '30 dias',
        totalFeedbacks,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        typeDistribution,
        statusDistribution,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de feedback:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

export const feedbackApi = onRequest({
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 300,
  maxInstances: 10
}, app);