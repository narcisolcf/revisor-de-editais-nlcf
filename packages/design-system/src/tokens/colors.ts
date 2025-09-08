/**
 * Tokens de cores baseados no Design System do Governo (DSGov)
 * Seguindo as diretrizes oficiais de identidade visual do governo brasileiro
 */

export const colors = {
  // Cores primárias do governo
  primary: {
    50: '#e6f3ff',
    100: '#b3d9ff',
    200: '#80bfff',
    300: '#4da6ff',
    400: '#1a8cff',
    500: '#0073e6', // Azul governo principal
    600: '#005cb3',
    700: '#004580',
    800: '#002e4d',
    900: '#00171a'
  },

  // Verde governo
  success: {
    50: '#e8f5e8',
    100: '#c3e6c3',
    200: '#9dd69d',
    300: '#78c678',
    400: '#52b752',
    500: '#2d7d2d', // Verde governo
    600: '#246324',
    700: '#1b4a1b',
    800: '#123012',
    900: '#091709'
  },

  // Amarelo governo
  warning: {
    50: '#fffbf0',
    100: '#fff2d9',
    200: '#ffe9c2',
    300: '#ffe0ab',
    400: '#ffd794',
    500: '#ffcd07', // Amarelo governo
    600: '#e6b800',
    700: '#cc9f00',
    800: '#b38600',
    900: '#996d00'
  },

  // Vermelho para erros
  error: {
    50: '#fef2f2',
    100: '#fde8e8',
    200: '#fbd5d5',
    300: '#f8b4b4',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Tons de cinza neutros
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },

  // Cores de fundo
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9'
  },

  // Cores de texto
  text: {
    primary: '#1e293b',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff'
  },

  // Cores de borda
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#0073e6'
  },

  // Estados interativos
  interactive: {
    hover: '#f1f5f9',
    pressed: '#e2e8f0',
    disabled: '#f8fafc'
  }
} as const

// Tipos para TypeScript
export type ColorToken = keyof typeof colors
export type ColorShade = keyof typeof colors.primary