/**
 * Tema escuro baseado nos tokens DSGov
 * Define as cores e estilos para o modo escuro
 */

import { colors } from '../tokens/colors'

export const darkTheme = {
  name: 'dark',
  colors: {
    // Cores de fundo (invertidas para modo escuro)
    background: {
      primary: '#0f172a', // slate-900
      secondary: '#1e293b', // slate-800
      tertiary: '#334155' // slate-700
    },
    
    // Cores de texto (invertidas para modo escuro)
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#e2e8f0', // slate-200
      tertiary: '#cbd5e1', // slate-300
      inverse: '#1e293b' // slate-800
    },
    
    // Cores de borda (adaptadas para modo escuro)
    border: {
      primary: '#475569', // slate-600
      secondary: '#64748b', // slate-500
      focus: colors.primary[400] // Mantém a cor de foco primária
    },
    
    // Cores primárias (ajustadas para contraste no modo escuro)
    primary: {
      50: colors.primary[900],
      100: colors.primary[800],
      200: colors.primary[700],
      300: colors.primary[600],
      400: colors.primary[500],
      500: colors.primary[400],
      600: colors.primary[300],
      700: colors.primary[200],
      800: colors.primary[100],
      900: colors.primary[50]
    },
    
    // Cores de sucesso (ajustadas para modo escuro)
    success: {
      50: colors.success[900],
      100: colors.success[800],
      200: colors.success[700],
      300: colors.success[600],
      400: colors.success[500],
      500: colors.success[400],
      600: colors.success[300],
      700: colors.success[200],
      800: colors.success[100],
      900: colors.success[50]
    },
    
    // Cores de aviso (ajustadas para modo escuro)
    warning: {
      50: colors.warning[900],
      100: colors.warning[800],
      200: colors.warning[700],
      300: colors.warning[600],
      400: colors.warning[500],
      500: colors.warning[400],
      600: colors.warning[300],
      700: colors.warning[200],
      800: colors.warning[100],
      900: colors.warning[50]
    },
    
    // Cores de erro (ajustadas para modo escuro)
    error: {
      50: colors.error[900],
      100: colors.error[800],
      200: colors.error[700],
      300: colors.error[600],
      400: colors.error[500],
      500: colors.error[400],
      600: colors.error[300],
      700: colors.error[200],
      800: colors.error[100],
      900: colors.error[50]
    },
    
    // Cores neutras (invertidas para modo escuro)
    neutral: {
      50: '#0f172a', // slate-900
      100: '#1e293b', // slate-800
      200: '#334155', // slate-700
      300: '#475569', // slate-600
      400: '#64748b', // slate-500
      500: '#94a3b8', // slate-400
      600: '#cbd5e1', // slate-300
      700: '#e2e8f0', // slate-200
      800: '#f1f5f9', // slate-100
      900: '#f8fafc'  // slate-50
    },
    
    // Estados interativos (adaptados para modo escuro)
    interactive: {
      hover: 'rgba(255, 255, 255, 0.1)',
      pressed: 'rgba(255, 255, 255, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.3)'
    }
  },
  
  // Configurações específicas do tema escuro
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.6)'
  },
  
  // Opacidades
  opacity: {
    disabled: '0.4',
    hover: '0.9',
    overlay: '0.8'
  }
} as const

export type DarkTheme = typeof darkTheme