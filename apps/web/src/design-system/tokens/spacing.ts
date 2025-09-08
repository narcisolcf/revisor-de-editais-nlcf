/**
 * Tokens de Espaçamento DSGov
 * Baseado na escala de 4px do Design System Governamental
 */

// Escala base de espaçamento (múltiplos de 4px)
export const spacing = {
  '01': '0.25rem',  // 4px
  '02': '0.5rem',   // 8px
  '03': '0.75rem',  // 12px
  '04': '1rem',     // 16px
  '05': '1.25rem',  // 20px
  '06': '1.5rem',   // 24px
  '07': '1.75rem',  // 28px
  '08': '2rem',     // 32px
  '09': '2.25rem',  // 36px
  '10': '2.5rem',   // 40px
  '11': '2.75rem',  // 44px
  '12': '3rem',     // 48px
  '14': '3.5rem',   // 56px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
  '28': '7rem',     // 112px
  '32': '8rem',     // 128px
  '36': '9rem',     // 144px
  '40': '10rem',    // 160px
  '44': '11rem',    // 176px
  '48': '12rem',    // 192px
  '52': '13rem',    // 208px
  '56': '14rem',    // 224px
  '60': '15rem',    // 240px
  '64': '16rem',    // 256px
  '72': '18rem',    // 288px
  '80': '20rem',    // 320px
  '96': '24rem',    // 384px
} as const;

// Espaçamentos semânticos para componentes
export const componentSpacing = {
  // Padding interno de componentes
  button: {
    small: { x: spacing['03'], y: spacing['02'] },
    medium: { x: spacing['04'], y: spacing['03'] },
    large: { x: spacing['06'], y: spacing['04'] },
  },
  input: {
    small: { x: spacing['03'], y: spacing['02'] },
    medium: { x: spacing['04'], y: spacing['03'] },
    large: { x: spacing['04'], y: spacing['04'] },
  },
  card: {
    small: spacing['04'],
    medium: spacing['06'],
    large: spacing['08'],
  },
  modal: {
    padding: spacing['06'],
    gap: spacing['04'],
  },
  
  // Margens entre elementos
  stack: {
    tight: spacing['02'],
    default: spacing['04'],
    loose: spacing['06'],
    extraLoose: spacing['08'],
  },
  
  // Espaçamentos de layout
  section: {
    small: spacing['08'],
    medium: spacing['12'],
    large: spacing['16'],
    extraLarge: spacing['24'],
  },
  
  // Container padding
  container: {
    mobile: spacing['04'],
    tablet: spacing['06'],
    desktop: spacing['08'],
  },
} as const;

// Gaps para layouts flexbox/grid
export const gap = {
  none: '0',
  xs: spacing['01'],
  sm: spacing['02'],
  md: spacing['04'],
  lg: spacing['06'],
  xl: spacing['08'],
  '2xl': spacing['12'],
  '3xl': spacing['16'],
} as const;

// Insets para posicionamento absoluto
export const inset = {
  auto: 'auto',
  '0': '0',
  '1': spacing['01'],
  '2': spacing['02'],
  '3': spacing['03'],
  '4': spacing['04'],
  '6': spacing['06'],
  '8': spacing['08'],
  '12': spacing['12'],
  '16': spacing['16'],
  '20': spacing['20'],
  '24': spacing['24'],
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '3/4': '75%',
  full: '100%',
} as const;

// Espaçamentos específicos para acessibilidade
export const a11ySpacing = {
  // Área mínima de toque (44px)
  touchTarget: spacing['11'],
  
  // Espaçamento mínimo entre elementos interativos
  interactiveGap: spacing['02'],
  
  // Padding mínimo para foco visível
  focusPadding: spacing['01'],
  
  // Espaçamento para leitores de tela
  screenReaderGap: spacing['01'],
} as const;

// Breakpoints para espaçamentos responsivos
export const responsiveSpacing = {
  mobile: {
    container: spacing['04'],
    section: spacing['08'],
    component: spacing['04'],
  },
  tablet: {
    container: spacing['06'],
    section: spacing['12'],
    component: spacing['06'],
  },
  desktop: {
    container: spacing['08'],
    section: spacing['16'],
    component: spacing['08'],
  },
  wide: {
    container: spacing['12'],
    section: spacing['24'],
    component: spacing['12'],
  },
} as const;