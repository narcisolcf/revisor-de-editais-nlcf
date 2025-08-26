/**
 * Teste simplificado para validar retry logic
 * Testa apenas as funções de retry sem depender da compilação completa
 */

const admin = require('firebase-admin');

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

// Implementação simplificada das funções de retry
class RetryLogicTester {
  constructor() {
    this.maxRetries = 3;
    this.retryDelayMs = 1000; // 1 segundo para teste
    this.maxRetryDelayMs = 10000; // 10 segundos
  }

  /**
   * Executa uma operação com retry automático
   */
  async retryOperation(operation, operationName, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} para ${operationName}`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.isRetryableError(lastError)) {
          throw lastError;
        }

        const delayMs = this.calculateRetryDelay(attempt);
        console.log(`${operationName} falhou (tentativa ${attempt}/${maxRetries}). Tentando novamente em ${delayMs}ms:`, {
          error: lastError.message,
          attempt,
          maxRetries
        });

        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Verifica se um erro pode ser retentado
   */
  isRetryableError(error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Erros de rede e temporários
    const networkErrors = [
      'network', 'timeout', 'econnreset', 'enotfound', 'econnrefused',
      'socket hang up', 'request timeout', 'connection reset'
    ];

    // Erros HTTP retryáveis
    const retryableHttpErrors = [
      '429', '500', '502', '503', '504', 'rate limit', 'service unavailable',
      'internal server error', 'bad gateway', 'gateway timeout'
    ];

    // Erros do Firestore retryáveis
    const firestoreErrors = [
      'unavailable', 'deadline', 'exceeded', 'resource-exhausted', 'aborted'
    ];

    return networkErrors.some(err => message.includes(err) || name.includes(err)) ||
           retryableHttpErrors.some(err => message.includes(err)) ||
           firestoreErrors.some(err => message.includes(err));
  }

  /**
   * Calcula o delay para retry com backoff exponencial
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 500; // Adiciona jitter
    
    return Math.min(exponentialDelay + jitter, this.maxRetryDelayMs);
  }

  /**
   * Utilitário para sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Simuladores de operações que podem falhar
class OperationSimulator {
  constructor(failureCount = 0) {
    this.failureCount = failureCount;
    this.callCount = 0;
  }

  async networkOperation() {
    this.callCount++;
    
    if (this.callCount <= this.failureCount) {
      if (this.callCount === 1) {
        throw new Error('Network timeout - ECONNRESET');
      } else if (this.callCount === 2) {
        throw new Error('Service unavailable - 503');
      } else {
        throw new Error('Rate limit exceeded - 429');
      }
    }

    return { success: true, attempt: this.callCount };
  }

  async firestoreOperation() {
    this.callCount++;
    
    if (this.callCount <= this.failureCount) {
      if (this.callCount === 1) {
        throw new Error('Firestore unavailable');
      } else {
        throw new Error('Deadline exceeded');
      }
    }

    // Simular operação no Firestore
    await db.collection('test_retry').doc('test').set({
      timestamp: new Date(),
      attempt: this.callCount
    });

    return { success: true, attempt: this.callCount };
  }

  async nonRetryableOperation() {
    throw new Error('Invalid input format - not retryable');
  }
}

// Função de teste principal
async function runRetryTests() {
  console.log('🧪 Iniciando testes de retry logic simplificado...');
  
  const tester = new RetryLogicTester();
  
  try {
    // Limpar dados de teste
    await cleanupTestData();
    
    // Teste 1: Sucesso sem retry
    console.log('\n📋 Teste 1: Operação bem-sucedida sem retry');
    const simulator1 = new OperationSimulator(0);
    const result1 = await tester.retryOperation(
      () => simulator1.networkOperation(),
      'Operação de rede'
    );
    assert(result1.success, 'Operação deveria ter sucesso');
    assert(result1.attempt === 1, `Esperado 1 tentativa, recebido ${result1.attempt}`);
    console.log('✅ Operação bem-sucedida sem retry');
    
    // Teste 2: Retry com sucesso após 2 falhas
    console.log('\n📋 Teste 2: Retry com sucesso após 2 falhas');
    const simulator2 = new OperationSimulator(2);
    const result2 = await tester.retryOperation(
      () => simulator2.networkOperation(),
      'Operação com retry'
    );
    assert(result2.success, 'Operação deveria ter sucesso após retry');
    assert(result2.attempt === 3, `Esperado 3 tentativas, recebido ${result2.attempt}`);
    console.log('✅ Operação bem-sucedida após 2 retries');
    
    // Teste 3: Falha após esgotar tentativas
    console.log('\n📋 Teste 3: Falha após esgotar tentativas');
    const simulator3 = new OperationSimulator(5);
    try {
      await tester.retryOperation(
        () => simulator3.networkOperation(),
        'Operação que falha'
      );
      assert(false, 'Operação deveria ter falhado');
    } catch (error) {
      assert(error.message.includes('Rate limit'), `Erro inesperado: ${error.message}`);
      console.log('✅ Operação falhou após esgotar tentativas (esperado)');
    }
    
    // Teste 4: Erro não retryável
    console.log('\n📋 Teste 4: Erro não retryável');
    const simulator4 = new OperationSimulator(0);
    try {
      await tester.retryOperation(
        () => simulator4.nonRetryableOperation(),
        'Operação não retryável'
      );
      assert(false, 'Operação deveria ter falhado');
    } catch (error) {
      assert(error.message.includes('Invalid input'), `Erro inesperado: ${error.message}`);
      console.log('✅ Erro não retryável tratado corretamente');
    }
    
    // Teste 5: Operação Firestore com retry
    console.log('\n📋 Teste 5: Operação Firestore com retry');
    const simulator5 = new OperationSimulator(1);
    const result5 = await tester.retryOperation(
      () => simulator5.firestoreOperation(),
      'Operação Firestore'
    );
    assert(result5.success, 'Operação Firestore deveria ter sucesso');
    assert(result5.attempt === 2, `Esperado 2 tentativas, recebido ${result5.attempt}`);
    console.log('✅ Operação Firestore bem-sucedida após 1 retry');
    
    // Teste 6: Verificar detecção de erros retryáveis
    console.log('\n📋 Teste 6: Detecção de erros retryáveis');
    const retryableErrors = [
      new Error('Network timeout'),
      new Error('ECONNRESET'),
      new Error('Service unavailable - 503'),
      new Error('Rate limit exceeded - 429'),
      new Error('Firestore unavailable'),
      new Error('Deadline exceeded')
    ];
    
    const nonRetryableErrors = [
      new Error('Invalid input format'),
      new Error('Authentication failed'),
      new Error('Permission denied'),
      new Error('Not found')
    ];
    
    retryableErrors.forEach(error => {
      assert(tester.isRetryableError(error), `Erro deveria ser retryável: ${error.message}`);
    });
    
    nonRetryableErrors.forEach(error => {
      assert(!tester.isRetryableError(error), `Erro não deveria ser retryável: ${error.message}`);
    });
    
    console.log('✅ Detecção de erros retryáveis funcionando corretamente');
    
    console.log('\n✅ Todos os testes de retry logic passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    process.exit(1);
  } finally {
    await cleanupTestData();
  }
}

// Utilitários
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function cleanupTestData() {
  try {
    const snapshot = await db.collection('test_retry').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.warn('Aviso: Erro ao limpar dados de teste:', error.message);
  }
}

// Executar testes
if (require.main === module) {
  runRetryTests()
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
  RetryLogicTester,
  OperationSimulator,
  runRetryTests
};