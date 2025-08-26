/**
 * Teste de integração do Firestore (sem mocks)
 * Sprint 1 - LicitaReview
 * 
 * Este arquivo executa testes de integração reais com o emulador do Firestore
 * sem usar os mocks configurados no setup.ts
 */

// Configurar ambiente ANTES de qualquer import
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.NODE_ENV = 'integration-test';
process.env.GCLOUD_PROJECT = 'analisador-de-editais';

// Limpar require cache para evitar conflitos com mocks
delete require.cache[require.resolve('firebase-admin')];

// Importar Firebase Admin diretamente
const admin = require('firebase-admin');

// Inicializar Firebase Admin para testes de integração
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'analisador-de-editais'
  });
}

const firestore = admin.firestore();

// Configurações do Firestore
firestore.settings({
  ignoreUndefinedProperties: true,
});

describe('Firestore Integration Tests', () => {
  const testCollection = 'integration-test-' + Date.now();
  
  beforeAll(() => {
    console.log('🔧 Iniciando testes de integração do Firestore');
    console.log('📍 Emulator Host:', process.env.FIRESTORE_EMULATOR_HOST);
    console.log('📁 Test Collection:', testCollection);
  });
  
  afterAll(async () => {
    // Limpar dados de teste
    try {
      const snapshot = await firestore.collection(testCollection).get();
      const batch = firestore.batch();
      
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`🧹 ${snapshot.docs.length} documentos de teste removidos`);
      }
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  });
  
  test('deve conectar com o emulador do Firestore', async () => {
    console.log('🔌 Testando conexão básica');
    
    const testDoc = {
      name: 'Teste de Conexão',
      timestamp: new Date(),
      status: 'active'
    };
    
    // Criar documento
    const docRef = await firestore.collection(testCollection).add(testDoc);
    expect(docRef.id).toBeDefined();
    console.log('✅ Documento criado:', docRef.id);
    
    // Ler documento
    const doc = await docRef.get();
    expect(doc.exists).toBe(true);
    
    const data = doc.data();
    expect(data.name).toBe('Teste de Conexão');
    expect(data.status).toBe('active');
    
    console.log('✅ Documento lido com sucesso');
  });
  
  test('deve executar operações de batch', async () => {
    console.log('📦 Testando operações de batch');
    
    const batch = firestore.batch();
    const docRefs = [];
    
    // Criar 3 documentos em batch
    for (let i = 1; i <= 3; i++) {
      const docRef = firestore.collection(testCollection).doc(`batch-${i}`);
      docRefs.push(docRef);
      
      batch.set(docRef, {
        name: `Documento Batch ${i}`,
        order: i,
        createdAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('✅ Batch commit executado');
    
    // Verificar se os documentos foram criados
    for (const docRef of docRefs) {
      const doc = await docRef.get();
      expect(doc.exists).toBe(true);
    }
    
    console.log('✅ Todos os documentos do batch foram verificados');
  });
  
  test('deve executar queries', async () => {
    console.log('🔍 Testando queries');
    
    // Buscar documentos com order >= 1
    const querySnapshot = await firestore
      .collection(testCollection)
      .where('order', '>=', 1)
      .orderBy('order')
      .get();
    
    expect(querySnapshot.size).toBeGreaterThanOrEqual(3);
    
    const docs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name as string,
        order: data.order as number,
        createdAt: data.createdAt as Date
      };
    });
    
    // Verificar ordenação
    for (let i = 1; i < docs.length; i++) {
      expect(docs[i].order).toBeGreaterThanOrEqual(docs[i-1].order);
    }
    
    console.log(`✅ Query executada: ${docs.length} documentos encontrados`);
  });
  
  test('deve executar transações', async () => {
    console.log('🔄 Testando transações');
    
    const counterRef = firestore.collection(testCollection).doc('counter');
    
    // Inicializar contador
    await counterRef.set({ count: 0 });
    
    // Incrementar usando transação
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);
      
      if (!doc.exists) {
        throw new Error('Contador não existe');
      }
      
      const data = doc.data();
      const currentCount = data?.count as number || 0;
      transaction.update(counterRef, { count: currentCount + 5 });
    });
    
    // Verificar resultado
    const finalDoc = await counterRef.get();
    const finalData = finalDoc.data();
    const finalCount = finalData?.count as number || 0;
    
    expect(finalCount).toBe(5);
    console.log('✅ Transação executada:', { finalCount });
  });
  
  test('deve verificar configurações do emulator', async () => {
    console.log('⚙️ Verificando configurações');
    
    // Verificar variáveis de ambiente
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8080');
    expect(process.env.GCLOUD_PROJECT).toBe('analisador-de-editais');
    
    // Testar operação específica do emulator
    const testDoc = firestore.collection('_emulator_config').doc('test');
    
    await testDoc.set({
      emulatorTest: true,
      timestamp: new Date(),
      host: process.env.FIRESTORE_EMULATOR_HOST
    });
    
    const doc = await testDoc.get();
    expect(doc.exists).toBe(true);
    const docData = doc.data();
    expect(docData?.emulatorTest).toBe(true);
    
    // Limpar
    await testDoc.delete();
    
    console.log('✅ Configurações verificadas');
  });
});