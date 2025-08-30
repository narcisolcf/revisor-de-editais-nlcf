/**
 * Comissões Routes
 * LicitaReview Cloud Functions
 */

import { Router } from 'express';
import { 
  listComissoes,
  getComissaoById,
  createComissao,
  updateComissao,
  deleteComissao,
  adicionarMembro,
  removerMembro,
  atualizarMembro,
  getComissaoStats,
  getComissaoHistory
} from '../comissoes';
import { authenticateUser } from '../../middleware/auth';
import { 
  initializeSecurity, 
  securityHeaders, 
  rateLimit, 
  attackProtection, 
  auditAccess 
} from '../../middleware/security';
import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../services/MetricsService';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar serviços de segurança
const db = getFirestore();
const loggingService = new LoggingService('comissoes-routes');
const metricsService = new MetricsService('comissoes-routes');

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

const router = Router();

// Aplicar middlewares de segurança
router.use(securityHeaders);
router.use(rateLimit);
router.use(attackProtection);
router.use(auditAccess);
router.use(authenticateUser);

// Main CRUD routes
router.get('/', listComissoes);
router.get('/:id', getComissaoById);
router.post('/', createComissao);
router.put('/:id', updateComissao);
router.delete('/:id', deleteComissao);

// Member management routes
router.post('/:id/membros', adicionarMembro);
router.delete('/:id/membros/:servidorId', removerMembro);
router.patch('/:id/membros/:servidorId', atualizarMembro);

// Statistics and history routes
router.get('/:id/stats', getComissaoStats);
router.get('/:id/history', getComissaoHistory);

export default router;