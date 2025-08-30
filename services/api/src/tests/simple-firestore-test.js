/**
 * Teste simples de conectividade com Firestore Emulator
 * Executa diretamente com Node.js (sem Jest)
 */

// Configurar ambiente
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'analisador-de-editais';

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'analisador-de-editais'
  });
}

const firestore = admin.firestore();

// Configurações
firestore.settings({
  ignoreUndefinedProperties: true,
});

async function testFirestoreConnection() {
  console.log('🔧 Iniciando teste de conectividade do Firestore');
  console.log('📍 Emulator Host:', process.env.FIRESTORE_EMULATOR_HOST);
  
  try {
    // Teste 1: Criar documento
    console.log('\n📝 Teste 1: Criando documento...');
    const testData = {
      name: 'Teste de Conectividade',
      timestamp: new Date(),
      status: 'ANALYZED'
    };
    
    const docRef = await firestore.collection('connectivity-test').add(testData);
    console.log('✅ Documento criado com ID:', docRef.id);
    
    // Teste 2: Ler documento
    console.log('\n📖 Teste 2: Lendo documento...');
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Documento lido:', {
        id: doc.id,
        name: data.name,
        status: data.status
      });
    } else {
      throw new Error('Documento não encontrado');
    }
    
    // Teste 3: Atualizar documento
    console.log('\n✏️ Teste 3: Atualizando documento...');
    await docRef.update({ status: 'updated', updatedAt: new Date() });
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    if (updatedData.status === 'updated') {
      console.log('✅ Documento atualizado com sucesso');
    } else {
      throw new Error('Falha na atualização');
    }
    
    // Teste 4: Query
    console.log('\n🔍 Teste 4: Executando query...');
    const querySnapshot = await firestore
      .collection('connectivity-test')
      .where('status', '==', 'updated')
      .get();
    
    console.log(`✅ Query executada: ${querySnapshot.size} documento(s) encontrado(s)`);
    
    // Teste 5: Batch operations
    console.log('\n📦 Teste 5: Operações em batch...');
    const batch = firestore.batch();
    
    for (let i = 1; i <= 3; i++) {
      const batchDocRef = firestore.collection('connectivity-test').doc(`batch-${i}`);
      batch.set(batchDocRef, {
        name: `Batch Document ${i}`,
        order: i,
        createdAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('✅ Batch commit executado com sucesso');
    
    // Teste 6: Transaction
    console.log('\n🔄 Teste 6: Executando transação...');
    const counterRef = firestore.collection('connectivity-test').doc('counter');
    
    await counterRef.set({ count: 0 });
    
    await firestore.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists) {
        throw new Error('Contador não existe');
      }
      
      const currentCount = counterDoc.data().count;
      transaction.update(counterRef, { count: currentCount + 10 });
    });
    
    const finalCounter = await counterRef.get();
    const finalCount = finalCounter.data().count;
    
    if (finalCount === 10) {
      console.log('✅ Transação executada com sucesso:', { finalCount });
    } else {
      throw new Error(`Transação falhou. Esperado: 10, Atual: ${finalCount}`);
    }
    
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    const allDocs = await firestore.collection('connectivity-test').get();
    const deleteBatch = firestore.batch();
    
    allDocs.docs.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    
    if (allDocs.docs.length > 0) {
      await deleteBatch.commit();
      console.log(`✅ ${allDocs.docs.length} documento(s) removido(s)`);
    }
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Conectividade com Firestore Emulator confirmada');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Executar teste
testFirestoreConnection()
  .then(() => {
    console.log('\n✅ Teste concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Teste falhou:', error);
    process.exit(1);
  });