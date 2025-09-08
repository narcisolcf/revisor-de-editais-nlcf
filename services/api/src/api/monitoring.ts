/**
 * API de Monitoramento
 * 
 * Endpoints para métricas, alertas, verificações de saúde
 * e configurações de monitoramento.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { https } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  initializeSecurity, 
  securityHeaders, 
  rateLimit, 
  auditAccessMiddleware, 
  attackProtection 
} from '../middleware/security';
import { 
  authenticateUser, 
  requireOrganization, 
  requirePermissions 
} from '../middleware/auth';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../services/MetricsService';
import { AlertService } from '../services/AlertService';
import { HealthCheckService } from '../services/HealthCheckService';
import { 
  CreateAlertRuleRequest,
  GetAlertsQuery,
  GetMetricsQuery,
  MetricType,
  AlertSeverity,
  AlertStatus,
  HealthStatus
} from '../types/monitoring.types';
import { z } from 'zod';

// Tipos estendidos do Express são carregados automaticamente

// Inicializar serviços
const db = getFirestore();
const logger = new LoggingService('monitoring-api');
const loggingService = logger; // Alias para compatibilidade
const metricsService = new MetricsService('monitoring-api');
const alertService = new AlertService(db, logger, metricsService);
const healthCheckService = new HealthCheckService(db, logger, metricsService);

// Iniciar monitoramento de saúde
healthCheckService.startMonitoring();

const app = express();

// Middleware básico
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Inicializar middleware de segurança
initializeSecurity(db, loggingService, metricsService, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 200 // máximo 200 requests por IP por janela (mais permissivo para monitoramento)
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    excludePaths: ['/health', '/metrics']
  }
});

// Aplicar middlewares de segurança
app.use(securityHeaders);
app.use(rateLimit);
app.use(auditAccessMiddleware);
app.use(attackProtection);

// Middleware de request ID
app.use((req: Request, res: Response, next: express.NextFunction) => {
  req.requestId = uuidv4();
  next();
});

// Middleware de autenticação global
app.use(authenticateUser);
app.use(requireOrganization);

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const createAlertRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  metric: z.string().min(1),
  condition: z.enum(['>', '<', '>=', '<=', '==', '!=']),
  threshold: z.number(),
  severity: z.nativeEnum(AlertSeverity),
  cooldownMinutes: z.number().min(1).max(1440).optional(),
  notificationChannels: z.array(z.string()).optional(),
  tags: z.record(z.string()).optional()
});

const getMetricsQuerySchema = z.object({
  metric: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tags: z.record(z.string()).optional(),
  aggregation: z.enum(['avg', 'sum', 'min', 'max', 'count']).optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '1d']).optional(),
  limit: z.number().min(1).max(1000).optional()
});

const getAlertsQuerySchema = z.object({
  status: z.nativeEnum(AlertStatus).optional(),
  severity: z.nativeEnum(AlertSeverity).optional(),
  ruleId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

// ============================================================================
// ROTAS DE MÉTRICAS
// ============================================================================

/**
 * GET /metrics
 * Busca métricas com filtros
 */
app.get('/metrics', 
  requirePermissions(['ANALYSIS_READ']),
  validateQuery(getMetricsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query: GetMetricsQuery = {
        name: req.query.metric as string,
        type: req.query.type as MetricType,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        tags: req.query.tags ? JSON.parse(req.query.tags as string) : undefined,
        aggregation: req.query.aggregation as 'sum' | 'avg' | 'min' | 'max' | 'count',
        interval: req.query.interval as string
      };

      const metrics = await metricsService.getMetrics(query.name);

      await logger.info('Métricas consultadas', {
        function: 'getMetrics',
        user: req.user || undefined,
        metadata: { query, resultCount: metrics.length || 0 }
      });

      res.json({
        success: true,
        data: metrics,
        total: metrics.length || 0
      });
    } catch (error) {
      await logger.error('Erro ao buscar métricas', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          query: req.query,
          function: 'getMetrics'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * GET /metrics/summary
 * Resumo de métricas por período
 */
app.get('/metrics/summary',
  requirePermissions(['ANALYSIS_READ']),
  async (req: Request, res: Response) => {
    try {
      const metric = req.query.metric as string;
      const hours = parseInt(req.query.hours as string) || 24;
      
      if (!metric) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro metric é obrigatório'
        });
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hours * 3600000));
      
      // Obter métricas específicas para o período
      const metricEntries = metricsService.getMetrics(metric);
      const filteredMetrics = metricEntries.filter(entry => 
        entry.timestamp >= startDate && entry.timestamp <= endDate
      );
      
      const summary = {
        metric,
        period: { startDate, endDate, hours },
        count: filteredMetrics.length,
        total: filteredMetrics.reduce((sum, entry) => sum + entry.value, 0),
        average: filteredMetrics.length > 0 ? 
          filteredMetrics.reduce((sum, entry) => sum + entry.value, 0) / filteredMetrics.length : 0,
        latest: filteredMetrics[filteredMetrics.length - 1]?.value || 0
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      await logger.error('Erro ao buscar alertas', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getAlerts'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /metrics/system
 * Métricas de sistema (CPU, memória, etc.)
 */
app.get('/metrics/system',
  requirePermissions(['ANALYSIS_READ']),
  async (req: Request, res: Response) => {
    try {
      // Coletar métricas de sistema disponíveis
      const allMetrics = metricsService.getMetrics();
      const systemMetrics = {
        timestamp: new Date(),
        metrics: allMetrics.filter(m => m.name.startsWith('system_')),
        summary: metricsService.getMetricsSummary()
      };
      
      res.json({
        success: true,
        data: systemMetrics
      });
    } catch (error) {
      await logger.error('Erro ao buscar métricas de sistema', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getSystemMetrics'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /metrics/application
 * Métricas de aplicação
 */
app.get('/metrics/application',
  requirePermissions(['ANALYSIS_READ']),
  async (req: Request, res: Response) => {
    try {
      // Coletar métricas de aplicação disponíveis
      const allMetrics = metricsService.getMetrics();
      const appMetrics = {
        timestamp: new Date(),
        metrics: allMetrics.filter(m => !m.name.startsWith('system_')),
        summary: metricsService.getMetricsSummary()
      };
      
      res.json({
        success: true,
        data: appMetrics
      });
    } catch (error) {
      await logger.error('Erro ao buscar métricas de aplicação', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getApplicationMetrics'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// ============================================================================
// ROTAS DE ALERTAS
// ============================================================================

/**
 * POST /alerts/rules
 * Cria nova regra de alerta
 */
app.post('/alerts/rules',
  requirePermissions(['CONFIG_WRITE']),
  validateRequest({ body: createAlertRuleSchema }),
  async (req: Request, res: Response) => {
    try {
      const alertRule = await alertService.createAlertRule(req.body);

      await logger.info('Regra de alerta criada', {
        function: 'createAlertRule',
        user: req.user,
        metadata: { alertRule }
      });

      res.status(201).json({
        success: true,
        data: alertRule
      });
    } catch (error) {
      await logger.error('Erro ao criar regra de alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user,
          request: req.body,
          function: 'createAlertRule'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /alerts/rules
 * Lista regras de alerta
 */
app.get('/alerts/rules',
  requirePermissions(['CONFIG_READ']),
  async (req: Request, res: Response) => {
    try {
      const enabled = req.query.enabled === 'true' ? true : 
                     req.query.enabled === 'false' ? false : undefined;
      
      const rules = await alertService.getAlertRules(enabled);

      res.json({
        success: true,
        data: rules,
        total: rules.length
      });
    } catch (error) {
      await logger.error('Erro ao buscar regras de alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getAlertRules'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * PUT /alerts/rules/:ruleId
 * Atualiza regra de alerta
 */
app.put('/alerts/rules/:ruleId',
  requirePermissions(['CONFIG_WRITE']),
  validateRequest({ body: createAlertRuleSchema.partial() }),
  async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const updatedRule = await alertService.updateAlertRule(ruleId, req.body);

      await logger.info('Regra de alerta atualizada', {
        function: 'updateAlertRule',
        user: req.user,
        metadata: { ruleId, updates: req.body }
      });

      res.json({
        success: true,
        data: updatedRule
      });
    } catch (error) {
      await logger.error('Erro ao atualizar regra de alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user,
          ruleId: req.params.ruleId,
          updates: req.body,
          function: 'updateAlertRule'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * DELETE /alerts/rules/:ruleId
 * Remove regra de alerta
 */
app.delete('/alerts/rules/:ruleId',
  requirePermissions(['CONFIG_WRITE']),
  async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      await alertService.deleteAlertRule(ruleId);

      await logger.info('Regra de alerta removida', {
        function: 'deleteAlertRule',
        user: req.user,
        metadata: { ruleId }
      });

      res.json({
        success: true,
        message: 'Regra de alerta removida com sucesso'
      });
    } catch (error) {
      await logger.error('Erro ao remover regra de alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user,
          ruleId: req.params.ruleId,
          function: 'deleteAlertRule'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /alerts
 * Lista alertas com filtros
 */
app.get('/alerts',
  requirePermissions(['ANALYSIS_READ']),
  validateQuery(getAlertsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query: GetAlertsQuery = {
        status: req.query.status as AlertStatus,
        severity: req.query.severity as AlertSeverity,
        ruleId: req.query.ruleId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await alertService.getAlerts(query);

      res.json({
        success: true,
        data: result.alerts,
        total: result.total,
        hasMore: result.hasMore
      });
    } catch (error) {
      await logger.error('Erro ao buscar alertas', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user,
          query: req.query,
          function: 'getAlerts'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * POST /alerts/:alertId/acknowledge
 * Reconhece um alerta
 */
app.post('/alerts/:alertId/acknowledge',
  requirePermissions(['ANALYSIS_WRITE']),
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      await alertService.acknowledgeAlert(alertId, req.user!.uid);

      await logger.info('Alerta reconhecido', {
        function: 'acknowledgeAlert',
        user: req.user || undefined,
        metadata: { alertId }
      });

      res.json({
        success: true,
        message: 'Alerta reconhecido com sucesso'
      });
    } catch (error) {
      await logger.error('Erro ao reconhecer alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          alertId: req.params.alertId,
          function: 'acknowledgeAlert'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * POST /alerts/:alertId/resolve
 * Resolve um alerta
 */
app.post('/alerts/:alertId/resolve',
  requirePermissions(['ANALYSIS_WRITE']),
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      await alertService.resolveAlert(alertId);

      await logger.info('Alerta resolvido', {
        function: 'resolveAlert',
        user: req.user || undefined,
        metadata: { alertId }
      });

      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso'
      });
    } catch (error) {
      await logger.error('Erro ao resolver alerta', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          alertId: req.params.alertId,
          function: 'resolveAlert'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /alerts/stats
 * Estatísticas de alertas
 */
app.get('/alerts/stats',
  requirePermissions(['ANALYSIS_READ']),
  async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const stats = await alertService.getAlertStats(hours);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      await logger.error('Erro ao buscar estatísticas de alertas', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getAlertStats'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// ============================================================================
// ROTAS DE SAÚDE
// ============================================================================

/**
 * GET /health
 * Status atual de saúde do sistema
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.getCurrentHealth();
    
    // Definir status HTTP baseado na saúde
    const statusCode = health.status === HealthStatus.HEALTHY ? 200 :
                      health.status === HealthStatus.DEGRADED ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    await logger.error('Erro ao verificar saúde do sistema', 
      error instanceof Error ? error : new Error(String(error)),
      {
        function: 'getCurrentHealth'
      }
    );

    res.status(503).json({
      success: false,
      error: 'Erro ao verificar saúde do sistema',
      data: {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: 0,
        components: [],
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    });
  }
});

/**
 * GET /health/history
 * Histórico de verificações de saúde
 */
app.get('/health/history',
  requirePermissions(['ANALYSIS_READ']),
  async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const history = await healthCheckService.getHealthHistory(hours, limit);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      await logger.error('Erro ao buscar histórico de saúde', 
        error instanceof Error ? error : new Error(String(error)),
        {
          user: req.user || undefined,
          function: 'getHealthHistory'
        }
      );

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// ============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================================================

app.use((error: any, req: Request, res: Response, next: express.NextFunction) => {
  logger.error('Erro não tratado na API de monitoramento', 
    error instanceof Error ? error : new Error(String(error)),
    {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
      function: 'errorHandler'
    }
  );

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    requestId: req.requestId
  });
});

// Exportar como Cloud Function
export const monitoringApi = https.onRequest({
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10
}, app);