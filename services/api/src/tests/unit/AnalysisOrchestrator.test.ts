/**
 * Testes unitários para AnalysisOrchestrator
 * LicitaReview Cloud Functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnalysisOrchestrator } from '../../services/AnalysisOrchestrator';

// Mock simples do Firestore
const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    })
  })
} as any;

describe('AnalysisOrchestrator', () => {
  let orchestrator: AnalysisOrchestrator;

  beforeEach(() => {
    orchestrator = new AnalysisOrchestrator(
      mockFirestore as any,
      'https://mock-cloud-run-url.com',
      'test-project-id'
    );
  });

  describe('Basic functionality', () => {
    it('should have startAnalysis method', () => {
      expect(orchestrator.startAnalysis).toBeDefined();
      expect(typeof orchestrator.startAnalysis).toBe('function');
    });

    it('should have processAnalysis method', () => {
      expect(orchestrator.processAnalysis).toBeDefined();
      expect(typeof orchestrator.processAnalysis).toBe('function');
    });

    it('should have startAnalysisWithUpload method', () => {
      expect(orchestrator.startAnalysisWithUpload).toBeDefined();
      expect(typeof orchestrator.startAnalysisWithUpload).toBe('function');
    });

    it('should have getAnalysisProgress method', () => {
      expect(orchestrator.getAnalysisProgress).toBeDefined();
      expect(typeof orchestrator.getAnalysisProgress).toBe('function');
    });

    it('should have cancelAnalysis method', () => {
      expect(orchestrator.cancelAnalysis).toBeDefined();
      expect(typeof orchestrator.cancelAnalysis).toBe('function');
    });
  });
});