import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastProps } from './Toast';
import { cn } from '../../utils/cn';

export interface ToastData extends Omit<ToastProps, 'open' | 'onOpenChange'> {
  /** ID único do toast */
  id: string;
  /** Timestamp de criação */
  createdAt: number;
}

export interface ToastContextValue {
  /** Lista de toasts ativos */
  toasts: ToastData[];
  /** Adicionar um novo toast */
  addToast: (toast: Omit<ToastData, 'id' | 'createdAt'>) => string;
  /** Remover um toast específico */
  removeToast: (id: string) => void;
  /** Remover todos os toasts */
  clearToasts: () => void;
  /** Atualizar um toast existente */
  updateToast: (id: string, updates: Partial<ToastData>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  /** Elementos filhos */
  children: React.ReactNode;
  /** Máximo de toasts simultâneos */
  maxToasts?: number;
  /** Posição dos toasts na tela */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Espaçamento entre toasts */
  gap?: string;
  /** Duração padrão dos toasts */
  defaultDuration?: number;
}

/**
 * Variantes para posicionamento do container de toasts
 */
const toastContainerVariants = {
  'top-left': 'top-04 left-04',
  'top-center': 'top-04 left-1/2 -translate-x-1/2',
  'top-right': 'top-04 right-04',
  'bottom-left': 'bottom-04 left-04',
  'bottom-center': 'bottom-04 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-04 right-04',
};

/**
 * Provider para gerenciar toasts globalmente
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'top-right',
  gap = '0.75rem',
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (toastData: Omit<ToastData, 'id' | 'createdAt'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastData = {
        ...toastData,
        id,
        createdAt: Date.now(),
        duration: toastData.duration ?? defaultDuration,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Limitar número máximo de toasts
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts, defaultDuration]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback(
    (id: string, updates: Partial<ToastData>) => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, ...updates } : toast
        )
      );
    },
    []
  );

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Container de toasts */}
      {toasts.length > 0 && (
        <div
          className={cn(
            'fixed z-50 pointer-events-none',
            'flex flex-col',
            toastContainerVariants[position]
          )}
          style={{ gap }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto animate-in slide-in-from-top-2 fade-in-0 duration-300"
            >
              <Toast
                {...toast}
                open={true}
                onClose={() => removeToast(toast.id)}
                onOpenChange={(open) => {
                  if (!open) {
                    removeToast(toast.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Hook para usar o contexto de toasts
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }

  return context;
}

/**
 * Hook com métodos de conveniência para toasts
 */
export function useToastHelpers() {
  const { addToast, removeToast, clearToasts } = useToast();

  const toast = useCallback(
    (props: Omit<ToastData, 'id' | 'createdAt'>) => {
      return addToast(props);
    },
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string, options?: Partial<ToastData>) => {
      return addToast({
        variant: 'success',
        title,
        description,
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, options?: Partial<ToastData>) => {
      return addToast({
        variant: 'error',
        title,
        description,
        duration: 0, // Erros não fecham automaticamente por padrão
        ...options,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<ToastData>) => {
      return addToast({
        variant: 'warning',
        title,
        description,
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string, options?: Partial<ToastData>) => {
      return addToast({
        variant: 'info',
        title,
        description,
        ...options,
      });
    },
    [addToast]
  );

  const promise = useCallback(
    async <T,>(
      promise: Promise<T>,
      {
        loading,
        success: successMessage,
        error: errorMessage,
        ...options
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      } & Partial<ToastData>
    ) => {
      const loadingId = addToast({
        variant: 'info',
        title: loading,
        duration: 0,
        closable: false,
        ...options,
      });

      try {
        const data = await promise;
        removeToast(loadingId);
        
        const message = typeof successMessage === 'function' 
          ? successMessage(data) 
          : successMessage;
        
        addToast({
          variant: 'success',
          title: message,
          ...options,
        });
        
        return data;
      } catch (err) {
        removeToast(loadingId);
        
        const message = typeof errorMessage === 'function' 
          ? errorMessage(err) 
          : errorMessage;
        
        addToast({
          variant: 'error',
          title: message,
          duration: 0,
          ...options,
        });
        
        throw err;
      }
    },
    [addToast, removeToast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    promise,
    dismiss: removeToast,
    clear: clearToasts,
  };
}

// Exportar tipos
// Tipos já exportados acima