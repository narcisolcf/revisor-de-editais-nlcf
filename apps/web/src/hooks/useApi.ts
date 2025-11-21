/**
 * useApi Hook
 *
 * Hook customizado que integra ApiClient + ErrorService + Toast.
 * Fornece interface simplificada para fazer requisições com tratamento robusto de erros.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, NetworkError } from '@/services/core/api';
import { errorService } from '@/services/core/error';
import { useToast } from '@/hooks/use-toast';
import type { ApiResponse, RequestConfig } from '@/types/core/api';

export interface UseApiOptions<T> extends Partial<RequestConfig> {
  /** Se deve executar automaticamente ao montar */
  immediate?: boolean;
  /** Callback de sucesso */
  onSuccess?: (data: T) => void;
  /** Callback de erro */
  onError?: (error: NetworkError) => void;
  /** Mensagem de sucesso customizada */
  successMessage?: string;
  /** Mensagem de erro customizada */
  errorMessage?: string;
  /** Se deve mostrar toast de erro */
  showErrorToast?: boolean;
  /** Se deve mostrar toast de sucesso */
  showSuccessToast?: boolean;
  /** Botão de retry no toast */
  enableRetryButton?: boolean;
}

export interface UseApiState<T> {
  /** Dados da resposta */
  data: T | null;
  /** Erro se ocorreu */
  error: NetworkError | null;
  /** Se está carregando */
  loading: boolean;
  /** Status HTTP da última resposta */
  status: number | null;
  /** Se já foi executado pelo menos uma vez */
  called: boolean;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  /** Executa a requisição manualmente */
  execute: (overrideConfig?: Partial<RequestConfig>) => Promise<ApiResponse<T> | null>;
  /** Reseta o estado */
  reset: () => void;
  /** Cancela requisição em andamento */
  cancel: () => void;
  /** Refaz última requisição */
  retry: () => Promise<ApiResponse<T> | null>;
}

/**
 * Hook para fazer requisições HTTP com tratamento robusto
 */
export function useApi<T = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    method = 'GET',
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showErrorToast = true,
    showSuccessToast = false,
    enableRetryButton = true,
    ...requestConfig
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
    status: null,
    called: false
  });

  const lastRequestRef = useRef<RequestConfig | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (requestIdRef.current) {
        apiClient.cancelRequest(requestIdRef.current);
      }
    };
  }, []);

  /**
   * Executa a requisição
   */
  const execute = useCallback(
    async (overrideConfig?: Partial<RequestConfig>): Promise<ApiResponse<T> | null> => {
      // Monta configuração final
      const finalConfig: RequestConfig = {
        url,
        method,
        ...requestConfig,
        ...overrideConfig
      };

      // Salva para retry
      lastRequestRef.current = finalConfig;

      // Atualiza estado para loading
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        called: true
      }));

      try {
        // Executa requisição
        const response = await apiClient.request<T>(finalConfig);

        // Verifica se ainda está montado
        if (!mountedRef.current) return null;

        // Atualiza estado com sucesso
        setState({
          data: response.data,
          error: null,
          loading: false,
          status: response.status,
          called: true
        });

        // Callback de sucesso
        onSuccess?.(response.data);

        // Toast de sucesso
        if (showSuccessToast && successMessage) {
          toast({
            title: 'Sucesso',
            description: successMessage,
            variant: 'default'
          });
        }

        return response;
      } catch (err) {
        // Converte para NetworkError
        const networkError =
          err instanceof NetworkError
            ? err
            : errorService.createNetworkError(
                err instanceof Error ? err.message : 'Erro desconhecido'
              );

        // Verifica se ainda está montado
        if (!mountedRef.current) return null;

        // Log do erro
        errorService.handle(networkError, {
          component: 'useApi',
          operation: 'execute',
          url,
          method
        });

        // Atualiza estado com erro
        setState((prev) => ({
          ...prev,
          error: networkError,
          loading: false,
          status: networkError.status || null
        }));

        // Callback de erro
        onError?.(networkError);

        // Toast de erro com retry
        if (showErrorToast) {
          const message = errorMessage || getErrorMessage(networkError);

          toast({
            title: 'Erro',
            description: message,
            variant: 'destructive',
            action: enableRetryButton
              ? {
                  label: 'Tentar Novamente',
                  onClick: () => retry()
                }
              : undefined
          });
        }

        return null;
      }
    },
    [
      url,
      method,
      requestConfig,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      showErrorToast,
      showSuccessToast,
      enableRetryButton,
      toast
    ]
  );

  /**
   * Refaz última requisição
   */
  const retry = useCallback(async (): Promise<ApiResponse<T> | null> => {
    if (!lastRequestRef.current) {
      console.warn('[useApi] Nenhuma requisição anterior para retry');
      return null;
    }

    return execute(lastRequestRef.current);
  }, [execute]);

  /**
   * Reseta o estado
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      status: null,
      called: false
    });
    lastRequestRef.current = null;
  }, []);

  /**
   * Cancela requisição em andamento
   */
  const cancel = useCallback(() => {
    if (requestIdRef.current) {
      apiClient.cancelRequest(requestIdRef.current);
      setState((prev) => ({
        ...prev,
        loading: false
      }));
    }
  }, []);

  // Execução imediata se solicitado
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel
  };
}

/**
 * Gera mensagem de erro amigável baseada no tipo de erro
 */
function getErrorMessage(error: NetworkError): string {
  // Timeout
  if (error.code === 'REQUEST_CANCELLED' || error.message.includes('timeout')) {
    return 'A requisição demorou muito. Verifique sua conexão e tente novamente.';
  }

  // Erro de rede
  if (error.code === 'NETWORK_ERROR') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Erros HTTP específicos
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Requisição inválida. Verifique os dados enviados.';
      case 401:
        return 'Você não está autenticado. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para acessar este recurso.';
      case 404:
        return 'Recurso não encontrado.';
      case 422:
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      case 429:
        return 'Muitas requisições. Aguarde um momento e tente novamente.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Erro no servidor. Tente novamente em alguns instantes.';
      default:
        return `Erro ${error.status}: ${error.message}`;
    }
  }

  return error.message || 'Ocorreu um erro inesperado.';
}

/**
 * Hook simplificado para GET
 */
export function useGet<T = unknown>(
  url: string,
  options?: Omit<UseApiOptions<T>, 'method'>
): UseApiReturn<T> {
  return useApi<T>(url, { ...options, method: 'GET' });
}

/**
 * Hook simplificado para POST
 */
export function usePost<T = unknown>(
  url: string,
  options?: Omit<UseApiOptions<T>, 'method'>
): UseApiReturn<T> {
  return useApi<T>(url, { ...options, method: 'POST' });
}

/**
 * Hook simplificado para PUT
 */
export function usePut<T = unknown>(
  url: string,
  options?: Omit<UseApiOptions<T>, 'method'>
): UseApiReturn<T> {
  return useApi<T>(url, { ...options, method: 'PUT' });
}

/**
 * Hook simplificado para PATCH
 */
export function usePatch<T = unknown>(
  url: string,
  options?: Omit<UseApiOptions<T>, 'method'>
): UseApiReturn<T> {
  return useApi<T>(url, { ...options, method: 'PATCH' });
}

/**
 * Hook simplificado para DELETE
 */
export function useDelete<T = unknown>(
  url: string,
  options?: Omit<UseApiOptions<T>, 'method'>
): UseApiReturn<T> {
  return useApi<T>(url, { ...options, method: 'DELETE' });
}

export default useApi;
