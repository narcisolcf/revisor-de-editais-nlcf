/**
 * Testes unitários para AnalysisOrchestrator
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnalysisOrchestrator } from '../../services/AnalysisOrchestrator';
import { CloudRunClient } from '../../services/CloudRunClient';
import { TaskQueueService } from '../../services/TaskQueueService';
import { NotificationService } from '../../services/NotificationService';
import { DocumentRepository } from '../../db/repositories/DocumentRepository';
import { AnalysisRepository } from '../../db/repositories/AnalysisRepository';
import { OrganizationRepository } from '../../db/repositories/OrganizationRepository';
import { AnalysisStatus, AnalysisPriority } from '../../types/config.types';
import { testData } from '../setup';

// Mocks dos serviços
jest.mock('../../services/CloudRunClient');
jest.mock('../../services/TaskQueueService');
jest.mock('../../services/NotificationService');
jest.mock('../../db/repositories/DocumentRepository');
jest.mock('../../db/repositories/AnalysisRepository');
jest.mock('../../db/repositories/OrganizationRepository');

describe('AnalysisOrchestrator', () => {
  let orchestrator: AnalysisOrchestrator;
  let mockCloudRunClient: jest.Mocked<CloudRunClient>;
  let mockTaskQueue: jest.Mocked<TaskQueueService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockDocumentRepo: jest.Mocked<DocumentRepository>;
  let mockAnalysisRepo: jest.Mocked<AnalysisRepository>;
  let mockOrganizationRepo: jest.Mocked<OrganizationRepository>;

  beforeEach(() => {
    // Criar mocks
    mockCloudRunClient = {
      analyzeDocument: jest.fn(),
      healthCheck: jest.fn(),
      isHealthy: jest.fn()
    } as any;

    mockTaskQueue = {
      enqueue: jest.fn(),
      dequeue: jest.fn(),
      getQueueStatus: jest.fn()
    } as any;

    mockNotificationService = {
      sendAnalysisComplete: jest.fn(),
      sendAnalysisError: jest.fn(),
      sendAnalysisStarted: jest.fn()
    } as any;

    mockDocumentRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    } as any;

    mockAnalysisRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByDocumentId: jest.fn()
    } as any;

    mockOrganizationRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    } as any;

    // Inicializar orchestrator
    orchestrator = new AnalysisOrchestrator(
      mockCloudRunClient,
      mockTaskQueue,
      mockNotificationService,
      mockDocumentRepo,
      mockAnalysisRepo,
      mockOrganizationRepo
    );
  });

  describe('startAnalysis', () => {
    it('deve iniciar uma análise com sucesso', async () => {
      // Arrange
      const analysisRequest = {
        documentId: testData.document.id,
        organizationId: testData.organization.id,
        userId: testData.user.uid,
        priority: AnalysisPriority.MEDIUM,
        options: {
          forceReanalysis: false,
          includeDetailedReport: true
        }
      };

      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PENDING
      };

      mockAnalysisRepo.create.mockResolvedValue(mockAnalysis);
      mockTaskQueue.enqueue.mockResolvedValue(undefined);
      mockNotificationService.sendAnalysisStarted.mockResolvedValue(undefined);

      // Act
      const result = await orchestrator.startAnalysis(analysisRequest);

      // Assert
      expect(result).toEqual(mockAnalysis);
      expect(mockAnalysisRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        documentId: analysisRequest.documentId,
        organizationId: analysisRequest.organizationId,
        userId: analysisRequest.userId,
        status: AnalysisStatus.PENDING,
        priority: analysisRequest.priority
      }));
      expect(mockTaskQueue.enqueue).toHaveBeenCalled();
      expect(mockNotificationService.sendAnalysisStarted).toHaveBeenCalledWith(mockAnalysis);
    });

    it('deve falhar se o documento não existir', async () => {
      // Arrange
      const analysisRequest = {
        documentId: 'non-existent-doc',
        organizationId: testData.organization.id,
        userId: testData.user.uid,
        priority: AnalysisPriority.MEDIUM,
        options: {}
      };

      mockDocumentRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(orchestrator.startAnalysis(analysisRequest))
        .rejects
        .toThrow('Document not found');
    });

    it('deve falhar se a organização não existir', async () => {
      // Arrange
      const analysisRequest = {
        documentId: testData.document.id,
        organizationId: 'non-existent-org',
        userId: testData.user.uid,
        priority: AnalysisPriority.MEDIUM,
        options: {}
      };

      mockDocumentRepo.findById.mockResolvedValue(testData.document);
      mockOrganizationRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(orchestrator.startAnalysis(analysisRequest))
        .rejects
        .toThrow('Organization not found');
    });
  });

  describe('processAnalysis', () => {
    it('deve processar uma análise com sucesso', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PROCESSING
      };

      const mockDocument = testData.document;
      const mockOrganization = testData.organization;
      
      const mockAnalysisResult = {
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
            category: 'structural',
            message: 'Seção de especificações técnicas incompleta',
            severity: 'medium',
            location: { page: 5, section: '3.2' }
          }
        ],
        recommendations: [
          'Incluir especificações técnicas detalhadas',
          'Revisar critérios de avaliação'
        ],
        metadata: {
          processingTime: 12000,
          aiConfidence: 0.92,
          rulesApplied: 15,
          version: '1.0.0'
        }
      };

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);
      mockDocumentRepo.findById.mockResolvedValue(mockDocument);
      mockOrganizationRepo.findById.mockResolvedValue(mockOrganization);
      mockCloudRunClient.analyzeDocument.mockResolvedValue(mockAnalysisResult);
      mockAnalysisRepo.update.mockResolvedValue({
        ...mockAnalysis,
        status: AnalysisStatus.COMPLETED,
        result: mockAnalysisResult
      });
      mockNotificationService.sendAnalysisComplete.mockResolvedValue(undefined);

      // Act
      const result = await orchestrator.processAnalysis(mockAnalysis.id);

      // Assert
      expect(result.status).toBe(AnalysisStatus.COMPLETED);
      expect(result.result).toEqual(mockAnalysisResult);
      expect(mockCloudRunClient.analyzeDocument).toHaveBeenCalledWith(expect.objectContaining({
        document: mockDocument,
        organizationConfig: mockOrganization
      }));
      expect(mockNotificationService.sendAnalysisComplete).toHaveBeenCalled();
    });

    it('deve lidar com falhas na análise', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PROCESSING
      };

      const mockError = new Error('Cloud Run service unavailable');

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);
      mockDocumentRepo.findById.mockResolvedValue(testData.document);
      mockOrganizationRepo.findById.mockResolvedValue(testData.organization);
      mockCloudRunClient.analyzeDocument.mockRejectedValue(mockError);
      mockAnalysisRepo.update.mockResolvedValue({
        ...mockAnalysis,
        status: AnalysisStatus.FAILED,
        error: mockError.message
      });
      mockNotificationService.sendAnalysisError.mockResolvedValue(undefined);

      // Act
      const result = await orchestrator.processAnalysis(mockAnalysis.id);

      // Assert
      expect(result.status).toBe(AnalysisStatus.FAILED);
      expect(result.error).toBe(mockError.message);
      expect(mockNotificationService.sendAnalysisError).toHaveBeenCalled();
    });

    it('deve implementar retry logic para falhas temporárias', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PROCESSING,
        retryCount: 0
      };

      const temporaryError = new Error('Network timeout - ECONNRESET');
      const successResult = {
        scores: { overall: 85 },
        findings: [],
        recommendations: [],
        metadata: { processingTime: 10000 }
      };

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);
      mockDocumentRepo.findById.mockResolvedValue(testData.document);
      mockOrganizationRepo.findById.mockResolvedValue(testData.organization);
      
      // Primeira chamada falha, segunda sucede
      mockCloudRunClient.analyzeDocument
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce(successResult);
      
      mockAnalysisRepo.update.mockResolvedValue({
        ...mockAnalysis,
        status: AnalysisStatus.COMPLETED,
        result: successResult,
        retryCount: 1
      });
      mockNotificationService.sendAnalysisComplete.mockResolvedValue(undefined);

      // Act
      const result = await orchestrator.processAnalysis(mockAnalysis.id);

      // Assert
      expect(result.status).toBe(AnalysisStatus.COMPLETED);
      expect(result.retryCount).toBe(1);
      expect(mockCloudRunClient.analyzeDocument).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAnalysisProgress', () => {
    it('deve retornar o progresso da análise', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PROCESSING,
        progress: {
          currentStep: 'analyzing_content',
          totalSteps: 5,
          completedSteps: 2,
          estimatedTimeRemaining: 30000
        }
      };

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);

      // Act
      const progress = await orchestrator.getAnalysisProgress(mockAnalysis.id);

      // Assert
      expect(progress).toEqual(mockAnalysis.progress);
    });

    it('deve retornar null se a análise não existir', async () => {
      // Arrange
      mockAnalysisRepo.findById.mockResolvedValue(null);

      // Act
      const progress = await orchestrator.getAnalysisProgress('non-existent-id');

      // Assert
      expect(progress).toBeNull();
    });
  });

  describe('cancelAnalysis', () => {
    it('deve cancelar uma análise em andamento', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.PROCESSING
      };

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);
      mockAnalysisRepo.update.mockResolvedValue({
        ...mockAnalysis,
        status: AnalysisStatus.CANCELLED,
        cancelledAt: new Date()
      });

      // Act
      const result = await orchestrator.cancelAnalysis(mockAnalysis.id, testData.user.uid);

      // Assert
      expect(result.status).toBe(AnalysisStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
      expect(mockAnalysisRepo.update).toHaveBeenCalledWith(
        mockAnalysis.id,
        expect.objectContaining({
          status: AnalysisStatus.CANCELLED,
          cancelledBy: testData.user.uid
        })
      );
    });

    it('deve falhar ao tentar cancelar análise já concluída', async () => {
      // Arrange
      const mockAnalysis = {
        ...testData.analysis,
        status: AnalysisStatus.COMPLETED
      };

      mockAnalysisRepo.findById.mockResolvedValue(mockAnalysis);

      // Act & Assert
      await expect(orchestrator.cancelAnalysis(mockAnalysis.id, testData.user.uid))
        .rejects
        .toThrow('Cannot cancel completed analysis');
    });
  });

  describe('listActiveAnalyses', () => {
    it('deve listar análises ativas para uma organização', async () => {
      // Arrange
      const mockActiveAnalyses = [
        { ...testData.analysis, status: AnalysisStatus.PROCESSING },
        { ...testData.analysis, id: 'analysis-2', status: AnalysisStatus.PENDING }
      ];

      mockAnalysisRepo.findByOrganizationId = jest.fn().mockResolvedValue(mockActiveAnalyses);

      // Act
      const result = await orchestrator.listActiveAnalyses(testData.organization.id);

      // Assert
      expect(result).toEqual(mockActiveAnalyses);
      expect(mockAnalysisRepo.findByOrganizationId).toHaveBeenCalledWith(
        testData.organization.id,
        expect.objectContaining({
          status: { in: [AnalysisStatus.PENDING, AnalysisStatus.PROCESSING] }
        })
      );
    });
  });

  describe('retry logic', () => {
    it('deve implementar backoff exponencial', () => {
      // Arrange & Act
      const delay1 = (orchestrator as any).calculateRetryDelay(1);
      const delay2 = (orchestrator as any).calculateRetryDelay(2);
      const delay3 = (orchestrator as any).calculateRetryDelay(3);

      // Assert
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3).toBeLessThanOrEqual(10000); // maxRetryDelayMs
    });

    it('deve identificar erros retryáveis corretamente', () => {
      // Arrange
      const retryableErrors = [
        new Error('Network timeout'),
        new Error('ECONNRESET'),
        new Error('Service unavailable - 503'),
        new Error('Rate limit exceeded - 429'),
        new Error('Firestore unavailable')
      ];

      const nonRetryableErrors = [
        new Error('Invalid input format'),
        new Error('Authentication failed'),
        new Error('Permission denied')
      ];

      // Act & Assert
      retryableErrors.forEach(error => {
        expect((orchestrator as any).isRetryableError(error)).toBe(true);
      });

      nonRetryableErrors.forEach(error => {
        expect((orchestrator as any).isRetryableError(error)).toBe(false);
      });
    });
  });
});