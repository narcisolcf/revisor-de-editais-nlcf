/**
 * Configuração global para testes
 * LicitaReview - Sistema de Análise de Editais
 */

import { jest } from '@jest/globals';

// Configurar timeout global para testes
jest.setTimeout(30000);

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.GCLOUD_PROJECT = 'test-project';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';

// Mock básico do Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
    applicationDefault: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
    runTransaction: jest.fn()
  }))
}));

// Mock básico do Firebase Functions
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock básico do Express
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn()
  };
  
  interface MockExpress {
    (): typeof mockApp;
    json: jest.Mock;
    Router: jest.Mock;
  }
  
  const mockExpress = jest.fn(() => mockApp) as MockExpress;
  mockExpress.json = jest.fn();
  mockExpress.Router = jest.fn(() => mockApp);
  return mockExpress;
});

// Mock de middlewares
jest.mock('cors', () => jest.fn(() => jest.fn()));
jest.mock('helmet', () => jest.fn(() => jest.fn()));

// Mock do Axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn()
  })),
  get: jest.fn(),
  post: jest.fn()
}));

// Limpeza após cada teste
afterEach(() => {
  jest.clearAllMocks();
});