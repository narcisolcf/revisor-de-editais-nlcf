/**
 * Configuração Central do API Client
 *
 * Configura interceptors, retry logic e tratamento de erros global.
 */

import { apiClient, authInterceptor } from '@/services/core/api';
import type { RequestInterceptor, ResponseInterceptor } from '@/types/core/api';

/**
 * Interceptor para adicionar token de autenticação
 */
const authTokenInterceptor: RequestInterceptor = async (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
};

/**
 * Interceptor para tratar erros de autenticação
 */
const authErrorInterceptor: ResponseInterceptor = {
  onSuccess: async (response) => {
    // Se receber 401, limpa token e redireciona para login
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');

      // Redireciona para login se não estiver na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    return response;
  }
};

/**
 * Interceptor para logging em desenvolvimento
 */
const loggingInterceptor: ResponseInterceptor = {
  onSuccess: async (response) => {
    if (import.meta.env.DEV) {
      const method = response.config?.method || 'UNKNOWN';
      const url = response.config?.url || 'unknown';
      console.log(
        `%c[API] ${method} ${url}`,
        'color: #10b981; font-weight: bold',
        `${response.status} ${response.statusText}`
      );
    }
    return response;
  },
  onError: async (error) => {
    if (import.meta.env.DEV) {
      console.error(
        `%c[API ERROR]`,
        'color: #ef4444; font-weight: bold',
        error
      );
    }
    throw error;
  }
};

/**
 * Interceptor para adicionar timestamp às requisições
 */
const timestampInterceptor: RequestInterceptor = async (config) => {
  config.headers = {
    ...config.headers,
    'X-Request-Time': new Date().toISOString()
  };
  return config;
};

/**
 * Inicializa a configuração do API Client
 */
export function initializeApiClient() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Configura client
  apiClient.updateConfig({
    baseUrl,
    timeout: 30000,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: import.meta.env.DEV,
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0'
    }
  });

  // Adiciona interceptors na ordem correta
  // 1. Timestamp (primeiro para rastreamento)
  apiClient.addRequestInterceptor(timestampInterceptor);

  // 2. Auth token (antes de enviar)
  apiClient.addRequestInterceptor(authTokenInterceptor);

  // 3. Logging (por último para capturar config final)
  apiClient.addResponseInterceptor(loggingInterceptor);

  // 4. Auth error handler (verifica 401)
  apiClient.addResponseInterceptor(authErrorInterceptor);

  console.log('[API Config] ApiClient inicializado com sucesso');
  console.log('[API Config] Base URL:', baseUrl);
  console.log('[API Config] Retry habilitado:', apiClient.getConfig().enableRetry);
  console.log('[API Config] Max retries:', apiClient.getConfig().maxRetries);
}

/**
 * Obtém configuração atual do client
 */
export function getApiConfig() {
  return apiClient.getConfig();
}

/**
 * Atualiza base URL dinamicamente
 */
export function setApiBaseUrl(baseUrl: string) {
  apiClient.updateConfig({ baseUrl });
  console.log('[API Config] Base URL atualizada:', baseUrl);
}

/**
 * Exporta instância configurada
 */
export { apiClient };
export default apiClient;
