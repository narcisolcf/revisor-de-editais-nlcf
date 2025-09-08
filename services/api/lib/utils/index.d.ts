/**
 * Utilitários gerais para o sistema de análise de editais
 * Sprint 1 - LicitaReview
 */
import { Request, Response } from 'express';
import { z } from 'zod';
export * from './validation';
import { LoggingService } from '../services/LoggingService';
export declare const logger: LoggingService;
/**
 * Interface para resposta de sucesso padronizada
 */
export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    requestId: string;
    timestamp: string;
}
/**
 * Interface para resposta de erro padronizada
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    requestId: string;
    timestamp: string;
    debug?: Record<string, unknown>;
}
/**
 * Gerar ID único para requisições
 */
export declare function generateRequestId(): string;
/**
 * Criar resposta de sucesso padronizada
 */
export declare function createSuccessResponse<T>(data: T, requestId?: string): SuccessResponse<T>;
/**
 * Criar resposta de erro padronizada
 */
export declare function createErrorResponse(code: string, message: string, details?: Record<string, unknown>, requestId?: string): ErrorResponse;
/**
 * Enviar resposta de sucesso
 */
export declare function sendSuccessResponse<T>(res: Response, data: T, statusCode?: number, requestId?: string): void;
/**
 * Enviar resposta de erro
 */
export declare function sendErrorResponse(res: Response, code: string, message: string, statusCode?: number, details?: Record<string, unknown>, requestId?: string): void;
/**
 * Extrair ID da requisição do header ou gerar novo
 */
export declare function getRequestId(req: Request): string;
/**
 * Validar se um valor é um UUID válido
 */
export declare function isValidUUID(value: string): boolean;
/**
 * Sanitizar string removendo caracteres especiais
 */
export declare function sanitizeString(str: string): string;
/**
 * Converter bytes para formato legível
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Delay assíncrono
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry com backoff exponencial
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number, backoffMultiplier?: number): Promise<T>;
/**
 * Verificar se um erro é retryable
 */
export declare function isRetryableError(error: unknown): boolean;
/**
 * Truncar texto mantendo palavras completas
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Normalizar nome de arquivo
 */
export declare function normalizeFileName(fileName: string): string;
/**
 * Validar email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Schemas Zod comuns
 */
export declare const CommonSchemas: {
    uuid: z.ZodString;
    email: z.ZodString;
    nonEmptyString: z.ZodString;
    positiveNumber: z.ZodNumber;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
    }>;
};
/**
 * Validar acesso à organização
 */
export declare function validateOrganizationAccess(userOrgId: string, targetOrgId: string): boolean;
