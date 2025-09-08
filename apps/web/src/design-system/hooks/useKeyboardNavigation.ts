import { useCallback, useEffect, useRef, useState } from 'react';

export interface KeyboardNavigationOptions {
  /** Seletor dos elementos navegáveis */
  itemSelector?: string;
  /** Se deve fazer loop (voltar ao início quando chegar ao fim) */
  loop?: boolean;
  /** Se deve focar automaticamente no primeiro item */
  autoFocus?: boolean;
  /** Orientação da navegação */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Callback quando um item é selecionado */
  onSelect?: (index: number, element: HTMLElement) => void;
  /** Callback quando o foco muda */
  onFocusChange?: (index: number, element: HTMLElement) => void;
  /** Se deve prevenir o comportamento padrão das teclas */
  preventDefault?: boolean;
  /** Teclas customizadas para navegação */
  customKeys?: {
    next?: string[];
    previous?: string[];
    select?: string[];
    escape?: string[];
  };
}

export interface KeyboardNavigationReturn {
  /** Índice do item atualmente focado */
  currentIndex: number;
  /** Função para definir o índice atual */
  setCurrentIndex: (index: number) => void;
  /** Função para focar no próximo item */
  focusNext: () => void;
  /** Função para focar no item anterior */
  focusPrevious: () => void;
  /** Função para focar no primeiro item */
  focusFirst: () => void;
  /** Função para focar no último item */
  focusLast: () => void;
  /** Função para selecionar o item atual */
  selectCurrent: () => void;
  /** Ref para o container */
  containerRef: React.RefObject<HTMLElement>;
  /** Lista de elementos navegáveis */
  items: HTMLElement[];
}

/**
 * Hook para navegação por teclado acessível
 * 
 * Implementa as diretrizes WCAG 2.1 AA para navegação por teclado:
 * - Suporte a Arrow Keys, Tab, Enter, Space, Escape
 * - Navegação circular (loop)
 * - Orientação horizontal, vertical ou ambas
 * - Foco visível e gerenciamento de estado
 * - Callbacks para eventos de navegação
 * 
 * @example
 * ```tsx
 * function Menu() {
 *   const {
 *     currentIndex,
 *     containerRef,
 *     focusNext,
 *     focusPrevious,
 *     selectCurrent
 *   } = useKeyboardNavigation({
 *     itemSelector: '[role="menuitem"]',
 *     orientation: 'vertical',
 *     loop: true,
 *     onSelect: (index, element) => {
 *       console.log('Selected:', element.textContent);
 *     }
 *   });
 * 
 *   return (
 *     <div ref={containerRef} role="menu">
 *       <div role="menuitem" tabIndex={currentIndex === 0 ? 0 : -1}>
 *         Item 1
 *       </div>
 *       <div role="menuitem" tabIndex={currentIndex === 1 ? 0 : -1}>
 *         Item 2
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardNavigation({
  itemSelector = '[tabindex], button, input, select, textarea, a[href]',
  loop = true,
  autoFocus = false,
  orientation = 'both',
  onSelect,
  onFocusChange,
  preventDefault = true,
  customKeys = {},
}: KeyboardNavigationOptions = {}): KeyboardNavigationReturn {
  const containerRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [items, setItems] = useState<HTMLElement[]>([]);

  // Teclas padrão para navegação
  const defaultKeys = {
    next: orientation === 'horizontal' ? ['ArrowRight'] : orientation === 'vertical' ? ['ArrowDown'] : ['ArrowRight', 'ArrowDown'],
    previous: orientation === 'horizontal' ? ['ArrowLeft'] : orientation === 'vertical' ? ['ArrowUp'] : ['ArrowLeft', 'ArrowUp'],
    select: ['Enter', ' '],
    escape: ['Escape'],
  };

  const keys = {
    next: customKeys.next || defaultKeys.next,
    previous: customKeys.previous || defaultKeys.previous,
    select: customKeys.select || defaultKeys.select,
    escape: customKeys.escape || defaultKeys.escape,
  };

  // Atualizar lista de itens navegáveis
  const updateItems = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(
      containerRef.current.querySelectorAll(itemSelector)
    ).filter((el): el is HTMLElement => {
      const element = el as HTMLElement;
      return (
        element.offsetParent !== null && // Elemento visível
        !element.hasAttribute('disabled') && // Não desabilitado
        element.getAttribute('aria-hidden') !== 'true' // Não oculto para leitores de tela
      );
    });

    setItems(elements);

    // Se não há índice atual válido e há itens, definir o primeiro
    if (elements.length > 0 && (currentIndex < 0 || currentIndex >= elements.length)) {
      const newIndex = autoFocus ? 0 : -1;
      setCurrentIndex(newIndex);
      if (autoFocus && elements[0]) {
        elements[0].focus();
      }
    }
  }, [itemSelector, currentIndex, autoFocus]);

  // Focar em um item específico
  const focusItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;

      const item = items[index];
      if (item) {
        item.focus();
        setCurrentIndex(index);
        onFocusChange?.(index, item);
      }
    },
    [items, onFocusChange]
  );

  // Navegar para o próximo item
  const focusNext = useCallback(() => {
    if (items.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1;
    }
    focusItem(nextIndex);
  }, [currentIndex, items.length, loop, focusItem]);

  // Navegar para o item anterior
  const focusPrevious = useCallback(() => {
    if (items.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = loop ? items.length - 1 : 0;
    }
    focusItem(prevIndex);
  }, [currentIndex, items.length, loop, focusItem]);

  // Focar no primeiro item
  const focusFirst = useCallback(() => {
    if (items.length > 0) {
      focusItem(0);
    }
  }, [items.length, focusItem]);

  // Focar no último item
  const focusLast = useCallback(() => {
    if (items.length > 0) {
      focusItem(items.length - 1);
    }
  }, [items.length, focusItem]);

  // Selecionar item atual
  const selectCurrent = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < items.length) {
      const item = items[currentIndex];
      if (item) {
        onSelect?.(currentIndex, item);
        
        // Simular clique se for um elemento clicável
        if (item.tagName === 'BUTTON' || item.tagName === 'A') {
          item.click();
        }
      }
    }
  }, [currentIndex, items, onSelect]);

  // Handler de teclado
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;

      if (keys.next.includes(key)) {
        if (preventDefault) event.preventDefault();
        focusNext();
      } else if (keys.previous.includes(key)) {
        if (preventDefault) event.preventDefault();
        focusPrevious();
      } else if (keys.select.includes(key)) {
        if (preventDefault) event.preventDefault();
        selectCurrent();
      } else if (key === 'Home') {
        if (preventDefault) event.preventDefault();
        focusFirst();
      } else if (key === 'End') {
        if (preventDefault) event.preventDefault();
        focusLast();
      } else if (keys.escape.includes(key)) {
        // Escape geralmente remove o foco ou fecha o componente
        if (containerRef.current) {
          containerRef.current.blur();
        }
      }
    },
    [keys, preventDefault, focusNext, focusPrevious, selectCurrent, focusFirst, focusLast]
  );

  // Configurar event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(updateItems);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-hidden', 'tabindex'],
    });

    // Atualizar itens inicialmente
    updateItems();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [handleKeyDown, updateItems]);

  // Atualizar índice quando itens mudam
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < items.length) {
      const item = items[currentIndex];
      if (item && document.activeElement !== item) {
        // Sincronizar foco se necessário
        const activeIndex = items.findIndex(item => item === document.activeElement);
        if (activeIndex >= 0) {
          setCurrentIndex(activeIndex);
        }
      }
    }
  }, [items, currentIndex]);

  return {
    currentIndex,
    setCurrentIndex,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    selectCurrent,
    containerRef,
    items,
  };
}