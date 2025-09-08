/**
 * Tokens de bordas e sombras baseados no Design System do Governo Federal (DSGov)
 * Referência: https://www.gov.br/ds/fundamentos-visuais/elevacao
 */

export const borders = {
  // Larguras de borda
  width: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },

  // Raios de borda
  radius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Estilos de borda
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    none: 'none'
  }
} as const;

export const shadows = {
  // Sombras de elevação
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Sombras de foco
  focus: {
    primary: '0 0 0 2px rgb(14 165 233 / 0.5)',
    error: '0 0 0 2px rgb(239 68 68 / 0.5)',
    success: '0 0 0 2px rgb(34 197 94 / 0.5)',
    warning: '0 0 0 2px rgb(234 179 8 / 0.5)'
  },

  // Sombras coloridas
  colored: {
    primary: '0 4px 14px 0 rgb(14 165 233 / 0.15)',
    success: '0 4px 14px 0 rgb(34 197 94 / 0.15)',
    warning: '0 4px 14px 0 rgb(234 179 8 / 0.15)',
    error: '0 4px 14px 0 rgb(239 68 68 / 0.15)'
  }
} as const;

// Tokens de elevação semânticos
export const elevation = {
  // Níveis de elevação para componentes
  level: {
    0: { boxShadow: shadows.none },
    1: { boxShadow: shadows.xs },
    2: { boxShadow: shadows.sm },
    3: { boxShadow: shadows.md },
    4: { boxShadow: shadows.lg },
    5: { boxShadow: shadows.xl },
    6: { boxShadow: shadows['2xl'] }
  },

  // Elevações para estados específicos
  state: {
    hover: { boxShadow: shadows.md },
    focus: { boxShadow: shadows.focus.primary },
    active: { boxShadow: shadows.inner },
    disabled: { boxShadow: shadows.none }
  }
} as const;

export type BorderWidth = keyof typeof borders.width;
export type BorderRadius = keyof typeof borders.radius;
export type BorderStyle = keyof typeof borders.style;
export type Shadow = keyof typeof shadows;
export type ElevationLevel = keyof typeof elevation.level;
export type ElevationState = keyof typeof elevation.state;