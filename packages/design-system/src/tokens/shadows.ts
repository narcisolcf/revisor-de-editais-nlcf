/**
 * Tokens de sombras e elevações baseados no Design System do Governo (DSGov)
 * Sistema de elevação para criar hierarquia visual e profundidade
 */

export const shadows = {
  // Sombras básicas por nível de elevação
  none: 'none',
  
  // Elevação 1 - Elementos sutis (cards, inputs)
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Elevação 2 - Elementos interativos (botões, links)
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Elevação 3 - Componentes destacados (dropdowns, tooltips)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // Elevação 4 - Elementos flutuantes (modais, popovers)
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Elevação 5 - Elementos de maior destaque (sidebars, navigation)
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Elevação 6 - Elementos de máximo destaque (overlays, drawers)
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Sombra interna para elementos pressionados
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Sombras específicas por contexto
  context: {
    // Sombras para estados de foco
    focus: {
      primary: '0 0 0 3px rgba(0, 115, 230, 0.1)', // Azul governo com transparência
      error: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      success: '0 0 0 3px rgba(45, 125, 45, 0.1)',
      warning: '0 0 0 3px rgba(255, 205, 7, 0.1)'
    },

    // Sombras para componentes específicos
    card: {
      default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      active: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },

    button: {
      default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      hover: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      active: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },

    dropdown: {
      default: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },

    modal: {
      backdrop: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      content: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },

    tooltip: {
      default: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },

    navigation: {
      sidebar: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      topbar: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }
  },

  // Sombras coloridas para estados especiais
  colored: {
    primary: {
      light: '0 4px 6px -1px rgba(0, 115, 230, 0.1), 0 2px 4px -1px rgba(0, 115, 230, 0.06)',
      medium: '0 10px 15px -3px rgba(0, 115, 230, 0.1), 0 4px 6px -2px rgba(0, 115, 230, 0.05)',
      strong: '0 20px 25px -5px rgba(0, 115, 230, 0.1), 0 10px 10px -5px rgba(0, 115, 230, 0.04)'
    },
    success: {
      light: '0 4px 6px -1px rgba(45, 125, 45, 0.1), 0 2px 4px -1px rgba(45, 125, 45, 0.06)',
      medium: '0 10px 15px -3px rgba(45, 125, 45, 0.1), 0 4px 6px -2px rgba(45, 125, 45, 0.05)',
      strong: '0 20px 25px -5px rgba(45, 125, 45, 0.1), 0 10px 10px -5px rgba(45, 125, 45, 0.04)'
    },
    warning: {
      light: '0 4px 6px -1px rgba(255, 205, 7, 0.1), 0 2px 4px -1px rgba(255, 205, 7, 0.06)',
      medium: '0 10px 15px -3px rgba(255, 205, 7, 0.1), 0 4px 6px -2px rgba(255, 205, 7, 0.05)',
      strong: '0 20px 25px -5px rgba(255, 205, 7, 0.1), 0 10px 10px -5px rgba(255, 205, 7, 0.04)'
    },
    error: {
      light: '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
      medium: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
      strong: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04)'
    }
  }
} as const

// Tipos para TypeScript
export type ShadowToken = keyof typeof shadows
export type ContextShadow = keyof typeof shadows.context
export type ColoredShadow = keyof typeof shadows.colored