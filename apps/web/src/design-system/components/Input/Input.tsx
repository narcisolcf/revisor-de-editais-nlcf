import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Variantes do componente Input DSGov
 * Baseado nas diretrizes de design governamental
 */
const inputVariants = cva(
  [
    // Estilos base
    'flex w-full rounded-md border bg-background px-03 py-02',
    'text-body-small text-text-primary',
    'transition-dsgov',
    'focus-dsgov',
    'placeholder:text-text-placeholder',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'disabled:bg-gray-5',
    // Acessibilidade
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border-default',
          'focus-visible:border-primary focus-visible:ring-primary',
          'hover:border-gray-30',
        ],
        error: [
          'border-error',
          'focus-visible:border-error focus-visible:ring-error',
          'bg-red-warm-5',
        ],
        success: [
          'border-success',
          'focus-visible:border-success focus-visible:ring-success',
          'bg-green-cool-5',
        ],
        warning: [
          'border-warning',
          'focus-visible:border-warning focus-visible:ring-warning',
          'bg-yellow-5',
        ],
      },
      size: {
        sm: 'h-08 px-02 py-01 text-01',
        md: 'h-10 px-03 py-02 text-02',
        lg: 'h-12 px-04 py-03 text-03',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const labelVariants = cva(
  [
    'block text-body-small font-medium text-text-primary mb-01',
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
  ],
  {
    variants: {
      variant: {
        default: 'text-text-primary',
        error: 'text-error',
        success: 'text-success',
        warning: 'text-warning',
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-error",
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      required: false,
    },
  }
);

const helperTextVariants = cva(
  [
    'mt-01 text-01 flex items-start gap-01',
  ],
  {
    variants: {
      variant: {
        default: 'text-text-secondary',
        error: 'text-error',
        success: 'text-success',
        warning: 'text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label do input */
  label?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Texto de erro */
  errorText?: string;
  /** Texto de sucesso */
  successText?: string;
  /** Texto de aviso */
  warningText?: string;
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Contador de caracteres */
  showCharacterCount?: boolean;
  /** Máximo de caracteres */
  maxLength?: number;
  /** Container className */
  containerClassName?: string;
  /** Label className */
  labelClassName?: string;
  /** Helper text className */
  helperClassName?: string;
}

/**
 * Componente Input DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Estados visuais claros (default, error, success, warning)
 * - Validação em tempo real
 * - Suporte a ícones e contadores
 * - Labels e textos de ajuda associados
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="seu@email.com"
 *   helperText="Insira um email válido"
 *   required
 * />
 * 
 * <Input
 *   label="Senha"
 *   type="password"
 *   variant="error"
 *   errorText="Senha deve ter pelo menos 8 caracteres"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      variant,
      size,
      label,
      helperText,
      errorText,
      successText,
      warningText,
      leftIcon,
      rightIcon,
      required = false,
      showCharacterCount = false,
      maxLength,
      type = 'text',
      id,
      'aria-describedby': ariaDescribedBy,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [currentLength, setCurrentLength] = useState(
      typeof value === 'string' ? value.length : 0
    );

    // Gerar IDs únicos se não fornecidos
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${inputId}-helper`;
    const errorTextId = `${inputId}-error`;
    const successTextId = `${inputId}-success`;
    const warningTextId = `${inputId}-warning`;
    const characterCountId = `${inputId}-count`;

    // Determinar variante baseada nos textos de estado
    const currentVariant = errorText
      ? 'error'
      : successText
      ? 'success'
      : warningText
      ? 'warning'
      : variant;

    // Texto de estado atual
    const stateText = errorText || successText || warningText || helperText;
    
    // Ícone de estado
    const stateIcon = errorText
      ? <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      : successText
      ? <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      : warningText
      ? <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      : null;

    // Construir aria-describedby
    const describedByIds = [
      ariaDescribedBy,
      stateText && (errorText ? errorTextId : successText ? successTextId : warningText ? warningTextId : helperTextId),
      showCharacterCount && characterCountId,
    ].filter(Boolean).join(' ');

    // Tipo do input (para senha com toggle)
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Handler para mudança de valor
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentLength(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className={cn('space-y-01', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              labelVariants({ variant: currentVariant, required }),
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-03 top-1/2 -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            id={inputId}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || type === 'password') && 'pr-10',
              className
            )}
            aria-describedby={describedByIds || undefined}
            aria-invalid={!!errorText}
            aria-required={required}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            {...props}
          />

          {/* Right Icon / Password Toggle */}
          {(rightIcon || type === 'password') && (
            <div className="absolute right-03 top-1/2 -translate-y-1/2">
              {type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span className="text-text-secondary">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Helper/Error/Success/Warning Text */}
        {stateText && (
          <div
            id={errorText ? errorTextId : successText ? successTextId : warningText ? warningTextId : helperTextId}
            className={cn(
              helperTextVariants({ variant: currentVariant }),
              helperClassName
            )}
            role={errorText ? 'alert' : 'status'}
            aria-live={errorText ? 'assertive' : 'polite'}
          >
            {stateIcon}
            <span>{stateText}</span>
          </div>
        )}

        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <div
            id={characterCountId}
            className="text-01 text-text-secondary text-right"
            aria-live="polite"
          >
            <span className={cn(
              currentLength > maxLength * 0.9 && 'text-warning',
              currentLength >= maxLength && 'text-error'
            )}>
              {currentLength}
            </span>
            <span>/{maxLength}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Exportar tipos para uso externo
// Tipos já exportados acima
export { inputVariants, labelVariants, helperTextVariants };