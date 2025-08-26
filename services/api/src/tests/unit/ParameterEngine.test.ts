/**
 * Testes unitários para ParameterEngine
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ParameterEngine } from '../../services/ParameterEngine';
import { Firestore } from 'firebase-admin/firestore';

// Mock do Firestore
const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: jest.fn().mockReturnValue({
          id: 'test-org',
          name: 'Test Organization',
          type: 'municipal',
          settings: {
            analysisPreset: 'balanced'
          }
        })
      }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined)
    }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [] as unknown[]
    })
  }),
  doc: jest.fn(),
  batch: jest.fn().mockReturnValue({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
  }),
  runTransaction: jest.fn()
} as unknown as Firestore;

describe('ParameterEngine', () => {
  let parameterEngine: ParameterEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    
    parameterEngine = new ParameterEngine(
      mockFirestore as Firestore,
      {
        enableAdaptiveWeights: true,
        enableLearningMode: true,
        adaptationThreshold: 10,
        maxWeightAdjustment: 15.0,
        cacheTimeout: 30 * 60 * 1000
      }
    );
  });

  describe('generateParameters', () => {
    it('deve gerar parâmetros de análise para uma organização', async () => {
      // Arrange
      const organizationId = 'test-org-id';

      // Act
      const parameters = await parameterEngine.generateParameters(organizationId);

      // Assert
      expect(parameters).toBeDefined();
      expect(parameters.organizationId).toBe(organizationId);
      expect(parameters.weights).toBeDefined();
      expect(parameters.customRules).toBeDefined();
      expect(parameters.preset).toBeDefined();
      expect(parameters.metadata).toBeDefined();
      expect(parameters.metadata.engineVersion).toBe('1.0.0');
    });

    it('deve usar cache quando forceRefresh é false', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      
      // Act - primeira chamada
      await parameterEngine.generateParameters(organizationId, false);
      
      // Act - segunda chamada
      await parameterEngine.generateParameters(organizationId, false);

      // Assert - deve ter chamado o Firestore apenas uma vez
      expect(mockFirestore.collection).toHaveBeenCalledTimes(2); // Uma para org, uma para customParams
    });

    it('deve ignorar cache quando forceRefresh é true', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      
      // Act - primeira chamada
      await parameterEngine.generateParameters(organizationId, false);
      
      // Act - segunda chamada com forceRefresh
      await parameterEngine.generateParameters(organizationId, true);

      // Assert - deve ter chamado o Firestore duas vezes
      expect(mockFirestore.collection).toHaveBeenCalledTimes(4); // Duas chamadas completas
    });
  });

  describe('configuração', () => {
    it('deve usar configuração padrão quando não fornecida', () => {
      // Arrange & Act
      const engine = new ParameterEngine(mockFirestore as Firestore);

      // Assert
      expect(engine).toBeDefined();
    });

    it('deve aceitar configuração customizada', () => {
      // Arrange
      const customConfig = {
        enableAdaptiveWeights: false,
        enableLearningMode: false,
        adaptationThreshold: 5,
        maxWeightAdjustment: 10.0,
        cacheTimeout: 60 * 60 * 1000
      };

      // Act
      const engine = new ParameterEngine(mockFirestore as Firestore, customConfig);

      // Assert
      expect(engine).toBeDefined();
    });
  });

  describe('tratamento de erros', () => {
    it('deve lidar com organização inexistente', async () => {
      // Arrange
      const organizationId = 'non-existent-org';
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false
      });

      // Act & Assert
      await expect(parameterEngine.generateParameters(organizationId))
        .rejects.toThrow('Organization not found');
    });

    it('deve lidar com erro do Firestore', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      mockFirestore.collection().doc().get.mockRejectedValueOnce(
        new Error('Firestore connection error')
      );

      // Act & Assert
      await expect(parameterEngine.generateParameters(organizationId))
        .rejects.toThrow('Firestore connection error');
    });
  });
});