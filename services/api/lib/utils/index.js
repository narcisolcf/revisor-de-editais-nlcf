"use strict";
/**
 * Utilitários gerais para o sistema de análise de editais
 * Sprint 1 - LicitaReview
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonSchemas = exports.logger = void 0;
exports.generateRequestId = generateRequestId;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.sendSuccessResponse = sendSuccessResponse;
exports.sendErrorResponse = sendErrorResponse;
exports.getRequestId = getRequestId;
exports.isValidUUID = isValidUUID;
exports.sanitizeString = sanitizeString;
exports.formatBytes = formatBytes;
exports.sleep = sleep;
exports.retryWithBackoff = retryWithBackoff;
exports.isRetryableError = isRetryableError;
exports.truncateText = truncateText;
exports.normalizeFileName = normalizeFileName;
exports.isValidEmail = isValidEmail;
exports.validateOrganizationAccess = validateOrganizationAccess;
const uuid_1 = require("uuid");
const zod_1 = require("zod");
// Re-exportar validação
__exportStar(require("./validation"), exports);
// Re-exportar logger
const LoggingService_1 = require("../services/LoggingService");
exports.logger = new LoggingService_1.LoggingService('utils');
/**
 * Gerar ID único para requisições
 */
function generateRequestId() {
    return (0, uuid_1.v4)();
}
/**
 * Criar resposta de sucesso padronizada
 */
function createSuccessResponse(data, requestId) {
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
function createErrorResponse(code, message, details, requestId) {
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
function sendSuccessResponse(res, data, statusCode = 200, requestId) {
    res.status(statusCode).json(createSuccessResponse(data, requestId));
}
/**
 * Enviar resposta de erro
 */
function sendErrorResponse(res, code, message, statusCode = 400, details, requestId) {
    res.status(statusCode).json(createErrorResponse(code, message, details, requestId));
}
/**
 * Extrair ID da requisição do header ou gerar novo
 */
function getRequestId(req) {
    return req.headers['x-request-id'] || generateRequestId();
}
/**
 * Validar se um valor é um UUID válido
 */
function isValidUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
/**
 * Sanitizar string removendo caracteres especiais
 */
function sanitizeString(str) {
    return str.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
}
/**
 * Converter bytes para formato legível
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * Delay assíncrono
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry com backoff exponencial
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000, backoffMultiplier = 2) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                throw lastError;
            }
            const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Verificar se um erro é retryable
 */
function isRetryableError(error) {
    if (!error)
        return false;
    const err = error;
    // Erros de rede
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        return true;
    }
    // Erros HTTP 5xx e 429
    if (err.response?.status && (err.response.status >= 500 || err.response.status === 429)) {
        return true;
    }
    return false;
}
/**
 * Truncar texto mantendo palavras completas
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}
/**
 * Normalizar nome de arquivo
 */
function normalizeFileName(fileName) {
    return fileName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
/**
 * Validar email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Schemas Zod comuns
 */
exports.CommonSchemas = {
    uuid: zod_1.z.string().uuid('ID deve ser um UUID válido'),
    email: zod_1.z.string().email('Email deve ter formato válido'),
    nonEmptyString: zod_1.z.string().min(1, 'Campo não pode estar vazio'),
    positiveNumber: zod_1.z.number().positive('Número deve ser positivo'),
    pagination: zod_1.z.object({
        page: zod_1.z.number().int().min(1).default(1),
        limit: zod_1.z.number().int().min(1).max(100).default(20)
    })
};
/**
 * Validar acesso à organização
 */
function validateOrganizationAccess(userOrgId, targetOrgId) {
    return userOrgId === targetOrgId;
}
//# sourceMappingURL=index.js.map