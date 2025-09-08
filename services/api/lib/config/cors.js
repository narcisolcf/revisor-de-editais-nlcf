"use strict";
/**
 * Configuração CORS
 * LicitaReview - Sistema de Análise de Editais
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCorsConfig = exports.productionCorsConfig = exports.developmentCorsConfig = exports.corsConfig = void 0;
// Configuração CORS para desenvolvimento
const developmentCorsConfig = {
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key',
        'X-Organization-ID'
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After'
    ],
    maxAge: 86400 // 24 horas
};
exports.developmentCorsConfig = developmentCorsConfig;
// Configuração CORS para produção
const productionCorsConfig = {
    origin: [
        'https://licitareview.com',
        'https://www.licitareview.com',
        'https://app.licitareview.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key',
        'X-Organization-ID'
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ],
    maxAge: 86400 // 24 horas
};
exports.productionCorsConfig = productionCorsConfig;
// Configuração CORS para testes
const testCorsConfig = {
    origin: true, // Permite qualquer origem em testes
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key',
        'X-Organization-ID',
        'X-Test-Header'
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
        'X-Test-Response'
    ],
    maxAge: 0 // Sem cache em testes
};
exports.testCorsConfig = testCorsConfig;
// Selecionar configuração baseada no ambiente
const getEnvironment = () => {
    return process.env.NODE_ENV || 'development';
};
exports.corsConfig = (() => {
    const env = getEnvironment();
    switch (env) {
        case 'production':
            return productionCorsConfig;
        case 'test':
            return testCorsConfig;
        case 'development':
        default:
            return developmentCorsConfig;
    }
})();
//# sourceMappingURL=cors.js.map