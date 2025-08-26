"use strict";
/**
 * Configuração global para testes
 * LicitaReview - Sistema de Análise de Editais
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Configurar timeout global para testes
globals_1.jest.setTimeout(30000);
// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.GCLOUD_PROJECT = 'test-project';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
// Mock básico do Firebase Admin SDK
globals_1.jest.mock('firebase-admin', () => ({
    initializeApp: globals_1.jest.fn(),
    credential: {
        cert: globals_1.jest.fn(),
        applicationDefault: globals_1.jest.fn()
    },
    firestore: globals_1.jest.fn(() => ({
        collection: globals_1.jest.fn(),
        doc: globals_1.jest.fn(),
        batch: globals_1.jest.fn(),
        runTransaction: globals_1.jest.fn()
    }))
}));
// Mock básico do Firebase Functions
globals_1.jest.mock('firebase-functions', () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }
}));
// Mock básico do Express
globals_1.jest.mock('express', () => {
    const mockApp = {
        use: globals_1.jest.fn(),
        get: globals_1.jest.fn(),
        post: globals_1.jest.fn(),
        put: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        listen: globals_1.jest.fn()
    };
    const mockExpress = globals_1.jest.fn(() => mockApp);
    mockExpress.json = globals_1.jest.fn();
    mockExpress.Router = globals_1.jest.fn(() => mockApp);
    return mockExpress;
});
// Mock de middlewares
globals_1.jest.mock('cors', () => globals_1.jest.fn(() => globals_1.jest.fn()));
globals_1.jest.mock('helmet', () => globals_1.jest.fn(() => globals_1.jest.fn()));
// Mock do Axios
globals_1.jest.mock('axios', () => ({
    create: globals_1.jest.fn(() => ({
        get: globals_1.jest.fn(),
        post: globals_1.jest.fn()
    })),
    get: globals_1.jest.fn(),
    post: globals_1.jest.fn()
}));
// Limpeza após cada teste
afterEach(() => {
    globals_1.jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map