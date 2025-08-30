/**
 * Comissões API Handler
 * LicitaReview Cloud Functions
 */
import { Request, Response } from 'express';
/**
 * GET /api/comissoes
 * List comissões with filtering and pagination
 */
export declare const listComissoes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/comissoes/:id
 * Get comissão by ID with detailed information
 */
export declare const getComissaoById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /api/comissoes
 * Create new comissão
 */
export declare const createComissao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * PUT /api/comissoes/:id
 * Update comissão
 */
export declare const updateComissao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /api/comissoes/:id
 * Delete comissão
 */
export declare const deleteComissao: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /api/comissoes/:id/membros
 * Add member to comissão
 */
export declare const adicionarMembro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /api/comissoes/:id/membros/:servidorId
 * Remove member from comissão
 */
export declare const removerMembro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * PATCH /api/comissoes/:id/membros/:servidorId
 * Update member in comissão
 */
export declare const atualizarMembro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/comissoes/:id/stats
 * Get comissão statistics
 */
export declare const getComissaoStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/comissoes/:id/history
 * Get comissão history
 */
export declare const getComissaoHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
