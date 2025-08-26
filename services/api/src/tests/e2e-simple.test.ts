/**
 * Teste End-to-End Simplificado
 * Sprint 1 - LicitaReview
 * 
 * Testa o fluxo básico de análise sem mocks complexos
 */

// Configurar ambiente para testes de integração
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = 'analisador-de-editais';

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin para testes
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'analisador-de-editais'
  });
}

const firestore = admin.firestore();

// Configurações
firestore.settings({
  ignoreUndefinedProperties: true,
});

// Tipos básicos para o teste
interface TestDocument {
  id: string;
  title: string;
  content: string;
  organizationId: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  createdAt: Date;
  updatedAt: Date;
}

interface TestAnalysisResult {
  id: string;
  documentId: string;
  organizationId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  conformityScores?: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
    overall: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

interface TestOrganizationConfig {
  id: string;
  organizationId: string;
  organizationName: string;
  weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
  presetType: 'STANDARD' | 'CUSTOM';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

describe('E2E - Fluxo Básico de Análise', () => {
  const testOrgId = 'test-org-' + Date.now();
  const testUserId = 'test-user-' + Date.now();
  let testDocumentId: string;
  let testConfigId: string;
  
  beforeAll(async () => {
    console.log('🔧 Configurando ambiente de teste E2E');
    console.log('🏢 Organization ID:', testOrgId);
    console.log('👤 User ID:', testUserId);
  });
  
  afterAll(async () => {
    console.log('🧹 Limpando dados de teste E2E');
    
    try {
      // Limpar documentos
      const documentsSnapshot = await firestore
        .collection('documents')
        .where('organizationId', '==', testOrgId)
        .get();
      
      // Limpar resultados de análise
      const analysisSnapshot = await firestore
        .collection('analysisResults')
        .where('organizationId', '==', testOrgId)
        .get();
      
      // Limpar configurações
      const configsSnapshot = await firestore
        .collection('organizationConfigs')
        .where('organizationId', '==', testOrgId)
        .get();
      
      const batch = firestore.batch();
      
      [...documentsSnapshot.docs, ...analysisSnapshot.docs, ...configsSnapshot.docs]
        .forEach(doc => batch.delete(doc.ref));
      
      if (documentsSnapshot.docs.length + analysisSnapshot.docs.length + configsSnapshot.docs.length > 0) {
        await batch.commit();
        console.log('✅ Dados de teste removidos');
      }
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  });
  
  beforeEach(() => {
    console.log('\n' + '='.repeat(50));
  });
  
  it('deve criar configuração organizacional', async () => {
    console.log('🏗️ Teste: Criando configuração organizacional');
    
    const config: Omit<TestOrganizationConfig, 'id'> = {
      organizationId: testOrgId,
      organizationName: 'Organização de Teste E2E',
      weights: {
        structural: 25.0,
        legal: 25.0,
        clarity: 25.0,
        abnt: 25.0
      },
      presetType: 'STANDARD',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const configRef = await firestore.collection('organizationConfigs').add(config);
    testConfigId = configRef.id;
    
    console.log('✅ Configuração criada:', testConfigId);
    
    // Verificar se foi criada corretamente
    const configDoc = await configRef.get();
    expect(configDoc.exists).toBe(true);
    
    const configData = configDoc.data() as TestOrganizationConfig;
    expect(configData.organizationId).toBe(testOrgId);
    expect(configData.weights.structural).toBe(25.0);
    expect(configData.isActive).toBe(true);
    
    console.log('✅ Configuração verificada');
  });
  
  it('deve criar documento para análise', async () => {
    console.log('📄 Teste: Criando documento para análise');
    
    const document: Omit<TestDocument, 'id'> = {
      title: 'Edital de Teste E2E',
      content: 'Este é um edital de teste para verificar o fluxo end-to-end de análise. O documento contém informações estruturais, legais e de clareza para validação.',
      organizationId: testOrgId,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await firestore.collection('documents').add(document);
    testDocumentId = docRef.id;
    
    console.log('✅ Documento criado:', testDocumentId);
    
    // Verificar se foi criado corretamente
    const docDoc = await docRef.get();
    expect(docDoc.exists).toBe(true);
    
    const docData = docDoc.data() as TestDocument;
    expect(docData.title).toBe('Edital de Teste E2E');
    expect(docData.organizationId).toBe(testOrgId);
    expect(docData.status).toBe('DRAFT');
    
    console.log('✅ Documento verificado');
  });
  
  it('deve simular início de análise', async () => {
    console.log('🔄 Teste: Simulando início de análise');
    
    // Atualizar status do documento para PROCESSING
    await firestore.collection('documents').doc(testDocumentId).update({
      status: 'PROCESSING',
      updatedAt: new Date()
    });
    
    // Criar registro de análise
    const analysisResult: Omit<TestAnalysisResult, 'id'> = {
      documentId: testDocumentId,
      organizationId: testOrgId,
      status: 'processing',
      createdAt: new Date()
    };
    
    const analysisRef = await firestore.collection('analysisResults').add(analysisResult);
    const analysisId = analysisRef.id;
    
    console.log('✅ Análise iniciada:', analysisId);
    
    // Verificar se o documento foi atualizado
    const docDoc = await firestore.collection('documents').doc(testDocumentId).get();
    const docData = docDoc.data() as TestDocument;
    expect(docData.status).toBe('PROCESSING');
    
    // Verificar se a análise foi criada
    const analysisDoc = await analysisRef.get();
    expect(analysisDoc.exists).toBe(true);
    
    const analysisData = analysisDoc.data() as TestAnalysisResult;
    expect(analysisData.status).toBe('processing');
    expect(analysisData.documentId).toBe(testDocumentId);
    
    console.log('✅ Status de análise verificado');
  });
  
  it('deve simular conclusão de análise', async () => {
    console.log('✅ Teste: Simulando conclusão de análise');
    
    // Buscar a análise em andamento
    const analysisSnapshot = await firestore
      .collection('analysisResults')
      .where('documentId', '==', testDocumentId)
      .where('status', '==', 'processing')
      .get();
    
    expect(analysisSnapshot.size).toBe(1);
    const analysisDoc = analysisSnapshot.docs[0];
    
    // Simular resultados de análise
    const completedAnalysis = {
      status: 'completed',
      conformityScores: {
        structural: 85.5,
        legal: 92.0,
        clarity: 78.3,
        abnt: 88.7,
        overall: 86.1
      },
      completedAt: new Date()
    };
    
    await analysisDoc.ref.update(completedAnalysis);
    
    // Atualizar status do documento
    await firestore.collection('documents').doc(testDocumentId).update({
      status: 'COMPLETED',
      updatedAt: new Date()
    });
    
    console.log('✅ Análise concluída');
    
    // Verificar resultados
    const updatedAnalysis = await analysisDoc.ref.get();
    const analysisData = updatedAnalysis.data() as TestAnalysisResult;
    
    expect(analysisData.status).toBe('completed');
    expect(analysisData.conformityScores?.overall).toBe(86.1);
    expect(analysisData.completedAt).toBeDefined();
    
    // Verificar documento
    const updatedDoc = await firestore.collection('documents').doc(testDocumentId).get();
    const docData = updatedDoc.data() as TestDocument;
    expect(docData.status).toBe('COMPLETED');
    
    console.log('✅ Resultados verificados:', {
      overallScore: analysisData.conformityScores?.overall,
      documentStatus: docData.status
    });
  });
  
  it('deve verificar integridade dos dados', async () => {
    console.log('🔍 Teste: Verificando integridade dos dados');
    
    // Verificar se todos os dados estão consistentes
    const [configDoc, documentDoc, analysisSnapshot] = await Promise.all([
      firestore.collection('organizationConfigs').doc(testConfigId).get(),
      firestore.collection('documents').doc(testDocumentId).get(),
      firestore.collection('analysisResults')
        .where('documentId', '==', testDocumentId)
        .get()
    ]);
    
    // Verificar configuração
    expect(configDoc.exists).toBe(true);
    const configData = configDoc.data() as TestOrganizationConfig;
    expect(configData.organizationId).toBe(testOrgId);
    expect(configData.isActive).toBe(true);
    
    // Verificar documento
    expect(documentDoc.exists).toBe(true);
    const docData = documentDoc.data() as TestDocument;
    expect(docData.status).toBe('COMPLETED');
    expect(docData.organizationId).toBe(testOrgId);
    
    // Verificar análise
    expect(analysisSnapshot.size).toBe(1);
    const analysisData = analysisSnapshot.docs[0].data() as TestAnalysisResult;
    expect(analysisData.status).toBe('completed');
    expect(analysisData.organizationId).toBe(testOrgId);
    expect(analysisData.documentId).toBe(testDocumentId);
    
    console.log('✅ Integridade dos dados verificada:', {
      configExists: configDoc.exists,
      documentStatus: docData.status,
      analysisStatus: analysisData.status,
      organizationConsistency: [
        configData.organizationId,
        docData.organizationId,
        analysisData.organizationId
      ].every(id => id === testOrgId)
    });
  });
});