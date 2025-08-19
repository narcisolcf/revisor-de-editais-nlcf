const admin = require('firebase-admin');
// const path = require('path'); // Comentado - não utilizado no momento

// Inicializar Firebase Admin SDK
const serviceAccount = require('./credentials/analisador-de-editais-firebase-adminsdk-fbsvc-2f209c7f43.json');

// Verificar se o arquivo de credenciais foi carregado corretamente
if (!serviceAccount.project_id) {
  console.error('❌ Erro: Arquivo de credenciais inválido ou não encontrado');
  process.exit(1);
}

console.log('Credenciais carregadas:');
console.log('- Project ID:', serviceAccount.project_id);
console.log('- Client Email:', serviceAccount.client_email);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('✅ Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', error.message);
  console.log('\n🔧 Possíveis soluções:');
  console.log('1. Verifique se o Firebase Authentication está habilitado no console:');
  console.log('   https://console.firebase.google.com/project/' + serviceAccount.project_id + '/authentication');
  console.log('2. Verifique se as credenciais estão corretas');
  process.exit(1);
}

const auth = admin.auth();

// Função para definir custom claims para um usuário
async function setCustomClaims(uid, claims) {
  try {
    await auth.setCustomUserClaims(uid, claims);
    console.log(`✅ Custom claims definidos para o usuário ${uid}:`, claims);
  } catch (error) {
    console.error(`❌ Erro ao definir custom claims para ${uid}:`, error.message);
  }
}

// Função para criar usuário administrador
async function createAdminUser() {
  // Altere estes valores antes de executar o script
  const adminEmail = 'costaefeitosa@gmail.com';
  const adminPassword = 'NLcf1046@';
  
  try {
    // Criar usuário
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
      displayName: 'Administrador'
    });
    
    console.log(`✅ Usuário administrador criado: ${userRecord.uid}`);
    
    // Definir custom claims de administrador
    const adminClaims = {
      role: 'admin',
      permissions: {
        manageUsers: true,
        manageOrganizations: true,
        manageComissoes: true,
        viewAllData: true,
        systemAdmin: true
      },
      organizationId: null, // Admin global não pertence a uma organização específica
      isActive: true
    };
    
    await setCustomClaims(userRecord.uid, adminClaims);
    
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Usuário já existe. Buscando usuário existente...');
      const existingUser = await auth.getUserByEmail(adminEmail);
      
      // Atualizar claims do usuário existente
      const adminClaims = {
        role: 'admin',
        permissions: {
          manageUsers: true,
          manageOrganizations: true,
          manageComissoes: true,
          viewAllData: true,
          systemAdmin: true
        },
        organizationId: null,
        isActive: true
      };
      
      await setCustomClaims(existingUser.uid, adminClaims);
      return existingUser;
    } else {
      console.error('❌ Erro ao criar usuário administrador:', error.message);
      throw error;
    }
  }
}

// Função para criar usuário comum de exemplo
async function createRegularUser() {
  const userEmail = 'usuario@exemplo.com';
  const userPassword = 'senhaUsuario123';
  
  try {
    const userRecord = await auth.createUser({
      email: userEmail,
      password: userPassword,
      emailVerified: true,
      displayName: 'Usuário Comum'
    });
    
    console.log(`✅ Usuário comum criado: ${userRecord.uid}`);
    
    // Definir custom claims de usuário comum
    const userClaims = {
      role: 'user',
      permissions: {
        manageUsers: false,
        manageOrganizations: false,
        manageComissoes: false,
        viewAllData: false,
        systemAdmin: false
      },
      organizationId: 'org_exemplo_123', // Usuário pertence a uma organização
      isActive: true
    };
    
    await setCustomClaims(userRecord.uid, userClaims);
    
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Usuário comum já existe.');
      return await auth.getUserByEmail(userEmail);
    } else {
      console.error('❌ Erro ao criar usuário comum:', error.message);
      throw error;
    }
  }
}

// Função para listar usuários e seus claims
async function listUsersWithClaims() {
  try {
    const listUsersResult = await auth.listUsers(10);
    
    console.log('\n📋 Usuários e seus Custom Claims:');
    console.log('=' .repeat(50));
    
    for (const userRecord of listUsersResult.users) {
      console.log(`\n👤 Usuário: ${userRecord.email || 'Sem email'}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Nome: ${userRecord.displayName || 'Sem nome'}`);
      console.log(`   Email verificado: ${userRecord.emailVerified}`);
      console.log(`   Criado em: ${userRecord.metadata.creationTime}`);
      
      if (userRecord.customClaims && Object.keys(userRecord.customClaims).length > 0) {
        console.log(`   Custom Claims:`, JSON.stringify(userRecord.customClaims, null, 4));
      } else {
        console.log(`   Custom Claims: Nenhum`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🚀 Configurando Firebase Auth Custom Claims...');
  console.log('=' .repeat(50));
  
  try {
    // Criar usuário administrador
    console.log('\n1. Criando usuário administrador...');
    await createAdminUser();
    
    // Criar usuário comum (opcional)
    console.log('\n2. Criando usuário comum de exemplo...');
    await createRegularUser();
    
    // Aguardar um pouco para os claims serem processados
    console.log('\n⏳ Aguardando processamento dos claims...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Listar usuários e claims
    console.log('\n3. Listando usuários e claims...');
    await listUsersWithClaims();
    
    console.log('\n✅ Configuração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Teste o login com o usuário administrador criado');
    console.log('   2. Verifique se as regras do Firestore estão funcionando');
    console.log('   3. Configure o frontend para usar os custom claims');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  setCustomClaims,
  createAdminUser,
  createRegularUser,
  listUsersWithClaims
};