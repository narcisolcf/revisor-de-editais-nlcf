/**
 * Configuração do Tailwind CSS integrada com os tokens DSGov
 * Esta configuração pode ser estendida pelos projetos que usam o design system
 */

const { colors } = require('./src/tokens/colors')
const { typography } = require('./src/tokens/typography')
const { spacing } = require('./src/tokens/spacing')
const { shadows } = require('./src/tokens/shadows')
const { radius } = require('./src/tokens/radius')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Permite que projetos externos usem os componentes
    './node_modules/@revisor-editais/design-system/dist/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Cores baseadas nos tokens DSGov
      colors: {
        // Cores primárias (azul governo)
        primary: colors.primary,
        
        // Cores de sucesso (verde governo)
        success: colors.success,
        
        // Cores de aviso (amarelo governo)
        warning: colors.warning,
        
        // Cores de erro
        error: colors.error,
        
        // Cores neutras
        neutral: colors.neutral,
        
        // Cores de fundo
        background: {
          primary: 'var(--color-background-primary, #ffffff)',
          secondary: 'var(--color-background-secondary, #f8fafc)',
          tertiary: 'var(--color-background-tertiary, #f1f5f9)',
          inverse: 'var(--color-background-inverse, #0f172a)',
          overlay: 'var(--color-background-overlay, rgba(0, 0, 0, 0.6))'
        },
        
        // Cores de texto
        text: {
          primary: 'var(--color-text-primary, #0f172a)',
          secondary: 'var(--color-text-secondary, #475569)',
          tertiary: 'var(--color-text-tertiary, #64748b)',
          inverse: 'var(--color-text-inverse, #ffffff)',
          disabled: 'var(--color-text-disabled, #94a3b8)'
        },
        
        // Cores de borda
        border: {
          primary: 'var(--color-border-primary, #e2e8f0)',
          secondary: 'var(--color-border-secondary, #cbd5e1)',
          tertiary: 'var(--color-border-tertiary, #94a3b8)',
          inverse: 'var(--color-border-inverse, #475569)',
          focus: 'var(--color-border-focus, #3b82f6)'
        }
      },
      
      // Tipografia baseada nos tokens
      fontFamily: {
        sans: typography.fontFamily.primary,
        serif: typography.fontFamily.secondary,
        mono: typography.fontFamily.mono
      },
      
      fontSize: {
        'xs': [typography.fontSize.xs, { lineHeight: typography.lineHeight.tight }],
        'sm': [typography.fontSize.sm, { lineHeight: typography.lineHeight.normal }],
        'base': [typography.fontSize.base, { lineHeight: typography.lineHeight.normal }],
        'lg': [typography.fontSize.lg, { lineHeight: typography.lineHeight.normal }],
        'xl': [typography.fontSize.xl, { lineHeight: typography.lineHeight.relaxed }],
        '2xl': [typography.fontSize['2xl'], { lineHeight: typography.lineHeight.relaxed }],
        '3xl': [typography.fontSize['3xl'], { lineHeight: typography.lineHeight.tight }],
        '4xl': [typography.fontSize['4xl'], { lineHeight: typography.lineHeight.tight }],
        '5xl': [typography.fontSize['5xl'], { lineHeight: typography.lineHeight.tight }],
        '6xl': [typography.fontSize['6xl'], { lineHeight: typography.lineHeight.tight }]
      },
      
      fontWeight: {
        thin: typography.fontWeight.thin,
        light: typography.fontWeight.light,
        normal: typography.fontWeight.normal,
        medium: typography.fontWeight.medium,
        semibold: typography.fontWeight.semibold,
        bold: typography.fontWeight.bold,
        extrabold: typography.fontWeight.extrabold,
        black: typography.fontWeight.black
      },
      
      letterSpacing: {
        tighter: typography.letterSpacing.tighter,
        tight: typography.letterSpacing.tight,
        normal: typography.letterSpacing.normal,
        wide: typography.letterSpacing.wide,
        wider: typography.letterSpacing.wider,
        widest: typography.letterSpacing.widest
      },
      
      // Espaçamento baseado nos tokens
      spacing: {
        ...spacing.basic,
        // Espaçamentos semânticos
        'component-xs': spacing.semantic.component.xs,
        'component-sm': spacing.semantic.component.sm,
        'component-md': spacing.semantic.component.md,
        'component-lg': spacing.semantic.component.lg,
        'component-xl': spacing.semantic.component.xl
      },
      
      // Sombras baseadas nos tokens
      boxShadow: {
        ...shadows.basic,
        // Sombras por contexto
        'focus': shadows.context.focus,
        'card': shadows.context.card,
        'button': shadows.context.button,
        'dropdown': shadows.context.dropdown,
        'modal': shadows.context.modal,
        'tooltip': shadows.context.tooltip,
        'navigation': shadows.context.navigation
      },
      
      // Border radius baseado nos tokens
      borderRadius: {
        ...radius.basic,
        // Radius semânticos
        'button': radius.semantic.button,
        'input': radius.semantic.input,
        'card': radius.semantic.card,
        'badge': radius.semantic.badge,
        'modal': radius.semantic.modal,
        'dropdown': radius.semantic.dropdown,
        'tooltip': radius.semantic.tooltip,
        'navigation': radius.semantic.navigation,
        'avatar': radius.semantic.avatar
      },
      
      // Animações e transições
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms'
      },
      
      transitionTimingFunction: {
        'ease-in-out-cubic': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-cubic': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-cubic': 'cubic-bezier(0.4, 0, 1, 1)'
      },
      
      // Configurações de acessibilidade
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    }
  },
  plugins: [
    // Plugin para adicionar utilitários customizados
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Utilitários de foco para acessibilidade
        '.focus-visible-ring': {
          '&:focus-visible': {
            outline: 'none',
            'box-shadow': `0 0 0 2px ${theme('colors.primary.500')}, 0 0 0 4px ${theme('colors.primary.200')}`
          }
        },
        
        // Utilitários para truncar texto
        '.text-truncate': {
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap'
        },
        
        // Utilitários para scroll suave
        '.scroll-smooth': {
          'scroll-behavior': 'smooth'
        },
        
        // Utilitários para ocultar scrollbar
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      
      addUtilities(newUtilities)
    }
  ]
}