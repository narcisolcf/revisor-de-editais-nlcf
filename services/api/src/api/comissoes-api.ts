/**
 * Comissões API - Comissões CRUD operations
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { 
  CreateComissaoRequestSchema,
  UpdateComissaoRequestSchema,
  AdicionarMembroRequestSchema,
  AtualizarMembroRequestSchema,
  ComissoesQueryOptionsSchema
} from "../types";
import {
  authenticateUser,
  requireOrganization,
  validateOrganizationAccess,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  UUIDSchema
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

const ServidorIdSchema = z.object({
  servidorId: z.string().uuid()
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
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await getComissaoById(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
      }
    }
  }
);

/**
 * POST /
 * Create new comissão
 */
app.post("/",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  validateRequestBody(CreateComissaoRequestSchema),
  createComissao
);

/**
 * PUT /:id
 * Update comissão
 */
app.put("/:id",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  validateRequestBody(UpdateComissaoRequestSchema),
  async (req, res) => {
    try {
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await updateComissao(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
      }
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
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await deleteComissao(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
      }
    }
  }
);

/**
 * POST /:id/membros
 * Add member to comissão
 */
app.post("/:id/membros",
  requirePermissions([PERMISSIONS.DOCUMENTS_WRITE]),
  validateRequestBody(AdicionarMembroRequestSchema),
  async (req, res) => {
    try {
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await adicionarMembro(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
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
      validatePathParams(ComissaoServidorSchema, req.params);
      await removerMembro(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
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
  validateRequestBody(AtualizarMembroRequestSchema),
  async (req, res) => {
    try {
      validatePathParams(ComissaoServidorSchema, req.params);
      await atualizarMembro(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
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
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await getComissaoStats(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
      }
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
      const { id } = validatePathParams(ComissaoIdSchema, req.params);
      await getComissaoHistory(req, res);
    } catch (error) {
      const requestId = req.headers['x-request-id'] as string;
      if (error instanceof ValidationError) {
        res.status(400).json(createErrorResponse(error.message, error.details, requestId));
      } else {
        res.status(500).json(createErrorResponse('Internal server error', undefined, requestId));
      }
    }
  }
);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Comissões API Error:', error);
  const errorResponse = createErrorResponse(
    error.message || 'Internal server error',
    error instanceof ValidationError ? error.details : undefined,
    req.requestId
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