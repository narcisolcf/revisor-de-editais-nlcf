"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisRequestSchema = exports.PaginationSchema = exports.AnalysisIdSchema = exports.DocumentIdSchema = exports.ValidationError = void 0;
exports.validateData = validateData;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validatePathParams = validatePathParams;
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
        req.validatedBody = validation.data;
        next();
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
        req.validatedQuery = validation.data;
        next();
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
        req.validatedParams = validation.data;
        next();
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
//# sourceMappingURL=validation.js.map