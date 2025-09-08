/**
 * Componente Badge otimizado com variantes de status
 * Baseado nos tokens DSGov e padrões de design governamental
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'

// Definição das variantes do badge usando CVA
const badgeVariants = cva(
  // Classes base sempre aplicadas
  [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
  ],
  {
    variants: {
      // Variantes de estilo visual
      variant: {
        default: [
          'bg-neutral-100 text-neutral-800 border border-neutral-200',
          'hover:bg-neutral-200'
        ],
        primary: [
          'bg-primary-100 text-primary-800 border border-primary-200',
          'hover:bg-primary-200 focus-visible:ring-primary-500'
        ],
        secondary: [
          'bg-neutral-100 text-neutral-700 border border-neutral-300',
          'hover:bg-neutral-200'
        ],
        success: [
          'bg-success-100 text-success-800 border border-success-200',
          'hover:bg-success-200 focus-visible:ring-success-500'
        ],
        warning: [
          'bg-warning-100 text-warning-800 border border-warning-200',
          'hover:bg-warning-200 focus-visible:ring-warning-500'
        ],
        error: [
          'bg-error-100 text-error-800 border border-error-200',
          'hover:bg-error-200 focus-visible:ring-error-500'
        ],
        info: [
          'bg-blue-100 text-blue-800 border border-blue-200',
          'hover:bg-blue-200 focus-visible:ring-blue-500'
        ],
        // Variantes sólidas
        'primary-solid': [
          'bg-primary-600 text-white border border-primary-600',
          'hover:bg-primary-700 focus-visible:ring-primary-500'
        ],
        'success-solid': [
          'bg-success-600 text-white border border-success-600',
          'hover:bg-success-700 focus-visible:ring-success-500'
        ],
        'warning-solid': [
          'bg-warning-600 text-white border border-warning-600',
          'hover:bg-warning-700 focus-visible:ring-warning-500'
        ],
        'error-solid': [
          'bg-error-600 text-white border border-error-600',
          'hover:bg-error-700 focus-visible:ring-error-500'
        ],
        // Variantes outline
        'primary-outline': [
          'bg-transparent text-primary-700 border border-primary-300',
          'hover:bg-primary-50 focus-visible:ring-primary-500'
        ],
        'success-outline': [
          'bg-transparent text-success-700 border border-success-300',
          'hover:bg-success-50 focus-visible:ring-success-500'
        ],
        'warning-outline': [
          'bg-transparent text-warning-700 border border-warning-300',
          'hover:bg-warning-50 focus-visible:ring-warning-500'
        ],
        'error-outline': [
          'bg-transparent text-error-700 border border-error-300',
          'hover:bg-error-50 focus-visible:ring-error-500'
        ]
      },
      // Variantes de tamanho
      size: {
        xs: 'px-2 py-0.5 text-xs rounded-md h-5',
        sm: 'px-2.5 py-0.5 text-xs rounded-md h-6',
        md: 'px-3 py-1 text-sm rounded-md h-7',
        lg: 'px-3.5 py-1 text-sm rounded-lg h-8',
        xl: 'px-4 py-1.5 text-base rounded-lg h-9'
      },
      // Variantes de formato
      shape: {
        default: '',
        rounded: 'rounded-full',
        square: 'rounded-none'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'default'
    }
  }
)

// Variantes para o indicador de status (dot)
const statusDotVariants = cva(
  'inline-block w-2 h-2 rounded-full mr-1.5',
  {
    variants: {
      status: {
        online: 'bg-success-500',
        offline: 'bg-neutral-400',
        busy: 'bg-error-500',
        away: 'bg-warning-500',
        pending: 'bg-blue-500'
      }
    }
  }
)

// Interface das props do componente
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Ícone a ser exibido antes do texto
   */
  leftIcon?: React.ReactNode
  /**
   * Ícone a ser exibido após o texto
   */
  rightIcon?: React.ReactNode
  /**
   * Indicador de status (dot colorido)
   */
  statusDot?: 'online' | 'offline' | 'busy' | 'away' | 'pending'
  /**
   * Se true, torna o badge clicável
   */
  clickable?: boolean
  /**
   * Função chamada quando o badge é clicado (apenas se clickable=true)
   */
  onBadgeClick?: () => void
  /**
   * Se true, exibe um botão de remoção
   */
  removable?: boolean
  /**
   * Função chamada quando o botão de remoção é clicado
   */
  onRemove?: () => void
  /**
   * Texto alternativo para o botão de remoção (acessibilidade)
   */
  removeAriaLabel?: string
}

/**
 * Componente Badge com suporte a diferentes variantes e estados
 * 
 * @example
 * ```tsx
 * // Badge básico
 * <Badge>Novo</Badge>
 * 
 * // Badge de status
 * <Badge variant="success">Aprovado</Badge>
 * <Badge variant="error">Rejeitado</Badge>
 * <Badge variant="warning">Pendente</Badge>
 * 
 * // Badge com ícones
 * <Badge leftIcon={<CheckIcon />} variant="success">
 *   Concluído
 * </Badge>
 * 
 * // Badge com status dot
 * <Badge statusDot="online">Online</Badge>
 * 
 * // Badge removível
 * <Badge removable onRemove={() => console.log('Removido')}>
 *   Tag removível
 * </Badge>
 * 
 * // Badge clicável
 * <Badge clickable onBadgeClick={() => console.log('Clicado')}>
 *   Clique aqui
 * </Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      leftIcon,
      rightIcon,
      statusDot,
      clickable = false,
      onBadgeClick,
      removable = false,
      onRemove,
      removeAriaLabel = 'Remover',
      children,
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (clickable && onBadgeClick) {
        onBadgeClick()
      }
    }

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation() // Evita trigger do click do badge
      if (onRemove) {
        onRemove()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        handleClick()
      }
    }

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, shape }),
          clickable && 'cursor-pointer',
          className
        )}
        onClick={clickable ? handleClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? handleKeyDown : undefined}
        {...props}
      >
        {/* Status dot */}
        {statusDot && (
          <span
            className={statusDotVariants({ status: statusDot })}
            aria-hidden="true"
          />
        )}

        {/* Ícone esquerdo */}
        {leftIcon && (
          <span className="mr-1 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Conteúdo */}
        <span className="truncate">{children}</span>

        {/* Ícone direito */}
        {rightIcon && (
          <span className="ml-1 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* Botão de remoção */}
        {removable && (
          <button
            type="button"
            className={cn(
              'ml-1 flex items-center justify-center rounded-full',
              'hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current',
              'transition-colors duration-150',
              size === 'xs' && 'h-3 w-3',
              size === 'sm' && 'h-3.5 w-3.5',
              size === 'md' && 'h-4 w-4',
              size === 'lg' && 'h-4 w-4',
              size === 'xl' && 'h-5 w-5'
            )}
            onClick={handleRemove}
            aria-label={removeAriaLabel}
          >
            <svg
              className={cn(
                'fill-current',
                size === 'xs' && 'h-2 w-2',
                size === 'sm' && 'h-2.5 w-2.5',
                size === 'md' && 'h-3 w-3',
                size === 'lg' && 'h-3 w-3',
                size === 'xl' && 'h-3.5 w-3.5'
              )}
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Exporta as variantes para uso externo
export { badgeVariants, statusDotVariants }
export type { VariantProps as BadgeVariantProps }