import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { classificationTree } from '../data/classification';
import type { ClassificationNode } from '../types/document';

async function migrateClassificationData() {
  console.log('🚀 Iniciando migração dos dados de classificação...');
  
  const batch = writeBatch(db);
  const collectionRef = collection(db, 'classifications');
  
  // Função recursiva para processar a árvore hierárquica
  function processNode(node: ClassificationNode, parentPath: string = '') {
    const docId = parentPath ? `${parentPath}_${node.key}` : node.key;
    const docRef = doc(collectionRef, docId);
    
    // Preparar dados do nó
    const nodeData = {
      nivel: node.nivel,
      nome: node.nome,
      key: node.key,
      parentPath: parentPath || null,
      hasChildren: node.filhos && node.filhos.length > 0,
      childrenKeys: node.filhos?.map((child: ClassificationNode) => child.key) || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    batch.set(docRef, nodeData);
    console.log(`📄 Preparando migração: ${nodeData.nome} (${docId})`);
    
    // Processar filhos recursivamente
    if (node.filhos && node.filhos.length > 0) {
      node.filhos.forEach((child: ClassificationNode) => {
        processNode(child, docId);
      });
    }
  }
  
  try {
    // Primeiro verificar se já foi migrado
    try {
      const controlDoc = doc(db, 'migration-control', 'classification-v1');
      const controlSnap = await import('firebase/firestore').then(module => module.getDoc(controlDoc));
      
      if (controlSnap.exists()) {
        console.log('⚠️  Migração já foi executada anteriormente.');
        console.log('📅 Data da migração:', controlSnap.data().migratedAt?.toDate());
        return;
      }
    } catch (checkError) {
      console.log('📝 Primeira execução da migração, prosseguindo...');
    }
    
    // Processar toda a árvore de classificação
    classificationTree.forEach(rootNode => {
      processNode(rootNode);
    });
    
    console.log('⏳ Executando batch write...');
    
    // Executar batch write
    await batch.commit();
    console.log('✅ Migração de dados concluída com sucesso!');
    
    // Criar documento de controle da migração
    const controlDoc = doc(db, 'migration-control', 'classification-v1');
    await setDoc(controlDoc, {
      version: '1.0',
      migratedAt: new Date(),
      totalNodes: getTotalNodeCount(classificationTree),
      status: 'completed',
      source: 'local-data'
    });
    
    console.log('📊 Documento de controle criado');
    console.log(`🎯 Total de ${getTotalNodeCount(classificationTree)} nós migrados`);
    
  } catch (error: unknown) {
    console.error('❌ Erro na migração:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
      console.log('\n🚨 ERRO DE PERMISSÃO:');
      console.log('1. Acesse o Firebase Console: https://console.firebase.google.com');
      console.log('2. Vá para Firestore Database > Rules');
      console.log('3. Substitua as regras pelo conteúdo do arquivo firestore.rules');
      console.log('4. Publique as novas regras');
      console.log('5. Execute a migração novamente');
    }
    
    throw error;
  }
}

function getTotalNodeCount(tree: ClassificationNode[]): number {
  let count = 0;
  
  function countNodes(nodes: ClassificationNode[]) {
    nodes.forEach(node => {
      count++;
      if (node.filhos && node.filhos.length > 0) {
        countNodes(node.filhos);
      }
    });
  }
  
  countNodes(tree);
  return count;
}

// Executar migração automaticamente
migrateClassificationData()
  .then(() => {
    console.log('🎉 Script de migração finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });

export { migrateClassificationData };