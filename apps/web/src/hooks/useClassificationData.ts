import { useQuery } from '@tanstack/react-query';
import { getTiposObjeto } from '@/data/classification';
import type { ClassificationNode } from '@/types/document';
import { fetchClassificationTree } from '@/services/classificationFirebase';

// Hook principal para buscar árvore de classificação completa
export function useClassificationTree() {
  return useQuery<ClassificationNode[]>({
    queryKey: ['classification-tree'],
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('🔄 useClassificationTree: Starting data fetch...');
      }
      
      try {
        const tree = await fetchClassificationTree();
        if (Array.isArray(tree) && tree.length > 0) {
          if (import.meta.env.DEV) {
          console.log(`✅ Firebase data loaded successfully: ${tree.length} root nodes`);
        }
          return tree;
        }
        // Fallback para dados locais apenas se Firebase falhar
        console.warn('⚠️ Empty Firebase response, falling back to local classification data');
        const localData = getTiposObjeto();
        if (import.meta.env.DEV) {
          console.log(`📁 Local data loaded: ${localData.length} root nodes`);
        }
        return localData;
      } catch (error) {
        console.warn('❌ Firebase classification fetch failed, using local data:', error);
        const localData = getTiposObjeto();
        if (import.meta.env.DEV) {
          console.log(`📁 Local data loaded as fallback: ${localData.length} root nodes`);
        }
        return localData;
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
