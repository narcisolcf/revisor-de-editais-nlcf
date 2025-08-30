/**
 * Teste básico de integração para verificar conectividade
 * Sprint 1 - LicitaReview
 * 
 * IMPORTANTE: Este teste NÃO usa mocks e conecta diretamente ao emulador
 */

// Configurar ambiente ANTES de importar qualquer coisa
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = 'analisador-de-editais';

// Importar Jest sem setup que contém mocks
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Importar Firebase Admin diretamente (sem mocks)
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin para testes de integração
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'analisador-de-editais',
    // Para testes de integração, não precisamos de credenciais reais
  });
}

const firestore = admin.firestore();

// Configurações do Firestore para testes
firestore.settings({
  ignoreUndefinedProperties: true,
});

describe('Teste Básico de Integração', () => {
  const testCollectionName = 'integration-test';
  const testDocId = 'test-doc-001';
  
  beforeAll(async () => {
    console.log('🔧 Configurando teste de integração básica');
    console.log('📍 Emulator Host:', process.env.FIRESTORE_EMULATOR_HOST);
  });
  
  afterAll(async () => {
    // Limpar dados de teste
    try {
      await firestore.collection(testCollectionName).doc(testDocId).delete();
      console.log('🧹 Dados de teste limpos');
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  });
  
  it('deve conectar com o Firestore emulator', async () => {
    console.log('🔌 Testando conexão com Firestore emulator');
    
    // Testar escrita
    const testData = {
      name: 'Teste de Integração',
      timestamp: new Date(),
      status: 'ANALYZED',
      metadata: {
        version: '1.0.0',
        environment: 'test'
      }
    };
    
    await firestore.collection(testCollectionName).doc(testDocId).set(testData);
    console.log('✅ Documento criado no Firestore');
    
    // Testar leitura
    const doc = await firestore.collection(testCollectionName).doc(testDocId).get();
    expect(doc.exists).toBe(true);
    
    const data = doc.data();
    expect(data).toBeDefined();
    expect(data!.name).toBe('Teste de Integração');
    expect(data!.status).toBe('active');
    
    console.log('✅ Documento lido do Firestore:', {
      id: doc.id,
      name: data!.name,
      status: data!.status
    });
  });
  
  it('deve testar operações de coleção', async () => {
    console.log('📚 Testando operações de coleção');
    
    // Criar múltiplos documentos
    const batch = firestore.batch();
    
    for (let i = 1; i <= 3; i++) {
      const docRef = firestore.collection(testCollectionName).doc(`batch-doc-${i}`);
      batch.set(docRef, {
        name: `Documento Batch ${i}`,
        order: i,
        createdAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('✅ Batch de documentos criado');
    
    // Consultar documentos
    const querySnapshot = await firestore
      .collection(testCollectionName)
      .where('order', '>=', 1)
      .orderBy('order')
      .get();
    
    expect(querySnapshot.size).toBe(3);
    
    const docs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        order: data.order,
        createdAt: data.createdAt
      };
    });
    
    expect(docs[0].order).toBe(1);
    expect(docs[1].order).toBe(2);
    expect(docs[2].order).toBe(3);
    
    console.log('✅ Query executada com sucesso:', {
      totalDocs: docs.length,
      firstDoc: docs[0].name,
      lastDoc: docs[2].name
    });
    
    // Limpar documentos do batch
    const deleteBatch = firestore.batch();
    querySnapshot.docs.forEach(doc => {
      if (doc.id.startsWith('batch-doc-')) {
        deleteBatch.delete(doc.ref);
      }
    });
    await deleteBatch.commit();
    console.log('✅ Documentos do batch removidos');
  });
  
  it('deve testar transações', async () => {
    console.log('🔄 Testando transações');
    
    const counterDocRef = firestore.collection(testCollectionName).doc('counter');
    
    // Inicializar contador
    await counterDocRef.set({ count: 0 });
    
    // Incrementar contador usando transação
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterDocRef);
      
      if (!doc.exists) {
        throw new Error('Documento contador não existe');
      }
      
      const currentCount = doc.data()!.count;
      transaction.update(counterDocRef, { count: currentCount + 1 });
    });
    
    // Verificar resultado
    const finalDoc = await counterDocRef.get();
    const finalCount = finalDoc.data()!.count;
    
    expect(finalCount).toBe(1);
    console.log('✅ Transação executada com sucesso:', { finalCount });
    
    // Limpar contador
    await counterDocRef.delete();
  });
  
  it('deve verificar configurações do emulator', async () => {
    console.log('⚙️ Verificando configurações do emulator');
    
    // Verificar se estamos usando o emulator
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    expect(emulatorHost).toBe('127.0.0.1:8080');
    
    // Testar configurações específicas do emulator
    const testDoc = firestore.collection('_emulator_test').doc('config');
    
    await testDoc.set({
      emulatorTest: true,
      timestamp: new Date(),
      host: emulatorHost
    });
    
    const doc = await testDoc.get();
    expect(doc.exists).toBe(true);
    expect(doc.data()!.emulatorTest).toBe(true);
    
    await testDoc.delete();
    
    console.log('✅ Configurações do emulator verificadas:', {
      host: emulatorHost,
      connected: true
    });
  });
});