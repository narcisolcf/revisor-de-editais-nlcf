import { z } from 'zod';

/**
 * Classe de erro de validação
 */
export class ValidationError extends Error {
  public details: any;
  
  constructor(message: string, details?: any) {
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
  details?: any;
}

/**
 * Valida dados usando schema Zod
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: any): ValidationResult<T> {
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
  return (req: any, res: any, next: any) => {
    const validation = validateData(schema, req.body);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    req.validatedBody = validation.data;
    next();
  };
}

/**
 * Middleware para validar query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateData(schema, req.query);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    req.validatedQuery = validation.data;
    next();
  };
}

/**
 * Middleware para validar path parameters
 */
export function validatePathParams<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateData(schema, req.params);
    
    if (!validation.success) {
      throw new ValidationError(validation.error!, validation.details);
    }
    
    req.validatedParams = validation.data;
    next();
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
