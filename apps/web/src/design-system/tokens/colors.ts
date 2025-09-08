/**
 * Tokens de Cores DSGov (Design System do Governo Federal)
 * Baseado nas diretrizes oficiais do governo brasileiro
 */

// Cores Primárias DSGov
export const colors = {
  blue: {
    'vivid-10': '#0C326F',
    'vivid-20': '#1351B4',
    'vivid-30': '#2670E8',
    'vivid-40': '#4B8BF5',
    'vivid-50': '#81B1FA',
    'vivid-60': '#B5D4FF',
    'vivid-70': '#D4E7FF',
    'vivid-80': '#E9F4FF',
    'vivid-90': '#F5FAFF',
  },
  green: {
    'cool-vivid-10': '#0D4F2C',
    'cool-vivid-20': '#168821',
    'cool-vivid-30': '#1F8B24',
    'cool-vivid-40': '#2E8B57',
    'cool-vivid-50': '#4CBB17',
    'cool-vivid-60': '#70CC2A',
    'cool-vivid-70': '#94D83A',
    'cool-vivid-80': '#B8E986',
    'cool-vivid-90': '#E1F5FE',
  },
  yellow: {
    'vivid-10': '#7A4100',
    'vivid-20': '#B54708',
    'vivid-30': '#DC6803',
    'vivid-40': '#F59E0B',
    'vivid-50': '#FBBF24',
    'vivid-60': '#FCD34D',
    'vivid-70': '#FDE68A',
    'vivid-80': '#FEF3C7',
    'vivid-90': '#FFFBEB',
  },
  red: {
    'vivid-10': '#7F1D1D',
    'vivid-20': '#B91C1C',
    'vivid-30': '#DC2626',
    'vivid-40': '#EF4444',
    'vivid-50': '#F87171',
    'vivid-60': '#FCA5A5',
    'vivid-70': '#FECACA',
    'vivid-80': '#FEE2E2',
    'vivid-90': '#FEF2F2',
  },
  gray: {
    '2': '#F8F9FA',
    '5': '#F1F3F4',
    '10': '#E8EAED',
    '20': '#DADCE0',
    '30': '#BDC1C6',
    '40': '#9AA0A6',
    '50': '#80868B',
    '60': '#5F6368',
    '70': '#3C4043',
    '80': '#202124',
    '90': '#171717',
  },
} as const;

// Mapeamento semântico para facilitar o uso
export const semanticColors = {
  primary: colors.blue['vivid-20'],
  secondary: colors.gray['60'],
  success: colors.green['cool-vivid-30'],
  warning: colors.yellow['vivid-40'],
  error: colors.red['vivid-30'],
  info: colors.blue['vivid-30'],
} as const;

// Cores para estados de componentes
export const stateColors = {
  hover: {
    primary: colors.blue['vivid-10'],
    secondary: colors.gray['70'],
    success: colors.green['cool-vivid-20'],
    warning: colors.yellow['vivid-30'],
    error: colors.red['vivid-20'],
  },
  active: {
    primary: colors.blue['vivid-10'],
    secondary: colors.gray['80'],
    success: colors.green['cool-vivid-10'],
    warning: colors.yellow['vivid-20'],
    error: colors.red['vivid-10'],
  },
  disabled: {
    background: colors.gray['10'],
    text: colors.gray['40'],
    border: colors.gray['20'],
  },
} as const;

// Cores para backgrounds
export const backgroundColors = {
  surface: colors.gray['2'],
  card: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  success: colors.green['cool-vivid-90'],
  warning: colors.yellow['vivid-90'],
  error: colors.red['vivid-90'],
  info: colors.blue['vivid-90'],
} as const;

// Cores para texto
export const textColors = {
  primary: colors.gray['80'],
  secondary: colors.gray['60'],
  muted: colors.gray['40'],
  inverse: '#FFFFFF',
  link: colors.blue['vivid-20'],
  linkHover: colors.blue['vivid-10'],
} as const;

// Cores para bordas
export const borderColors = {
  default: colors.gray['20'],
  muted: colors.gray['10'],
  focus: colors.blue['vivid-30'],
  error: colors.red['vivid-30'],
  success: colors.green['cool-vivid-30'],
  warning: colors.yellow['vivid-40'],
} as const;