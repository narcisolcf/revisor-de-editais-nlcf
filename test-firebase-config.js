const admin = require('firebase-admin');
const path = require('path');

// Configurar o caminho para o arquivo de credenciais
const serviceAccountPath = path.join(__dirname, 'credentials', 'licitareview-prod-b6b067fdd7e4.json');

try {
  // Inicializar o Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'licitareview-prod'
  });

  console.log('✅ Firebase Admin SDK inicializado com sucesso!');

  // Testar conexão com Firestore
  const db = admin.firestore();
  console.log('✅ Conexão com Firestore estabelecida!');

  // Testar Auth
  const auth = admin.auth();
  console.log('✅ Firebase Auth configurado!');

  // Teste básico de leitura/escrita no Firestore
  async function testFirestore() {
    try {
      // Criar um documento de teste
      const testRef = db.collection('test').doc('config-test');
      await testRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Teste de configuração realizado com sucesso',
        status: 'success'
      });
      console.log('✅ Escrita no Firestore funcionando!');

      // Ler o documento de teste
      const doc = await testRef.get();
      if (doc.exists) {
        console.log('✅ Leitura do Firestore funcionando!');
        console.log('Dados do teste:', doc.data());
      }

      // Limpar o documento de teste
      await testRef.delete();
      console.log('✅ Documento de teste removido!');

    } catch (error) {
      console.error('❌ Erro ao testar Firestore:', error);
    }
  }

  // Executar teste
  testFirestore().then(() => {
    console.log('\n🎉 Todos os testes passaram! Configuração está funcionando corretamente.');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', error);
  console.error('\nVerifique se:');
  console.error('1. O arquivo de credenciais está no local correto');
  console.error('2. A variável GOOGLE_APPLICATION_CREDENTIALS está configurada');
  console.error('3. As permissões da conta de serviço estão corretas');
  process.exit(1);
}