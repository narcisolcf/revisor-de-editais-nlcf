/**
 * Componente Card baseado no Design System do Governo Federal (DSGov)
 * Referência: https://www.gov.br/ds/components/card
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../styles/utils';

const cardVariants = cva(
  // Classes base
  [
    'bg-white rounded-lg border border-border-primary',
    'transition-all duration-200 ease-in-out'
  ],
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        outlined: 'border-2 shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent'
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      },
      hover: {
        none: '',
        lift: 'hover:shadow-lg hover:-translate-y-1',
        glow: 'hover:shadow-xl hover:shadow-primary-500/10',
        scale: 'hover:scale-[1.02]'
      },
      interactive: {
        true: 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
      interactive: false
    }
  }
);

const cardHeaderVariants = cva(
  'flex items-center justify-between',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-4 pb-2',
        md: 'p-6 pb-4',
        lg: 'p-8 pb-6'
      },
      border: {
        true: 'border-b border-border-primary',
        false: ''
      }
    },
    defaultVariants: {
      padding: 'md',
      border: false
    }
  }
);

const cardContentVariants = cva(
  '',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      }
    },
    defaultVariants: {
      padding: 'md'
    }
  }
);

const cardFooterVariants = cva(
  'flex items-center',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-4 pt-2',
        md: 'p-6 pt-4',
        lg: 'p-8 pt-6'
      },
      border: {
        true: 'border-t border-border-primary',
        false: ''
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between'
      }
    },
    defaultVariants: {
      padding: 'md',
      border: false,
      justify: 'start'
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Conteúdo do card
   */
  children: React.ReactNode;
  /**
   * Se o card é clicável
   */
  asChild?: boolean;
}

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {
  children: React.ReactNode;
}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {
  children: React.ReactNode;
}

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      hover,
      interactive,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? 'div' : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, hover, interactive }),
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding, border, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardHeaderVariants({ padding, border }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardContentVariants({ padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding, border, justify, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardFooterVariants({ padding, border, justify }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export {
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants
};