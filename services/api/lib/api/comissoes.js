"use strict";
/**
 * Comissões API Handler
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComissaoHistory = exports.getComissaoStats = exports.atualizarMembro = exports.removerMembro = exports.adicionarMembro = exports.deleteComissao = exports.updateComissao = exports.createComissao = exports.getComissaoById = exports.listComissoes = void 0;
const firestore_1 = require("firebase-admin/firestore");
const ComissaoService_1 = require("../services/ComissaoService");
const types_1 = require("../types");
const zod_1 = require("zod");
const db = (0, firestore_1.getFirestore)();
/**
 * GET /api/comissoes
 * List comissões with filtering and pagination
 */
const listComissoes = async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        // Validate and parse query parameters
        const queryOptions = types_1.ComissoesQueryOptionsSchema.parse(req.query);
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const result = await service.listComissoes(queryOptions);
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
        return;
    }
    catch (error) {
        console.error('Error listing comissões:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.listComissoes = listComissoes;
/**
 * GET /api/comissoes/:id
 * Get comissão by ID with detailed information
 */
const getComissaoById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const comissao = await service.getComissaoById(id);
        if (!comissao) {
            return res.status(404).json({
                success: false,
                error: 'Comissão not found'
            });
        }
        res.json({
            success: true,
            data: comissao
        });
        return;
    }
    catch (error) {
        console.error('Error getting comissão:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getComissaoById = getComissaoById;
/**
 * POST /api/comissoes
 * Create new comissão
 */
const createComissao = async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        // Validate request body
        const data = types_1.CreateComissaoRequestSchema.parse(req.body);
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const comissao = await service.createComissao(data, userId);
        res.status(201).json({
            success: true,
            data: comissao,
            message: 'Comissão created successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error creating comissão:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.createComissao = createComissao;
/**
 * PUT /api/comissoes/:id
 * Update comissão
 */
const updateComissao = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        // Validate request body
        const data = types_1.UpdateComissaoRequestSchema.parse(req.body);
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const comissao = await service.updateComissao(id, data, userId);
        if (!comissao) {
            return res.status(404).json({
                success: false,
                error: 'Comissão not found'
            });
        }
        res.json({
            success: true,
            data: comissao,
            message: 'Comissão updated successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error updating comissão:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.updateComissao = updateComissao;
/**
 * DELETE /api/comissoes/:id
 * Delete comissão
 */
const deleteComissao = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        await service.deleteComissao(id, userId);
        res.json({
            success: true,
            message: 'Comissão deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error deleting comissão:', error);
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.deleteComissao = deleteComissao;
/**
 * POST /api/comissoes/:id/membros
 * Add member to comissão
 */
const adicionarMembro = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        // Validate request body
        const data = types_1.AdicionarMembroRequestSchema.parse(req.body);
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        await service.adicionarMembro(id, data, userId);
        res.status(201).json({
            success: true,
            message: 'Member added successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error adding member:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.adicionarMembro = adicionarMembro;
/**
 * DELETE /api/comissoes/:id/membros/:servidorId
 * Remove member from comissão
 */
const removerMembro = async (req, res) => {
    try {
        const { id, servidorId } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        if (!id || !servidorId) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID and Servidor ID are required'
            });
        }
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        await service.removerMembro(id, servidorId, userId);
        res.json({
            success: true,
            message: 'Member removed successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error removing member:', error);
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.removerMembro = removerMembro;
/**
 * PATCH /api/comissoes/:id/membros/:servidorId
 * Update member in comissão
 */
const atualizarMembro = async (req, res) => {
    try {
        const { id, servidorId } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        if (!id || !servidorId) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID and Servidor ID are required'
            });
        }
        // Validate request body
        const data = types_1.AtualizarMembroRequestSchema.parse(req.body);
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        await service.atualizarMembro(id, servidorId, data, userId);
        res.json({
            success: true,
            message: 'Member updated successfully'
        });
        return;
    }
    catch (error) {
        console.error('Error updating member:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.atualizarMembro = atualizarMembro;
/**
 * GET /api/comissoes/:id/stats
 * Get comissão statistics
 */
const getComissaoStats = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const stats = await service.getComissaoStats(id);
        res.json({
            success: true,
            data: stats
        });
        return;
    }
    catch (error) {
        console.error('Error getting comissão stats:', error);
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getComissaoStats = getComissaoStats;
/**
 * GET /api/comissoes/:id/history
 * Get comissão history
 */
const getComissaoHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Comissão ID is required'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const service = new ComissaoService_1.ComissaoService(db, organizationId);
        const result = await service.getComissaoHistory(id, page, limit);
        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                hasMore: result.hasMore
            }
        });
        return;
    }
    catch (error) {
        console.error('Error getting comissão history:', error);
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.getComissaoHistory = getComissaoHistory;
//# sourceMappingURL=comissoes.js.map