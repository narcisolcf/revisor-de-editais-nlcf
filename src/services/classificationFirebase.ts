import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { ClassificationNode } from '@/types/document';

const COLLECTION_NAME = 'classifications';

interface FirebaseClassificationNode {
  nivel: number;
  nome: string;
  key: string;
  parentPath: string | null;
  hasChildren: boolean;
  childrenKeys: string[];
}

export async function fetchClassificationTree(): Promise<ClassificationNode[]> {
  try {
    // Verificar se a migração foi concluída
    const migrationDoc = await getDoc(doc(db, 'migration-control', 'classification-v1'));
    if (!migrationDoc.exists()) {
      throw new Error('Classification data not migrated to Firebase yet');
    }

    const col = collection(db, COLLECTION_NAME);
    const snap = await getDocs(col);
    
    if (snap.empty) {
      throw new Error('No classification data found in Firebase');
    }

    // Mapear documentos por path para facilitar a construção da árvore
    const nodeMap = new Map<string, FirebaseClassificationNode>();
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      
      // Validar se o documento tem os campos necessários
      if (
        typeof data.nivel === 'number' &&
        typeof data.nome === 'string' &&
        typeof data.key === 'string' &&
        (data.parentPath === null || typeof data.parentPath === 'string') &&
        typeof data.hasChildren === 'boolean' &&
        Array.isArray(data.childrenKeys)
      ) {
        const validNode: FirebaseClassificationNode = {
          nivel: data.nivel,
          nome: data.nome,
          key: data.key,
          parentPath: data.parentPath,
          hasChildren: data.hasChildren,
          childrenKeys: data.childrenKeys
        };
        nodeMap.set(doc.id, validNode);
      } else {
        console.warn(`Skipping invalid document: ${doc.id}`, data);
      }
    });

    // Construir árvore hierárquica recursivamente
    function buildHierarchy(parentPath: string | null = null): ClassificationNode[] {
      const children: ClassificationNode[] = [];
      
      for (const [docId, nodeData] of nodeMap.entries()) {
        if (nodeData.parentPath === parentPath) {
          const node: ClassificationNode = {
            nivel: nodeData.nivel,
            nome: nodeData.nome,
            key: nodeData.key,
            filhos: nodeData.hasChildren ? buildHierarchy(docId) : []
          };
          children.push(node);
        }
      }
      
      // Ordenar por nome para consistência
      return children.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    const tree = buildHierarchy();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Firebase: Built classification tree with ${tree.length} root nodes`);
      console.log('Root nodes:', tree.map(n => ({ key: n.key, nome: n.nome, filhos: n.filhos.length })));
    }
    
    if (tree.length === 0) {
      throw new Error('Failed to build classification tree from Firebase data');
    }

    return tree;
    
  } catch (error) {
    console.error('Error fetching classification tree from Firebase:', error);
    throw error;
  }
}

// Manter compatibilidade com código existente
export async function fetchTiposObjeto(): Promise<ClassificationNode[]> {
  const fullTree = await fetchClassificationTree();
  return fullTree; // Retorna a árvore completa (nível 1 já são os tipos de objeto)
}
