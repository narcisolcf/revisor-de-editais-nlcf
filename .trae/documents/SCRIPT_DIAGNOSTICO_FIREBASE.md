# Script de Diagnóstico Firebase - Especificação Técnica

## Objetivo
Validar a conectividade e funcionalidade do ambiente Firebase após a resolução dos problemas de propriedade do projeto `licitareview-prod`.

## Especificação do Script

### 1. Estrutura do Arquivo
```
diagnose-firebase-environment.js
```

### 2. Dependências Necessárias
```json
{
  "firebase-admin": "^12.0.0",
  "dotenv": "^16.0.0"
}
```

### 3. Código Completo

```javascript
#!/usr/bin/env node

/**
 * Script de Diagnóstico do Ambiente Firebase
 * Valida conectividade com Storage e Firestore
 * Projeto: licitareview-prod
 */

const admin = require('firebase-admin');
const path = require('path');

// Configuração do service account
const serviceAccountPath = path.join(__dirname, 'credentials', 'licitareview-prod-b6b067fdd7e4.json');

// Inicialização do Firebase Admin
try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'licitareview-prod',
    storageBucket: 'licitareview-prod.appspot.com'
  });
  
  console.log('🔧 Firebase Admin inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
  process.exit(1);
}

// Referências aos serviços
const storage = admin.storage();
const firestore = admin.firestore();
const bucket = storage.bucket();

/**
 * Função principal de diagnóstico
 */
async function executarDiagnostico() {
  console.log('\n=== DIAGNÓSTICO DO AMBIENTE FIREBASE ===\n');
  
  try {
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
    await admin.app().delete();
    console.log('\n🔌 Conexões finalizadas');
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
    
    await bucket.getMetadata();
    console.log('   ✅ Permissões Storage: OK');
    
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
if (require.main === module) {
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

module.exports = {
  executarDiagnostico,
  testarAutenticacao,
  listarArquivosRecentes,
  testarFirestore,
  correlacionarDados
};
```

## 4. Instruções de Execução

### 4.1 Pré-requisitos
```bash
# Instalar dependências
npm install firebase-admin dotenv

# Verificar se o arquivo de credenciais existe
ls -la credentials/licitareview-prod-b6b067fdd7e4.json
```

### 4.2 Execução
```bash
# Executar o script
node diagnose-firebase-environment.js

# Ou com permissões de execução
chmod +x diagnose-firebase-environment.js
./diagnose-firebase-environment.js
```

### 4.3 Output Esperado
```
=== DIAGNÓSTICO DO AMBIENTE FIREBASE ===

🔐 Testando autenticação...
   ✅ Autenticado no projeto: licitareview-prod
   ✅ Permissões Firestore: OK
   ✅ Permissões Storage: OK

📁 Testando conectividade Storage...
   📋 Listando arquivos do Storage...
   📊 Total de arquivos encontrados: 127
   🎯 5 arquivos mais recentes identificados

🗄️  Testando conectividade Firestore...
   📄 Documentos na coleção 'documentos': 45
   ✍️  Teste de escrita: OK (doc: abc123)
   🗑️  Documento de teste removido

🔗 Correlacionando dados Storage + Firestore...

=== RELATÓRIO DE CORRELAÇÃO ===

1. 📄 edital_2024_01_15.pdf
   📅 Criado: 2024-01-15T10:30:00.000Z
   📏 Tamanho: 2.5 MB
   🏷️  Tipo: application/pdf
   🗄️  Firestore: ✅ Encontrado
   📊 Status: processado
   🏢 Organização: Prefeitura Municipal
   🔄 Processado: Sim

[...]

✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO

🔌 Conexões finalizadas

🎉 Script finalizado
```

## 5. Tratamento de Erros

### 5.1 Erros Comuns
- **Arquivo de credenciais não encontrado**: Verificar caminho `./credentials/licitareview-prod-b6b067fdd7e4.json`
- **Permissões insuficientes**: Validar roles IAM da service account
- **Projeto não encontrado**: Confirmar project ID `licitareview-prod`
- **Timeout de rede**: Verificar conectividade com Google Cloud

### 5.2 Debug
```bash
# Executar com logs detalhados
DEBUG=* node diagnose-firebase-environment.js

# Verificar configuração Firebase
node -e "console.log(require('./credentials/licitareview-prod-b6b067fdd7e4.json').project_id)"
```

## 6. Próximos Passos

Após execução bem-sucedida do script:
1. ✅ Ambiente validado
2. 🚀 Iniciar desenvolvimento das funcionalidades pendentes
3. 🔄 Implementar AnalysisOrchestrator
4. 🔗 Configurar comunicação bidirecional
5. 📦 Preparar deploy staging

---
*Especificação criada em: Janeiro 2025*
*Versão: 1.0*