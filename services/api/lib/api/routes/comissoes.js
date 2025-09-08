"use strict";
/**
 * Comissões Routes
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comissoes_1 = require("../comissoes");
const auth_1 = require("../../middleware/auth");
const security_1 = require("../../middleware/security");
const LoggingService_1 = require("../../services/LoggingService");
const MetricsService_1 = require("../../services/MetricsService");
const firestore_1 = require("firebase-admin/firestore");
// Inicializar serviços de segurança
const db = (0, firestore_1.getFirestore)();
const loggingService = new LoggingService_1.LoggingService('comissoes-routes');
const metricsService = new MetricsService_1.MetricsService('comissoes-routes');
// Inicializar middleware de segurança
const securityManager = (0, security_1.initializeSecurity)(db, loggingService, metricsService, {
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
const router = (0, express_1.Router)();
// Aplicar middlewares de segurança
router.use(security_1.securityHeaders);
router.use(security_1.rateLimit);
router.use(security_1.attackProtection);
router.use(security_1.auditAccess);
router.use(auth_1.authenticateUser);
// Main CRUD routes
router.get('/', comissoes_1.listComissoes);
router.get('/:id', comissoes_1.getComissaoById);
router.post('/', comissoes_1.createComissao);
router.put('/:id', comissoes_1.updateComissao);
router.delete('/:id', comissoes_1.deleteComissao);
// Member management routes
router.post('/:id/membros', comissoes_1.adicionarMembro);
router.delete('/:id/membros/:servidorId', comissoes_1.removerMembro);
router.patch('/:id/membros/:servidorId', comissoes_1.atualizarMembro);
// Statistics and history routes
router.get('/:id/stats', comissoes_1.getComissaoStats);
router.get('/:id/history', comissoes_1.getComissaoHistory);
exports.default = router;
//# sourceMappingURL=comissoes.js.map