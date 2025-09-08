import { useCallback, useEffect, useRef, useState } from 'react';

export interface FocusManagementOptions {
  /** Se deve restaurar o foco ao desmontar */
  restoreOnUnmount?: boolean;
  /** Se deve capturar o foco inicial */
  captureInitialFocus?: boolean;
  /** Se deve fazer trap do foco (manter dentro do container) */
  trapFocus?: boolean;
  /** Seletor para elementos focáveis */
  focusableSelector?: string;
  /** Se deve ignorar elementos com tabindex="-1" */
  ignoreNegativeTabIndex?: boolean;
  /** Callback quando o foco é capturado */
  onFocusCapture?: () => void;
  /** Callback quando o foco é restaurado */
  onFocusRestore?: () => void;
}

export interface FocusManagementReturn {
  /** Ref para o container */
  containerRef: React.RefObject<HTMLElement>;
  /** Se o foco está atualmente capturado */
  isFocusCaptured: boolean;
  /** Função para capturar o foco */
  captureFocus: () => void;
  /** Função para restaurar o foco */
  restoreFocus: () => void;
  /** Função para focar no primeiro elemento */
  focusFirst: () => void;
  /** Função para focar no último elemento */
  focusLast: () => void;
  /** Lista de elementos focáveis */
  focusableElements: HTMLElement[];
}

/**
 * Seletor padrão para elementos focáveis
 */
const DEFAULT_FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'details > summary',
  'audio[controls]',
  'video[controls]',
].join(', ');

/**
 * Hook para gerenciamento avançado de foco
 * 
 * Implementa as diretrizes WCAG 2.1 AA para gerenciamento de foco:
 * - Captura e restauração de foco
 * - Focus trap para modais e overlays
 * - Navegação por elementos focáveis
 * - Detecção de elementos focáveis
 * - Gerenciamento de estado de foco
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const {
 *     containerRef,
 *     isFocusCaptured,
 *     captureFocus,
 *     restoreFocus
 *   } = useFocusManagement({
 *     trapFocus: true,
 *     restoreOnUnmount: true,
 *     captureInitialFocus: true
 *   });
 * 
 *   useEffect(() => {
 *     if (isOpen) {
 *       captureFocus();
 *     } else {
 *       restoreFocus();
 *     }
 *   }, [isOpen, captureFocus, restoreFocus]);
 * 
 *   if (!isOpen) return null;
 * 
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <h2>Modal Title</h2>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusManagement({
  restoreOnUnmount = true,
  captureInitialFocus = false,
  trapFocus = false,
  focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
  ignoreNegativeTabIndex = true,
  onFocusCapture,
  onFocusRestore,
}: FocusManagementOptions = {}): FocusManagementReturn {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [isFocusCaptured, setIsFocusCaptured] = useState(false);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  // Função para obter elementos focáveis
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelector)
    ).filter((element): element is HTMLElement => {
      const el = element as HTMLElement;
      
      // Verificar se o elemento está visível
      if (el.offsetParent === null && el.tagName !== 'DETAILS') {
        return false;
      }
      
      // Verificar se não está desabilitado
      if (el.hasAttribute('disabled')) {
        return false;
      }
      
      // Verificar aria-hidden
      if (el.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      
      // Verificar tabindex negativo se configurado
      if (ignoreNegativeTabIndex && el.getAttribute('tabindex') === '-1') {
        return false;
      }
      
      return true;
    });

    return elements;
  }, [focusableSelector, ignoreNegativeTabIndex]);

  // Atualizar lista de elementos focáveis
  const updateFocusableElements = useCallback(() => {
    const elements = getFocusableElements();
    setFocusableElements(elements);
  }, [getFocusableElements]);

  // Função para capturar o foco
  const captureFocus = useCallback(() => {
    if (isFocusCaptured) return;

    // Salvar elemento ativo atual
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    
    setIsFocusCaptured(true);
    updateFocusableElements();
    
    if (captureInitialFocus) {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[0].focus();
      }
    }
    
    onFocusCapture?.();
  }, [isFocusCaptured, captureInitialFocus, getFocusableElements, onFocusCapture, updateFocusableElements]);

  // Função para restaurar o foco
  const restoreFocus = useCallback(() => {
    if (!isFocusCaptured) return;

    setIsFocusCaptured(false);
    
    // Restaurar foco para o elemento anterior
    if (previousActiveElementRef.current) {
      try {
        previousActiveElementRef.current.focus();
      } catch (error) {
        // Elemento pode ter sido removido do DOM
        console.warn('Não foi possível restaurar o foco:', error);
      }
      previousActiveElementRef.current = null;
    }
    
    onFocusRestore?.();
  }, [isFocusCaptured, onFocusRestore]);

  // Função para focar no primeiro elemento
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  // Função para focar no último elemento
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handler para trap de foco
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !isFocusCaptured) return;
      
      if (event.key === 'Tab') {
        const elements = getFocusableElements();
        if (elements.length === 0) {
          event.preventDefault();
          return;
        }
        
        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];
        const activeElement = document.activeElement;
        
        if (event.shiftKey) {
          // Tab + Shift (navegação reversa)
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab normal
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      // Escape para sair do trap (opcional)
      if (event.key === 'Escape' && trapFocus) {
        restoreFocus();
      }
    },
    [trapFocus, isFocusCaptured, getFocusableElements, restoreFocus]
  );

  // Configurar event listeners
  useEffect(() => {
    if (isFocusCaptured && trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFocusCaptured, trapFocus, handleKeyDown]);

  // Observer para mudanças no DOM
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFocusCaptured) return;

    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-hidden', 'tabindex'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isFocusCaptured, updateFocusableElements]);

  // Restaurar foco ao desmontar
  useEffect(() => {
    return () => {
      if (restoreOnUnmount && isFocusCaptured) {
        restoreFocus();
      }
    };
  }, [restoreOnUnmount, isFocusCaptured, restoreFocus]);

  return {
    containerRef,
    isFocusCaptured,
    captureFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    focusableElements,
  };
}

/**
 * Hook simplificado para focus trap em modais
 */
export function useFocusTrap(isActive: boolean = false) {
  return useFocusManagement({
    trapFocus: true,
    restoreOnUnmount: true,
    captureInitialFocus: isActive,
  });
}

/**
 * Hook para gerenciar foco em componentes que aparecem/desaparecem
 */
export function useConditionalFocus(isVisible: boolean, options: FocusManagementOptions = {}) {
  const focusManagement = useFocusManagement({
    ...options,
    captureInitialFocus: false,
  });

  useEffect(() => {
    if (isVisible) {
      focusManagement.captureFocus();
    } else {
      focusManagement.restoreFocus();
    }
  }, [isVisible, focusManagement]);

  return focusManagement;
}