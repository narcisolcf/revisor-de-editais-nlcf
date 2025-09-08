import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Pause,
  Play,
  X,
  Loader2,
} from 'lucide-react';

/**
 * Variantes do componente StatusIndicator DSGov
 */
const statusIndicatorVariants = cva(
  [
    'inline-flex items-center gap-02',
    'rounded-sm',
    'transition-dsgov',
  ],
  {
    variants: {
      variant: {
        success: 'text-success',
        error: 'text-error',
        warning: 'text-warning',
        info: 'text-info',
        pending: 'text-text-secondary',
        processing: 'text-primary',
        paused: 'text-text-secondary',
        cancelled: 'text-text-secondary',
        neutral: 'text-text-secondary',
      },
      size: {
        sm: 'text-01',
        md: 'text-02',
        lg: 'text-03',
      },
      styleVariant: {
        minimal: '',
        subtle: 'px-02 py-01 bg-gray-05 rounded-sm',
        filled: 'px-03 py-02 text-white rounded-sm',
        outlined: 'px-03 py-02 border rounded-sm',
      },
    },
    compoundVariants: [
      // Filled styles
      {
        variant: 'success',
        styleVariant: 'filled',
        class: 'bg-green-60 text-white',
      },
      {
        variant: 'error',
        styleVariant: 'filled',
        class: 'bg-red-60 text-white',
      },
      {
        variant: 'warning',
        styleVariant: 'filled',
        class: 'bg-yellow-60 text-white',
      },
      {
        variant: 'info',
        styleVariant: 'filled',
        class: 'bg-blue-60 text-white',
      },
      {
        variant: 'pending',
        styleVariant: 'filled',
        class: 'bg-gray-60 text-white',
      },
      {
        variant: 'processing',
        styleVariant: 'filled',
        class: 'bg-blue-60 text-white',
      },
      {
        variant: 'paused',
        styleVariant: 'filled',
        class: 'bg-yellow-60 text-white',
      },
      {
        variant: 'cancelled',
        styleVariant: 'filled',
        class: 'bg-red-60 text-white',
      },
      {
        variant: 'neutral',
        styleVariant: 'filled',
        class: 'bg-gray-60 text-white',
      },
      // Outlined styles
      {
        variant: 'success',
        styleVariant: 'outlined',
        class: 'border-success bg-success-light/50 text-success',
      },
      {
        variant: 'error',
        styleVariant: 'outlined',
        class: 'border-error bg-error-light/50 text-error',
      },
      {
        variant: 'warning',
        styleVariant: 'outlined',
        class: 'border-warning bg-warning-light/50 text-warning',
      },
      {
        variant: 'info',
        styleVariant: 'outlined',
        class: 'border-info bg-info-light/50 text-info',
      },
      {
        variant: 'pending',
        styleVariant: 'outlined',
        class: 'border-gray-20 bg-gray-5/50 text-text-secondary',
      },
      {
        variant: 'processing',
        styleVariant: 'outlined',
        class: 'border-primary bg-primary-light/50 text-primary',
      },
      {
        variant: 'paused',
        styleVariant: 'outlined',
        class: 'border-gray-20 bg-gray-5/50 text-text-secondary',
      },
      {
        variant: 'cancelled',
        styleVariant: 'outlined',
        class: 'border-gray-20 bg-gray-5/50 text-text-secondary',
      },
      {
        variant: 'neutral',
        styleVariant: 'outlined',
        class: 'border-gray-20 bg-gray-5/50 text-text-secondary',
      },
      // Subtle styles
      {
        variant: 'success',
        styleVariant: 'subtle',
        class: 'bg-green-05 text-green-80',
      },
      {
        variant: 'error',
        styleVariant: 'subtle',
        class: 'bg-red-05 text-red-80',
      },
      {
        variant: 'warning',
        styleVariant: 'subtle',
        class: 'bg-warning-light/30',
      },
      {
        variant: 'info',
        styleVariant: 'subtle',
        class: 'bg-info-light/30',
      },
      {
        variant: 'pending',
        styleVariant: 'subtle',
        class: 'bg-gray-5/50',
      },
      {
        variant: 'processing',
        styleVariant: 'subtle',
        class: 'bg-primary-light/30',
      },
      {
        variant: 'paused',
        styleVariant: 'subtle',
        class: 'bg-gray-5/50',
      },
      {
        variant: 'cancelled',
        styleVariant: 'subtle',
        class: 'bg-gray-5/50',
      },
      {
        variant: 'neutral',
        styleVariant: 'subtle',
        class: 'bg-gray-5/50',
      },
    ],
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      styleVariant: 'minimal',
    },
  }
);

const statusIconVariants = cva(
  'flex-shrink-0',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      animated: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        animated: true,
        class: 'animate-spin',
      },
    ],
    defaultVariants: {
      size: 'md',
      animated: false,
    },
  }
);

const statusDotVariants = cva(
  'rounded-full flex-shrink-0',
  {
    variants: {
      variant: {
        success: 'bg-success',
        error: 'bg-error',
        warning: 'bg-warning',
        info: 'bg-info',
        pending: 'bg-gray-30',
        processing: 'bg-primary',
        paused: 'bg-gray-30',
        cancelled: 'bg-gray-30',
        neutral: 'bg-gray-30',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-3 w-3',
        lg: 'h-4 w-4',
      },
      pulse: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      pulse: false,
    },
  }
);

export interface StatusIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'>,
    VariantProps<typeof statusIndicatorVariants> {
  /** Texto do status */
  label?: string;
  /** Ícone personalizado */
  icon?: React.ReactNode;
  /** Se deve mostrar ícone padrão */
  showIcon?: boolean;
  /** Se deve mostrar apenas o dot */
  dotOnly?: boolean;
  /** Se deve animar o ícone (para loading) */
  animated?: boolean;
  /** Se deve pulsar o dot */
  pulse?: boolean;
  /** Tooltip/descrição adicional */
  description?: string;
  /** Estilo CSS personalizado */
  style?: React.CSSProperties;
}

/**
 * Função para obter ícone padrão baseado na variante
 */
function getDefaultIcon(variant: string, animated = false) {
  if (animated && variant === 'processing') {
    return <Loader2 />;
  }

  switch (variant) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <AlertCircle />;
    case 'warning':
      return <AlertTriangle />;
    case 'info':
      return <Info />;
    case 'pending':
      return <Clock />;
    case 'processing':
      return <Loader2 />;
    case 'paused':
      return <Pause />;
    case 'cancelled':
      return <X />;
    default:
      return null;
  }
}

/**
 * Componente StatusIndicator DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Estados visuais claros e consistentes
 * - Suporte a diferentes estilos (minimal, subtle, filled, outlined)
 * - Animações para estados dinâmicos
 * - Flexibilidade para diferentes contextos
 * 
 * @example
 * ```tsx
 * <StatusIndicator
 *   variant="success"
 *   label="Aprovado"
 *   style="filled"
 * />
 * 
 * <StatusIndicator
 *   variant="processing"
 *   label="Processando..."
 *   animated
 * />
 * 
 * <StatusIndicator
 *   variant="error"
 *   dotOnly
 *   pulse
 * />
 * ```
 */
export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  (
    {
      className,
      variant = 'neutral',
      size = 'md',
      styleVariant = 'minimal',
      label,
      icon,
      showIcon = true,
      dotOnly = false,
      animated = false,
      pulse = false,
      description,
      style,
      ...props
    },
    ref
  ) => {
    const displayIcon = icon || (showIcon ? getDefaultIcon(variant, animated) : null);
    const shouldAnimate = animated || (variant === 'processing' && !icon);

    if (dotOnly) {
      return (
        <span
          ref={ref}
          className={cn(
            statusDotVariants({
              variant,
              size,
              pulse: pulse || (variant === 'processing'),
            }),
            className
          )}
          title={description || label}
          aria-label={label}
          {...props}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          statusIndicatorVariants({ variant, size, styleVariant }),
          className
        )}
        style={style}
        role="status"
        aria-label={description || label}
        title={description}
        {...props}
      >
        {displayIcon && (
          <span
            className={statusIconVariants({
              size,
              animated: shouldAnimate,
            })}
            aria-hidden="true"
          >
            {displayIcon}
          </span>
        )}
        {label && (
          <span className="truncate">{label}</span>
        )}
      </span>
    );
  }
);

// Display name
StatusIndicator.displayName = 'StatusIndicator';

// Tipos já exportados acima
export {
  statusIndicatorVariants,
  statusIconVariants,
  statusDotVariants,
};