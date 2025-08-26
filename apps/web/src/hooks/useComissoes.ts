import { useState, useEffect, useCallback } from 'react';
import {
  Comissao,
  ComissaoFilters,
  ComissaoPagination,
  CreateComissaoRequest,
  UpdateComissaoRequest,
  UseComissoesOptions,
  UseComissoesReturn
} from '../types/comissao';
import { comissoesService } from '../services/comissoesService';

export const useComissoes = (options: UseComissoesOptions): UseComissoesReturn => {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ComissaoPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchComissoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await comissoesService.list(
        options.organizationId,
        options.filters,
        options.pagination?.page || 1,
        options.pagination?.limit || 20
      );
      
      setComissoes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar comissões';
      setError(errorMessage);
      console.error('Erro ao buscar comissões:', err);
    } finally {
      setLoading(false);
    }
  }, [
    options.organizationId,
    options.filters?.search,
    options.filters?.tipo,
    options.filters?.status,
    options.filters?.sortBy,
    options.filters?.sortOrder,
    options.pagination?.page,
    options.pagination?.limit
  ]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  const createComissao = useCallback(async (data: CreateComissaoRequest): Promise<Comissao> => {
    try {
      const novaComissao = await comissoesService.create(options.organizationId, data);
      await fetchComissoes(); // Recarregar lista
      return novaComissao;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar comissão';
      setError(errorMessage);
      throw err;
    }
  }, [options.organizationId, fetchComissoes]);

  const updateComissao = useCallback(async (
    id: string,
    data: UpdateComissaoRequest
  ): Promise<Comissao> => {
    try {
      const comissaoAtualizada = await comissoesService.update(options.organizationId, id, data);
      await fetchComissoes(); // Recarregar lista
      return comissaoAtualizada;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar comissão';
      setError(errorMessage);
      throw err;
    }
  }, [options.organizationId, fetchComissoes]);

  const deleteComissao = useCallback(async (id: string): Promise<void> => {
    try {
      await comissoesService.delete(options.organizationId, id);
      await fetchComissoes(); // Recarregar lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir comissão';
      setError(errorMessage);
      throw err;
    }
  }, [options.organizationId, fetchComissoes]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchComissoes();
  }, [fetchComissoes]);

  return {
    comissoes,
    loading,
    error,
    pagination,
    createComissao,
    updateComissao,
    deleteComissao,
    refetch
  };
};

export default useComissoes;