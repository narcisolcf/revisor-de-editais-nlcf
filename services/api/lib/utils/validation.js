"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUIDSchema = exports.AnalysisRequestSchema = exports.PaginationSchema = exports.AnalysisIdSchema = exports.DocumentIdSchema = exports.ValidationError = void 0;
exports.validateData = validateData;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validatePathParams = validatePathParams;
exports.validateRequestBody = validateRequestBody;
exports.validateQueryParams = validateQueryParams;
const zod_1 = require("zod");
/**
 * Classe de erro de validação
 */
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
/**
 * Valida dados usando schema Zod
 */
function validateData(schema, data) {
    try {
        const result = schema.parse(data);
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateBody(schema) {
    return (req, res, next) => {
        const validation = validateData(schema, req.body);
        if (!validation.success) {
            throw new ValidationError(validation.error, validation.details);
        }
        req.body = validation.data;
        return next();
    };
}
/**
 * Middleware para validar query parameters
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const validation = validateData(schema, req.query);
        if (!validation.success) {
            throw new ValidationError(validation.error, validation.details);
        }
        req.query = validation.data;
        return next();
    };
}
/**
 * Middleware para validar path parameters
 */
function validatePathParams(schema) {
    return (req, res, next) => {
        const validation = validateData(schema, req.params);
        if (!validation.success) {
            throw new ValidationError(validation.error, validation.details);
        }
        req.params = validation.data;
        return next();
    };
}
// Schemas comuns
exports.DocumentIdSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1, 'Document ID is required')
});
exports.AnalysisIdSchema = zod_1.z.object({
    analysisId: zod_1.z.string().min(1, 'Analysis ID is required')
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20)
});
exports.AnalysisRequestSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1, 'Document ID is required'),
    priority: zod_1.z.enum(['low', 'normal', 'high']).default('normal'),
    analysisType: zod_1.z.enum(['basic', 'detailed', 'comprehensive']).default('basic'),
    options: zod_1.z.object({
        includeAI: zod_1.z.boolean().default(true),
        generateRecommendations: zod_1.z.boolean().default(true),
        detailedMetrics: zod_1.z.boolean().default(false)
    }).optional()
});
// Schemas adicionais
exports.UUIDSchema = zod_1.z.string().uuid('ID deve ser um UUID válido');
// Função para validar corpo da requisição
function validateRequestBody(schema) {
    return (req, res, next) => {
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
function validateQueryParams(schema) {
    return (req, res, next) => {
        const result = validateData(schema, req.query);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                details: result.details
            });
        }
        req.query = result.data;
        return next();
    };
}
//# sourceMappingURL=validation.js.map