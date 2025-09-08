/**
 * Middleware de Validação de Requisições
 *
 * Utiliza Zod para validar dados de entrada das requisições
 * e retorna erros estruturados em caso de falha na validação.
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
interface ValidationSchemas {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
    headers?: z.ZodSchema<any>;
}
/**
 * Middleware de validação que aceita schemas para diferentes partes da requisição
 */
export declare function validateRequest(schemas: ValidationSchemas): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para validar apenas o body da requisição
 */
export declare function validateBody<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para validar apenas a query string
 */
export declare function validateQuery<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para validar apenas os parâmetros da URL
 */
export declare function validateParams<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para validar apenas os headers
 */
export declare function validateHeaders<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Schema para validação de ID (UUID)
 */
export declare const IdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Schema para validação de paginação
 */
export declare const PaginationQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
/**
 * Schema para validação de período de datas
 */
export declare const DateRangeQuerySchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
/**
 * Schema para validação de organização
 */
export declare const OrganizationParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
}, {
    organizationId: string;
}>;
/**
 * Middleware global para capturar erros de validação não tratados
 */
export declare function globalValidationErrorHandler(error: any, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Valida se uma string é um email válido
 */
export declare const emailSchema: z.ZodString;
/**
 * Valida se uma string é um telefone brasileiro válido
 */
export declare const phoneSchema: z.ZodString;
/**
 * Valida se uma string é um CPF válido
 */
export declare const cpfSchema: z.ZodString;
/**
 * Valida se uma string é um CNPJ válido
 */
export declare const cnpjSchema: z.ZodString;
/**
 * Valida se uma string é uma URL válida
 */
export declare const urlSchema: z.ZodString;
/**
 * Valida se um valor está dentro de um range numérico
 */
export declare function rangeSchema(min: number, max: number): z.ZodNumber;
/**
 * Valida se uma string tem um tamanho específico
 */
export declare function lengthSchema(min: number, max: number): z.ZodString;
declare const _default: {
    validateRequest: typeof validateRequest;
    validateBody: typeof validateBody;
    validateQuery: typeof validateQuery;
    validateParams: typeof validateParams;
    validateHeaders: typeof validateHeaders;
    globalValidationErrorHandler: typeof globalValidationErrorHandler;
    IdParamSchema: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    PaginationQuerySchema: z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
    }, {
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    DateRangeQuerySchema: z.ZodEffects<z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
    OrganizationParamSchema: z.ZodObject<{
        organizationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        organizationId: string;
    }, {
        organizationId: string;
    }>;
    emailSchema: z.ZodString;
    phoneSchema: z.ZodString;
    cpfSchema: z.ZodString;
    cnpjSchema: z.ZodString;
    urlSchema: z.ZodString;
    rangeSchema: typeof rangeSchema;
    lengthSchema: typeof lengthSchema;
};
export default _default;
