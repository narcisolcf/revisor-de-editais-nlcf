/**
 * Componente Input baseado no Design System do Governo Federal (DSGov)
 * Referência: https://www.gov.br/ds/components/input
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../styles/utils';

const inputVariants = cva(
  // Classes base
  [
    'flex w-full rounded-lg border bg-white px-3 py-2.5',
    'text-sm text-text-primary placeholder:text-text-tertiary',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border-primary',
          'focus:border-primary-500 focus:ring-primary-500/20'
        ],
        error: [
          'border-error-500 bg-error-50/50',
          'focus:border-error-500 focus:ring-error-500/20'
        ],
        success: [
          'border-success-500 bg-success-50/50',
          'focus:border-success-500 focus:ring-success-500/20'
        ],
        warning: [
          'border-warning-500 bg-warning-50/50',
          'focus:border-warning-500 focus:ring-warning-500/20'
        ]
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const labelVariants = cva(
  'block text-sm font-medium leading-6 mb-1.5',
  {
    variants: {
      variant: {
        default: 'text-text-primary',
        error: 'text-error-600',
        success: 'text-success-600',
        warning: 'text-warning-600'
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-error-500",
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      required: false
    }
  }
);

const helperTextVariants = cva(
  'mt-1.5 text-xs leading-5',
  {
    variants: {
      variant: {
        default: 'text-text-secondary',
        error: 'text-error-600',
        success: 'text-success-600',
        warning: 'text-warning-600'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Label do campo
   */
  label?: string;
  /**
   * Texto de ajuda
   */
  helperText?: string;
  /**
   * Mensagem de erro
   */
  errorMessage?: string;
  /**
   * Ícone à esquerda
   */
  leftIcon?: React.ReactNode;
  /**
   * Ícone à direita
   */
  rightIcon?: React.ReactNode;
  /**
   * Elemento adicional à direita (ex: botão)
   */
  rightElement?: React.ReactNode;
  /**
   * Se o campo é obrigatório
   */
  required?: boolean;
  /**
   * Container wrapper props
   */
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      rightElement,
      required = false,
      containerProps,
      id,
      ...props
    },
    ref
  ) => {
    // Se há erro, usar variant error
    const inputVariant = errorMessage ? 'error' : variant;
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasIcons = leftIcon || rightIcon || rightElement;

    return (
      <div {...containerProps} className={cn('w-full', containerProps?.className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={labelVariants({ variant: inputVariant, required })}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Ícone esquerdo */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon && !rightElement,
                'pr-12': rightElement
              },
              className
            )}
            {...props}
          />

          {/* Ícone direito */}
          {rightIcon && !rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}

          {/* Elemento direito */}
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {/* Helper Text ou Error Message */}
        {(helperText || errorMessage) && (
          <p className={helperTextVariants({ variant: inputVariant })}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { inputVariants, labelVariants, helperTextVariants };