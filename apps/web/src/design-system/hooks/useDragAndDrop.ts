import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnouncements } from './useAnnouncements';

export interface DragItem {
  id: string;
  type: string;
  data?: any;
}

export interface DropZone {
  id: string;
  accepts: string[];
  data?: any;
}

export interface DragAndDropOptions {
  /** Se deve usar anúncios de acessibilidade */
  announcements?: boolean;
  /** Delay antes de iniciar o drag (em ms) */
  dragDelay?: number;
  /** Se deve permitir drag por teclado */
  keyboardDrag?: boolean;
  /** Callback quando o drag inicia */
  onDragStart?: (item: DragItem, event: DragEvent | KeyboardEvent) => void;
  /** Callback quando o drag termina */
  onDragEnd?: (item: DragItem, event: DragEvent | KeyboardEvent) => void;
  /** Callback quando um item é solto */
  onDrop?: (item: DragItem, dropZone: DropZone, event: DragEvent | KeyboardEvent) => void;
  /** Callback quando o drag entra em uma zona */
  onDragEnter?: (item: DragItem, dropZone: DropZone, event: DragEvent) => void;
  /** Callback quando o drag sai de uma zona */
  onDragLeave?: (item: DragItem, dropZone: DropZone, event: DragEvent) => void;
}

export interface DragAndDropReturn {
  /** Estado atual do drag */
  isDragging: boolean;
  /** Item sendo arrastado */
  draggedItem: DragItem | null;
  /** Zona de drop ativa */
  activeDropZone: DropZone | null;
  /** Props para elementos arrastáveis */
  getDragProps: (item: DragItem) => {
    draggable: boolean;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    onKeyDown: (event: KeyboardEvent) => void;
    'aria-grabbed'?: boolean;
    role: string;
    tabIndex: number;
  };
  /** Props para zonas de drop */
  getDropProps: (dropZone: DropZone) => {
    onDragOver: (event: DragEvent) => void;
    onDragEnter: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
    'aria-dropeffect'?: string;
    role: string;
  };
  /** Função para cancelar drag atual */
  cancelDrag: () => void;
}

/**
 * Hook para funcionalidades de arrastar e soltar acessíveis
 * 
 * Implementa as diretrizes WCAG 2.1 AA para drag and drop:
 * - Suporte a navegação por teclado (Space/Enter para pegar, Arrow keys para mover, Space/Enter para soltar)
 * - Anúncios de acessibilidade para mudanças de estado
 * - Atributos ARIA apropriados (aria-grabbed, aria-dropeffect)
 * - Feedback visual e sonoro
 * - Cancelamento de operações
 * 
 * @example
 * ```tsx
 * function DragDropList() {
 *   const {
 *     isDragging,
 *     draggedItem,
 *     getDragProps,
 *     getDropProps
 *   } = useDragAndDrop({
 *     announcements: true,
 *     keyboardDrag: true,
 *     onDrop: (item, dropZone) => {
 *       console.log('Dropped:', item, 'on:', dropZone);
 *     }
 *   });
 * 
 *   return (
 *     <div>
 *       <div {...getDragProps({ id: '1', type: 'item', data: { name: 'Item 1' } })}>
 *         Item 1
 *       </div>
 *       <div {...getDropProps({ id: 'zone1', accepts: ['item'] })}>
 *         Drop Zone
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDragAndDrop({
  announcements = true,
  dragDelay = 0,
  keyboardDrag = true,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragEnter,
  onDragLeave,
}: DragAndDropOptions = {}): DragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);
  
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropZonesRef = useRef<DropZone[]>([]);
  const currentDropZoneIndexRef = useRef(-1);
  
  const { announce, announceSuccess, announceError } = useAnnouncements();

  // Função para iniciar o drag
  const startDrag = useCallback(
    (item: DragItem, event: DragEvent | KeyboardEvent, isKeyboard = false) => {
      setIsDragging(true);
      setDraggedItem(item);
      setKeyboardMode(isKeyboard);
      
      if (announcements) {
        announce(`Arrastando ${item.data?.name || item.id}. Use as setas para navegar entre zonas de destino.`);
      }
      
      onDragStart?.(item, event);
    },
    [announce, announcements, onDragStart]
  );

  // Função para terminar o drag
  const endDrag = useCallback(
    (item: DragItem, event: DragEvent | KeyboardEvent) => {
      setIsDragging(false);
      setDraggedItem(null);
      setActiveDropZone(null);
      setKeyboardMode(false);
      currentDropZoneIndexRef.current = -1;
      
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      
      onDragEnd?.(item, event);
    },
    [onDragEnd]
  );

  // Função para cancelar drag
  const cancelDrag = useCallback(() => {
    if (draggedItem) {
      if (announcements) {
        announce('Operação de arrastar cancelada.');
      }
      endDrag(draggedItem, new KeyboardEvent('keydown'));
    }
  }, [draggedItem, announcements, announce, endDrag]);

  // Função para soltar item
  const dropItem = useCallback(
    (item: DragItem, dropZone: DropZone, event: DragEvent | KeyboardEvent) => {
      if (dropZone.accepts.includes(item.type)) {
        onDrop?.(item, dropZone, event);
        if (announcements) {
          announceSuccess(`${item.data?.name || item.id} solto em ${dropZone.data?.name || dropZone.id}.`);
        }
      } else {
        if (announcements) {
          announceError(`Não é possível soltar ${item.data?.name || item.id} em ${dropZone.data?.name || dropZone.id}.`);
        }
      }
      endDrag(item, event);
    },
    [onDrop, announcements, announceSuccess, announceError, endDrag]
  );

  // Props para elementos arrastáveis
  const getDragProps = useCallback(
    (item: DragItem) => ({
      draggable: true,
      role: 'button',
      tabIndex: 0,
      'aria-grabbed': isDragging && draggedItem?.id === item.id,
      onDragStart: (event: DragEvent) => {
        event.dataTransfer.setData('text/plain', JSON.stringify(item));
        event.dataTransfer.effectAllowed = 'move';
        
        if (dragDelay > 0) {
          dragTimeoutRef.current = setTimeout(() => {
            startDrag(item, event);
          }, dragDelay);
        } else {
          startDrag(item, event);
        }
      },
      onDragEnd: (event: DragEvent) => {
        if (draggedItem) {
          endDrag(draggedItem, event);
        }
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (!keyboardDrag) return;
        
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          
          if (!isDragging) {
            // Iniciar drag por teclado
            startDrag(item, event, true);
          } else if (draggedItem?.id === item.id) {
            // Soltar item na zona ativa
            if (activeDropZone) {
              dropItem(item, activeDropZone, event);
            } else {
              cancelDrag();
            }
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelDrag();
        } else if (isDragging && keyboardMode && draggedItem?.id === item.id) {
          // Navegação por teclado entre zonas de drop
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            const nextIndex = Math.min(currentDropZoneIndexRef.current + 1, dropZonesRef.current.length - 1);
            if (nextIndex !== currentDropZoneIndexRef.current) {
              currentDropZoneIndexRef.current = nextIndex;
              const nextZone = dropZonesRef.current[nextIndex];
              setActiveDropZone(nextZone);
              if (announcements) {
                announce(`Zona de destino: ${nextZone.data?.name || nextZone.id}`);
              }
            }
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const prevIndex = Math.max(currentDropZoneIndexRef.current - 1, 0);
            if (prevIndex !== currentDropZoneIndexRef.current) {
              currentDropZoneIndexRef.current = prevIndex;
              const prevZone = dropZonesRef.current[prevIndex];
              setActiveDropZone(prevZone);
              if (announcements) {
                announce(`Zona de destino: ${prevZone.data?.name || prevZone.id}`);
              }
            }
          }
        }
      },
    }),
    [isDragging, draggedItem, activeDropZone, keyboardDrag, dragDelay, keyboardMode, announcements, startDrag, endDrag, dropItem, cancelDrag, announce]
  );

  // Props para zonas de drop
  const getDropProps = useCallback(
    (dropZone: DropZone) => {
      // Registrar zona de drop
      useEffect(() => {
        if (!dropZonesRef.current.find(zone => zone.id === dropZone.id)) {
          dropZonesRef.current.push(dropZone);
        }
        return () => {
          dropZonesRef.current = dropZonesRef.current.filter(zone => zone.id !== dropZone.id);
        };
      }, [dropZone]);
      
      return {
        role: 'region',
        'aria-dropeffect': isDragging ? 'move' : undefined,
        onDragOver: (event: DragEvent) => {
          if (draggedItem && dropZone.accepts.includes(draggedItem.type)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }
        },
        onDragEnter: (event: DragEvent) => {
          if (draggedItem) {
            setActiveDropZone(dropZone);
            onDragEnter?.(draggedItem, dropZone, event);
          }
        },
        onDragLeave: (event: DragEvent) => {
          if (draggedItem && event.currentTarget === event.target) {
            setActiveDropZone(null);
            onDragLeave?.(draggedItem, dropZone, event);
          }
        },
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          
          if (draggedItem) {
            dropItem(draggedItem, dropZone, event);
          } else {
            // Fallback para dados do dataTransfer
            try {
              const itemData = JSON.parse(event.dataTransfer.getData('text/plain'));
              dropItem(itemData, dropZone, event);
            } catch (error) {
              console.warn('Erro ao processar dados do drop:', error);
            }
          }
        },
      };
    },
    [isDragging, draggedItem, onDragEnter, onDragLeave, dropItem]
  );

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    draggedItem,
    activeDropZone,
    getDragProps,
    getDropProps,
    cancelDrag,
  };
}

/**
 * Hook simplificado para listas reordenáveis
 */
export function useSortable<T extends { id: string }>({
  items,
  onReorder,
  announcements = true,
}: {
  items: T[];
  onReorder: (newItems: T[]) => void;
  announcements?: boolean;
}) {
  const dragAndDrop = useDragAndDrop({
    announcements,
    keyboardDrag: true,
    onDrop: (draggedItem, dropZone) => {
      const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
      const dropIndex = items.findIndex(item => item.id === dropZone.id);
      
      if (draggedIndex !== -1 && dropIndex !== -1 && draggedIndex !== dropIndex) {
        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(dropIndex, 0, removed);
        onReorder(newItems);
      }
    },
  });

  const getSortableProps = useCallback(
    (item: T, index: number) => ({
      ...dragAndDrop.getDragProps({
        id: item.id,
        type: 'sortable-item',
        data: { ...item, index },
      }),
      ...dragAndDrop.getDropProps({
        id: item.id,
        accepts: ['sortable-item'],
        data: { ...item, index },
      }),
    }),
    [dragAndDrop, items]
  );

  return {
    ...dragAndDrop,
    getSortableProps,
  };
}