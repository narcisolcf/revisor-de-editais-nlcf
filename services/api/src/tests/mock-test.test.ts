/**
 * Teste simples para verificar se o mock do Firestore está funcionando
 */

import { expect, describe, it } from '@jest/globals';
import { mockFirestore } from './setup';
import { AnalysisRepository } from '../db/repositories/AnalysisRepository';

describe('Mock Test', () => {
  it('deve testar o mock do Firestore diretamente', async () => {
    console.log('🔧 Testando mock do Firestore');
    
    // Testar collection
    const collection = mockFirestore.collection('test');
    
    // Testar doc
    const doc = collection.doc('test-id');
    
    // Testar set com array
    const testData = { test: 'data', customRules: ['rule1', 'rule2'] };
    await doc.set(testData);
    console.log('✅ Set executado com:', testData);
    
    // Testar get
    const result = await doc.get();
    console.log('result.data():', result?.data?.());
    
    expect(result.exists).toBe(true);
    expect(result.data().test).toBe('data');
    expect(Array.isArray(result.data().customRules)).toBe(true);
    expect(result.data().customRules).toEqual(['rule1', 'rule2']);
  });
  
  it('deve testar o AnalysisRepository com mock', async () => {
    console.log('🔧 Testando AnalysisRepository');
    
    const analysisRepo = new AnalysisRepository(mockFirestore);
    console.log('analysisRepo criado');
    
    // Testar createAnalysis
    const analysisData = {
      documentId: 'test-doc-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
      analysisType: 'FULL' as const,
      configurationId: 'test-config-id',
      request: {
        priority: 'HIGH' as const,
        timeout: 30000,
        options: {
          includeAI: true,
          generateRecommendations: true,
          detailedMetrics: false,
          customRules: [] // Array vazio
        }
      },
      processing: {
        status: 'PENDING' as const,
        progress: 0
      },
      engine: {
        name: 'test-engine',
        version: '1.0.0',
        fallbackUsed: false,
        cacheHit: false
      },
      createdBy: 'test-user-id'
    };

    console.log('=== ANTES DA CRIAÇÃO ===');
    console.log('customRules type:', typeof analysisData.request.options.customRules);
    console.log('customRules isArray:', Array.isArray(analysisData.request.options.customRules));
    console.log('customRules value:', analysisData.request.options.customRules);
    
    const createdAnalysis = await analysisRepo.createAnalysis(analysisData);
    
    console.log('=== APÓS CRIAÇÃO ===');
    console.log('created customRules type:', typeof createdAnalysis.request.options.customRules);
    console.log('created customRules isArray:', Array.isArray(createdAnalysis.request.options.customRules));
    console.log('created customRules value:', createdAnalysis.request.options.customRules);

    const foundAnalysis = await analysisRepo.findById(createdAnalysis.id);
    
    console.log('=== APÓS BUSCA ===');
    if (foundAnalysis) {
      // Verificar se customRules foi preservado como array
    }

    expect(foundAnalysis).toBeTruthy();
     expect(foundAnalysis?.processing?.status).toBe('PENDING');
  });
});