import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnouncements } from './useAnnouncements';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: TouchPoint;
  distance: number;
}

export interface TouchGestureOptions {
  /** Se deve usar anúncios de acessibilidade */
  announcements?: boolean;
  /** Distância mínima para reconhecer swipe (em pixels) */
  swipeThreshold?: number;
  /** Velocidade mínima para reconhecer swipe (pixels/ms) */
  swipeVelocityThreshold?: number;
  /** Escala mínima para reconhecer pinch */
  pinchThreshold?: number;
  /** Tempo máximo para tap (em ms) */
  tapTimeout?: number;
  /** Distância máxima para tap (em pixels) */
  tapThreshold?: number;
  /** Tempo para long press (em ms) */
  longPressTimeout?: number;
  /** Se deve prevenir comportamento padrão */
  preventDefault?: boolean;
  /** Callback para swipe */
  onSwipe?: (gesture: SwipeGesture, event: TouchEvent) => void;
  /** Callback para pinch */
  onPinch?: (gesture: PinchGesture, event: TouchEvent) => void;
  /** Callback para tap */
  onTap?: (point: TouchPoint, event: TouchEvent) => void;
  /** Callback para double tap */
  onDoubleTap?: (point: TouchPoint, event: TouchEvent) => void;
  /** Callback para long press */
  onLongPress?: (point: TouchPoint, event: TouchEvent) => void;
  /** Callback para início do touch */
  onTouchStart?: (point: TouchPoint, event: TouchEvent) => void;
  /** Callback para movimento do touch */
  onTouchMove?: (point: TouchPoint, event: TouchEvent) => void;
  /** Callback para fim do touch */
  onTouchEnd?: (point: TouchPoint, event: TouchEvent) => void;
}

export interface TouchGestureReturn {
  /** Se está tocando atualmente */
  isTouching: boolean;
  /** Número de toques ativos */
  touchCount: number;
  /** Último gesto de swipe */
  lastSwipe: SwipeGesture | null;
  /** Último gesto de pinch */
  lastPinch: PinchGesture | null;
  /** Props para elementos com gestos */
  getTouchProps: () => {
    onTouchStart: (event: TouchEvent) => void;
    onTouchMove: (event: TouchEvent) => void;
    onTouchEnd: (event: TouchEvent) => void;
    onTouchCancel: (event: TouchEvent) => void;
    style: {
      touchAction: string;
    };
  };
  /** Função para resetar estado */
  resetGestures: () => void;
}

/**
 * Hook para funcionalidades de gestos touch acessíveis
 * 
 * Implementa as diretrizes WCAG 2.1 AA para gestos touch:
 * - Suporte a gestos alternativos (não apenas gestos complexos)
 * - Anúncios de acessibilidade para mudanças de estado
 * - Prevenção de ativação acidental
 * - Feedback tátil e sonoro
 * - Cancelamento de gestos
 * 
 * @example
 * ```tsx
 * function TouchGestureComponent() {
 *   const {
 *     isTouching,
 *     lastSwipe,
 *     getTouchProps
 *   } = useTouchGestures({
 *     announcements: true,
 *     onSwipe: (gesture) => {
 *       console.log('Swipe:', gesture.direction);
 *     },
 *     onTap: (point) => {
 *       console.log('Tap at:', point.x, point.y);
 *     }
 *   });
 * 
 *   return (
 *     <div {...getTouchProps()}>
 *       Touch me!
 *     </div>
 *   );
 * }
 * ```
 */
export function useTouchGestures({
  announcements = true,
  swipeThreshold = 50,
  swipeVelocityThreshold = 0.3,
  pinchThreshold = 0.1,
  tapTimeout = 300,
  tapThreshold = 10,
  longPressTimeout = 500,
  preventDefault = true,
  onSwipe,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: TouchGestureOptions = {}): TouchGestureReturn {
  const [isTouching, setIsTouching] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<SwipeGesture | null>(null);
  const [lastPinch, setLastPinch] = useState<PinchGesture | null>(null);
  
  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchesRef = useRef<TouchPoint[]>([]);
  const lastTapRef = useRef<TouchPoint | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number>(0);
  
  const { announce, announceSuccess } = useAnnouncements();

  // Função para calcular distância entre dois pontos
  const calculateDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Função para calcular centro entre dois pontos
  const calculateCenter = useCallback((p1: TouchPoint, p2: TouchPoint): TouchPoint => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      timestamp: Math.max(p1.timestamp, p2.timestamp),
    };
  }, []);

  // Função para detectar direção do swipe
  const detectSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'left' | 'right' | 'up' | 'down' => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // Função para criar TouchPoint a partir de Touch
  const createTouchPoint = useCallback((touch: Touch): TouchPoint => {
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
  }, []);

  // Função para resetar estado
  const resetGestures = useCallback(() => {
    setIsTouching(false);
    setTouchCount(0);
    setLastSwipe(null);
    setLastPinch(null);
    touchStartRef.current = null;
    touchesRef.current = [];
    initialDistanceRef.current = 0;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handler para início do touch
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }
      
      const touches = Array.from(event.touches).map(createTouchPoint);
      touchesRef.current = touches;
      setTouchCount(touches.length);
      setIsTouching(true);
      
      if (touches.length === 1) {
        const touch = touches[0];
        touchStartRef.current = touch;
        
        // Configurar timer para long press
        longPressTimerRef.current = setTimeout(() => {
          if (touchStartRef.current && calculateDistance(touchStartRef.current, touch) <= tapThreshold) {
            onLongPress?.(touch, event);
            if (announcements) {
              announce('Pressão longa detectada.');
            }
          }
        }, longPressTimeout);
        
        onTouchStart?.(touch, event);
      } else if (touches.length === 2) {
        // Inicializar pinch
        initialDistanceRef.current = calculateDistance(touches[0], touches[1]);
        
        // Cancelar long press
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    [preventDefault, createTouchPoint, onTouchStart, onLongPress, announcements, announce, calculateDistance, tapThreshold, longPressTimeout]
  );

  // Handler para movimento do touch
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }
      
      const touches = Array.from(event.touches).map(createTouchPoint);
      touchesRef.current = touches;
      
      if (touches.length === 1) {
        const touch = touches[0];
        
        // Cancelar long press se movimento for muito grande
        if (touchStartRef.current && longPressTimerRef.current) {
          const distance = calculateDistance(touchStartRef.current, touch);
          if (distance > tapThreshold) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        
        onTouchMove?.(touch, event);
      } else if (touches.length === 2 && initialDistanceRef.current > 0) {
        // Detectar pinch
        const currentDistance = calculateDistance(touches[0], touches[1]);
        const scale = currentDistance / initialDistanceRef.current;
        const center = calculateCenter(touches[0], touches[1]);
        
        if (Math.abs(scale - 1) > pinchThreshold) {
          const pinchGesture: PinchGesture = {
            scale,
            center,
            distance: currentDistance,
          };
          
          setLastPinch(pinchGesture);
          onPinch?.(pinchGesture, event);
          
          if (announcements) {
            const action = scale > 1 ? 'Ampliando' : 'Reduzindo';
            announce(`${action} ${Math.round(scale * 100)}%`);
          }
        }
      }
    },
    [preventDefault, createTouchPoint, onTouchMove, onPinch, announcements, announce, calculateDistance, calculateCenter, tapThreshold, pinchThreshold]
  );

  // Handler para fim do touch
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }
      
      const touches = Array.from(event.touches).map(createTouchPoint);
      const changedTouches = Array.from(event.changedTouches).map(createTouchPoint);
      
      // Cancelar long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      if (touches.length === 0) {
        // Todos os toques terminaram
        setIsTouching(false);
        setTouchCount(0);
        
        if (touchStartRef.current && changedTouches.length === 1) {
          const endTouch = changedTouches[0];
          const distance = calculateDistance(touchStartRef.current, endTouch);
          const duration = endTouch.timestamp - touchStartRef.current.timestamp;
          const velocity = distance / duration;
          
          if (distance <= tapThreshold && duration <= tapTimeout) {
            // Detectar tap ou double tap
            const now = Date.now();
            const timeSinceLastTap = now - lastTapTimeRef.current;
            
            if (lastTapRef.current && timeSinceLastTap <= 300 && 
                calculateDistance(lastTapRef.current, endTouch) <= tapThreshold) {
              // Double tap
              onDoubleTap?.(endTouch, event);
              if (announcements) {
                announceSuccess('Toque duplo detectado.');
              }
              lastTapRef.current = null;
              lastTapTimeRef.current = 0;
            } else {
              // Single tap
              onTap?.(endTouch, event);
              lastTapRef.current = endTouch;
              lastTapTimeRef.current = now;
            }
          } else if (distance >= swipeThreshold && velocity >= swipeVelocityThreshold) {
            // Detectar swipe
            const direction = detectSwipeDirection(touchStartRef.current, endTouch);
            const swipeGesture: SwipeGesture = {
              direction,
              distance,
              velocity,
              duration,
            };
            
            setLastSwipe(swipeGesture);
            onSwipe?.(swipeGesture, event);
            
            if (announcements) {
              const directionText = {
                left: 'esquerda',
                right: 'direita',
                up: 'cima',
                down: 'baixo',
              }[direction];
              announce(`Deslize para ${directionText} detectado.`);
            }
          }
        }
        
        touchStartRef.current = null;
        initialDistanceRef.current = 0;
      } else {
        setTouchCount(touches.length);
      }
      
      if (changedTouches.length > 0) {
        onTouchEnd?.(changedTouches[0], event);
      }
    },
    [preventDefault, createTouchPoint, onTouchEnd, onTap, onDoubleTap, onSwipe, announcements, announce, announceSuccess, calculateDistance, detectSwipeDirection, tapThreshold, tapTimeout, swipeThreshold, swipeVelocityThreshold]
  );

  // Handler para cancelamento do touch
  const handleTouchCancel = useCallback(
    (event: TouchEvent) => {
      if (announcements) {
        announce('Gesto cancelado.');
      }
      resetGestures();
    },
    [announcements, announce, resetGestures]
  );

  // Props para elementos com gestos
  const getTouchProps = useCallback(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
      style: {
        touchAction: preventDefault ? 'none' : 'auto',
      },
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventDefault]
  );

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isTouching,
    touchCount,
    lastSwipe,
    lastPinch,
    getTouchProps,
    resetGestures,
  };
}

/**
 * Hook simplificado para swipe em listas
 */
export function useSwipeList({
  onSwipeLeft,
  onSwipeRight,
  announcements = true,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  announcements?: boolean;
}) {
  return useTouchGestures({
    announcements,
    swipeThreshold: 100,
    swipeVelocityThreshold: 0.5,
    onSwipe: (gesture) => {
      if (gesture.direction === 'left') {
        onSwipeLeft?.();
      } else if (gesture.direction === 'right') {
        onSwipeRight?.();
      }
    },
  });
}

/**
 * Hook simplificado para zoom com pinch
 */
export function usePinchZoom({
  onZoom,
  minScale = 0.5,
  maxScale = 3,
  announcements = true,
}: {
  onZoom?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  announcements?: boolean;
}) {
  const [currentScale, setCurrentScale] = useState(1);
  
  const touchGestures = useTouchGestures({
    announcements,
    pinchThreshold: 0.05,
    onPinch: (gesture) => {
      const newScale = Math.min(Math.max(gesture.scale, minScale), maxScale);
      setCurrentScale(newScale);
      onZoom?.(newScale);
    },
  });

  const resetZoom = useCallback(() => {
    setCurrentScale(1);
    onZoom?.(1);
  }, [onZoom]);

  return {
    ...touchGestures,
    currentScale,
    resetZoom,
  };
}