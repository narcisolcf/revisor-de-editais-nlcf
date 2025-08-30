/**
 * Middleware de Validação de Requisições
 * 
 * Utiliza Zod para validar dados de entrada das requisições
 * e retorna erros estruturados em caso de falha na validação.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ValidationSchemas {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  headers?: z.ZodSchema<any>;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: any;
}

interface ValidationErrorResponse {
  error: string;
  message: string;
  details: ValidationError[];
  timestamp: string;
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Converte erros do Zod em formato mais amigável
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: 'received' in err ? err.received : undefined
  }));
}

/**
 * Sanitiza dados de query string convertendo strings para tipos apropriados
 */
function sanitizeQueryParams(query: any): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Converter strings vazias para undefined
      if (value.trim() === '') {
        continue;
      }
      
      // Converter 'true'/'false' para boolean
      if (value.toLowerCase() === 'true') {
        sanitized[key] = true;
        continue;
      }
      if (value.toLowerCase() === 'false') {
        sanitized[key] = false;
        continue;
      }
      
      // Converter números
      if (/^\d+$/.test(value)) {
        sanitized[key] = parseInt(value, 10);
        continue;
      }
      if (/^\d*\.\d+$/.test(value)) {
        sanitized[key] = parseFloat(value);
        continue;
      }
    }
    
    sanitized[key] = value;
  }
  
  return sanitized;
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de validação que aceita schemas para diferentes partes da requisição
 */
export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: ValidationError[] = [];
      
      // Validar body
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }
      
      // Validar query (com sanitização)
      if (schemas.query) {
        try {
          const sanitizedQuery = sanitizeQueryParams(req.query);
          req.query = schemas.query.parse(sanitizedQuery);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }
      
      // Validar params
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }
      
      // Validar headers
      if (schemas.headers) {
        try {
          req.headers = schemas.headers.parse(req.headers);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }
      
      // Se houver erros, retornar resposta de erro
      if (errors.length > 0) {
        const response: ValidationErrorResponse = {
          error: 'Dados de entrada inválidos',
          message: 'A requisição contém dados que não atendem aos critérios de validação',
          details: errors,
          timestamp: new Date().toISOString()
        };
        
        return res.status(400).json(response);
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de validação:', error);
      
      const response: ValidationErrorResponse = {
        error: 'Erro interno de validação',
        message: 'Ocorreu um erro inesperado durante a validação dos dados',
        details: [],
        timestamp: new Date().toISOString()
      };
      
      return res.status(500).json(response);
    }
  };
}

// ============================================================================
// MIDDLEWARES ESPECÍFICOS
// ============================================================================

/**
 * Middleware para validar apenas o body da requisição
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return validateRequest({ body: schema });
}

/**
 * Middleware para validar apenas a query string
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return validateRequest({ query: schema });
}

/**
 * Middleware para validar apenas os parâmetros da URL
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return validateRequest({ params: schema });
}

/**
 * Middleware para validar apenas os headers
 */
export function validateHeaders<T>(schema: z.ZodSchema<T>) {
  return validateRequest({ headers: schema });
}

// ============================================================================
// SCHEMAS COMUNS
// ============================================================================

/**
 * Schema para validação de ID (UUID)
 */
export const IdParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

/**
 * Schema para validação de paginação
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

/**
 * Schema para validação de período de datas
 */
export const DateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Data de início deve ser anterior à data de fim',
    path: ['startDate']
  }
);

/**
 * Schema para validação de organização
 */
export const OrganizationParamSchema = z.object({
  organizationId: z.string().min(1, 'ID da organização é obrigatório')
});

// ============================================================================
// MIDDLEWARE DE ERRO GLOBAL
// ============================================================================

/**
 * Middleware global para capturar erros de validação não tratados
 */
export function globalValidationErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof ZodError) {
    const response: ValidationErrorResponse = {
      error: 'Erro de validação',
      message: 'Os dados fornecidos não atendem aos critérios de validação',
      details: formatZodErrors(error),
      timestamp: new Date().toISOString()
    };
    
    return res.status(400).json(response);
  }
  
  next(error);
}

// ============================================================================
// UTILITÁRIOS PARA VALIDAÇÃO CUSTOMIZADA
// ============================================================================

/**
 * Valida se uma string é um email válido
 */
export const emailSchema = z.string().email('Email deve ter um formato válido');

/**
 * Valida se uma string é um telefone brasileiro válido
 */
export const phoneSchema = z.string().regex(
  /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  'Telefone deve ter um formato válido (ex: (11) 99999-9999)'
);

/**
 * Valida se uma string é um CPF válido
 */
export const cpfSchema = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
  'CPF deve ter um formato válido (ex: 123.456.789-00 ou 12345678900)'
);

/**
 * Valida se uma string é um CNPJ válido
 */
export const cnpjSchema = z.string().regex(
  /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
  'CNPJ deve ter um formato válido (ex: 12.345.678/0001-90 ou 12345678000190)'
);

/**
 * Valida se uma string é uma URL válida
 */
export const urlSchema = z.string().url('URL deve ter um formato válido');

/**
 * Valida se um valor está dentro de um range numérico
 */
export function rangeSchema(min: number, max: number) {
  return z.number().min(min, `Valor deve ser maior ou igual a ${min}`)
    .max(max, `Valor deve ser menor ou igual a ${max}`);
}

/**
 * Valida se uma string tem um tamanho específico
 */
export function lengthSchema(min: number, max: number) {
  return z.string()
    .min(min, `Texto deve ter pelo menos ${min} caracteres`)
    .max(max, `Texto deve ter no máximo ${max} caracteres`);
}

export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  globalValidationErrorHandler,
  IdParamSchema,
  PaginationQuerySchema,
  DateRangeQuerySchema,
  OrganizationParamSchema,
  emailSchema,
  phoneSchema,
  cpfSchema,
  cnpjSchema,
  urlSchema,
  rangeSchema,
  lengthSchema
};