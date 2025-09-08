/**
 * Tema claro baseado nos tokens DSGov
 * Define as cores e estilos para o modo claro
 */

import { colors } from '../tokens/colors'

export const lightTheme = {
  name: 'light',
  colors: {
    // Cores de fundo
    background: {
      primary: colors.background.primary,
      secondary: colors.background.secondary,
      tertiary: colors.background.tertiary
    },
    
    // Cores de texto
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      tertiary: colors.text.tertiary,
      inverse: colors.text.inverse
    },
    
    // Cores de borda
    border: {
      primary: colors.border.primary,
      secondary: colors.border.secondary,
      focus: colors.border.focus
    },
    
    // Cores primárias
    primary: {
      50: colors.primary[50],
      100: colors.primary[100],
      200: colors.primary[200],
      300: colors.primary[300],
      400: colors.primary[400],
      500: colors.primary[500],
      600: colors.primary[600],
      700: colors.primary[700],
      800: colors.primary[800],
      900: colors.primary[900]
    },
    
    // Cores de sucesso
    success: {
      50: colors.success[50],
      100: colors.success[100],
      200: colors.success[200],
      300: colors.success[300],
      400: colors.success[400],
      500: colors.success[500],
      600: colors.success[600],
      700: colors.success[700],
      800: colors.success[800],
      900: colors.success[900]
    },
    
    // Cores de aviso
    warning: {
      50: colors.warning[50],
      100: colors.warning[100],
      200: colors.warning[200],
      300: colors.warning[300],
      400: colors.warning[400],
      500: colors.warning[500],
      600: colors.warning[600],
      700: colors.warning[700],
      800: colors.warning[800],
      900: colors.warning[900]
    },
    
    // Cores de erro
    error: {
      50: colors.error[50],
      100: colors.error[100],
      200: colors.error[200],
      300: colors.error[300],
      400: colors.error[400],
      500: colors.error[500],
      600: colors.error[600],
      700: colors.error[700],
      800: colors.error[800],
      900: colors.error[900]
    },
    
    // Cores neutras
    neutral: {
      50: colors.neutral[50],
      100: colors.neutral[100],
      200: colors.neutral[200],
      300: colors.neutral[300],
      400: colors.neutral[400],
      500: colors.neutral[500],
      600: colors.neutral[600],
      700: colors.neutral[700],
      800: colors.neutral[800],
      900: colors.neutral[900]
    },
    
    // Estados interativos
    interactive: {
      hover: colors.interactive.hover,
      pressed: colors.interactive.pressed,
      disabled: colors.interactive.disabled
    }
  },
  
  // Configurações específicas do tema claro
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },
  
  // Opacidades
  opacity: {
    disabled: '0.5',
    hover: '0.8',
    overlay: '0.6'
  }
} as const

export type LightTheme = typeof lightTheme