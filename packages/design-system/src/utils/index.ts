/**
 * Utilitários do Design System
 * Exporta todas as funções utilitárias para uso nos componentes
 */

// Utilitários de classes CSS
export {
  cn
} from './cn'

// Utilitários de acessibilidade
export {
  generateId,
  createButtonAria,
  createInputAria,
  createNavigationAria,
  createListAria,
  createLiveRegionAria,
  isVisibleToScreenReader,
  focusFirstFocusable,
  trapFocus
} from './accessibility'

// Re-exporta tipos
export type { AriaProps } from './accessibility'