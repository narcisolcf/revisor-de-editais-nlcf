"use strict";
/**
 * Setup para testes de segurança
 *
 * Configurações e mocks compartilhados para todos os testes de segurança.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockFirestore = void 0;
exports.setupTestServices = setupTestServices;
exports.cleanupTestServices = cleanupTestServices;
exports.getTestServices = getTestServices;
exports.wait = wait;
exports.createMockRequest = createMockRequest;
exports.createMockResponse = createMockResponse;
exports.createMockNext = createMockNext;
const globals_1 = require("@jest/globals");
const LoggingService_1 = require("../../services/LoggingService");
const MetricsService_1 = require("../../services/MetricsService");
const AuditService_1 = require("../../services/AuditService");
const security_1 = require("../../middleware/security");
// Mock do Firestore com tipagem correta
exports.mockFirestore = {
    collection: globals_1.jest.fn(() => ({
        doc: globals_1.jest.fn(() => ({
            get: globals_1.jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
            set: globals_1.jest.fn(() => Promise.resolve()),
            update: globals_1.jest.fn(() => Promise.resolve()),
            delete: globals_1.jest.fn(() => Promise.resolve())
        })),
        where: globals_1.jest.fn(() => exports.mockFirestore.collection()),
        orderBy: globals_1.jest.fn(() => exports.mockFirestore.collection()),
        limit: globals_1.jest.fn(() => exports.mockFirestore.collection()),
        get: globals_1.jest.fn(() => Promise.resolve({ docs: [], empty: true, size: 0 })),
        add: globals_1.jest.fn(() => Promise.resolve({ id: 'mock-id' }))
    }))
};
// Instâncias de serviços para testes
let testLogger;
let testMetrics;
let testAuditService;
let testSecurityManager;
/**
 * Inicializar serviços de teste
 */
function setupTestServices() {
    // Limpar logs e métricas anteriores
    LoggingService_1.LoggingService.clearTestLogs();
    // Criar instâncias de teste
    testLogger = new LoggingService_1.LoggingService('test-api', 'test');
    testMetrics = new MetricsService_1.MetricsService('test-api', 'test');
    testMetrics.clear();
    testAuditService = new AuditService_1.AuditService(testLogger);
    // Inicializar SecurityManager com configuração de teste
    testSecurityManager = (0, security_1.initializeSecurity)(exports.mockFirestore, testLogger, testMetrics, {
        rateLimit: {
            windowMs: 1000, // 1 segundo para testes rápidos
            maxRequests: 5, // Limite baixo para testar facilmente
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        },
        audit: {
            enabled: true,
            sensitiveFields: ['password', 'token', 'secret'],
            excludePaths: ['/health']
        },
        headers: {
            contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';",
            strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
            xFrameOptions: 'DENY',
            xContentTypeOptions: 'nosniff',
            referrerPolicy: 'strict-origin-when-cross-origin'
        }
    });
    return {
        logger: testLogger,
        metrics: testMetrics,
        auditService: testAuditService,
        securityManager: testSecurityManager
    };
}
/**
 * Limpar recursos de teste
 */
function cleanupTestServices() {
    if (testSecurityManager) {
        testSecurityManager.destroy();
    }
    if (testMetrics) {
        testMetrics.clear();
    }
    LoggingService_1.LoggingService.clearTestLogs();
    // Limpar mocks
    globals_1.jest.clearAllMocks();
}
/**
 * Obter instâncias de teste
 */
function getTestServices() {
    if (!testSecurityManager) {
        return setupTestServices();
    }
    return {
        logger: testLogger,
        metrics: testMetrics,
        auditService: testAuditService,
        securityManager: testSecurityManager
    };
}
/**
 * Aguardar um tempo específico (útil para testes de rate limiting)
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Criar mock de request para testes
 */
function createMockRequest(overrides = {}) {
    return {
        method: 'GET',
        path: '/api/test',
        url: '/api/test',
        headers: {
            'user-agent': 'test-agent',
            'x-forwarded-for': '127.0.0.1'
        },
        ip: '127.0.0.1',
        body: {},
        query: {},
        params: {},
        get: function (header) {
            return this.headers[header.toLowerCase()];
        },
        ...overrides
    };
}
/**
 * Criar mock de response para testes
 */
function createMockResponse() {
    const headers = {};
    const mockResponse = {
        headers,
        statusCode: 200,
        setHeader: globals_1.jest.fn((name, value) => {
            headers[name.toLowerCase()] = value;
            return mockResponse;
        }),
        removeHeader: globals_1.jest.fn((name) => {
            delete headers[name.toLowerCase()];
            return mockResponse;
        }),
        getHeader: globals_1.jest.fn((name) => {
            return headers[name.toLowerCase()];
        }),
        status: globals_1.jest.fn(() => mockResponse),
        json: globals_1.jest.fn(() => mockResponse),
        send: globals_1.jest.fn(() => mockResponse),
        end: globals_1.jest.fn(() => mockResponse)
    };
    return mockResponse;
}
/**
 * Criar mock de next function
 */
function createMockNext() {
    return globals_1.jest.fn();
}
//# sourceMappingURL=setup.js.map