"use strict";
/**
 * Middleware de Validação de Requisições
 *
 * Utiliza Zod para validar dados de entrada das requisições
 * e retorna erros estruturados em caso de falha na validação.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlSchema = exports.cnpjSchema = exports.cpfSchema = exports.phoneSchema = exports.emailSchema = exports.OrganizationParamSchema = exports.DateRangeQuerySchema = exports.PaginationQuerySchema = exports.IdParamSchema = void 0;
exports.validateRequest = validateRequest;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.validateHeaders = validateHeaders;
exports.globalValidationErrorHandler = globalValidationErrorHandler;
exports.rangeSchema = rangeSchema;
exports.lengthSchema = lengthSchema;
const zod_1 = require("zod");
// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================
/**
 * Converte erros do Zod em formato mais amigável
 */
function formatZodErrors(error) {
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
function sanitizeQueryParams(query) {
    const sanitized = {};
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
function validateRequest(schemas) {
    return (req, res, next) => {
        try {
            const errors = [];
            // Validar body
            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        errors.push(...formatZodErrors(error));
                    }
                }
            }
            // Validar query (com sanitização)
            if (schemas.query) {
                try {
                    const sanitizedQuery = sanitizeQueryParams(req.query);
                    req.query = schemas.query.parse(sanitizedQuery);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        errors.push(...formatZodErrors(error));
                    }
                }
            }
            // Validar params
            if (schemas.params) {
                try {
                    req.params = schemas.params.parse(req.params);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        errors.push(...formatZodErrors(error));
                    }
                }
            }
            // Validar headers
            if (schemas.headers) {
                try {
                    req.headers = schemas.headers.parse(req.headers);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        errors.push(...formatZodErrors(error));
                    }
                }
            }
            // Se houver erros, retornar resposta de erro
            if (errors.length > 0) {
                const response = {
                    error: 'Dados de entrada inválidos',
                    message: 'A requisição contém dados que não atendem aos critérios de validação',
                    details: errors,
                    timestamp: new Date().toISOString()
                };
                return res.status(400).json(response);
            }
            next();
        }
        catch (error) {
            console.error('Erro no middleware de validação:', error);
            const response = {
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
function validateBody(schema) {
    return validateRequest({ body: schema });
}
/**
 * Middleware para validar apenas a query string
 */
function validateQuery(schema) {
    return validateRequest({ query: schema });
}
/**
 * Middleware para validar apenas os parâmetros da URL
 */
function validateParams(schema) {
    return validateRequest({ params: schema });
}
/**
 * Middleware para validar apenas os headers
 */
function validateHeaders(schema) {
    return validateRequest({ headers: schema });
}
// ============================================================================
// SCHEMAS COMUNS
// ============================================================================
/**
 * Schema para validação de ID (UUID)
 */
exports.IdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('ID deve ser um UUID válido')
});
/**
 * Schema para validação de paginação
 */
exports.PaginationQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().min(0).default(0)
});
/**
 * Schema para validação de período de datas
 */
exports.DateRangeQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional()
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
}, {
    message: 'Data de início deve ser anterior à data de fim',
    path: ['startDate']
});
/**
 * Schema para validação de organização
 */
exports.OrganizationParamSchema = zod_1.z.object({
    organizationId: zod_1.z.string().min(1, 'ID da organização é obrigatório')
});
// ============================================================================
// MIDDLEWARE DE ERRO GLOBAL
// ============================================================================
/**
 * Middleware global para capturar erros de validação não tratados
 */
function globalValidationErrorHandler(error, req, res, next) {
    if (error instanceof zod_1.ZodError) {
        const response = {
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
exports.emailSchema = zod_1.z.string().email('Email deve ter um formato válido');
/**
 * Valida se uma string é um telefone brasileiro válido
 */
exports.phoneSchema = zod_1.z.string().regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone deve ter um formato válido (ex: (11) 99999-9999)');
/**
 * Valida se uma string é um CPF válido
 */
exports.cpfSchema = zod_1.z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF deve ter um formato válido (ex: 123.456.789-00 ou 12345678900)');
/**
 * Valida se uma string é um CNPJ válido
 */
exports.cnpjSchema = zod_1.z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ deve ter um formato válido (ex: 12.345.678/0001-90 ou 12345678000190)');
/**
 * Valida se uma string é uma URL válida
 */
exports.urlSchema = zod_1.z.string().url('URL deve ter um formato válido');
/**
 * Valida se um valor está dentro de um range numérico
 */
function rangeSchema(min, max) {
    return zod_1.z.number().min(min, `Valor deve ser maior ou igual a ${min}`)
        .max(max, `Valor deve ser menor ou igual a ${max}`);
}
/**
 * Valida se uma string tem um tamanho específico
 */
function lengthSchema(min, max) {
    return zod_1.z.string()
        .min(min, `Texto deve ter pelo menos ${min} caracteres`)
        .max(max, `Texto deve ter no máximo ${max} caracteres`);
}
exports.default = {
    validateRequest,
    validateBody,
    validateQuery,
    validateParams,
    validateHeaders,
    globalValidationErrorHandler,
    IdParamSchema: exports.IdParamSchema,
    PaginationQuerySchema: exports.PaginationQuerySchema,
    DateRangeQuerySchema: exports.DateRangeQuerySchema,
    OrganizationParamSchema: exports.OrganizationParamSchema,
    emailSchema: exports.emailSchema,
    phoneSchema: exports.phoneSchema,
    cpfSchema: exports.cpfSchema,
    cnpjSchema: exports.cnpjSchema,
    urlSchema: exports.urlSchema,
    rangeSchema,
    lengthSchema
};
//# sourceMappingURL=validation.js.map