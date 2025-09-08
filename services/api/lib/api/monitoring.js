"use strict";
/**
 * API de Monitoramento
 *
 * Endpoints para métricas, alertas, verificações de saúde
 * e configurações de monitoramento.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringApi = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const security_1 = require("../middleware/security");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const AlertService_1 = require("../services/AlertService");
const HealthCheckService_1 = require("../services/HealthCheckService");
const monitoring_types_1 = require("../types/monitoring.types");
const zod_1 = require("zod");
// Tipos estendidos do Express são carregados automaticamente
// Inicializar serviços
const db = (0, firestore_1.getFirestore)();
const logger = new LoggingService_1.LoggingService('monitoring-api');
const loggingService = logger; // Alias para compatibilidade
const metricsService = new MetricsService_1.MetricsService('monitoring-api');
const alertService = new AlertService_1.AlertService(db, logger, metricsService);
const healthCheckService = new HealthCheckService_1.HealthCheckService(db, logger, metricsService);
// Iniciar monitoramento de saúde
healthCheckService.startMonitoring();
const app = (0, express_1.default)();
// Middleware básico
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// Inicializar middleware de segurança
(0, security_1.initializeSecurity)(db, loggingService, metricsService, {
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
app.use(security_1.securityHeaders);
app.use(security_1.rateLimit);
app.use(security_1.auditAccessMiddleware);
app.use(security_1.attackProtection);
// Middleware de request ID
app.use((req, res, next) => {
    req.requestId = (0, uuid_1.v4)();
    next();
});
// Middleware de autenticação global
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================
const createAlertRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    metric: zod_1.z.string().min(1),
    condition: zod_1.z.enum(['>', '<', '>=', '<=', '==', '!=']),
    threshold: zod_1.z.number(),
    severity: zod_1.z.nativeEnum(monitoring_types_1.AlertSeverity),
    cooldownMinutes: zod_1.z.number().min(1).max(1440).optional(),
    notificationChannels: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.record(zod_1.z.string()).optional()
});
const getMetricsQuerySchema = zod_1.z.object({
    metric: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    tags: zod_1.z.record(zod_1.z.string()).optional(),
    aggregation: zod_1.z.enum(['avg', 'sum', 'min', 'max', 'count']).optional(),
    interval: zod_1.z.enum(['1m', '5m', '15m', '1h', '1d']).optional(),
    limit: zod_1.z.number().min(1).max(1000).optional()
});
const getAlertsQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(monitoring_types_1.AlertStatus).optional(),
    severity: zod_1.z.nativeEnum(monitoring_types_1.AlertSeverity).optional(),
    ruleId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.number().min(1).max(100).optional(),
    offset: zod_1.z.number().min(0).optional()
});
// ============================================================================
// ROTAS DE MÉTRICAS
// ============================================================================
/**
 * GET /metrics
 * Busca métricas com filtros
 */
app.get('/metrics', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), (0, validation_1.validateQuery)(getMetricsQuerySchema), async (req, res) => {
    try {
        const query = {
            name: req.query.metric,
            type: req.query.type,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            tags: req.query.tags ? JSON.parse(req.query.tags) : undefined,
            aggregation: req.query.aggregation,
            interval: req.query.interval
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
    }
    catch (error) {
        await logger.error('Erro ao buscar métricas', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            query: req.query,
            function: 'getMetrics'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * GET /metrics/summary
 * Resumo de métricas por período
 */
app.get('/metrics/summary', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), async (req, res) => {
    try {
        const metric = req.query.metric;
        const hours = parseInt(req.query.hours) || 24;
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
        const filteredMetrics = metricEntries.filter(entry => entry.timestamp >= startDate && entry.timestamp <= endDate);
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
    }
    catch (error) {
        await logger.error('Erro ao buscar alertas', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getAlerts'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /metrics/system
 * Métricas de sistema (CPU, memória, etc.)
 */
app.get('/metrics/system', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao buscar métricas de sistema', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getSystemMetrics'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /metrics/application
 * Métricas de aplicação
 */
app.get('/metrics/application', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao buscar métricas de aplicação', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getApplicationMetrics'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// ============================================================================
// ROTAS DE ALERTAS
// ============================================================================
/**
 * POST /alerts/rules
 * Cria nova regra de alerta
 */
app.post('/alerts/rules', (0, auth_1.requirePermissions)(['CONFIG_WRITE']), (0, validation_1.validateRequest)({ body: createAlertRuleSchema }), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao criar regra de alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user,
            request: req.body,
            function: 'createAlertRule'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /alerts/rules
 * Lista regras de alerta
 */
app.get('/alerts/rules', (0, auth_1.requirePermissions)(['CONFIG_READ']), async (req, res) => {
    try {
        const enabled = req.query.enabled === 'true' ? true :
            req.query.enabled === 'false' ? false : undefined;
        const rules = await alertService.getAlertRules(enabled);
        res.json({
            success: true,
            data: rules,
            total: rules.length
        });
    }
    catch (error) {
        await logger.error('Erro ao buscar regras de alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getAlertRules'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * PUT /alerts/rules/:ruleId
 * Atualiza regra de alerta
 */
app.put('/alerts/rules/:ruleId', (0, auth_1.requirePermissions)(['CONFIG_WRITE']), (0, validation_1.validateRequest)({ body: createAlertRuleSchema.partial() }), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao atualizar regra de alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user,
            ruleId: req.params.ruleId,
            updates: req.body,
            function: 'updateAlertRule'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * DELETE /alerts/rules/:ruleId
 * Remove regra de alerta
 */
app.delete('/alerts/rules/:ruleId', (0, auth_1.requirePermissions)(['CONFIG_WRITE']), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao remover regra de alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user,
            ruleId: req.params.ruleId,
            function: 'deleteAlertRule'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /alerts
 * Lista alertas com filtros
 */
app.get('/alerts', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), (0, validation_1.validateQuery)(getAlertsQuerySchema), async (req, res) => {
    try {
        const query = {
            status: req.query.status,
            severity: req.query.severity,
            ruleId: req.query.ruleId,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        const result = await alertService.getAlerts(query);
        res.json({
            success: true,
            data: result.alerts,
            total: result.total,
            hasMore: result.hasMore
        });
    }
    catch (error) {
        await logger.error('Erro ao buscar alertas', error instanceof Error ? error : new Error(String(error)), {
            user: req.user,
            query: req.query,
            function: 'getAlerts'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * POST /alerts/:alertId/acknowledge
 * Reconhece um alerta
 */
app.post('/alerts/:alertId/acknowledge', (0, auth_1.requirePermissions)(['ANALYSIS_WRITE']), async (req, res) => {
    try {
        const { alertId } = req.params;
        await alertService.acknowledgeAlert(alertId, req.user.uid);
        await logger.info('Alerta reconhecido', {
            function: 'acknowledgeAlert',
            user: req.user || undefined,
            metadata: { alertId }
        });
        res.json({
            success: true,
            message: 'Alerta reconhecido com sucesso'
        });
    }
    catch (error) {
        await logger.error('Erro ao reconhecer alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            alertId: req.params.alertId,
            function: 'acknowledgeAlert'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * POST /alerts/:alertId/resolve
 * Resolve um alerta
 */
app.post('/alerts/:alertId/resolve', (0, auth_1.requirePermissions)(['ANALYSIS_WRITE']), async (req, res) => {
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
    }
    catch (error) {
        await logger.error('Erro ao resolver alerta', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            alertId: req.params.alertId,
            function: 'resolveAlert'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /alerts/stats
 * Estatísticas de alertas
 */
app.get('/alerts/stats', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const stats = await alertService.getAlertStats(hours);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        await logger.error('Erro ao buscar estatísticas de alertas', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getAlertStats'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// ============================================================================
// ROTAS DE SAÚDE
// ============================================================================
/**
 * GET /health
 * Status atual de saúde do sistema
 */
app.get('/health', async (req, res) => {
    try {
        const health = await healthCheckService.getCurrentHealth();
        // Definir status HTTP baseado na saúde
        const statusCode = health.status === monitoring_types_1.HealthStatus.HEALTHY ? 200 :
            health.status === monitoring_types_1.HealthStatus.DEGRADED ? 200 : 503;
        res.status(statusCode).json({
            success: true,
            data: health
        });
    }
    catch (error) {
        await logger.error('Erro ao verificar saúde do sistema', error instanceof Error ? error : new Error(String(error)), {
            function: 'getCurrentHealth'
        });
        res.status(503).json({
            success: false,
            error: 'Erro ao verificar saúde do sistema',
            data: {
                status: monitoring_types_1.HealthStatus.UNHEALTHY,
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
app.get('/health/history', (0, auth_1.requirePermissions)(['ANALYSIS_READ']), async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const limit = parseInt(req.query.limit) || 100;
        const history = await healthCheckService.getHealthHistory(hours, limit);
        res.json({
            success: true,
            data: history,
            total: history.length
        });
    }
    catch (error) {
        await logger.error('Erro ao buscar histórico de saúde', error instanceof Error ? error : new Error(String(error)), {
            user: req.user || undefined,
            function: 'getHealthHistory'
        });
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
// ============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================================================
app.use((error, req, res, next) => {
    logger.error('Erro não tratado na API de monitoramento', error instanceof Error ? error : new Error(String(error)), {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        params: req.params,
        function: 'errorHandler'
    });
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        requestId: req.requestId
    });
});
// Exportar como Cloud Function
exports.monitoringApi = firebase_functions_1.https.onRequest({
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
    maxInstances: 10
}, app);
//# sourceMappingURL=monitoring.js.map