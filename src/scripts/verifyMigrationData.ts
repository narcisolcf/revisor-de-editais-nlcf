import { classificationTree } from '../data/classification';
import type { ClassificationNode } from '../types/document';

// Script para verificar a estrutura de dados antes da migração
function verifyClassificationData() {
  console.log('🔍 Verificando estrutura de dados de classificação...\n');

  // Simular a estrutura que será migrada para o Firebase
  const migrationData: Record<string, unknown>[] = [];
  
  function processNode(node: ClassificationNode, parentPath: string = '') {
    const docId = parentPath ? `${parentPath}_${node.key}` : node.key;
    
    const nodeData = {
      docId,
      nivel: node.nivel,
      nome: node.nome,
      key: node.key,
      parentPath: parentPath || null,
      hasChildren: node.filhos && node.filhos.length > 0,
      childrenKeys: node.filhos?.map((child: ClassificationNode) => child.key) || [],
    };
    
    migrationData.push(nodeData);
    console.log(`📄 ${node.nome} (ID: ${docId})`);
    
    if (node.filhos && node.filhos.length > 0) {
      node.filhos.forEach((child: ClassificationNode) => {
        processNode(child, docId);
      });
    }
  }

  // Processar toda a árvore
  classificationTree.forEach(rootNode => {
    processNode(rootNode);
  });

  console.log(`\n📊 Total de documentos a serem migrados: ${migrationData.length}`);
  
  // Mostrar estrutura resumida
  console.log('\n🏗️  Estrutura hierárquica:');
  const rootNodes = migrationData.filter(node => node.parentPath === null);
  rootNodes.forEach(root => {
    console.log(`\n${root.nome} (${root.childrenKeys.length} modalidades)`);
    
    root.childrenKeys.forEach((modalidadeKey: string) => {
      const modalidade = migrationData.find(node => 
        node.key === modalidadeKey && node.parentPath === root.docId
      );
      if (modalidade) {
        console.log(`  └─ ${modalidade.nome} (${modalidade.childrenKeys.length} subtipos)`);
        
        modalidade.childrenKeys.forEach((subtipoKey: string) => {
          const subtipo = migrationData.find(node => 
            node.key === subtipoKey && node.parentPath === modalidade.docId
          );
          if (subtipo) {
            console.log(`      └─ ${subtipo.nome} (${subtipo.childrenKeys.length} documentos)`);
          }
        });
      }
    });
  });

  console.log('\n✅ Verificação concluída! Os dados estão prontos para migração.');
  console.log('\n📋 Próximos passos:');
  console.log('1. Configurar regras de segurança no Firebase Console');
  console.log('2. Executar a migração real: npm run migrate:classification');
  
  return migrationData;
}

// Executar verificação
const data = verifyClassificationData();

export { verifyClassificationData, data };