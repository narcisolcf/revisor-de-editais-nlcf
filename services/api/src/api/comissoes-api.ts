/**
 * Comissões API - Comissões CRUD operations
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { z } from "zod";

import { 
  CreateComissaoRequestSchema,
  UpdateComissaoRequestSchema,
  AdicionarMembroRequestSchema,
  AtualizarMembroRequestSchema,

} from "../types";
import {
  authenticateUser,
  requireOrganization,

  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  validateData,
  ValidationError,

  createErrorResponse,
  generateRequestId,

} from "../utils";
import { config } from "../config";
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
} from "./comissoes";

// Validation schemas for path parameters
const ComissaoIdSchema = z.object({
  id: z.string().uuid()
});



const ComissaoServidorSchema = z.object({
  id: z.string().uuid(),
  servidorId: z.string().uuid()
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.maxRequestSize }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Authentication and authorization
app.use(authenticateUser);
app.use(requireOrganization);

/**
 * GET /
 * List comissões with filtering and pagination
 */
app.get("/", 
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]), // Using existing permission for now
  listComissoes
);

/**
 * GET /:id
 * Get comissão by ID with detailed information
 */
app.get("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Parâmetros de caminho inválidos',
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      await getComissaoById(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          error.message,
          error.details as Record<string, unknown>,
          requestId
        ));
      } else {
        res.status(500).json(createErrorResponse(
          'INTERNAL_ERROR',
          'Erro interno do servidor',
          {},
          requestId
        ));
      }
      return;
    }
  }
);

/**
 * POST /
 * Create new comissão
 */
app.post("/",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    const bodyValidation = validateData(CreateComissaoRequestSchema, req.body);
    if (!bodyValidation.success) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Dados da requisição inválidos',
        bodyValidation.details as Record<string, unknown>,
        req.headers['x-request-id'] as string
      ));
    }
    await createComissao(req, res);
    return;
  }
);

/**
 * PUT /:id
 * Update comissão
 */
app.put("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Parâmetros de caminho inválidos',
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      const bodyValidation = validateData(UpdateComissaoRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      await updateComissao(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Erro interno do servidor", {}, requestId));
      }
      return;
      return;
    }
  }
);

/**
 * DELETE /:id
 * Delete comissão
 */
app.delete("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_DELETE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Parâmetros de caminho inválidos',
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      await deleteComissao(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Erro interno do servidor", {}, requestId));
      }
      return;
    }
  }
);

/**
 * POST /:id/membros
 * Add member to comissão
 */
app.post("/:id/membros",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      const bodyValidation = validateData(AdicionarMembroRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      await adicionarMembro(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        return res.status(500).json(createErrorResponse("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
      }
    }
  }
);

/**
 * DELETE /:id/membros/:servidorId
 * Remove member from comissão
 */
app.delete("/:id/membros/:servidorId",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoServidorSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      await removerMembro(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        return res.status(500).json(createErrorResponse("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
      }
    }
  }
);

/**
 * PATCH /:id/membros/:servidorId
 * Update member in comissão
 */
app.patch("/:id/membros/:servidorId",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoServidorSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      const bodyValidation = validateData(AtualizarMembroRequestSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Dados da requisição inválidos',
          bodyValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      
      await atualizarMembro(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        return res.status(500).json(createErrorResponse("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
      }
    }
  }
);

/**
 * GET /:id/stats
 * Get comissão statistics
 */
app.get("/:id/stats",
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      await getComissaoStats(req, res);
      return;
     } catch (error) {
       const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        res.status(500).json(createErrorResponse("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
      }
      return;
    }
  }
);

/**
 * GET /:id/history
 * Get comissão history
 */
app.get("/:id/history",
  requirePermissions([PERMISSIONS.DOCUMENTS_READ]),
  async (req, res) => {
    try {
      const pathValidation = validateData(ComissaoIdSchema, req.params);
      if (!pathValidation.success) {
        return res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Parâmetros de caminho inválidos",
          pathValidation.details as Record<string, unknown>,
          req.headers['x-request-id'] as string
        ));
      }
      await getComissaoHistory(req, res);
      return;
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        return res.status(400).json(createErrorResponse("VALIDATION_ERROR", error.message, error.details as Record<string, unknown>, requestId));
      } else {
        return res.status(500).json(createErrorResponse("INTERNAL_ERROR", 'Erro interno do servidor', {}, requestId));
      }
    }
  }
);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Comissões API Error:', error);
  const errorResponse = createErrorResponse(
    "INTERNAL_ERROR",
    error.message || 'Erro interno do servidor',
    error instanceof ValidationError ? error.details as Record<string, unknown> : {},
    req.headers['x-request-id'] as string
  );
  res.status(error instanceof ValidationError ? 400 : 500).json(errorResponse);
});

// Export the Cloud Function
export const comissoesApi = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 300,
  maxInstances: 100,
  cors: config.corsOrigin
}, app);