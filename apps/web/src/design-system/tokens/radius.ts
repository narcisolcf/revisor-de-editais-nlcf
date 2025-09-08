/**
 * Tokens de Border Radius DSGov
 * Baseado nas diretrizes de arredondamento governamental
 */

// Escala base de border radius
export const radius = {
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Circular
} as const;

// Border radius para componentes específicos
export const componentRadius = {
  // Botões
  button: {
    small: radius.sm,
    medium: radius.md,
    large: radius.lg,
    pill: radius.full,
  },
  
  // Inputs e campos de formulário
  input: {
    default: radius.md,
    small: radius.sm,
    large: radius.lg,
  },
  
  // Cards e containers
  card: {
    default: radius.lg,
    small: radius.md,
    large: radius.xl,
  },
  
  // Badges e tags
  badge: {
    default: radius.sm,
    pill: radius.full,
  },
  
  // Elementos de navegação
  tab: {
    default: radius.md,
    top: `${radius.md} ${radius.md} 0 0`,
    bottom: `0 0 ${radius.md} ${radius.md}`,
  },
  
  // Modais e overlays
  modal: {
    default: radius.xl,
    large: radius['2xl'],
  },
  
  // Tooltips e popovers
  tooltip: {
    default: radius.md,
  },
  
  popover: {
    default: radius.lg,
  },
  
  // Elementos de mídia
  avatar: {
    square: radius.md,
    rounded: radius.lg,
    circle: radius.full,
  },
  
  image: {
    default: radius.lg,
    small: radius.md,
    large: radius.xl,
  },
  
  // Elementos de feedback
  notification: {
    default: radius.lg,
    toast: radius.xl,
  },
  
  // Progress e loading
  progress: {
    track: radius.full,
    bar: radius.full,
  },
  
  // Elementos de upload
  dropzone: {
    default: radius.lg,
    dashed: radius.xl,
  },
} as const;

// Border radius para estados específicos
export const stateRadius = {
  // Estados de foco
  focus: {
    outline: radius.md,
    ring: radius.lg,
  },
  
  // Estados de hover
  hover: {
    subtle: radius.md,
    enhanced: radius.lg,
  },
  
  // Estados de seleção
  selected: {
    default: radius.md,
    highlighted: radius.lg,
  },
} as const;

// Border radius responsivo
export const responsiveRadius = {
  mobile: {
    card: radius.md,
    modal: radius.lg,
    button: radius.sm,
  },
  tablet: {
    card: radius.lg,
    modal: radius.xl,
    button: radius.md,
  },
  desktop: {
    card: radius.lg,
    modal: radius.xl,
    button: radius.md,
  },
} as const;

// Combinações especiais de border radius
export const specialRadius = {
  // Apenas cantos superiores
  topOnly: {
    sm: `${radius.sm} ${radius.sm} 0 0`,
    md: `${radius.md} ${radius.md} 0 0`,
    lg: `${radius.lg} ${radius.lg} 0 0`,
    xl: `${radius.xl} ${radius.xl} 0 0`,
  },
  
  // Apenas cantos inferiores
  bottomOnly: {
    sm: `0 0 ${radius.sm} ${radius.sm}`,
    md: `0 0 ${radius.md} ${radius.md}`,
    lg: `0 0 ${radius.lg} ${radius.lg}`,
    xl: `0 0 ${radius.xl} ${radius.xl}`,
  },
  
  // Apenas lado esquerdo
  leftOnly: {
    sm: `${radius.sm} 0 0 ${radius.sm}`,
    md: `${radius.md} 0 0 ${radius.md}`,
    lg: `${radius.lg} 0 0 ${radius.lg}`,
    xl: `${radius.xl} 0 0 ${radius.xl}`,
  },
  
  // Apenas lado direito
  rightOnly: {
    sm: `0 ${radius.sm} ${radius.sm} 0`,
    md: `0 ${radius.md} ${radius.md} 0`,
    lg: `0 ${radius.lg} ${radius.lg} 0`,
    xl: `0 ${radius.xl} ${radius.xl} 0`,
  },
} as const;

// Utilitários para transições de border radius
export const radiusTransitions = {
  default: 'border-radius 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'border-radius 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'border-radius 300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;