/**
 * Exportações dos temas do Design System
 * Baseado nos tokens DSGov e padrões de design governamental
 */

// Temas
export { lightTheme, type LightTheme } from './light'
export { darkTheme, type DarkTheme } from './dark'

// Provider e hooks de tema
export {
  ThemeProvider,
  useTheme,
  useIsDark,
  useIsLight,
  type Theme,
  type ThemeName
} from './theme-provider'

// Importações para uso interno
import { lightTheme } from './light'
import { darkTheme } from './dark'

// Utilitários de tema
export const themes = {
  light: lightTheme,
  dark: darkTheme
} as const

// Função para obter tema por nome
export function getTheme(themeName: 'light' | 'dark') {
  return themes[themeName]
}

// Função para obter todas as cores de um tema
export function getThemeColors(themeName: 'light' | 'dark') {
  return themes[themeName].colors
}

// Função para obter sombras de um tema
export function getThemeShadows(themeName: 'light' | 'dark') {
  return themes[themeName].shadows
}