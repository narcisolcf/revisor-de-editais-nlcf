/**
 * Teste End-to-End Simplificado (JavaScript)
 * Sprint 1 - LicitaReview
 * 
 * Executa diretamente com Node.js para testar o fluxo básico de análise
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

// Utilitários de teste
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(`Assertion failed: ${message}. Value should exist but is ${value}`);
  }
}

// Variáveis globais do teste
const testOrgId = 'test-org-' + Date.now();
const testUserId = 'test-user-' + Date.now();
let testDocumentId;
let testConfigId;
let testAnalysisId;

async function runE2ETests() {
  console.log('🚀 Iniciando Testes End-to-End Simplificados');
  console.log('🏢 Organization ID:', testOrgId);
  console.log('👤 User ID:', testUserId);
  console.log('=' .repeat(60));
  
  try {
    // Teste 1: Criar configuração organizacional
    await testCreateOrganizationConfig();
    
    // Teste 2: Criar documento
    await testCreateDocument();
    
    // Teste 3: Iniciar análise
    await testStartAnalysis();
    
    // Teste 4: Simular processamento
    await testProcessAnalysis();
    
    // Teste 5: Concluir análise
    await testCompleteAnalysis();
    
    // Teste 6: Verificar integridade
    await testDataIntegrity();
    
    // Teste 7: Testar queries complexas
    await testComplexQueries();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODOS OS TESTES E2E PASSARAM!');
    console.log('✅ Fluxo completo de análise validado');
    
  } catch (error) {
    console.error('\n❌ TESTE E2E FALHOU:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    // Limpeza
    await cleanup();
  }
}

async function testCreateOrganizationConfig() {
  console.log('\n🏗️ Teste 1: Criando configuração organizacional');
  
  const config = {
    organizationId: testOrgId,
    organizationName: 'Organização de Teste E2E',
    weights: {
      structural: 25.0,
      legal: 25.0,
      clarity: 25.0,
      abnt: 25.0
    },
    presetType: 'STANDARD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const configRef = await firestore.collection('organizationConfigs').add(config);
  testConfigId = configRef.id;
  
  console.log('✅ Configuração criada:', testConfigId);
  
  // Verificar
  const configDoc = await configRef.get();
  assert(configDoc.exists, 'Configuração deve existir');
  
  const configData = configDoc.data();
  assertEqual(configData.organizationId, testOrgId, 'Organization ID deve coincidir');
  assertEqual(configData.weights.structural, 25.0, 'Peso structural deve ser 25.0');
  assertEqual(configData.isActive, true, 'Configuração deve estar ativa');
  
  console.log('✅ Configuração verificada com sucesso');
}

async function testCreateDocument() {
  console.log('\n📄 Teste 2: Criando documento para análise');
  
  const document = {
    title: 'Edital de Teste E2E',
    content: 'Este é um edital de teste para verificar o fluxo end-to-end de análise. O documento contém informações estruturais, legais e de clareza para validação. Inclui seções sobre requisitos técnicos, critérios de avaliação, prazos de execução e condições contratuais.',
    organizationId: testOrgId,
    status: 'DRAFT',
    type: 'EDITAL',
    metadata: {
      fileSize: 1024,
      pageCount: 5,
      language: 'pt-BR'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: testUserId
  };
  
  const docRef = await firestore.collection('documents').add(document);
  testDocumentId = docRef.id;
  
  console.log('✅ Documento criado:', testDocumentId);
  
  // Verificar
  const docDoc = await docRef.get();
  assert(docDoc.exists, 'Documento deve existir');
  
  const docData = docDoc.data();
  assertEqual(docData.title, 'Edital de Teste E2E', 'Título deve coincidir');
  assertEqual(docData.organizationId, testOrgId, 'Organization ID deve coincidir');
  assertEqual(docData.status, 'DRAFT', 'Status inicial deve ser DRAFT');
  
  console.log('✅ Documento verificado com sucesso');
}

async function testStartAnalysis() {
  console.log('\n🔄 Teste 3: Iniciando análise');
  
  // Atualizar status do documento
  await firestore.collection('documents').doc(testDocumentId).update({
    status: 'PROCESSING',
    updatedAt: new Date(),
    processingStartedAt: new Date()
  });
  
  // Criar registro de análise
  const analysisResult = {
    documentId: testDocumentId,
    organizationId: testOrgId,
    status: 'pending',
    priority: 'NORMAL',
    analysisType: 'FULL',
    parameters: {
      enableStructuralAnalysis: true,
      enableLegalAnalysis: true,
      enableClarityAnalysis: true,
      enableABNTAnalysis: true
    },
    createdAt: new Date(),
    createdBy: testUserId
  };
  
  const analysisRef = await firestore.collection('analysisResults').add(analysisResult);
  testAnalysisId = analysisRef.id;
  
  console.log('✅ Análise criada:', testAnalysisId);
  
  // Verificar documento atualizado
  const docDoc = await firestore.collection('documents').doc(testDocumentId).get();
  const docData = docDoc.data();
  assertEqual(docData.status, 'PROCESSING', 'Status deve ser PROCESSING');
  
  // Verificar análise criada
  const analysisDoc = await analysisRef.get();
  assert(analysisDoc.exists, 'Análise deve existir');
  
  const analysisData = analysisDoc.data();
  assertEqual(analysisData.status, 'pending', 'Status da análise deve ser pending');
  assertEqual(analysisData.documentId, testDocumentId, 'Document ID deve coincidir');
  
  console.log('✅ Análise iniciada com sucesso');
}

async function testProcessAnalysis() {
  console.log('\n⚙️ Teste 4: Simulando processamento');
  
  // Atualizar status para processing
  await firestore.collection('analysisResults').doc(testAnalysisId).update({
    status: 'processing',
    processingStartedAt: new Date(),
    progress: {
      structural: 0,
      legal: 0,
      clarity: 0,
      abnt: 0,
      overall: 0
    }
  });
  
  console.log('✅ Status atualizado para processing');
  
  // Simular progresso incremental
  const progressSteps = [
    { structural: 25, legal: 0, clarity: 0, abnt: 0, overall: 6.25 },
    { structural: 100, legal: 50, clarity: 0, abnt: 0, overall: 37.5 },
    { structural: 100, legal: 100, clarity: 75, clarity: 0, overall: 68.75 },
    { structural: 100, legal: 100, clarity: 100, abnt: 50, overall: 87.5 }
  ];
  
  for (let i = 0; i < progressSteps.length; i++) {
    await firestore.collection('analysisResults').doc(testAnalysisId).update({
      progress: progressSteps[i],
      lastProgressUpdate: new Date()
    });
    
    console.log(`✅ Progresso atualizado: ${progressSteps[i].overall}%`);
    
    // Pequena pausa para simular processamento
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Processamento simulado com sucesso');
}

async function testCompleteAnalysis() {
  console.log('\n✅ Teste 5: Concluindo análise');
  
  const completedAnalysis = {
    status: 'completed',
    conformityScores: {
      structural: 85.5,
      legal: 92.0,
      clarity: 78.3,
      abnt: 88.7,
      overall: 86.1
    },
    weightedScore: 86.1,
    findings: [
      {
        category: 'structural',
        severity: 'medium',
        description: 'Estrutura do documento adequada com pequenos ajustes necessários',
        location: 'Seção 2.1'
      },
      {
        category: 'legal',
        severity: 'low',
        description: 'Conformidade legal excelente',
        location: 'Geral'
      }
    ],
    recommendations: [
      'Revisar formatação da seção 2.1',
      'Adicionar mais detalhes nos critérios de avaliação'
    ],
    executionTimeSeconds: 45.2,
    completedAt: new Date(),
    processingCompletedAt: new Date()
  };
  
  await firestore.collection('analysisResults').doc(testAnalysisId).update(completedAnalysis);
  
  // Atualizar documento
  await firestore.collection('documents').doc(testDocumentId).update({
    status: 'COMPLETED',
    updatedAt: new Date(),
    processingCompletedAt: new Date(),
    lastAnalysisId: testAnalysisId
  });
  
  console.log('✅ Análise concluída');
  
  // Verificar resultados
  const analysisDoc = await firestore.collection('analysisResults').doc(testAnalysisId).get();
  const analysisData = analysisDoc.data();
  
  assertEqual(analysisData.status, 'completed', 'Status deve ser completed');
  assertEqual(analysisData.conformityScores.overall, 86.1, 'Score overall deve ser 86.1');
  assertExists(analysisData.completedAt, 'Data de conclusão deve existir');
  assert(analysisData.findings.length > 0, 'Deve ter findings');
  assert(analysisData.recommendations.length > 0, 'Deve ter recomendações');
  
  // Verificar documento
  const docDoc = await firestore.collection('documents').doc(testDocumentId).get();
  const docData = docDoc.data();
  assertEqual(docData.status, 'COMPLETED', 'Status do documento deve ser COMPLETED');
  assertEqual(docData.lastAnalysisId, testAnalysisId, 'Last analysis ID deve coincidir');
  
  console.log('✅ Resultados verificados:', {
    overallScore: analysisData.conformityScores.overall,
    findingsCount: analysisData.findings.length,
    recommendationsCount: analysisData.recommendations.length,
    executionTime: analysisData.executionTimeSeconds
  });
}

async function testDataIntegrity() {
  console.log('\n🔍 Teste 6: Verificando integridade dos dados');
  
  // Buscar todos os dados relacionados
  const [configDoc, documentDoc, analysisDoc] = await Promise.all([
    firestore.collection('organizationConfigs').doc(testConfigId).get(),
    firestore.collection('documents').doc(testDocumentId).get(),
    firestore.collection('analysisResults').doc(testAnalysisId).get()
  ]);
  
  // Verificar existência
  assert(configDoc.exists, 'Configuração deve existir');
  assert(documentDoc.exists, 'Documento deve existir');
  assert(analysisDoc.exists, 'Análise deve existir');
  
  const configData = configDoc.data();
  const docData = documentDoc.data();
  const analysisData = analysisDoc.data();
  
  // Verificar consistência de organização
  assertEqual(configData.organizationId, testOrgId, 'Config org ID deve coincidir');
  assertEqual(docData.organizationId, testOrgId, 'Document org ID deve coincidir');
  assertEqual(analysisData.organizationId, testOrgId, 'Analysis org ID deve coincidir');
  
  // Verificar relacionamentos
  assertEqual(analysisData.documentId, testDocumentId, 'Analysis document ID deve coincidir');
  assertEqual(docData.lastAnalysisId, testAnalysisId, 'Document last analysis ID deve coincidir');
  
  // Verificar estados finais
  assertEqual(configData.isActive, true, 'Configuração deve estar ativa');
  assertEqual(docData.status, 'COMPLETED', 'Documento deve estar completo');
  assertEqual(analysisData.status, 'completed', 'Análise deve estar completa');
  
  console.log('✅ Integridade dos dados verificada:', {
    allEntitiesExist: true,
    organizationConsistency: true,
    relationshipsValid: true,
    finalStatesCorrect: true
  });
}

async function testComplexQueries() {
  console.log('\n🔍 Teste 7: Testando queries complexas');
  
  // Query 1: Documentos por organização
  const orgDocsQuery = await firestore
    .collection('documents')
    .where('organizationId', '==', testOrgId)
    .where('status', '==', 'COMPLETED')
    .get();
  
  assert(orgDocsQuery.size >= 1, 'Deve encontrar pelo menos 1 documento');
  console.log('✅ Query documentos por organização:', orgDocsQuery.size);
  
  // Query 2: Análises concluídas
  const completedAnalysesQuery = await firestore
    .collection('analysisResults')
    .where('organizationId', '==', testOrgId)
    .where('status', '==', 'completed')
    .orderBy('completedAt', 'desc')
    .get();
  
  assert(completedAnalysesQuery.size >= 1, 'Deve encontrar pelo menos 1 análise');
  console.log('✅ Query análises concluídas:', completedAnalysesQuery.size);
  
  // Query 3: Configurações ativas
  const activeConfigsQuery = await firestore
    .collection('organizationConfigs')
    .where('organizationId', '==', testOrgId)
    .where('isActive', '==', true)
    .get();
  
  assert(activeConfigsQuery.size >= 1, 'Deve encontrar pelo menos 1 configuração ativa');
  console.log('✅ Query configurações ativas:', activeConfigsQuery.size);
  
  // Query 4: Análises com score alto
  const highScoreQuery = await firestore
    .collection('analysisResults')
    .where('organizationId', '==', testOrgId)
    .where('conformityScores.overall', '>=', 80)
    .get();
  
  assert(highScoreQuery.size >= 1, 'Deve encontrar análises com score alto');
  console.log('✅ Query análises com score alto:', highScoreQuery.size);
  
  console.log('✅ Todas as queries complexas executadas com sucesso');
}

async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  
  try {
    const batch = firestore.batch();
    
    // Adicionar documentos para exclusão
    if (testConfigId) {
      batch.delete(firestore.collection('organizationConfigs').doc(testConfigId));
    }
    if (testDocumentId) {
      batch.delete(firestore.collection('documents').doc(testDocumentId));
    }
    if (testAnalysisId) {
      batch.delete(firestore.collection('analysisResults').doc(testAnalysisId));
    }
    
    await batch.commit();
    console.log('✅ Dados de teste removidos');
  } catch (error) {
    console.error('Erro na limpeza:', error.message);
  }
}

// Executar testes
runE2ETests()
  .then(() => {
    console.log('\n🎉 TESTES E2E CONCLUÍDOS COM SUCESSO!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 TESTES E2E FALHARAM:', error.message);
    process.exit(1);
  });