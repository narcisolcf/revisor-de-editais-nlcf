import { useQuery } from '@tanstack/react-query';
import { getTiposObjeto } from '@/data/classification';
import type { ClassificationNode } from '@/types/document';
import { fetchTiposObjeto } from '@/services/classificationFirebase';

// Busca Tipos de Objeto com fallback para dados locais
export function useTiposObjeto() {
  return useQuery<ClassificationNode[]>({
    queryKey: ['tipos-objeto'],
    queryFn: async () => {
      try {
        const remote = await fetchTiposObjeto();
        if (Array.isArray(remote) && remote.length > 0) return remote;
        return getTiposObjeto();
      } catch (e) {
        return getTiposObjeto();
      }
    },
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });
}
