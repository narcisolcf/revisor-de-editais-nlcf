/**
 * Testes para a API do ParameterEngine
 * Sprint 1 - LicitaReview
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ParameterEngine } from '../services/ParameterEngine';
import { OrganizationRepository, CustomParametersRepository } from '../db/repositories/OrganizationRepository';
import { AnalysisRepository } from '../db/repositories/AnalysisRepository';
import { ProblemCategory, ProblemSeverity } from '../types/analysis.types';
import { AnalysisPreset } from '../types/config.types';

// Mock do Firebase
jest.mock('../config/firebase', () => ({
  // Firebase mocks are handled by Jest configuration
}));

// Mock do ParameterEngine
jest.mock('../services/ParameterEngine');

// Interface para Problem
interface Problem {
  id: string;
  type: string;
  severity: string;
  description: string;
  location: string;
  suggestion: string;
}

interface MockRequest {
  user?: {
    uid: string;
    organizationId: string;
    role: string;
  };
}

interface MockResponse {
  status?: () => MockResponse;
  json?: () => MockResponse;
}

type MockNext = () => void;

// Mock da autenticação
jest.mock('../middleware/auth', () => ({
  authenticateUser: (req: MockRequest, res: MockResponse, next: MockNext) => {
    req.user = {
      uid: 'test-user-id',
      organizationId: 'test-org-id',
      role: 'ADMIN'
    };
    next();
  },
  requireOrganization: (req: MockRequest, res: MockResponse, next: MockNext) => next(),
  requirePermissions: jest.fn(() => {
    return (req: MockRequest, res: MockResponse, next: MockNext) => {
      next();
    };
  }),
  PERMISSIONS: {
    CONFIG_READ: 'config:read',
    CONFIG_WRITE: 'config:write'
  },
  ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER'
  }
}))

// Mock do rate limiting
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: MockRequest, res: MockResponse, next: MockNext) => next());
});

// Mock do helmet
jest.mock('helmet', () => {
  return jest.fn(() => (req: MockRequest, res: MockResponse, next: MockNext) => next());
});

// Mock do cors
jest.mock('cors', () => {
  return jest.fn(() => (req: MockRequest, res: MockResponse, next: MockNext) => next());
});

// Mock da configuração
jest.mock('../config', () => ({
  config: {
    corsOrigin: '*',
    maxRequestSize: '10mb',
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 100
  }
}));

// Mock do logger
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

import { Application } from 'express';

describe('ParameterEngine API', () => {
  let app: Application;
  let mockParameterEngine: jest.Mocked<ParameterEngine>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock ParameterEngine instance
    mockParameterEngine = {
      generateParameters: jest.fn(),
      optimizeParameters: jest.fn(),
      clearCache: jest.fn(),
      getEngineStats: jest.fn()
    } as any;

    (ParameterEngine as jest.MockedClass<typeof ParameterEngine>).mockImplementation(() => mockParameterEngine);

    // Import app after mocks are set up
    const { parameterEngineApi } = await import('../api/parameter-engine');
    // Extract the Express app from the Cloud Function
    app = (parameterEngineApi as any).__express;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('GET /parameters', () => {
    it('deve gerar parâmetros com sucesso', async () => {
      const mockParameters = {
      organizationId: 'test-org-id',
      weights: {
        structural: 40,
        legal: 30,
        clarity: 20,
        abnt: 10
      },
      customRules: [],
      preset: AnalysisPreset.STANDARD,
      metadata: {
        configVersion: 1,
        engineVersion: '1.0.0',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    };

      mockParameterEngine.generateParameters.mockResolvedValue(mockParameters);

      const response = await request(app)
        .get('/parameters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockParameters);
      expect(mockParameterEngine.generateParameters).toHaveBeenCalledWith('test-org-id');
    });

    it('deve lidar com erro de validação', async () => {
      mockParameterEngine.generateParameters.mockRejectedValue(new Error('Validation error'));

      const response = await request(app)
        .get('/parameters')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /optimize', () => {
    it('deve otimizar parâmetros com sucesso', async () => {
      const requestData = {
        analysisCount: 50,
        includeRecommendations: true
      };

      const mockOptimizationResult = {
        suggestedWeights: {
          structural: 45,
          legal: 25,
          clarity: 20,
          abnt: 10
        },
        reasoning: 'Otimização baseada em análises recentes',
        confidence: 0.85,
        basedOnAnalyses: 50,
        improvements: [
          {
            category: ProblemCategory.ESTRUTURAL,
            currentWeight: 40,
            suggestedWeight: 45,
            expectedImprovement: 5
          }
        ]
      };

      mockParameterEngine.optimizeParameters.mockResolvedValue(mockOptimizationResult);

      const response = await request(app)
        .post('/optimize')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOptimizationResult);
      expect(mockParameterEngine.optimizeParameters).toHaveBeenCalledWith(
        'test-org-id',
        requestData.includeRecommendations
      );
    });

    it('deve validar dados de entrada', async () => {
      const invalidData = {
        analysisCount: -1, // Inválido
        includeRecommendations: 'invalid' // Inválido
      };

      const response = await request(app)
        .post('/optimize')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /refresh-cache', () => {
    it('deve limpar cache com sucesso', async () => {
      const response = await request(app)
        .post('/refresh-cache')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cleared).toBe(true);
      expect(mockParameterEngine.clearCache).toHaveBeenCalledWith('test-org-id');
    });
  });

  describe('GET /engine/stats', () => {
    it('deve retornar estatísticas do engine', async () => {
      const mockStats = {
        version: '1.0.0',
        cacheSize: 5,
        totalOrganizations: 5,
        totalOptimizations: 25,
        averageImprovement: 12.5,
        cacheHitRate: 0.78,
        config: {
          enableAdaptiveWeights: true,
          enableLearningMode: true,
          adaptationThreshold: 10,
          maxWeightAdjustment: 15.0,
          cacheTimeout: 1800000
        }
      };

      mockParameterEngine.getEngineStats.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/engine/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('PUT /engine/config', () => {
    it('deve atualizar configuração do engine', async () => {
      const configUpdate = {
        enableAdaptiveWeights: false,
        adaptationThreshold: 15
      };

      const response = await request(app)
        .put('/engine/config')
        .send(configUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
    });

    it('deve validar configuração de entrada', async () => {
      const invalidConfig = {
        adaptationThreshold: -5, // Inválido
        maxWeightAdjustment: 100 // Inválido
      };

      const response = await request(app)
        .put('/engine/config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /health', () => {
    it('deve retornar status de saúde', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.version).toBeDefined();
    });
  });
});