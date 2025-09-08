/**
 * Provider de temas para gerenciar tema claro/escuro
 * Baseado nos tokens DSGov e padrões de design governamental
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { lightTheme } from './light'
import { darkTheme } from './dark'

// Tipos dos temas
export type Theme = typeof lightTheme | typeof darkTheme
export type ThemeName = 'light' | 'dark' | 'system'

// Interface do contexto de tema
interface ThemeContextType {
  theme: Theme
  themeName: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

// Contexto do tema
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Props do provider
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeName
  storageKey?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

/**
 * Provider de temas que gerencia o estado do tema e persiste a preferência
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system" storageKey="app-theme">
 *       <YourApp />
 *     </ThemeProvider>
 *   )
 * }
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return defaultTheme
    
    try {
      const stored = localStorage.getItem(storageKey)
      return (stored as ThemeName) || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Determina o tema atual baseado na preferência
  const currentTheme = themeName === 'system' ? systemTheme : themeName
  const theme = currentTheme === 'dark' ? darkTheme : lightTheme
  const isDark = currentTheme === 'dark'
  const isLight = currentTheme === 'light'

  // Monitora mudanças na preferência do sistema
  useEffect(() => {
    if (!enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystem])

  // Aplica o tema ao documento
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove classes de tema anteriores
    root.classList.remove('light', 'dark')
    
    // Adiciona a classe do tema atual
    root.classList.add(currentTheme)
    
    // Define variáveis CSS customizadas para o tema
    const setThemeVariables = (theme: Theme) => {
      // Cores de fundo
      root.style.setProperty('--color-background-primary', theme.colors.background.primary)
      root.style.setProperty('--color-background-secondary', theme.colors.background.secondary)
      root.style.setProperty('--color-background-tertiary', theme.colors.background.tertiary)
      
      // Cores de texto
      root.style.setProperty('--color-text-primary', theme.colors.text.primary)
      root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
      root.style.setProperty('--color-text-tertiary', theme.colors.text.tertiary)
      
      // Cores de borda
      root.style.setProperty('--color-border-primary', theme.colors.border.primary)
      root.style.setProperty('--color-border-secondary', theme.colors.border.secondary)
      root.style.setProperty('--color-border-focus', theme.colors.border.focus)
    }
    
    setThemeVariables(theme)
  }, [theme, currentTheme])

  // Persiste a preferência de tema
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, themeName)
    } catch {
      // Ignora erros de localStorage
    }
  }, [themeName, storageKey])

  // Função para definir o tema
  const setTheme = (newTheme: ThemeName) => {
    if (disableTransitionOnChange) {
      const css = document.createElement('style')
      css.appendChild(
        document.createTextNode(
          '*, *::before, *::after { transition: none !important; animation-duration: 0.01ms !important; animation-delay: 0.01ms !important; }'
        )
      )
      document.head.appendChild(css)

      // Força um reflow
      window.getComputedStyle(css).opacity
      document.head.removeChild(css)
    }

    setThemeName(newTheme)
  }

  // Função para alternar entre temas
  const toggleTheme = () => {
    if (themeName === 'system') {
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(themeName === 'dark' ? 'light' : 'dark')
    }
  }

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
    toggleTheme,
    isDark,
    isLight
  }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook para acessar o contexto de tema
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, toggleTheme } = useTheme()
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       Tema atual: {isDark ? 'Escuro' : 'Claro'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  
  return context
}

/**
 * Hook para detectar se o tema atual é escuro
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDark = useIsDark()
 *   
 *   return (
 *     <div className={isDark ? 'dark-styles' : 'light-styles'}>
 *       Conteúdo
 *     </div>
 *   )
 * }
 * ```
 */
export function useIsDark(): boolean {
  const { isDark } = useTheme()
  return isDark
}

/**
 * Hook para detectar se o tema atual é claro
 */
export function useIsLight(): boolean {
  const { isLight } = useTheme()
  return isLight
}