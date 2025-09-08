import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

/**
 * Variantes do componente Badge DSGov
 * Baseado nas diretrizes de design governamental
 */
const badgeVariants = cva(
  [
    // Estilos base
    'inline-flex items-center gap-01 rounded-full border',
    'text-01 font-medium',
    'transition-dsgov',
    'focus-dsgov',
    'select-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border-default bg-background text-text-primary',
          'hover:bg-gray-5',
        ],
        primary: [
          'border-primary bg-primary text-text-inverse',
          'hover:bg-blue-vivid-10',
        ],
        secondary: [
          'border-gray-30 bg-gray-10 text-text-primary',
          'hover:bg-gray-20',
        ],
        success: [
          'border-success bg-success text-text-inverse',
          'hover:bg-green-cool-vivid-20',
        ],
        warning: [
          'border-warning bg-warning text-text-primary',
          'hover:bg-yellow-20',
        ],
        error: [
          'border-error bg-error text-text-inverse',
          'hover:bg-red-vivid-20',
        ],
        info: [
          'border-info bg-info text-text-inverse',
          'hover:bg-cyan-vivid-20',
        ],
        outline: [
          'border-border-default bg-transparent text-text-primary',
          'hover:bg-gray-5',
        ],
        'outline-primary': [
          'border-primary bg-transparent text-primary',
          'hover:bg-blue-vivid-90',
        ],
        'outline-success': [
          'border-success bg-transparent text-success',
          'hover:bg-green-cool-5',
        ],
        'outline-warning': [
          'border-warning bg-transparent text-warning',
          'hover:bg-yellow-5',
        ],
        'outline-error': [
          'border-error bg-transparent text-error',
          'hover:bg-red-warm-5',
        ],
        'outline-info': [
          'border-info bg-transparent text-info',
          'hover:bg-cyan-5',
        ],
      },
      size: {
        sm: 'px-02 py-01 text-01 h-05',
        md: 'px-03 py-01 text-02 h-06',
        lg: 'px-04 py-02 text-03 h-08',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'active:scale-95',
        ],
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

const badgeCloseButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full',
    'transition-dsgov',
    'focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1',
    'hover:bg-black/10 active:bg-black/20',
    'ml-01',
  ],
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Conteúdo do badge */
  children?: React.ReactNode;
  /** Se o badge pode ser removido */
  dismissible?: boolean;
  /** Função chamada quando o badge é removido */
  onDismiss?: () => void;
  /** Ícone personalizado para remoção */
  dismissIcon?: React.ReactNode;
  /** Texto alternativo para o botão de remoção */
  dismissLabel?: string;
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  /** Se o badge é interativo (clicável) */
  interactive?: boolean;
  /** Função de clique para badges interativos */
  onBadgeClick?: () => void;
  /** Elemento HTML para renderizar */
  as?: React.ElementType;
}

/**
 * Componente Badge DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Estados visuais claros
 * - Suporte a remoção (dismissible)
 * - Diferentes variantes semânticas
 * - Interatividade opcional
 * 
 * @example
 * ```tsx
 * <Badge variant="primary">Novo</Badge>
 * 
 * <Badge variant="success" leftIcon={<Check />}>
 *   Aprovado
 * </Badge>
 * 
 * <Badge
 *   variant="outline-error"
 *   dismissible
 *   onDismiss={() => console.log('Removido')}
 * >
 *   Erro
 * </Badge>
 * 
 * <Badge
 *   variant="primary"
 *   interactive
 *   onBadgeClick={() => console.log('Clicado')}
 * >
 *   Clicável
 * </Badge>
 * ```
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      interactive: interactiveProp,
      children,
      dismissible = false,
      onDismiss,
      dismissIcon,
      dismissLabel = 'Remover',
      leftIcon,
      onBadgeClick,
      as: Component = 'div',
      onClick,
      onKeyDown,
      tabIndex,
      role,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Determinar se o badge é interativo
    const isInteractive = interactiveProp || !!onBadgeClick;

    // Handler para clique no badge
    const handleBadgeClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevenir propagação se o clique foi no botão de remoção
      if ((e.target as HTMLElement).closest('[data-dismiss-button]')) {
        return;
      }
      
      onClick?.(e);
      onBadgeClick?.();
    };

    // Handler para teclado no badge
    const handleBadgeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onBadgeClick?.();
      }
    };

    // Handler para remoção
    const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onDismiss?.();
    };

    // Handler para teclado na remoção
    const handleDismissKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss?.();
      }
    };

    // Props de acessibilidade para badges interativos
    const accessibilityProps = isInteractive
      ? {
          tabIndex: tabIndex ?? 0,
          role: role ?? 'button',
          'aria-label': ariaLabel,
          onClick: handleBadgeClick,
          onKeyDown: handleBadgeKeyDown,
        }
      : {
          onClick,
          onKeyDown,
        };

    // Ícone de remoção padrão
    const defaultDismissIcon = (
      <X className={cn(
        size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5'
      )} />
    );

    return (
      <Component
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, interactive: isInteractive }),
          className
        )}
        {...accessibilityProps}
        {...props}
      >
        {/* Ícone à esquerda */}
        {leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Conteúdo */}
        {children && (
          <span className="flex-1 truncate">
            {children}
          </span>
        )}

        {/* Botão de remoção */}
        {dismissible && (
          <button
            type="button"
            data-dismiss-button
            onClick={handleDismiss}
            onKeyDown={handleDismissKeyDown}
            className={cn(
              badgeCloseButtonVariants({ size }),
              'focus-visible:ring-current'
            )}
            aria-label={dismissLabel}
            tabIndex={-1}
          >
            {dismissIcon || defaultDismissIcon}
          </button>
        )}
      </Component>
    );
  }
);

Badge.displayName = 'Badge';

// Exportar tipos para uso externo
// Tipos já exportados acima
export { badgeVariants, badgeCloseButtonVariants };