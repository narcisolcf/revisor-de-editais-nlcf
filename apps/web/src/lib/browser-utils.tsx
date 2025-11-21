/**
 * Browser Detection Utilities
 *
 * Utilitários seguros para detectar e acessar APIs do browser.
 * Previne erros em ambientes SSR, Node.js e testes.
 */

import React from 'react';

/**
 * Verifica se o código está sendo executado no navegador
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Verifica se estamos em ambiente Node.js
 */
export const isNode = (): boolean => {
  return typeof process !== 'undefined' &&
         process.versions != null &&
         process.versions.node != null;
};

/**
 * Verifica se estamos em modo de teste
 */
export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test' ||
         process.env.JEST_WORKER_ID !== undefined ||
         (typeof global !== 'undefined' && (global as any).describe !== undefined);
};

/**
 * Acessa window de forma segura
 * @returns window object ou null se não disponível
 */
export const safeWindow = (): Window | null => {
  return isBrowser() ? window : null;
};

/**
 * Acessa document de forma segura
 * @returns document object ou null se não disponível
 */
export const safeDocument = (): Document | null => {
  return isBrowser() ? document : null;
};

/**
 * Acessa navigator de forma segura
 * @returns navigator object ou null se não disponível
 */
export const safeNavigator = (): Navigator | null => {
  return isBrowser() && typeof navigator !== 'undefined' ? navigator : null;
};

/**
 * Acessa localStorage de forma segura
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
      return false;
    }
  }
};

/**
 * Acessa sessionStorage de forma segura
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser()) return false;
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser()) return false;
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('sessionStorage.removeItem failed:', e);
      return false;
    }
  }
};

/**
 * Adiciona event listener de forma segura
 */
export const safeAddEventListener = <K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): (() => void) | null => {
  if (!isBrowser()) return null;

  window.addEventListener(type, listener, options);

  return () => {
    if (isBrowser()) {
      window.removeEventListener(type, listener, options);
    }
  };
};

/**
 * Abre URL de forma segura
 */
export const safeOpen = (url: string, target = '_blank'): Window | null => {
  if (!isBrowser()) {
    console.warn('window.open called in non-browser environment');
    return null;
  }
  return window.open(url, target);
};

/**
 * Recarrega a página de forma segura
 */
export const safeReload = (): void => {
  if (isBrowser()) {
    window.location.reload();
  } else {
    console.warn('window.location.reload called in non-browser environment');
  }
};

/**
 * Navega para URL de forma segura
 */
export const safeNavigate = (url: string): void => {
  if (isBrowser()) {
    window.location.href = url;
  } else {
    console.warn('window.location.href set in non-browser environment');
  }
};

/**
 * Obtém URL atual de forma segura
 */
export const safeGetCurrentUrl = (): string => {
  if (isBrowser()) {
    return window.location.href;
  }
  return '';
};

/**
 * Hook React para executar código apenas no browser
 */
export const useBrowserOnly = (callback: () => void | (() => void), deps: any[] = []) => {
  React.useEffect(() => {
    if (isBrowser()) {
      return callback();
    }
  }, deps);
};

/**
 * HOC para garantir que componente só renderiza no browser
 */
export function withBrowserOnly<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted || !isBrowser()) {
      return null;
    }

    return <Component {...props} />;
  };
}
