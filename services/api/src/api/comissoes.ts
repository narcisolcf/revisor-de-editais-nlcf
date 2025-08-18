/**
 * Comissões API Handler
 * LicitaReview Cloud Functions
 */

import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { ComissaoService } from '../services/ComissaoService';
import {
  CreateComissaoRequestSchema,
  UpdateComissaoRequestSchema,
  AdicionarMembroRequestSchema,
  AtualizarMembroRequestSchema,
  ComissoesQueryOptionsSchema,
  CreateComissaoRequest,
  UpdateComissaoRequest,
  AdicionarMembroRequest,
  AtualizarMembroRequest,
  ComissoesQueryOptions
} from '../types';
import { z } from 'zod';

const db = getFirestore();

/**
 * GET /api/comissoes
 * List comissões with filtering and pagination
 */
export const listComissoes = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Validate and parse query parameters
    const queryOptions = ComissoesQueryOptionsSchema.parse(req.query) as ComissoesQueryOptions;
    
    const service = new ComissaoService(db, organizationId);
    const result = await service.listComissoes(queryOptions);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error listing comissões:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/comissoes/:id
 * Get comissão by ID with detailed information
 */
export const getComissaoById = async (req: Request, res: Response) => {
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

    const service = new ComissaoService(db, organizationId);
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
  } catch (error) {
    console.error('Error getting comissão:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/comissoes
 * Create new comissão
 */
export const createComissao = async (req: Request, res: Response) => {
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
    const data = CreateComissaoRequestSchema.parse(req.body) as CreateComissaoRequest;
    
    const service = new ComissaoService(db, organizationId);
    const comissao = await service.createComissao(data, userId);

    res.status(201).json({
      success: true,
      data: comissao,
      message: 'Comissão created successfully'
    });
  } catch (error) {
    console.error('Error creating comissão:', error);
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/comissoes/:id
 * Update comissão
 */
export const updateComissao = async (req: Request, res: Response) => {
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
    const data = UpdateComissaoRequestSchema.parse(req.body) as UpdateComissaoRequest;
    
    const service = new ComissaoService(db, organizationId);
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
  } catch (error) {
    console.error('Error updating comissão:', error);
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/comissoes/:id
 * Delete comissão
 */
export const deleteComissao = async (req: Request, res: Response) => {
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

    const service = new ComissaoService(db, organizationId);
    await service.deleteComissao(id, userId);

    res.json({
      success: true,
      message: 'Comissão deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comissão:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/comissoes/:id/membros
 * Add member to comissão
 */
export const adicionarMembro = async (req: Request, res: Response) => {
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
    const data = AdicionarMembroRequestSchema.parse(req.body) as AdicionarMembroRequest;
    
    const service = new ComissaoService(db, organizationId);
    await service.adicionarMembro(id, data, userId);

    res.status(201).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/comissoes/:id/membros/:servidorId
 * Remove member from comissão
 */
export const removerMembro = async (req: Request, res: Response) => {
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

    const service = new ComissaoService(db, organizationId);
    await service.removerMembro(id, servidorId, userId);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PATCH /api/comissoes/:id/membros/:servidorId
 * Update member in comissão
 */
export const atualizarMembro = async (req: Request, res: Response) => {
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
    const data = AtualizarMembroRequestSchema.parse(req.body) as AtualizarMembroRequest;
    
    const service = new ComissaoService(db, organizationId);
    await service.atualizarMembro(id, servidorId, data, userId);

    res.json({
      success: true,
      message: 'Member updated successfully'
    });
  } catch (error) {
    console.error('Error updating member:', error);
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/comissoes/:id/stats
 * Get comissão statistics
 */
export const getComissaoStats = async (req: Request, res: Response) => {
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

    const service = new ComissaoService(db, organizationId);
    const stats = await service.getComissaoStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting comissão stats:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/comissoes/:id/history
 * Get comissão history
 */
export const getComissaoHistory = async (req: Request, res: Response) => {
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const service = new ComissaoService(db, organizationId);
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
  } catch (error) {
    console.error('Error getting comissão history:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};