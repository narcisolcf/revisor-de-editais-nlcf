#!/usr/bin/env node

/**
 * Script de Diagnóstico do Ambiente Firebase
 * Valida conectividade com Storage e Firestore
 * Projeto: licitareview-prod
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Para ES modules, precisamos obter __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do service account
const serviceAccountPath = path.join(__dirname, 'credentials', 'licitareview-prod-b6b067fdd7e4.json');

// Variáveis globais para os serviços
let storage, firestore, bucket;

// Inicialização do Firebase Admin
async function initializeFirebase() {
  try {
    const fs = await import('fs');
    const serviceAccountData = await fs.promises.readFile(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountData);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'licitareview-prod'
    });
    
    console.log('🔧 Firebase Admin inicializado com sucesso');
    
    // Inicializar referências aos serviços
    storage = admin.storage();
    firestore = admin.firestore();
    
    // Tentar obter bucket padrão ou especificar explicitamente
    try {
      bucket = storage.bucket('licitareview-prod.appspot.com');
    } catch (error) {
      console.warn('⚠️  Storage bucket não configurado, testes de Storage serão ignorados');
      bucket = null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    process.exit(1);
  }
}

/**
 * Função principal de diagnóstico
 */
async function executarDiagnostico() {
  console.log('\n=== DIAGNÓSTICO DO AMBIENTE FIREBASE ===\n');
  
  try {
    // Inicializar Firebase primeiro
    await initializeFirebase();
    
    // 1. Teste de autenticação
    console.log('🔐 Testando autenticação...');
    await testarAutenticacao();
    
    // 2. Teste de conectividade Storage
    console.log('\n📁 Testando conectividade Storage...');
    const arquivosRecentes = await listarArquivosRecentes();
    
    // 3. Teste de conectividade Firestore
    console.log('\n🗄️  Testando conectividade Firestore...');
    await testarFirestore();
    
    // 4. Correlação Storage + Firestore
    console.log('\n🔗 Correlacionando dados Storage + Firestore...');
    await correlacionarDados(arquivosRecentes);
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO');
    
  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Finalizar conexões
    try {
      await admin.app().delete();
      console.log('\n🔌 Conexões finalizadas');
    } catch (error) {
      console.log('\n🔌 Conexões já finalizadas');
    }
  }
}

/**
 * Testa a autenticação básica
 */
async function testarAutenticacao() {
  try {
    // Teste simples de acesso ao projeto
    const projectId = admin.app().options.projectId;
    console.log(`   ✅ Autenticado no projeto: ${projectId}`);
    
    // Verificar permissões básicas
    await firestore.collection('_test').limit(1).get();
    console.log('   ✅ Permissões Firestore: OK');
    
    if (bucket) {
      try {
        await bucket.getMetadata();
        console.log('   ✅ Permissões Storage: OK');
      } catch (storageError) {
        console.log('   ⚠️  Storage: Bucket não existe ou sem permissão');
        bucket = null; // Desabilitar Storage para o resto do diagnóstico
      }
    } else {
      console.log('   ⚠️  Storage: Não configurado');
    }
    
  } catch (error) {
    throw new Error(`Falha na autenticação: ${error.message}`);
  }
}

/**
 * Lista e ordena arquivos do Storage por data de criação
 */
async function listarArquivosRecentes() {
  try {
    console.log('   📋 Listando arquivos do Storage...');
    
    if (!bucket) {
      console.log('   ⚠️  Storage não configurado, retornando lista vazia');
      return [];
    }
    
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log('   ⚠️  Nenhum arquivo encontrado no Storage');
      return [];
    }
    
    console.log(`   📊 Total de arquivos encontrados: ${files.length}`);
    
    // Obter metadados e ordenar por data de criação
    const arquivosComMetadata = await Promise.all(
      files.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata();
          return {
            nome: file.name,
            dataCriacao: new Date(metadata.timeCreated),
            tamanho: metadata.size,
            contentType: metadata.contentType
          };
        } catch (error) {
          console.warn(`   ⚠️  Erro ao obter metadata de ${file.name}:`, error.message);
          return null;
        }
      })
    );
    
    // Filtrar arquivos válidos e ordenar
    const arquivosValidos = arquivosComMetadata
      .filter(arquivo => arquivo !== null)
      .sort((a, b) => b.dataCriacao - a.dataCriacao);
    
    // Selecionar os 5 mais recentes
    const cincoMaisRecentes = arquivosValidos.slice(0, 5);
    
    console.log('   🎯 5 arquivos mais recentes identificados');
    
    return cincoMaisRecentes;
    
  } catch (error) {
    throw new Error(`Erro ao listar arquivos: ${error.message}`);
  }
}

/**
 * Testa conectividade básica com Firestore
 */
async function testarFirestore() {
  try {
    // Teste de leitura na coleção documentos
    const documentosRef = firestore.collection('documentos');
    const snapshot = await documentosRef.limit(5).get();
    
    console.log(`   📄 Documentos na coleção 'documentos': ${snapshot.size}`);
    
    // Teste de escrita (documento temporário)
    const testDoc = {
      tipo: 'teste_diagnostico',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'teste_conectividade'
    };
    
    const docRef = await documentosRef.add(testDoc);
    console.log(`   ✍️  Teste de escrita: OK (doc: ${docRef.id})`);
    
    // Limpar documento de teste
    await docRef.delete();
    console.log('   🗑️  Documento de teste removido');
    
  } catch (error) {
    throw new Error(`Erro no Firestore: ${error.message}`);
  }
}

/**
 * Correlaciona dados entre Storage e Firestore
 */
async function correlacionarDados(arquivosRecentes) {
  if (arquivosRecentes.length === 0) {
    console.log('   ⚠️  Nenhum arquivo para correlacionar');
    return;
  }
  
  console.log('\n=== RELATÓRIO DE CORRELAÇÃO ===\n');
  
  for (let i = 0; i < arquivosRecentes.length; i++) {
    const arquivo = arquivosRecentes[i];
    console.log(`${i + 1}. 📄 ${arquivo.nome}`);
    console.log(`   📅 Criado: ${arquivo.dataCriacao.toISOString()}`);
    console.log(`   📏 Tamanho: ${formatarTamanho(arquivo.tamanho)}`);
    console.log(`   🏷️  Tipo: ${arquivo.contentType || 'N/A'}`);
    
    try {
      // Buscar documento correspondente no Firestore
      // Assumindo que o ID do documento é o nome do arquivo (sem extensão)
      const nomeBase = arquivo.nome.replace(/\.[^/.]+$/, '');
      
      const docRef = firestore.collection('documentos').doc(nomeBase);
      const docSnapshot = await docRef.get();
      
      if (docSnapshot.exists) {
        const dados = docSnapshot.data();
        console.log('   🗄️  Firestore: ✅ Encontrado');
        console.log(`   📊 Status: ${dados.status || 'N/A'}`);
        console.log(`   🏢 Organização: ${dados.organizacao || 'N/A'}`);
        console.log(`   🔄 Processado: ${dados.processado ? 'Sim' : 'Não'}`);
      } else {
        console.log('   🗄️  Firestore: ❌ Não encontrado');
      }
      
    } catch (error) {
      console.log(`   🗄️  Firestore: ⚠️  Erro na consulta: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }
}

/**
 * Formata tamanho de arquivo em formato legível
 */
function formatarTamanho(bytes) {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Executar diagnóstico
if (import.meta.url === `file://${process.argv[1]}`) {
  executarDiagnostico()
    .then(() => {
      console.log('\n🎉 Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error.message);
      process.exit(1);
    });
}

export {
  executarDiagnostico,
  testarAutenticacao,
  listarArquivosRecentes,
  testarFirestore,
  correlacionarDados
};