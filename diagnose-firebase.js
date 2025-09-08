import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obter diretório atual para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'credentials/licitareview-prod-b6b067fdd7e4.json'), 'utf8')
);

console.log('🔍 Diagnóstico do Firebase - Analisador de Editais');
console.log('=' .repeat(50));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  console.log('✅ Firebase Admin SDK inicializado com sucesso');
  console.log(`📋 Project ID: ${serviceAccount.project_id}`);
  console.log(`📧 Service Account: ${serviceAccount.client_email}`);
  
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', error.message);
  process.exit(1);
}

async function testFirebaseServices() {
  console.log('\n🧪 Testando serviços do Firebase...');
  console.log('-' .repeat(40));
  
  // Teste 1: Firebase Authentication
  console.log('\n1. 🔐 Testando Firebase Authentication...');
  try {
    const auth = admin.auth();
    // Tentar listar usuários (operação simples para testar se o serviço está ativo)
    const listUsersResult = await auth.listUsers(1);
    console.log('   ✅ Firebase Authentication está funcionando');
    console.log(`   📊 Total de usuários encontrados: ${listUsersResult.users.length}`);
  } catch (error) {
    console.log('   ❌ Firebase Authentication NÃO está funcionando');
    console.log(`   🔍 Erro: ${error.message}`);
    
    if (error.message.includes('There is no configuration corresponding to the provided identifier')) {
      console.log('\n   📋 SOLUÇÃO NECESSÁRIA:');
      console.log('   🎯 O Firebase Authentication não está habilitado neste projeto.');
       console.log('   \n   📝 Passos para habilitar:');
       console.log(`   1. Acesse: https://console.firebase.google.com/project/${serviceAccount.project_id}/authentication`);
       console.log('   2. Clique em "Começar" ou "Get Started"');
       console.log('   3. Escolha os provedores de autenticação (recomendado: Email/Password)');
      console.log('   4. Aguarde alguns minutos para a configuração ser aplicada');
      console.log('   5. Execute este script novamente');
    }
  }
  
  // Teste 2: Firestore
  console.log('\n2. 🗄️ Testando Firestore...');
  try {
    const firestore = admin.firestore();
    // Tentar acessar uma coleção simples
    const testCollection = firestore.collection('test');
    await testCollection.limit(1).get();
    console.log('   ✅ Firestore está funcionando');
  } catch (error) {
    console.log('   ❌ Firestore NÃO está funcionando');
    console.log(`   🔍 Erro: ${error.message}`);
  }
  
  // Teste 3: Verificar permissões da Service Account
  console.log('\n3. 🔑 Verificando permissões da Service Account...');
  try {
    const auth = admin.auth();
    // Tentar uma operação que requer permissões específicas
    await auth.listUsers(1);
    console.log('   ✅ Service Account tem permissões adequadas');
  } catch (error) {
    if (error.message.includes('insufficient permission')) {
      console.log('   ❌ Service Account NÃO tem permissões suficientes');
      console.log('   📋 Verifique se os seguintes papéis estão atribuídos:');
      console.log('   - Firebase Admin SDK Administrator Service Agent');
      console.log('   - Firebase Authentication Admin');
    }
  }
}

async function showProjectInfo() {
  console.log('\n📊 Informações do Projeto');
   console.log('-' .repeat(40));
   console.log(`🏷️ Project ID: ${serviceAccount.project_id}`);
   console.log(`📧 Service Account Email: ${serviceAccount.client_email}`);
   console.log(`🆔 Client ID: ${serviceAccount.client_id}`);
   
   console.log('\n🔗 Links Úteis:');
   console.log(`🌐 Console do Firebase: https://console.firebase.google.com/project/${serviceAccount.project_id}`);
   console.log(`🔐 Authentication: https://console.firebase.google.com/project/${serviceAccount.project_id}/authentication`);
   console.log(`🗄️ Firestore: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore`);
   console.log(`⚙️ Configurações: https://console.firebase.google.com/project/${serviceAccount.project_id}/settings/general`);
}

async function main() {
  try {
    await testFirebaseServices();
    await showProjectInfo();
    
    console.log('\n🎯 Próximos Passos:');
    console.log('1. Se o Firebase Authentication não estiver funcionando, siga as instruções acima');
    console.log('2. Após habilitar o Authentication, execute: node setup-custom-claims.js');
    console.log('3. Se ainda houver problemas, verifique as permissões da Service Account');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  } finally {
    process.exit(0);
  }
}

// Executar diagnóstico
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  testFirebaseServices,
  showProjectInfo
};