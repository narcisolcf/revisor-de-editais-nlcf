// Hooks de acessibilidade
export {
  useKeyboardNavigation,
  type KeyboardNavigationOptions,
  type KeyboardNavigationReturn,
} from './useKeyboardNavigation';

export {
  useAnnouncements,
  useRouteAnnouncements,
  useFormAnnouncements,
} from './useAnnouncements';
export type {
  AnnouncementOptions,
  UseAnnouncementsReturn,
} from './useAnnouncements';

export {
  useFocusManagement,
} from './useFocusManagement';
export type {
  FocusManagementOptions,
  FocusManagementReturn,
} from './useFocusManagement';

// Interações Avançadas
export { useDragAndDrop } from './useDragAndDrop';
export { useTouchGestures, useSwipeList, usePinchZoom } from './useTouchGestures';
export type {
  DragItem,
  DropZone,
  DragAndDropOptions,
  DragAndDropReturn,
} from './useDragAndDrop';
export type {
  TouchPoint,
  SwipeGesture,
  PinchGesture,
  TouchGestureOptions,
  TouchGestureReturn,
} from './useTouchGestures';

// Hooks de Teste de Acessibilidade
export {
  useAccessibilityTesting,
  useColorContrastMonitor,
  useFormAccessibilityValidation,
  type AccessibilityTestOptions,
  type AccessibilityTestReturn,
} from './useAccessibilityTesting';