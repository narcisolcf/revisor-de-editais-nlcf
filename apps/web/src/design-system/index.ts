// Tokens de Design
export * from './tokens';

// Componentes base
export * from './components/Button';
export * from './components/Input';
export * from './components/Card';
export * from './components/Badge';

// Componentes de Navegação
export * from './components/Breadcrumb';
export * from './components/Menu';

// Componentes de Feedback Visual
export * from './components/Toast';
export * from './components/StatusIndicator';

// Componentes de Teste de Acessibilidade
export {
  AccessibilityTester,
  type AccessibilityTesterProps,
} from './components/AccessibilityTester';

// Hooks de Acessibilidade e Interações Avançadas
export {
  useKeyboardNavigation,
  useAnnouncements,
  useFocusManagement,
  useDragAndDrop,
  useTouchGestures,
  useSwipeList,
  usePinchZoom,
  useAccessibilityTesting,
  useColorContrastMonitor,
  useFormAccessibilityValidation,
} from './hooks';
export type {
  KeyboardNavigationOptions,
  KeyboardNavigationReturn,
  AnnouncementOptions,
  UseAnnouncementsReturn,
  FocusManagementOptions,
  FocusManagementReturn,
  DragItem,
  DropZone,
  DragAndDropOptions,
  DragAndDropReturn,
  TouchPoint,
  SwipeGesture,
  PinchGesture,
  TouchGestureOptions,
  TouchGestureReturn,
  AccessibilityTestOptions,
  AccessibilityTestReturn,
} from './hooks';

// Utilitários
export { cn } from './utils/cn';

// Estilos Globais
// Nota: Os estilos globais devem ser importados diretamente no arquivo principal da aplicação
// import './design-system/styles/globals.css';