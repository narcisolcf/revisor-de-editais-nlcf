/**
 * Callbacks API - Endpoints para receber callbacks do Cloud Run
 * LicitaReview Cloud Functions
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { CallbackHandler } from '../services/CallbackHandler';
import type { CallbackSecurityConfig } from '../services/CallbackHandler';
import { AnalysisOrchestrator } from '../services/AnalysisOrchestrator';
import { NotificationService } from '../services/NotificationService';
import { MetricsService } from '../services/MetricsService';
import { LoggingService } from '../services/LoggingService';
import { AuditService } from '../services/AuditService';
import { CloudRunClient } from '../services/CloudRunClient';
import { ParameterEngine } from '../services/ParameterEngine';
import { AuthenticationService } from '../services/AuthenticationService';
import { createAuthMiddleware, requireAuth } from '../middleware/authMiddleware';
import { createWebhookValidation, WebhookRequest } from '../middleware/webhookValidationMiddleware';
import { initializeSecurity, securityHeaders, rateLimit } from '../middleware/security';
import { errorHandler } from '../middleware/error';
import { createErrorResponse, createSuccessResponse } from '../utils';
import { getAuthConfig } from '../config/auth';
import { config } from '../config';

// Configuração de autenticação e segurança
const authConfig = getAuthConfig();

// Configuração de segurança para callbacks (mantida para compatibilidade)
const callbackSecurityConfig: CallbackSecurityConfig = {
  secretKey: authConfig.webhook.secretKey,
  allowedIPs: process.env.CALLBACK_ALLOWED_IPS ? 
    process.env.CALLBACK_ALLOWED_IPS.split(',').map(ip => ip.trim()) : 
    undefined,
  signatureHeader: authConfig.webhook.signatureHeader,
  timestampTolerance: authConfig.webhook.timestampTolerance
};

// Configuração de autenticação
const authService = new AuthenticationService(
  authConfig.googleCloud,
  authConfig.jwt
);

// Inicializar serviços
const db = admin.firestore();
const logger = new LoggingService();
const metricsService = new MetricsService('callbacks-api');
const cloudRunClient = new CloudRunClient(
  process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
  {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    serviceAccountEmail: process.env.CLOUD_RUN_SERVICE_ACCOUNT,
    audience: process.env.CLOUD_RUN_SERVICE_URL
  }
);

const parameterEngine = new ParameterEngine(db);
const orchestrator = new AnalysisOrchestrator(
  db,
  process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
  process.env.GOOGLE_CLOUD_PROJECT || 'default-project'
);
const notificationService = new NotificationService(process.env.GOOGLE_CLOUD_PROJECT || 'default-project');
const auditService = new AuditService(logger);

// Inicializar CallbackHandler
const callbackHandler = new CallbackHandler(
  orchestrator,
  notificationService,
  metricsService,
  auditService,
  callbackSecurityConfig
);

// Configurar middleware de autenticação
const authMiddleware = createAuthMiddleware(authService, {
  required: true,
  allowedServices: ['cloud-run', 'google-cloud'],
  skipPaths: ['/callback/health', '/callback/metrics']
});

// Configurar middleware de validação de webhook
const webhookValidation = createWebhookValidation({
  config: authConfig.webhook,
  skipValidation: process.env.NODE_ENV === 'development' && process.env.SKIP_WEBHOOK_VALIDATION === 'true',
  customErrorHandler: (error, req, res) => {
    console.warn('Validação de webhook falhou:', {
      error: error.error,
      code: error.code,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: (req as any).requestId
    });
    
    res.status(401).json(createErrorResponse(
      error.code || 'WEBHOOK_VALIDATION_FAILED',
      error.error || 'Falha na validação do webhook',
      error.details,
      (req as any).requestId
    ));
  }
});

// Configurar limpeza automática de callbacks antigos
callbackHandler.startCleanupSchedule(60); // A cada 60 minutos

// Criar aplicação Express
const app = express();

// Configurar CORS específico para callbacks
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sem origin (para serviços server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se o origin é do Cloud Run (baseado na URL do serviço)
    const cloudRunServiceUrl = process.env.CLOUD_RUN_SERVICE_URL;
    if (cloudRunServiceUrl && origin.startsWith(cloudRunServiceUrl)) {
      return callback(null, true);
    }
    
    // Permitir origins configurados
    const allowedOrigins = process.env.CALLBACK_ALLOWED_ORIGINS?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Rejeitar outros origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['POST', 'GET'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-callback-signature',
    'x-timestamp',
    'x-request-id'
  ]
};

app.use(cors(corsOptions));

// Inicializar middleware de segurança
const securityManager = initializeSecurity(db, logger, metricsService, {
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 100 // máximo 100 requests por minuto por IP
  },
  audit: {
    enabled: true,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
    excludePaths: ['/callback/health', '/callback/metrics']
  }
});

app.use(securityHeaders);

// Middleware de autenticação e validação
app.use('/callback', authMiddleware.authenticate());
app.use(webhookValidation.logWebhook());

// Rate limiting específico para callbacks
app.use(rateLimit);

// Middleware para parsing JSON com limite maior para callbacks
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    // Armazenar o body raw para validação de assinatura
    req.rawBody = buf;
  }
}));

// Middleware para adicionar request ID
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] as string || 
    `callback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('x-request-id', req.requestId);
  next();
});

// Middleware de logging para callbacks
app.use((req, res, next) => {
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] Callback received:`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
    contentLength: req.headers['content-length']
  });
  
  // Log da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Callback response:`, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0
    });
    return originalSend.call(this, data);
  };
  
  next();
});

/**
 * POST /callback/analysis
 * Endpoint principal para receber callbacks do Cloud Run sobre análises
 */
app.post('/callback/analysis', 
  webhookValidation.validate(),
  webhookValidation.rateLimit(100, 60000), // 100 requests por minuto
  authMiddleware.authenticateWebhook(authConfig.webhook.secretKey),
  async (req: WebhookRequest, res) => {
  try {
    console.log('Callback de análise validado:', {
      eventType: req.webhook?.eventType,
      timestamp: req.webhook?.timestamp,
      validated: req.webhook?.validated,
      requestId: req.requestId
    });
    
    await callbackHandler.handleCallback(req, res);
  } catch (error) {
    console.error('Erro não tratado no callback de análise:', error);
    res.status(500).json(createErrorResponse(
      'CALLBACK_ERROR',
      'Erro interno ao processar callback',
      process.env.NODE_ENV === 'development' ? { error: error instanceof Error ? error.message : 'Unknown error' } : undefined,
      req.requestId
    ));
  }
});

/**
 * POST /callback/document
 * Endpoint para receber callbacks sobre processamento de documentos
 */
app.post('/callback/document',
  webhookValidation.validate(),
  webhookValidation.rateLimit(200, 60000), // 200 requests por minuto
  authMiddleware.authenticateWebhook(authConfig.webhook.secretKey),
  async (req: WebhookRequest, res) => {
  try {
    // Validar payload básico
    const { document_id, status, processing_info } = req.body;
    
    if (!document_id || !status) {
      return res.status(400).json(createErrorResponse(
        'INVALID_PAYLOAD',
        'document_id e status são obrigatórios',
        undefined,
        req.requestId
      ));
    }
    
    // Log do evento
    console.log(`Callback de documento recebido:`, {
      document_id,
      status,
      processing_info,
      eventType: req.webhook?.eventType,
      validated: req.webhook?.validated,
      requestId: req.requestId
    });
    
    // Atualizar status do documento no Firestore
    await db.collection('documents').doc(document_id).update({
      status,
      processing_info,
      updated_at: new Date()
    });
    
    // Registrar métricas
    metricsService.incrementCounter('document_event', 1, {
      document_id,
      event_type: 'status_update',
      status
    });
    
    res.status(200).json(createSuccessResponse(
      { message: 'Callback de documento processado com sucesso' },
      req.requestId
    ));
    
  } catch (error) {
    console.error('Erro ao processar callback de documento:', error);
    res.status(500).json(createErrorResponse(
      'CALLBACK_ERROR',
      'Erro interno ao processar callback de documento',
      process.env.NODE_ENV === 'development' ? { error: error instanceof Error ? error.message : 'Unknown error' } : undefined,
      req.requestId
    ));
  }
});

/**
 * GET /callback/health
 * Endpoint de health check para o serviço de callbacks
 */
app.get('/callback/health', (req, res) => {
  try {
    const metrics = callbackHandler.getMetrics();
    
    res.status(200).json(createSuccessResponse({
      status: 'healthy',
      service: 'callbacks',
      timestamp: new Date().toISOString(),
      metrics: {
        total_callbacks_received: metrics.total_received,
        successful_processed: metrics.successful_processed,
        failed_processed: metrics.failed_processed,
        success_rate: metrics.total_received > 0 ? 
          (metrics.successful_processed / metrics.total_received * 100).toFixed(2) + '%' : '0%',
        average_processing_time: `${metrics.average_processing_time.toFixed(2)}ms`
      },
      configuration: {
        security_enabled: !!callbackSecurityConfig.secretKey,
        ip_filtering_enabled: !!callbackSecurityConfig.allowedIPs,
        timestamp_validation_enabled: callbackSecurityConfig.timestampTolerance > 0,
        webhook_validation_enabled: !process.env.SKIP_WEBHOOK_VALIDATION,
        replay_protection_enabled: authConfig.webhook.enableReplayProtection
      }
    }, req.requestId));
  } catch (error) {
    console.error('Erro no health check de callbacks:', error);
    res.status(500).json(createErrorResponse(
      'HEALTH_CHECK_ERROR',
      'Erro ao verificar saúde do serviço de callbacks',
      undefined,
      req.requestId
    ));
  }
});

/**
 * GET /callback/metrics
 * Endpoint para obter métricas detalhadas dos callbacks
 */
app.get('/callback/metrics', (req, res) => {
  try {
    const metrics = callbackHandler.getMetrics();
    
    res.status(200).json(createSuccessResponse({
      metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    }, req.requestId));
  } catch (error) {
    console.error('Erro ao obter métricas de callbacks:', error);
    res.status(500).json(createErrorResponse(
      'METRICS_ERROR',
      'Erro ao obter métricas de callbacks',
      undefined,
      req.requestId
    ));
  }
});

/**
 * GET /callback/security/stats
 * Endpoint para obter estatísticas de segurança dos webhooks
 */
app.get('/callback/security/stats',
  requireAuth(authService),
  async (req, res) => {
    try {
      const stats = await webhookValidation.getStats();
      res.json(createSuccessResponse({
        security_stats: stats,
        timestamp: new Date().toISOString()
      }, req.requestId));
    } catch (error) {
      console.error('Erro ao obter estatísticas de segurança:', error);
      res.status(500).json(createErrorResponse(
        'STATS_ERROR',
        'Erro ao obter estatísticas de segurança',
        process.env.NODE_ENV === 'development' ? { error: error instanceof Error ? error.message : 'Unknown error' } : undefined,
        req.requestId
      ));
    }
  }
);

/**
 * POST /callback/webhook/test
 * Endpoint para testar validação de webhook
 */
app.post('/callback/webhook/test',
  requireAuth(authService),
  webhookValidation.validateSignatureOnly(),
  async (req: WebhookRequest, res) => {
    try {
      res.json(createSuccessResponse({
        message: 'Webhook validado com sucesso',
        validation_result: {
          signature_valid: req.webhook?.validated || false,
          event_type: req.webhook?.eventType,
          timestamp: req.webhook?.timestamp
        },
        test_timestamp: new Date().toISOString()
      }, req.requestId));
    } catch (error) {
      console.error('Erro no teste de webhook:', error);
      res.status(500).json(createErrorResponse(
        'WEBHOOK_TEST_ERROR',
        'Erro ao testar webhook',
        process.env.NODE_ENV === 'development' ? { error: error instanceof Error ? error.message : 'Unknown error' } : undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /callback/test
 * Endpoint de teste para desenvolvimento (apenas em ambiente de desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  app.get('/callback/test', (req, res) => {
    res.json(createSuccessResponse({
      message: 'Endpoint de teste funcionando',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      webhook_validation_enabled: !process.env.SKIP_WEBHOOK_VALIDATION
    }, req.requestId));
  });
}

/**
 * POST /callback/test
 * Endpoint para testar a funcionalidade de callbacks (apenas em desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  app.post('/callback/test', (req, res) => {
    try {
      console.log('Callback de teste recebido:', {
        headers: req.headers,
        body: req.body,
        requestId: req.requestId
      });
      
      res.status(200).json(createSuccessResponse({
        message: 'Callback de teste processado com sucesso',
        received_data: req.body,
        timestamp: new Date().toISOString()
      }, req.requestId));
    } catch (error) {
      console.error('Erro no callback de teste:', error);
      res.status(500).json(createErrorResponse(
        'TEST_ERROR',
        'Erro no callback de teste',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        req.requestId
      ));
    }
  });
}

// Middleware de tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json(createErrorResponse(
    'ROUTE_NOT_FOUND',
    `Endpoint de callback não encontrado: ${req.method} ${req.originalUrl}`,
    undefined,
    req.requestId
  ));
});

// Configurar limpeza automática do cache de replay de webhooks
setInterval(() => {
  try {
    webhookValidation.cleanup();
  } catch (error) {
    console.warn('Erro na limpeza do cache de webhook:', error);
  }
}, 5 * 60 * 1000); // A cada 5 minutos

// Middleware de tratamento de erros
app.use(errorHandler);

// Exportar Cloud Function
export const callbacksApi = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
    maxInstances: 50
  })
  .https
  .onRequest(app);

// Exportar handler para uso em testes
export { callbackHandler };