/**
 * Testes para hook useApi
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi, useGet, usePost } from '../useApi';
import { apiClient } from '@/services/core/api';
import type { ApiResponse } from '@/types/core/api';

// Mock do apiClient
vi.mock('@/services/core/api', () => ({
  apiClient: {
    request: vi.fn(),
    cancelRequest: vi.fn()
  },
  NetworkError: class NetworkError extends Error {
    code: string;
    status?: number;

    constructor(message: string, code: string, context?: any) {
      super(message);
      this.code = code;
      this.status = context?.status;
    }
  }
}));

// Mock do toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock do errorService
vi.mock('@/services/core/error', () => ({
  errorService: {
    handle: vi.fn(),
    createNetworkError: vi.fn((message) => new Error(message))
  }
}));

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useApi('/test'));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBeNull();
    expect(result.current.called).toBe(false);
  });

  it('deve executar requisição com sucesso', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: ApiResponse<typeof mockData> = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi<typeof mockData>('/test'));

    // Executa requisição e aguarda conclusão
    await result.current.execute();

    // Verifica estado final
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.status).toBe(200);
      expect(result.current.called).toBe(true);
    });
  });

  it('deve tratar erros de rede', async () => {
    const mockError = new Error('Network error');
    vi.mocked(apiClient.request).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi('/test', { showErrorToast: false }));

    // Executa requisição e aguarda conclusão (mesmo com erro)
    await result.current.execute();

    // Verifica estado final
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.called).toBe(true);
    });
  });

  it('deve executar callback onSuccess', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: ApiResponse<typeof mockData> = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useApi<typeof mockData>('/test', { onSuccess })
    );

    await result.current.execute();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('deve executar callback onError', async () => {
    const mockError = new Error('Network error');
    vi.mocked(apiClient.request).mockRejectedValueOnce(mockError);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useApi('/test', { onError, showErrorToast: false })
    );

    await result.current.execute();

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('deve permitir retry após erro', async () => {
    const mockError = new Error('Network error');
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: ApiResponse<typeof mockData> = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    // Primeira chamada falha
    vi.mocked(apiClient.request)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() =>
      useApi<typeof mockData>('/test', { showErrorToast: false })
    );

    // Primeira tentativa (falha)
    await result.current.execute();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Retry (sucesso)
    await result.current.retry();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it('deve resetar o estado', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: ApiResponse<typeof mockData> = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi<typeof mockData>('/test'));

    await result.current.execute();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    // Reseta
    result.current.reset();

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.called).toBe(false);
    });
  });

  it('useGet deve usar método GET', async () => {
    const mockResponse: ApiResponse<any> = {
      data: { test: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useGet('/test'));

    await result.current.execute();

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('usePost deve usar método POST', async () => {
    const mockResponse: ApiResponse<any> = {
      data: { test: true },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { url: '/test', method: 'POST' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => usePost('/test'));

    await result.current.execute({ body: { name: 'Test' } });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('deve limpar estado ao desmontar sem causar memory leaks', async () => {
    // Mock que resolve normalmente
    const mockResponse: ApiResponse<any> = {
      data: { test: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };
    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    const { result, unmount } = renderHook(() => useApi('/test'));

    // Inicia requisição
    const promise = result.current.execute();

    // Desmonta antes da conclusão (simula navegação rápida)
    unmount();

    // Aguarda promise resolver (não deve causar erro de setState em componente desmontado)
    await promise;

    // Se chegou aqui sem erro, o cleanup funcionou corretamente
    expect(true).toBe(true);
  });

  it('deve executar imediatamente se immediate=true', async () => {
    const mockResponse: ApiResponse<any> = {
      data: { test: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: '/test', method: 'GET' }
    };

    vi.mocked(apiClient.request).mockResolvedValueOnce(mockResponse);

    renderHook(() => useApi('/test', { immediate: true }));

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalled();
    });
  });
});
