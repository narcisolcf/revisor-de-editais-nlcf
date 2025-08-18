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
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for comissões endpoints
const comissoesRateLimit = rateLimit({
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