/**
 * Componente Button baseado no Design System do Governo Federal (DSGov)
 * Referência: https://www.gov.br/ds/components/button
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../styles/utils';

const buttonVariants = cva(
  // Classes base
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm leading-5',
    'border border-transparent',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none'
  ],
  {
    variants: {
      variant: {
        // Botão primário - ação principal
        primary: [
          'bg-primary-500 text-white border-primary-500',
          'hover:bg-primary-600 hover:border-primary-600',
          'focus:ring-primary-500',
          'active:bg-primary-700'
        ],
        // Botão secundário - ação secundária
        secondary: [
          'bg-white text-primary-500 border-primary-500',
          'hover:bg-primary-50 hover:text-primary-600',
          'focus:ring-primary-500',
          'active:bg-primary-100'
        ],
        // Botão fantasma - ação terciária
        ghost: [
          'bg-transparent text-primary-500 border-transparent',
          'hover:bg-primary-50 hover:text-primary-600',
          'focus:ring-primary-500',
          'active:bg-primary-100'
        ],
        // Botão de perigo
        danger: [
          'bg-error-500 text-white border-error-500',
          'hover:bg-error-600 hover:border-error-600',
          'focus:ring-error-500',
          'active:bg-error-700'
        ],
        // Botão de perigo secundário
        'danger-secondary': [
          'bg-white text-error-500 border-error-500',
          'hover:bg-error-50 hover:text-error-600',
          'focus:ring-error-500',
          'active:bg-error-100'
        ],
        // Botão de sucesso
        success: [
          'bg-success-500 text-white border-success-500',
          'hover:bg-success-600 hover:border-success-600',
          'focus:ring-success-500',
          'active:bg-success-700'
        ]
      },
      size: {
        xs: 'px-2.5 py-1.5 text-xs rounded-md',
        sm: 'px-3 py-2 text-sm rounded-md',
        md: 'px-4 py-2.5 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
        xl: 'px-8 py-4 text-lg rounded-xl'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      },
      loading: {
        true: 'cursor-wait',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Conteúdo do botão
   */
  children: React.ReactNode;
  /**
   * Ícone à esquerda do texto
   */
  leftIcon?: React.ReactNode;
  /**
   * Ícone à direita do texto
   */
  rightIcon?: React.ReactNode;
  /**
   * Estado de carregamento
   */
  loading?: boolean;
  /**
   * Texto alternativo para estado de carregamento
   */
  loadingText?: string;
  /**
   * Componente de spinner personalizado
   */
  spinner?: React.ReactNode;
}

/**
 * Componente Spinner simples para estado de loading
 */
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      spinner,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const showSpinner = loading && !spinner;
    const customSpinner = loading && spinner;
    const buttonText = loading && loadingText ? loadingText : children;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Ícone esquerdo ou spinner */}
        {showSpinner && <Spinner />}
        {customSpinner && customSpinner}
        {!loading && leftIcon && leftIcon}
        
        {/* Texto do botão */}
        {buttonText}
        
        {/* Ícone direito */}
        {!loading && rightIcon && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type { VariantProps } from 'class-variance-authority';
export { buttonVariants };