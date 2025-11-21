/**
 * Navigation Blocker Hook
 *
 * Bloqueia navegação quando há mudanças não salvas em formulários.
 * Exibe diálogo de confirmação antes de sair da página.
 *
 * @example
 * ```tsx
 * const MyForm = () => {
 *   const [formData, setFormData] = useState({});
 *   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 *   useNavigationBlocker(
 *     hasUnsavedChanges,
 *     "Você tem alterações não salvas. Deseja realmente sair?"
 *   );
 *
 *   return <form>...</form>;
 * };
 * ```
 */

import { useEffect, useCallback, useRef, useContext } from 'react';
import { useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import type { Blocker, History, Transition } from 'history';

export interface UseNavigationBlockerOptions {
  /** Mensagem customizada para o diálogo */
  message?: string;
  /** Callback antes de bloquear */
  onBeforeBlock?: () => boolean;
  /** Callback quando bloqueio é confirmado */
  onBlock?: () => void;
  /** Callback quando usuário confirma navegação */
  onProceed?: () => void;
}

/**
 * Custom implementation of useBlocker for React Router v6
 */
function useBlocker(blocker: Blocker, when = true): void {
  const navigator = useContext(UNSAFE_NavigationContext).navigator as History;

  useEffect(() => {
    if (!when) return;

    const unblock = navigator.block((tx: Transition) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };

      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
}

/**
 * Hook para bloquear navegação quando há mudanças não salvas
 */
export function useNavigationBlocker(
  shouldBlock: boolean,
  options: UseNavigationBlockerOptions = {}
): void {
  const {
    message = 'Você tem alterações não salvas. Deseja realmente sair?',
    onBeforeBlock,
    onBlock,
    onProceed
  } = options;

  const location = useLocation();

  // Bloquear navegação via react-router
  useBlocker(
    useCallback(
      (tx: Transition) => {
        // Callback before block
        if (onBeforeBlock && !onBeforeBlock()) {
          tx.retry();
          return;
        }

        const confirmed = window.confirm(message);

        if (confirmed) {
          onProceed?.();
          tx.retry();
        } else {
          onBlock?.();
        }
      },
      [message, onBeforeBlock, onBlock, onProceed]
    ),
    shouldBlock
  );

  // Bloquear navegação via beforeunload (reload, fechar aba)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Cancelar o evento
      e.preventDefault();
      // Chrome requer returnValue ser setado
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Reset prompted flag quando location mudar
  useEffect(() => {
    promptedRef.current = false;
  }, [location]);
}

/**
 * Hook simplificado para uso comum
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  useNavigationBlocker(hasUnsavedChanges, {
    message: 'Você tem alterações não salvas. Deseja realmente sair?'
  });
}

/**
 * Hook para detectar mudanças em formulário
 */
export function useFormDirtyState<T extends Record<string, any>>(
  initialValues: T,
  currentValues: T
): boolean {
  return JSON.stringify(initialValues) !== JSON.stringify(currentValues);
}
