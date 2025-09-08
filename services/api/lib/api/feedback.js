"use strict";
/**
 * Feedback API - Sistema de Feedback e Validação de Negócio
 * LicitaReview Cloud Functions
 *
 * Endpoints para coleta de feedback, tracking de parâmetros,
 * métricas de satisfação e relatórios de validação de negócio.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const BusinessValidationService_1 = require("../services/BusinessValidationService");
const security_1 = require("../middleware/security");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const firestore_1 = require("firebase-admin/firestore");
const feedback_types_1 = require("../types/feedback.types");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const feedback_types_2 = require("../types/feedback.types");
const utils_1 = require("../utils");
const error_1 = require("../middleware/error");
const zod_1 = require("zod");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// Inicializar serviços de segurança
const db = (0, firestore_1.getFirestore)();
const loggingService = new LoggingService_1.LoggingService('feedback-api');
const metricsService = new MetricsService_1.MetricsService('feedback-api');
// Inicializar middleware de segurança
const securityManager = (0, security_1.initializeSecurity)(db, loggingService, metricsService, {
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
app.use(security_1.securityHeaders);
app.use(security_1.rateLimit);
app.use(security_1.auditAccess);
app.use(security_1.attackProtection);
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = (0, utils_1.generateRequestId)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// Authentication middleware
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
const businessValidationService = new BusinessValidationService_1.BusinessValidationService();
// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================
const UpdateFeedbackStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(feedback_types_1.FeedbackStatus),
    response: zod_1.z.string().optional()
});
// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================================================
const validateCreateFeedback = (0, validation_1.validateRequest)({
    body: feedback_types_2.CreateFeedbackRequestSchema
});
const validateGetFeedback = (0, validation_1.validateRequest)({
    query: feedback_types_2.GetFeedbackQuerySchema
});
const validateUpdateFeedbackStatus = (0, validation_1.validateRequest)({
    body: UpdateFeedbackStatusSchema
});
const validateTrackParameterUsage = (0, validation_1.validateRequest)({
    body: feedback_types_2.TrackParameterUsageSchema
});
// ============================================================================
// ROUTES PARA FEEDBACK
// ============================================================================
/**
 * POST /feedback
 * Cria novo feedback do usuário
 */
app.post('/', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), validateCreateFeedback, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const organizationId = req.user?.organizationId;
        if (!userId || !organizationId) {
            return res.status(401).json({
                error: 'Usuário não autenticado ou organização não identificada'
            });
        }
        const feedbackData = req.body;
        const result = await businessValidationService.createFeedback(userId, organizationId, feedbackData);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Feedback criado com sucesso'
        });
    }
    catch (error) {
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
app.get('/', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), validateGetFeedback, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('support');
        if (!organizationId) {
            return res.status(401).json({
                error: 'Organização não identificada'
            });
        }
        const query = {
            organizationId,
            ...req.query,
            startDate: req.query.startDate,
            endDate: req.query.endDate
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
    }
    catch (error) {
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
app.put('/:id/status', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_WRITE]), validateUpdateFeedbackStatus, async (req, res) => {
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
        await businessValidationService.updateFeedbackStatus(feedbackId, status, reviewedBy, response);
        res.json({
            success: true,
            message: 'Status do feedback atualizado com sucesso'
        });
    }
    catch (error) {
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
app.post('/track-parameter', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_WRITE]), validateTrackParameterUsage, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const organizationId = req.user?.organizationId;
        if (!userId || !organizationId) {
            return res.status(401).json({
                error: 'Usuário não autenticado ou organização não identificada'
            });
        }
        const { analysisId, parameterId, parameterName, parameterType } = req.body;
        await businessValidationService.trackParameterUsage(userId, organizationId, analysisId, parameterId, parameterName, parameterType);
        res.json({
            success: true,
            message: 'Uso de parâmetro registrado com sucesso'
        });
    }
    catch (error) {
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
app.get('/parameter-analysis', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
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
        const days = parseInt(req.query.days) || 30;
        const analysis = await businessValidationService.analyzeParameterValue(organizationId, days);
        res.json({
            success: true,
            data: analysis,
            period: `${days} dias`
        });
    }
    catch (error) {
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
app.get('/business-validation-report', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
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
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate
            ? new Date(req.query.startDate)
            : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
        const report = await businessValidationService.generateBusinessValidationReport(organizationId, startDate, endDate);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
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
app.get('/business-metrics', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
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
        const days = parseInt(req.query.days) || 30;
        const metrics = await businessValidationService.getBusinessMetrics(organizationId, days);
        res.json({
            success: true,
            data: metrics,
            period: `${days} dias`
        });
    }
    catch (error) {
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
app.get('/config', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
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
    }
    catch (error) {
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
app.get('/stats', (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
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
        const query = {
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
        const typeDistribution = Object.values(feedback_types_1.FeedbackType).reduce((acc, type) => {
            acc[type] = feedbacks.filter(f => f.type === type).length;
            return acc;
        }, {});
        const statusDistribution = Object.values(feedback_types_1.FeedbackStatus).reduce((acc, status) => {
            acc[status] = feedbacks.filter(f => f.status === status).length;
            return acc;
        }, {});
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
    }
    catch (error) {
        console.error('Erro ao obter estatísticas de feedback:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// Error handling middleware
app.use(error_1.errorHandler);
exports.feedbackApi = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 10
}, app);
//# sourceMappingURL=feedback.js.map