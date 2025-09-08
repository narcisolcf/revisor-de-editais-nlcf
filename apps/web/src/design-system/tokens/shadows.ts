/**
 * Tokens de Sombras e Elevação DSGov
 * Baseado nas diretrizes de profundidade visual governamental
 */

// Sombras base para elevação
export const shadows = {
  none: 'none',
  
  // Elevação 1 - Elementos sutis (cards, inputs)
  '01': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Elevação 2 - Elementos interativos (botões, links)
  '02': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Elevação 3 - Elementos destacados (cards hover)
  '03': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // Elevação 4 - Elementos flutuantes (dropdowns)
  '04': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Elevação 5 - Elementos modais (tooltips, popovers)
  '05': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Elevação 6 - Elementos de overlay (modais, sidebars)
  '06': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Sombras especiais
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(19, 81, 180, 0.1)', // Azul DSGov com transparência
} as const;

// Sombras para estados específicos
export const stateShadows = {
  // Estados de foco
  focus: {
    primary: '0 0 0 3px rgba(19, 81, 180, 0.2)', // Azul DSGov
    secondary: '0 0 0 3px rgba(95, 99, 104, 0.2)', // Cinza DSGov
    success: '0 0 0 3px rgba(31, 139, 36, 0.2)', // Verde DSGov
    warning: '0 0 0 3px rgba(245, 158, 11, 0.2)', // Amarelo DSGov
    error: '0 0 0 3px rgba(220, 38, 38, 0.2)', // Vermelho DSGov
  },
  
  // Estados de hover
  hover: {
    subtle: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
    strong: '0 8px 16px 0 rgba(0, 0, 0, 0.15)',
  },
  
  // Estados de ativo/pressionado
  active: {
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    pressed: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  },
  
  // Estados de erro/validação
  error: {
    field: '0 0 0 1px #DC2626, 0 0 0 3px rgba(220, 38, 38, 0.1)',
    message: '0 1px 3px 0 rgba(220, 38, 38, 0.1)',
  },
  
  success: {
    field: '0 0 0 1px #1F8B24, 0 0 0 3px rgba(31, 139, 36, 0.1)',
    message: '0 1px 3px 0 rgba(31, 139, 36, 0.1)',
  },
} as const;

// Sombras para componentes específicos
export const componentShadows = {
  // Botões
  button: {
    default: shadows['02'],
    hover: shadows['03'],
    active: shadows['01'],
    focus: stateShadows.focus.primary,
  },
  
  // Cards
  card: {
    default: shadows['01'],
    hover: shadows['03'],
    elevated: shadows['04'],
  },
  
  // Inputs
  input: {
    default: shadows.inner,
    focus: stateShadows.focus.primary,
    error: stateShadows.error.field,
    success: stateShadows.success.field,
  },
  
  // Navegação
  navigation: {
    header: shadows['02'],
    sidebar: shadows['04'],
    dropdown: shadows['05'],
  },
  
  // Modais e overlays
  modal: {
    backdrop: 'none',
    content: shadows['06'],
  },
  
  tooltip: {
    default: shadows['04'],
  },
  
  popover: {
    default: shadows['05'],
  },
  
  // Elementos de feedback
  notification: {
    default: shadows['04'],
    elevated: shadows['05'],
  },
  
  // Elementos de upload/drag
  dropzone: {
    default: shadows.inner,
    active: '0 0 0 2px rgba(19, 81, 180, 0.2), inset 0 2px 4px 0 rgba(19, 81, 180, 0.05)',
    error: '0 0 0 2px rgba(220, 38, 38, 0.2), inset 0 2px 4px 0 rgba(220, 38, 38, 0.05)',
  },
} as const;

// Sombras para diferentes temas
export const themeShadows = {
  light: {
    ...shadows,
    text: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  
  dark: {
    none: 'none',
    '01': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    '02': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    '03': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    '04': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    '05': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    '06': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    text: '0 1px 2px rgba(0, 0, 0, 0.8)',
  },
} as const;

// Utilitários para animação de sombras
export const shadowTransitions = {
  default: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'box-shadow 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;