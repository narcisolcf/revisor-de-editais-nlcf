import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Variantes do componente Button DSGov
 * Baseado nas diretrizes de design governamental
 */
const buttonVariants = cva(
  [
    // Estilos base
    'inline-flex items-center justify-center gap-02',
    'font-medium text-body-small',
    'transition-dsgov',
    'focus-dsgov',
    'touch-target',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'relative overflow-hidden',
    // Prevenção de seleção de texto
    'select-none',
    // Acessibilidade
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        // Variante primária - ação principal
        primary: [
          'bg-primary text-text-inverse',
          'hover:bg-blue-vivid-10',
          'active:bg-blue-vivid-10 active:shadow-01',
          'focus-visible:ring-primary',
          'shadow-02 hover:shadow-03',
        ],
        // Variante secundária - ação secundária
        secondary: [
          'bg-transparent text-primary border-2 border-primary',
          'hover:bg-blue-vivid-90 hover:border-blue-vivid-20',
          'active:bg-blue-vivid-80 active:shadow-01',
          'focus-visible:ring-primary',
        ],
        // Variante outline - ação terciária
        outline: [
          'bg-transparent text-text-primary border border-border-default',
          'hover:bg-gray-2 hover:border-gray-30',
          'active:bg-gray-5 active:shadow-inner',
          'focus-visible:ring-gray-60',
        ],
        // Variante ghost - ação sutil
        ghost: [
          'bg-transparent text-text-primary',
          'hover:bg-gray-5',
          'active:bg-gray-10',
          'focus-visible:ring-gray-60',
        ],
        // Variante destructive - ações perigosas
        destructive: [
          'bg-error text-text-inverse',
          'hover:bg-red-vivid-20',
          'active:bg-red-vivid-20 active:shadow-01',
          'focus-visible:ring-error',
          'shadow-02 hover:shadow-03',
        ],
        // Variante success - confirmações
        success: [
          'bg-success text-text-inverse',
          'hover:bg-green-cool-vivid-20',
          'active:bg-green-cool-vivid-20 active:shadow-01',
          'focus-visible:ring-success',
          'shadow-02 hover:shadow-03',
        ],
        // Variante link - aparência de link
        link: [
          'bg-transparent text-text-link underline-offset-4',
          'hover:underline hover:text-blue-vivid-10',
          'active:text-blue-vivid-10',
          'focus-visible:ring-text-link',
          'p-0 h-auto min-h-0',
        ],
      },
      size: {
        sm: [
          'h-08 px-03 py-02',
          'text-01 font-medium',
          'rounded-sm',
        ],
        md: [
          'h-10 px-04 py-03',
          'text-02 font-medium',
          'rounded-md',
        ],
        lg: [
          'h-12 px-06 py-04',
          'text-03 font-medium',
          'rounded-lg',
        ],
        icon: [
          'h-10 w-10',
          'rounded-md',
          'p-0',
        ],
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Conteúdo do botão */
  children?: React.ReactNode;
  /** Estado de carregamento */
  loading?: boolean;
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  /** Ícone à direita do texto */
  rightIcon?: React.ReactNode;
  /** Texto alternativo para leitores de tela quando em loading */
  loadingText?: string;
  /** Referência para o elemento */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Componente Button DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Estados visuais claros
 * - Área de toque adequada (44px mínimo)
 * - Feedback visual e sonoro
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Confirmar
 * </Button>
 * 
 * <Button variant="secondary" loading loadingText="Processando...">
 *   Salvar
 * </Button>
 * 
 * <Button variant="outline" leftIcon={<Plus />}>
 *   Adicionar
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      loading = false,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Determina se o botão está desabilitado
    const isDisabled = disabled || loading;
    
    // Conteúdo do botão baseado no estado
    const buttonContent = (
      <>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">
              {loadingText || 'Carregando...'}
            </span>
          </>
        ) : (
          leftIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        
        {children && (
          <span className={cn(
            'flex-1',
            size === 'icon' && 'sr-only'
          )}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Exportar tipos para uso externo
// Tipos já exportados acima
export { buttonVariants };