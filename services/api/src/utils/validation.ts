import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Classe de erro de validação
 */
export class ValidationError extends Error {
  public details: unknown;
  
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Resultado da validação
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Valida dados usando schema Zod
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      };
    }
    
    return {
      success: false,
      error: 'Unknown validation error',
      details: error
    };
  }
}

/**
 * Middleware para validar body da requisição
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateData(schema, req.body);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    req.body = validation.data;
    return next();
  };
}

/**
 * Middleware para validar query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateData(schema, req.query);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    // Store validated data in a custom property instead of overwriting req.query
    (req as any).validatedQuery = validation.data;
    return next();
  };
}

/**
 * Middleware para validar path parameters
 */
export function validatePathParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateData(schema, req.params);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    req.params = validation.data as Record<string, string>;
    return next();
  };
}

// Schemas comuns
export const DocumentIdSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required')
});

export const AnalysisIdSchema = z.object({
  analysisId: z.string().min(1, 'Analysis ID is required')
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const AnalysisRequestSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  analysisType: z.enum(['basic', 'detailed', 'comprehensive']).default('basic'),
  options: z.object({
    includeAI: z.boolean().default(true),
    generateRecommendations: z.boolean().default(true),
    detailedMetrics: z.boolean().default(false)
  }).optional()
});

// Schemas adicionais
export const UUIDSchema = z.string().uuid('ID deve ser um UUID válido');

// Função para validar corpo da requisição
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateData(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
    req.body = result.data;
    return next();
  };
}

// Função para validar parâmetros de query
export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateData(schema, req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
    // Store validated data in a custom property instead of overwriting req.query
    (req as any).validatedQuery = result.data;
    return next();
  };
}
