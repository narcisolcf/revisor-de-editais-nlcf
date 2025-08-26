import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function debugFirebaseConnection() {
  console.log('🔍 Debug: Verificando conexão com Firebase...');
  
  try {
    // Verificar documento de controle de migração
    console.log('📋 Verificando documento de controle de migração...');
    const migrationDoc = await getDoc(doc(db, 'migration-control', 'classification-v1'));
    
    if (migrationDoc.exists()) {
      const migrationData = migrationDoc.data();
      console.log('✅ Documento de controle existe:', migrationData);
    } else {
      console.log('❌ Documento de controle NÃO existe - migração não foi executada');
      return;
    }

    // Verificar coleção classifications
    console.log('📊 Verificando coleção classifications...');
    const classificationsCol = collection(db, 'classifications');
    const snap = await getDocs(classificationsCol);
    
    if (snap.empty) {
      console.log('❌ Coleção classifications está VAZIA');
      return;
    }

    console.log(`✅ Coleção possui ${snap.docs.length} documentos`);
    
    // Mostrar alguns documentos de exemplo
    console.log('📄 Primeiros 5 documentos:');
    snap.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Nome: ${data.nome}`);
      console.log(`    Nível: ${data.nivel}`);
      console.log(`    ParentPath: ${data.parentPath}`);
      console.log(`    HasChildren: ${data.hasChildren}`);
    });

    // Verificar nós raiz (sem parent)
    const rootNodes = snap.docs.filter(doc => doc.data().parentPath === null);
    console.log(`🌳 Encontrados ${rootNodes.length} nós raiz:`);
    rootNodes.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.nome} (${data.key})`);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar com Firebase:', error);
  }
}

// Executar debug
debugFirebaseConnection()
  .then(() => {
    console.log('🎉 Debug concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no debug:', error);
    process.exit(1);
  });

export { debugFirebaseConnection };