"use strict";
/**
 * Comissões Routes
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comissoes_1 = require("../comissoes");
const auth_1 = require("../../middleware/auth");
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();
// Rate limiting for comissões endpoints
const comissoesRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Apply middleware to all routes
router.use(comissoesRateLimit);
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