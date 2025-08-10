import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { ClassificationNode } from '@/types/document';

const COLLECTION_NAME = 'classifications';

export async function fetchTiposObjeto(): Promise<ClassificationNode[]> {
  const col = collection(db, COLLECTION_NAME);
  const q = query(col, where('level', '==', 1));
  const snap = await getDocs(q);

  // Mapeia os documentos para o formato esperado pelo componente
  const items: ClassificationNode[] = snap.docs.map((doc) => {
    const d = doc.data() as any;
    return {
      nivel: 1,
      key: d?.key ?? doc.id,
      nome: d?.nome ?? d?.name ?? 'Sem nome',
      filhos: [],
    };
  });

  return items;
}
