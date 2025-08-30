/**
 * Testes unitários para CloudRunClient
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { CloudRunClient } from '../../services/CloudRunClient';
import { GoogleAuth } from 'google-auth-library';
import { testData } from '../setup';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do GoogleAuth
jest.mock('google-auth-library');
const MockedGoogleAuth = GoogleAuth as jest.MockedClass<typeof GoogleAuth>;

describe('CloudRunClient', () => {
  let client: CloudRunClient;
  let mockAuth: jest.Mocked<GoogleAuth>;
  let mockAxiosInstance: jest.Mocked<any>;

  const serviceUrl = 'https://test-service-url.run.app';
  const circuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 10000
  };
  const retryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  // Mock data para análise de documentos
  const mockAnalysisRequest = {
    document_content: testData.document.content,
    document_type: 'pdf',
    classification: {
      type: 'edital',
      category: 'obras',
      confidence: 0.95
    },
    organization_config: {
      id: testData.organization.id,
      weights: {
        structural: 25,
        legal: 25,
        clarity: 25,
        abnt: 25
      },
      customRules: [],
      templates: []
    },
    analysis_options: {
      includeDetailedReport: true,
      analysisDepth: 'comprehensive'
    },
    metadata: {
      document_id: testData.document.id,
      file_size: 1024000,
      upload_date: new Date()
    }
  };

  beforeEach(() => {
    // Setup mocks
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
      getClient: jest.fn(),
      getCredentials: jest.fn()
    } as jest.Mocked<GoogleAuth>;

    MockedGoogleAuth.mockImplementation(() => mockAuth);

    // Inicializar cliente
    client = new CloudRunClient(serviceUrl, circuitBreakerConfig, retryConfig);
  });

  describe('constructor', () => {
    it('deve inicializar com configurações corretas', () => {
      expect(client).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: serviceUrl,
        timeout: 300000, // 5 minutos
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('healthCheck', () => {
    it('deve retornar status saudável', async () => {
      // Arrange
      const mockHealthResponse = {
        status: 200,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: 3600
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockHealthResponse);

      // Act
      const result = await client.healthCheck();

      // Assert
      expect(result).toEqual(mockHealthResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('deve lidar com falhas no health check', async () => {
      // Arrange
      const mockError = new Error('Service unavailable');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(client.healthCheck()).rejects.toThrow('Service unavailable');
    });
  });

  describe('analyzeDocument', () => {

    it('deve analisar documento com sucesso', async () => {
      // Arrange
      const mockAnalysisResponse = {
        status: 200,
        data: {
          scores: {
            structural: 85,
            legal: 90,
            clarity: 80,
            abnt: 88,
            overall: 86
          },
          findings: [
            {
              type: 'warning',
              category: 'ESTRUTURAL',
              message: 'Seção incompleta',
              severity: 'MEDIA',
              location: { page: 5, section: '3.2' }
            }
          ],
          recommendations: [
            'Incluir especificações técnicas detalhadas'
          ],
          metadata: {
            processingTime: 12000,
            aiConfidence: 0.92,
            rulesApplied: 15,
            version: '1.0.0'
          }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockAnalysisResponse);

      // Act
      const result = await client.analyzeDocument(mockAnalysisRequest);

      // Assert
      expect(result).toEqual(mockAnalysisResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/analyze', mockAnalysisRequest);
    });

    it('deve implementar retry para falhas temporárias', async () => {
      // Arrange
      const temporaryError = {
        response: { status: 503 },
        message: 'Service temporarily unavailable'
      };
      const successResponse = {
        status: 200,
        data: { scores: { overall: 85 }, findings: [], recommendations: [] }
      };

      mockAxiosInstance.post
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce(successResponse);

      // Act
      const result = await client.analyzeDocument(mockAnalysisRequest);

      // Assert
      expect(result).toEqual(successResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após esgotar tentativas de retry', async () => {
      // Arrange
      const persistentError = {
        response: { status: 503 },
        message: 'Service persistently unavailable'
      };

      mockAxiosInstance.post.mockRejectedValue(persistentError);

      // Act & Assert
      await expect(client.analyzeDocument(mockAnalysisRequest))
        .rejects
        .toThrow('Service persistently unavailable');
      
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(4); // 1 inicial + 3 retries
    });

    it('deve não fazer retry para erros não retryáveis', async () => {
      // Arrange
      const nonRetryableError = {
        response: { status: 400 },
        message: 'Bad request - invalid input'
      };

      mockAxiosInstance.post.mockRejectedValue(nonRetryableError);

      // Act & Assert
      await expect(client.analyzeDocument(mockAnalysisRequest))
        .rejects
        .toThrow('Bad request - invalid input');
      
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Sem retry
    });
  });

  describe('circuit breaker', () => {
    it('deve abrir o circuito após muitas falhas', async () => {
      // Arrange
      const error = {
        response: { status: 500 },
        message: 'Internal server error'
      };

      mockAxiosInstance.post.mockRejectedValue(error);

      // Act - Causar falhas suficientes para abrir o circuito
      for (let i = 0; i < circuitBreakerConfig.failureThreshold; i++) {
        try {
          await client.analyzeDocument(mockAnalysisRequest);
        } catch (e) {
          // Ignorar erros esperados
        }
      }

      // Assert - Próxima chamada deve falhar imediatamente (circuito aberto)
      const startTime = Date.now();
      try {
        await client.analyzeDocument(mockAnalysisRequest);
      } catch (e) {
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(100); // Falha rápida
      }
    });

    it('deve permitir tentativas após período de recuperação', async () => {
      // Arrange
      const error = {
        response: { status: 500 },
        message: 'Internal server error'
      };
      const successResponse = {
        status: 200,
        data: { scores: { overall: 85 }, findings: [], recommendations: [] }
      };

      // Abrir o circuito
      mockAxiosInstance.post.mockRejectedValue(error);
      for (let i = 0; i < circuitBreakerConfig.failureThreshold; i++) {
        try {
          await client.analyzeDocument(mockAnalysisRequest);
        } catch (e) {
          // Ignorar
        }
      }

      // Simular passagem do tempo de recuperação
      jest.advanceTimersByTime(circuitBreakerConfig.resetTimeout + 1000);

      // Configurar sucesso para próxima tentativa
      mockAxiosInstance.post.mockResolvedValue(successResponse);

      // Act
      const result = await client.analyzeDocument(mockAnalysisRequest);

      // Assert
      expect(result).toEqual(successResponse.data);
    });
  });

  describe('isRetryableError', () => {
    it('deve identificar erros retryáveis corretamente', () => {
      // Arrange
      const retryableErrors = [
        { response: { status: 429 } }, // Rate limit
        { response: { status: 500 } }, // Internal server error
        { response: { status: 502 } }, // Bad gateway
        { response: { status: 503 } }, // Service unavailable
        { response: { status: 504 } }, // Gateway timeout
        { code: 'ECONNRESET' },        // Network error
        { code: 'ETIMEDOUT' },         // Timeout
        { message: 'Network Error' }   // Generic network error
      ];

      const nonRetryableErrors = [
        { response: { status: 400 } }, // Bad request
        { response: { status: 401 } }, // Unauthorized
        { response: { status: 403 } }, // Forbidden
        { response: { status: 404 } }, // Not found
        { response: { status: 422 } }, // Unprocessable entity
        { message: 'Invalid input' }   // Application error
      ];

      // Act & Assert
      retryableErrors.forEach(error => {
        expect((client as unknown as { isRetryableError: (error: unknown) => boolean }).isRetryableError(error)).toBe(true);
      });

      nonRetryableErrors.forEach(error => {
        expect((client as unknown as { isRetryableError: (error: unknown) => boolean }).isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('retryWithBackoff', () => {
    it('deve implementar backoff exponencial', async () => {
      // Arrange
      // @ts-ignore
      const operation = jest.fn()
        // @ts-ignore
        .mockRejectedValueOnce(new Error('Temporary failure 1'))
        // @ts-ignore
        .mockRejectedValueOnce(new Error('Temporary failure 2'))
        // @ts-ignore
        .mockResolvedValueOnce('Success');

      const isRetryable = jest.fn().mockReturnValue(true);

      // Act
      // @ts-ignore
      const result = await (client as unknown as { retryWithBackoff: (op: () => Promise<string>, isRetryable: (error: unknown) => boolean, config: unknown) => Promise<string> }).retryWithBackoff(
        operation,
        isRetryable,
        retryConfig
      );

      // Assert
      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('deve respeitar o delay máximo', () => {
      // Arrange & Act
      const delay1 = (client as unknown as { calculateBackoffDelay: (attempt: number, config: unknown) => number }).calculateBackoffDelay(1, retryConfig);
      const delay2 = (client as unknown as { calculateBackoffDelay: (attempt: number, config: unknown) => number }).calculateBackoffDelay(2, retryConfig);
      const delay3 = (client as unknown as { calculateBackoffDelay: (attempt: number, config: unknown) => number }).calculateBackoffDelay(10, retryConfig); // Tentativa alta

      // Assert
      expect(delay1).toBe(retryConfig.initialDelay);
      expect(delay2).toBe(retryConfig.initialDelay * retryConfig.backoffMultiplier);
      expect(delay3).toBeLessThanOrEqual(retryConfig.maxDelay);
    });
  });

  describe('authentication', () => {
    it('deve adicionar token de autenticação às requisições', async () => {
      // Arrange
      const mockResponse = {
        status: 200,
        data: { status: 'healthy' }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      await client.healthCheck();

      // Assert
      expect(mockAuth.getAccessToken).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('deve lidar com falhas de autenticação', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      mockAuth.getAccessToken.mockRejectedValue(authError);

      // Act & Assert
      await expect(client.healthCheck()).rejects.toThrow('Authentication failed');
    });
  });

  describe('error handling', () => {
    it('deve mapear códigos de erro HTTP corretamente', () => {
      // Arrange
      const errorMappings = [
        { status: 400, expectedType: 'ValidationError' },
        { status: 401, expectedType: 'AuthenticationError' },
        { status: 403, expectedType: 'AuthorizationError' },
        { status: 404, expectedType: 'NotFoundError' },
        { status: 429, expectedType: 'RateLimitError' },
        { status: 500, expectedType: 'InternalServerError' },
        { status: 503, expectedType: 'ServiceUnavailableError' }
      ];

      // Act & Assert
      errorMappings.forEach(({ status, expectedType }) => {
        const error = { response: { status, data: { message: 'Test error' } } };
        const mappedError = (client as unknown as { handleHttpError: (error: unknown) => { name: string } }).handleHttpError(error);
        expect(mappedError.name).toBe(expectedType);
      });
    });

    it('deve preservar informações de erro originais', () => {
      // Arrange
      const originalError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            details: ['Field X is required', 'Field Y is invalid']
          }
        }
      };

      // Act
      const mappedError = (client as unknown as { handleHttpError: (error: unknown) => { message: string; details: string[]; statusCode: number } }).handleHttpError(originalError);

      // Assert
      expect(mappedError.message).toContain('Validation failed');
      expect(mappedError.details).toEqual(originalError.response.data.details);
      expect(mappedError.statusCode).toBe(400);
    });
  });
});