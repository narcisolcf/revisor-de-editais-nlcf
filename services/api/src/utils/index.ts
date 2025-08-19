/**
 * Utilitários gerais para o sistema de análise de editais
 * Sprint 1 - LicitaReview
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Re-exportar validação
export * from './validation';

/**
 * Interface para resposta de sucesso padronizada
 */
export interface SuccessResponse<T = any> {
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
    details?: any;
  };
  requestId: string;
  timestamp: string;
  debug?: any;
}

/**
 * Gerar ID único para requisições
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * Criar resposta de sucesso padronizada
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Criar resposta de erro padronizada
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Enviar resposta de sucesso
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  requestId?: string
): void {
  res.status(statusCode).json(createSuccessResponse(data, requestId));
}

/**
 * Enviar resposta de erro
 */
export function sendErrorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  requestId?: string
): void {
  res.status(statusCode).json(createErrorResponse(code, message, details, requestId));
}

/**
 * Extrair ID da requisição do header ou gerar novo
 */
export function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || generateRequestId();
}

/**
 * Validar se um valor é um UUID válido
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Sanitizar string removendo caracteres especiais
 */
export function sanitizeString(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
}

/**
 * Converter bytes para formato legível
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Delay assíncrono
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Verificar se um erro é retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Erros de rede
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Erros HTTP 5xx e 429
  if (error.response?.status >= 500 || error.response?.status === 429) {
    return true;
  }
  
  return false;
}

/**
 * Truncar texto mantendo palavras completas
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Normalizar nome de arquivo
 */
export function normalizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Schemas Zod comuns
 */
export const CommonSchemas = {
  uuid: z.string().uuid('ID deve ser um UUID válido'),
  email: z.string().email('Email deve ter formato válido'),
  nonEmptyString: z.string().min(1, 'Campo não pode estar vazio'),
  positiveNumber: z.number().positive('Número deve ser positivo'),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  })
};
