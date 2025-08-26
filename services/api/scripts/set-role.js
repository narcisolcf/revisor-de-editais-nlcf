// services/api/scripts/set-role.js

// Importa o SDK de Admin do Firebase
const admin = require('firebase-admin');

// --- PONTO DE CONFIGURAÇÃO IMPORTANTE ---
// ATENÇÃO: Aponte para o seu arquivo de credenciais de Service Account
// Este caminho é relativo à raiz do seu projeto.
const serviceAccount = require('../../credentials/sua-chave-de-servico.json'); // <-- AJUSTE O CAMINHO AQUI

// Inicializa o app do Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pega os argumentos que você vai passar pelo terminal
const [email, role] = process.argv.slice(2);

// Validação dos argumentos
if (!email || !role) {
  console.error('❌ ERRO: Forneça o e-mail e o papel (role) do usuário.');
  console.log('✅ Uso: node scripts/set-role.js <email_do_usuario> <papel>');
  process.exit(1);
}

// Função principal assíncrona para executar a lógica
(async () => {
  try {
    console.log(`🔎 Buscando usuário com o e-mail: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);

    // Define o "selo" de autorização
    const customClaims = { role: role };
    
    console.log(`🏷️ Aplicando o papel '${role}' ao usuário ${user.uid}...`);
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    
    console.log(`✅ Sucesso! O usuário ${email} (UID: ${user.uid}) agora tem o papel '${role}'.`);
    
    // Verificação opcional para confirmar que o "selo" foi aplicado
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Roles atuais:', updatedUser.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha ao aplicar o papel:', error.message);
    process.exit(1);
  }
})();