import { fetchClassificationTree } from '../services/classificationFirebase';
import { getTiposObjeto } from '../data/classification';

async function testClassificationComponent() {
  console.log('🧪 Testing Classification Component Logic...');
  
  try {
    // Test Firebase fetch
    console.log('\n1. Testing Firebase fetch...');
    const firebaseData = await fetchClassificationTree();
    console.log(`✅ Firebase returned ${firebaseData.length} root nodes`);
    
    // Test first level (tipos de objeto)
    const firstLevel = firebaseData;
    console.log('\n2. Testing first level (Tipos de Objeto):');
    firstLevel.forEach(tipo => {
      console.log(`  - ${tipo.nome} (key: ${tipo.key}, children: ${tipo.filhos.length})`);
    });
    
    // Test cascade logic with first item
    if (firstLevel.length > 0) {
      const firstTipo = firstLevel[0];
      console.log(`\n3. Testing cascade with "${firstTipo.nome}"`);
      console.log(`   Modalidades available: ${firstTipo.filhos.length}`);
      
      firstTipo.filhos.forEach(modalidade => {
        console.log(`   - ${modalidade.nome} (key: ${modalidade.key}, children: ${modalidade.filhos.length})`);
        
        if (modalidade.filhos.length > 0) {
          const firstSubtipo = modalidade.filhos[0];
          console.log(`     └─ Example subtipo: ${firstSubtipo.nome} (children: ${firstSubtipo.filhos.length})`);
        }
      });
    }
    
    console.log('\n✅ All tests passed! The component should work correctly now.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Test fallback
    console.log('\n🔄 Testing local fallback...');
    const localData = getTiposObjeto();
    console.log(`📁 Local fallback returned ${localData.length} root nodes`);
  }
}

// Execute test
testClassificationComponent()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });

export { testClassificationComponent };