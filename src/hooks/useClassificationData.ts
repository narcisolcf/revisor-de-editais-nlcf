import { useQuery } from '@tanstack/react-query';
import { getTiposObjeto } from '@/data/classification';
import type { ClassificationNode } from '@/types/document';
import { fetchClassificationTree } from '@/services/classificationFirebase';

// Hook principal para buscar árvore de classificação completa
export function useClassificationTree() {
  return useQuery<ClassificationNode[]>({
    queryKey: ['classification-tree'],
    queryFn: async () => {
      try {
        const tree = await fetchClassificationTree();
        if (Array.isArray(tree) && tree.length > 0) {
          return tree;
        }
        // Fallback para dados locais apenas se Firebase falhar
        console.warn('Falling back to local classification data');
        return getTiposObjeto();
      } catch (error) {
        console.warn('Firebase classification fetch failed, using local data:', error);
        return getTiposObjeto();
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    retry: 1, // Tentar uma vez antes do fallback
  });
}

// Manter compatibilidade com código existente
export function useTiposObjeto() {
  return useClassificationTree();
}
