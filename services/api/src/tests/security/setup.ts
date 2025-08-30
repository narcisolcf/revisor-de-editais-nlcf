/**
 * Setup para testes de segurança
 * 
 * Configurações e mocks compartilhados para todos os testes de segurança.
 */

import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import { getFirestore } from 'firebase-admin/firestore';
import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../services/MetricsService';
import { AuditService } from '../../services/AuditService';
import { initializeSecurity, SecurityManager } from '../../middleware/security';

// Mock do Firestore com tipagem correta
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    where: jest.fn(() => mockFirestore.collection()),
    orderBy: jest.fn(() => mockFirestore.collection()),
    limit: jest.fn(() => mockFirestore.collection()),
    get: jest.fn(() => Promise.resolve({ docs: [], empty: true, size: 0 })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-id' }))
  }))
} as any;

// Instâncias de serviços para testes
let testLogger: LoggingService;
let testMetrics: MetricsService;
let testAuditService: AuditService;
let testSecurityManager: SecurityManager;

/**
 * Inicializar serviços de teste
 */
export function setupTestServices(): {
  logger: LoggingService;
  metrics: MetricsService;
  auditService: AuditService;
  securityManager: SecurityManager;
} {
  // Limpar logs e métricas anteriores
  LoggingService.clearTestLogs();
  
  // Criar instâncias de teste
  testLogger = new LoggingService('test-api', 'test');
  testMetrics = new MetricsService('test-api', 'test');
  testMetrics.clear();
  
  testAuditService = new AuditService(testLogger);
  
  // Inicializar SecurityManager com configuração de teste
  testSecurityManager = initializeSecurity(
    mockFirestore,
    testLogger,
    testMetrics,
    {
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
    }
  );

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
export function cleanupTestServices(): void {
  if (testSecurityManager) {
    testSecurityManager.destroy();
  }
  
  if (testMetrics) {
    testMetrics.clear();
  }
  
  LoggingService.clearTestLogs();
  
  // Limpar mocks
  jest.clearAllMocks();
}

/**
 * Obter instâncias de teste
 */
export function getTestServices(): {
  logger: LoggingService;
  metrics: MetricsService;
  auditService: AuditService;
  securityManager: SecurityManager;
} {
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
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Criar mock de request para testes
 */
export function createMockRequest(overrides: any = {}): any {
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
    get: function(header: string) {
      return this.headers[header.toLowerCase()];
    },
    ...overrides
  };
}

/**
 * Criar mock de response para testes
 */
export function createMockResponse(): any {
  const headers: Record<string, string> = {};
  const mockResponse = {
    headers,
    statusCode: 200,
    setHeader: jest.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
      return mockResponse;
    }),
    removeHeader: jest.fn((name: string) => {
      delete headers[name.toLowerCase()];
      return mockResponse;
    }),
    getHeader: jest.fn((name: string) => {
      return headers[name.toLowerCase()];
    }),
    status: jest.fn(() => mockResponse),
    json: jest.fn(() => mockResponse),
    send: jest.fn(() => mockResponse),
    end: jest.fn(() => mockResponse)
  };
  
  return mockResponse;
}

/**
 * Criar mock de next function
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}