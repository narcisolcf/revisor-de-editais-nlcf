import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Setup global para testes E2E
 * Configura o ambiente de teste antes da execução dos testes
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  try {
    // Verificar se o Firebase Emulator está rodando
    console.log('📡 Verificando Firebase Emulator...');
    await checkFirebaseEmulator();

    // Configurar dados de teste no Firestore
    console.log('🗄️ Configurando dados de teste...');
    await setupTestData();

    // Verificar se a aplicação está respondendo
    console.log('🌐 Verificando aplicação web...');
    await checkWebApplication();

    console.log('✅ Setup global concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no setup global:', error);
    throw error;
  }
}

/**
 * Verifica se o Firebase Emulator está rodando
 */
async function checkFirebaseEmulator() {
  try {
    const response = await fetch('http://localhost:4000');
    if (!response.ok) {
      throw new Error('Firebase Emulator não está respondendo');
    }
    console.log('✅ Firebase Emulator está rodando');
  } catch (error) {
    console.error('❌ Firebase Emulator não está disponível:', error);
    throw new Error('Firebase Emulator deve estar rodando antes dos testes');
  }
}

/**
 * Configura dados de teste no Firestore
 */
async function setupTestData() {
  try {
    // Aqui você pode configurar dados de teste específicos
    // Por exemplo, criar usuários de teste, documentos de exemplo, etc.
    
    // Exemplo: Criar usuário de teste
    const testUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Usuário de Teste'
    };

    // Exemplo: Criar documento de teste
    const testDocument = {
      id: 'test-doc-123',
      name: 'Edital de Teste.pdf',
      status: 'pending',
      uploadedAt: new Date().toISOString()
    };

    console.log('✅ Dados de teste configurados');
  } catch (error) {
    console.error('❌ Erro ao configurar dados de teste:', error);
    throw error;
  }
}

/**
 * Verifica se a aplicação web está respondendo
 */
async function checkWebApplication() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Tentar acessar a página principal
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verificar se a página carregou corretamente
    const title = await page.title();
    console.log(`✅ Aplicação web está respondendo - Título: ${title}`);
  } catch (error) {
    console.error('❌ Aplicação web não está disponível:', error);
    throw new Error('Aplicação web deve estar rodando antes dos testes');
  } finally {
    await browser.close();
  }
}

export default globalSetup;