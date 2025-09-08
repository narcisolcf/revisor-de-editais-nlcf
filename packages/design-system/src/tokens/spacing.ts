/**
 * Tokens de espaçamento baseados no Design System do Governo (DSGov)
 * Sistema baseado em múltiplos de 4px para consistência visual
 */

export const spacing = {
  // Espaçamentos básicos (múltiplos de 4px)
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px

  // Espaçamentos semânticos para componentes
  component: {
    // Padding interno de componentes
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px

    // Espaçamento entre elementos
    gap: {
      xs: '0.25rem',  // 4px
      sm: '0.5rem',   // 8px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem',     // 32px
      '2xl': '3rem'   // 48px
    },

    // Margens
    margin: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
      '2xl': '4rem'   // 64px
    }
  },

  // Espaçamentos para layout
  layout: {
    // Containers
    container: {
      xs: '1rem',     // 16px
      sm: '1.5rem',   // 24px
      md: '2rem',     // 32px
      lg: '3rem',     // 48px
      xl: '4rem',     // 64px
      '2xl': '6rem'   // 96px
    },

    // Seções
    section: {
      xs: '2rem',     // 32px
      sm: '3rem',     // 48px
      md: '4rem',     // 64px
      lg: '6rem',     // 96px
      xl: '8rem',     // 128px
      '2xl': '12rem'  // 192px
    },

    // Grid gaps
    grid: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
      '2xl': '4rem'   // 64px
    }
  },

  // Espaçamentos específicos para formulários
  form: {
    fieldGap: '1rem',      // 16px - espaço entre campos
    labelGap: '0.5rem',    // 8px - espaço entre label e input
    groupGap: '1.5rem',    // 24px - espaço entre grupos de campos
    buttonGap: '0.75rem',  // 12px - espaço entre botões
    sectionGap: '2rem'     // 32px - espaço entre seções do formulário
  },

  // Espaçamentos para navegação
  navigation: {
    itemGap: '0.5rem',     // 8px - espaço entre itens de menu
    groupGap: '1rem',      // 16px - espaço entre grupos de navegação
    levelGap: '1.5rem'     // 24px - espaço entre níveis hierárquicos
  }
} as const

// Tipos para TypeScript
export type SpacingToken = keyof typeof spacing
export type ComponentSpacing = keyof typeof spacing.component
export type LayoutSpacing = keyof typeof spacing.layout