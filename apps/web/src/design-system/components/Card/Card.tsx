import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Variantes do componente Card DSGov
 * Baseado nas diretrizes de design governamental
 */
const cardVariants = cva(
  [
    // Estilos base
    'rounded-lg border bg-background',
    'transition-dsgov',
    'focus-dsgov',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border-default',
          'shadow-02',
        ],
        elevated: [
          'border-border-default',
          'shadow-04',
          'hover:shadow-05',
        ],
        outlined: [
          'border-border-default',
          'shadow-none',
        ],
        filled: [
          'border-transparent',
          'bg-gray-5',
          'shadow-01',
        ],
        interactive: [
          'border-border-default',
          'shadow-02',
          'hover:shadow-03',
          'hover:border-gray-30',
          'cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        ],
        success: [
          'border-success',
          'bg-green-cool-5',
          'shadow-02',
        ],
        warning: [
          'border-warning',
          'bg-yellow-5',
          'shadow-02',
        ],
        error: [
          'border-error',
          'bg-red-warm-5',
          'shadow-02',
        ],
        info: [
          'border-info',
          'bg-cyan-5',
          'shadow-02',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-03',
        md: 'p-04',
        lg: 'p-06',
        xl: 'p-08',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      radius: 'lg',
    },
  }
);

const cardHeaderVariants = cva(
  [
    'flex flex-col space-y-01',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-03',
        md: 'p-04',
        lg: 'p-06',
        xl: 'p-08',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

const cardContentVariants = cva(
  [
    'text-text-primary',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-03',
        md: 'p-04',
        lg: 'p-06',
        xl: 'p-08',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

const cardFooterVariants = cva(
  [
    'flex items-center',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-03',
        md: 'p-04',
        lg: 'p-06',
        xl: 'p-08',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Se o card é interativo (clicável) */
  interactive?: boolean;
  /** Função de clique para cards interativos */
  onCardClick?: () => void;
  /** Elemento HTML para renderizar (div, article, section, etc.) */
  as?: React.ElementType;
}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {
  /** Elemento HTML para renderizar */
  as?: React.ElementType;
}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {
  /** Elemento HTML para renderizar */
  as?: React.ElementType;
}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {
  /** Elemento HTML para renderizar */
  as?: React.ElementType;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Elemento HTML para renderizar (h1, h2, h3, etc.) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Componente Card DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Diferentes variantes visuais
 * - Suporte a interatividade
 * - Estrutura semântica flexível
 * 
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Título do Card</CardTitle>
 *     <CardDescription>Descrição do conteúdo</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Conteúdo principal do card</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Ação</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      radius,
      interactive,
      onCardClick,
      as: Component = 'div',
      children,
      onClick,
      onKeyDown,
      tabIndex,
      role,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Determinar se o card é interativo
    const isInteractive = interactive || !!onCardClick;
    const currentVariant = isInteractive ? 'interactive' : variant;

    // Handler para clique
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      onCardClick?.();
    };

    // Handler para teclado
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onCardClick?.();
      }
    };

    // Props de acessibilidade para cards interativos
    const accessibilityProps = isInteractive
      ? {
          tabIndex: tabIndex ?? 0,
          role: role ?? 'button',
          'aria-label': ariaLabel,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
        }
      : {
          onClick,
          onKeyDown,
        };

    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ variant: currentVariant, padding, radius }),
          className
        )}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

/**
 * Cabeçalho do Card
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(cardHeaderVariants({ padding }), className)}
      {...props}
    />
  )
);

/**
 * Título do Card
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'text-heading-small font-semibold leading-none tracking-tight text-text-primary',
        className
      )}
      {...props}
    />
  )
);

/**
 * Descrição do Card
 */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body-small text-text-secondary', className)}
      {...props}
    />
  )
);

/**
 * Conteúdo do Card
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    />
  )
);

/**
 * Rodapé do Card
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(cardFooterVariants({ padding }), className)}
      {...props}
    />
  )
);

// Display names
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

// Exportar tipos para uso externo
// Tipos já exportados acima
export {
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
};