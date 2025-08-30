/**
 * Teste para validar retry logic e error handling no AnalysisOrchestrator
 * Executa diretamente com Node.js para evitar problemas de configuração do Jest
 */

const admin = require('firebase-admin');
const { AnalysisOrchestrator } = require('./lib/services/AnalysisOrchestrator');

// Configurar ambiente para emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = 'analisador-de-editais';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'analisador-de-editais'
  });
}

const db = admin.firestore();

// Mock do CloudRunClient para simular falhas
class MockCloudRunClient {
  constructor(failureCount = 0) {
    this.failureCount = failureCount;
    this.callCount = 0;
  }

  async analyzeDocument() {
    this.callCount++;
    
    if (this.callCount <= this.failureCount) {
      // Simular diferentes tipos de erro
      if (this.callCount === 1) {
        throw new Error('Network timeout - ECONNRESET');
      } else if (this.callCount === 2) {
        throw new Error('Service unavailable - 503');
      } else {
        throw new Error('Rate limit exceeded - 429');
      }
    }

    // Sucesso após falhas
    return {
      results: {
        conformity_score: 85,
        confidence: 0.92,
        problems: [
          {
            id: 'prob_1',
            type: 'MISSING_REQUIREMENT',
            severity: 'medium',
            description: 'Requisito obrigatório não encontrado'
          }
        ],
        recommendations: ['Adicionar requisito obrigatório'],
        metrics: { processing_time: 1500 },
        categories: { legal: 90, technical: 80 },
        ai_used: true
      },
      processing_time: 1500
    };
  }

  async healthCheck() {
    return { status: 'healthy' };
  }
}

// Mock dos serviços auxiliares
class MockTaskQueueService {
  async enqueue() {
    return 'mock-task-id';
  }
}

class MockNotificationService {
  async notifyAnalysisComplete() {
    console.log('Notificação enviada (mock)');
  }
}

// Função de teste principal
async function runRetryLogicTests() {
  console.log('🧪 Iniciando testes de retry logic e error handling...');
  
  try {
    // Limpar dados de teste
    await cleanupTestData();
    
    // Teste 1: Sucesso sem retry
    console.log('\n📋 Teste 1: Análise bem-sucedida sem retry');
    await testSuccessfulAnalysis();
    
    // Teste 2: Retry com sucesso após 2 falhas
    console.log('\n📋 Teste 2: Retry com sucesso após 2 falhas');
    await testRetryWithSuccess();
    
    // Teste 3: Falha após esgotar tentativas
    console.log('\n📋 Teste 3: Falha após esgotar tentativas');
    await testMaxRetriesExceeded();
    
    // Teste 4: Erro não retryável
    console.log('\n📋 Teste 4: Erro não retryável');
    await testNonRetryableError();
    
    console.log('\n✅ Todos os testes de retry logic passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    process.exit(1);
  } finally {
    await cleanupTestData();
  }
}

// Teste 1: Análise bem-sucedida
async function testSuccessfulAnalysis() {
  const mockCloudRun = new MockCloudRunClient(0); // Sem falhas
  const orchestrator = createOrchestrator(mockCloudRun);
  
  const request = {
    documentId: 'doc_success_test',
    organizationId: 'org_test',
    userId: 'user_test',
    options: {
      includeAI: true,
      generateRecommendations: true,
      detailedMetrics: true
    },
    priority: 'normal'
  };
  
  // Criar documento de teste
  await db.collection('documents').doc(request.documentId).set({
    name: 'Documento de Teste',
    content: 'Conteúdo do documento para análise',
    type: 'EDITAL',
    size: 1024,
    uploadedAt: new Date(),
    organizationId: request.organizationId
  });
  
  const analysisId = await orchestrator.startAnalysis(request);
  console.log(`Análise iniciada: ${analysisId}`);
  
  // Aguardar conclusão
  await waitForAnalysisCompletion(orchestrator, analysisId, 30000);
  
  const progress = await orchestrator.getAnalysisProgress(analysisId);
  assert(progress.status === 'completed', `Esperado 'completed', recebido '${progress.status}'`);
  assert(mockCloudRun.callCount === 1, `Esperado 1 chamada, recebido ${mockCloudRun.callCount}`);
  
  console.log('✅ Análise bem-sucedida sem retry');
}

// Teste 2: Retry com sucesso
async function testRetryWithSuccess() {
  const mockCloudRun = new MockCloudRunClient(2); // 2 falhas antes do sucesso
  const orchestrator = createOrchestrator(mockCloudRun);
  
  const request = {
    documentId: 'doc_retry_test',
    organizationId: 'org_test',
    userId: 'user_test',
    options: {
      includeAI: true,
      generateRecommendations: true,
      detailedMetrics: true
    },
    priority: 'normal'
  };
  
  // Criar documento de teste
  await db.collection('documents').doc(request.documentId).set({
    name: 'Documento de Teste Retry',
    content: 'Conteúdo do documento para teste de retry',
    type: 'EDITAL',
    size: 2048,
    uploadedAt: new Date(),
    organizationId: request.organizationId
  });
  
  const analysisId = await orchestrator.startAnalysis(request);
  console.log(`Análise com retry iniciada: ${analysisId}`);
  
  // Aguardar conclusão (mais tempo para retries)
  await waitForAnalysisCompletion(orchestrator, analysisId, 60000);
  
  const progress = await orchestrator.getAnalysisProgress(analysisId);
  assert(progress.status === 'completed', `Esperado 'completed', recebido '${progress.status}'`);
  assert(progress.retryCount >= 2, `Esperado pelo menos 2 retries, recebido ${progress.retryCount}`);
  
  console.log(`✅ Análise bem-sucedida após ${progress.retryCount} retries`);
}

// Teste 3: Falha após esgotar tentativas
async function testMaxRetriesExceeded() {
  const mockCloudRun = new MockCloudRunClient(5); // Mais falhas que o máximo
  const orchestrator = createOrchestrator(mockCloudRun);
  
  const request = {
    documentId: 'doc_fail_test',
    organizationId: 'org_test',
    userId: 'user_test',
    options: {
      includeAI: true,
      generateRecommendations: true,
      detailedMetrics: true
    },
    priority: 'normal'
  };
  
  // Criar documento de teste
  await db.collection('documents').doc(request.documentId).set({
    name: 'Documento de Teste Falha',
    content: 'Conteúdo do documento para teste de falha',
    type: 'EDITAL',
    size: 512,
    uploadedAt: new Date(),
    organizationId: request.organizationId
  });
  
  const analysisId = await orchestrator.startAnalysis(request);
  console.log(`Análise com falha iniciada: ${analysisId}`);
  
  // Aguardar falha
  await waitForAnalysisCompletion(orchestrator, analysisId, 60000);
  
  const progress = await orchestrator.getAnalysisProgress(analysisId);
  assert(progress.status === 'failed', `Esperado 'failed', recebido '${progress.status}'`);
  assert(progress.retryCount >= 3, `Esperado pelo menos 3 retries, recebido ${progress.retryCount}`);
  
  console.log(`✅ Análise falhou após ${progress.retryCount} retries (esperado)`);
}

// Teste 4: Erro não retryável
async function testNonRetryableError() {
  // Mock que simula erro não retryável
  class NonRetryableMockClient {
    async analyzeDocument() {
      throw new Error('Invalid document format - not retryable');
    }
  }
  
  const mockCloudRun = new NonRetryableMockClient();
  const orchestrator = createOrchestrator(mockCloudRun);
  
  const request = {
    documentId: 'doc_nonretry_test',
    organizationId: 'org_test',
    userId: 'user_test',
    options: {
      includeAI: true,
      generateRecommendations: true,
      detailedMetrics: true
    },
    priority: 'normal'
  };
  
  // Criar documento de teste
  await db.collection('documents').doc(request.documentId).set({
    name: 'Documento de Teste Não Retryável',
    content: 'Conteúdo inválido',
    type: 'INVALID',
    size: 256,
    uploadedAt: new Date(),
    organizationId: request.organizationId
  });
  
  const analysisId = await orchestrator.startAnalysis(request);
  console.log(`Análise com erro não retryável iniciada: ${analysisId}`);
  
  // Aguardar falha rápida
  await waitForAnalysisCompletion(orchestrator, analysisId, 30000);
  
  const progress = await orchestrator.getAnalysisProgress(analysisId);
  assert(progress.status === 'failed', `Esperado 'failed', recebido '${progress.status}'`);
  assert((progress.retryCount || 0) === 0, `Esperado 0 retries para erro não retryável, recebido ${progress.retryCount}`);
  
  console.log('✅ Erro não retryável tratado corretamente');
}

// Utilitários
function createOrchestrator(mockCloudRun) {
  // Substituir CloudRunClient por mock no constructor
  const orchestrator = new AnalysisOrchestrator(
    db, 
    'http://mock-url', 
    'test-project',
    {
      projectId: 'test-project',
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    }
  );
  orchestrator.cloudRunClient = mockCloudRun;
  orchestrator.taskQueue = new MockTaskQueueService();
  orchestrator.notificationService = new MockNotificationService();
  
  return orchestrator;
}

async function waitForAnalysisCompletion(orchestrator, analysisId, timeoutMs) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const progress = await orchestrator.getAnalysisProgress(analysisId);
    
    if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
      return progress;
    }
    
    await sleep(1000); // Aguardar 1 segundo
  }
  
  throw new Error(`Timeout aguardando conclusão da análise ${analysisId}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function cleanupTestData() {
  const collections = ['documents', 'analysis_progress', 'analysis_results', 'organization_configs'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  }
}

// Executar testes
if (require.main === module) {
  runRetryLogicTests()
    .then(() => {
      console.log('\n🎉 Testes de retry logic concluídos com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erro nos testes:', error);
      process.exit(1);
    });
}

module.exports = {
  runRetryLogicTests,
  testSuccessfulAnalysis,
  testRetryWithSuccess,
  testMaxRetriesExceeded,
  testNonRetryableError
};