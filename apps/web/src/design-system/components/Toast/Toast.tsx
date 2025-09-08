import React, { forwardRef, useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Variantes do componente Toast DSGov
 */
const toastVariants = cva(
  [
    'relative flex items-start gap-03 p-04',
    'rounded-sm border',
    'shadow-elevation-03',
    'transition-all duration-300 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border-gray-20',
          'text-text-primary',
          'focus-visible:ring-primary',
        ],
        success: [
          'bg-success-light border-success',
          'text-success-dark',
          'focus-visible:ring-success',
        ],
        error: [
          'bg-error-light border-error',
          'text-error-dark',
          'focus-visible:ring-error',
        ],
        warning: [
          'bg-warning-light border-warning',
          'text-warning-dark',
          'focus-visible:ring-warning',
        ],
        info: [
          'bg-info-light border-info',
          'text-info-dark',
          'focus-visible:ring-info',
        ],
      },
      size: {
        sm: 'p-03 text-01',
        md: 'p-04 text-02',
        lg: 'p-05 text-03',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const toastIconVariants = cva(
  'flex-shrink-0 mt-01',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const toastCloseButtonVariants = cva(
  [
    'flex-shrink-0 p-01 ml-auto',
    'rounded-sm',
    'transition-dsgov',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'hover:bg-black/10',
  ],
  {
    variants: {
      variant: {
        default: 'text-text-secondary hover:text-text-primary focus-visible:ring-primary',
        success: 'text-success hover:text-success-dark focus-visible:ring-success',
        error: 'text-error hover:text-error-dark focus-visible:ring-error',
        warning: 'text-warning hover:text-warning-dark focus-visible:ring-warning',
        info: 'text-info hover:text-info-dark focus-visible:ring-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const toastProgressVariants = cva(
  [
    'absolute bottom-0 left-0 h-1',
    'bg-current opacity-30',
    'transition-all duration-100 ease-linear',
  ]
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /** Título do toast */
  title?: string;
  /** Descrição/conteúdo do toast */
  description?: string;
  /** Ícone personalizado */
  icon?: React.ReactNode;
  /** Se deve mostrar ícone padrão baseado na variante */
  showIcon?: boolean;
  /** Se deve mostrar botão de fechar */
  closable?: boolean;
  /** Função chamada ao fechar */
  onClose?: () => void;
  /** Duração em ms (0 = não fecha automaticamente) */
  duration?: number;
  /** Se deve mostrar barra de progresso */
  showProgress?: boolean;
  /** Ações personalizadas */
  actions?: React.ReactNode;
  /** Se o toast está visível */
  open?: boolean;
  /** Função chamada quando a visibilidade muda */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Hook para auto-close do toast
 */
function useToastAutoClose(
  duration: number,
  open: boolean,
  onClose?: () => void
) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!open || duration <= 0 || isPaused) {
      return;
    }

    const startTime = Date.now();
    const interval = 50; // Atualizar a cada 50ms

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;

      setProgress(progressPercent);

      if (remaining <= 0) {
        onClose?.();
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, open, isPaused, onClose]);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return { progress, pause, resume };
}

/**
 * Função para obter ícone padrão baseado na variante
 */
function getDefaultIcon(variant: string, size: 'sm' | 'md' | 'lg' = 'md') {
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const iconProps = { size: iconSize };

  switch (variant) {
    case 'success':
      return <CheckCircle {...iconProps} />;
    case 'error':
      return <AlertCircle {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    default:
      return null;
  }
}

/**
 * Componente Toast DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Feedback visual claro e consistente
 * - Auto-close configurável com pausa
 * - Suporte a ações personalizadas
 * - Estados semânticos (sucesso, erro, aviso, info)
 * 
 * @example
 * ```tsx
 * <Toast
 *   variant="success"
 *   title="Sucesso!"
 *   description="Edital salvo com sucesso."
 *   duration={5000}
 *   showProgress
 *   onClose={() => setToastOpen(false)}
 * />
 * ```
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      title,
      description,
      icon,
      showIcon = true,
      closable = true,
      onClose,
      duration = 5000,
      showProgress = false,
      actions,
      open = true,
      onOpenChange,
      ...props
    },
    ref
  ) => {
    const { progress, pause, resume } = useToastAutoClose(
      duration,
      open,
      () => {
        onClose?.();
        onOpenChange?.(false);
      }
    );

    const handleClose = () => {
      onClose?.();
      onOpenChange?.(false);
    };

    const displayIcon = icon || (showIcon ? getDefaultIcon(variant, size) : null);

    if (!open) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant, size }), className)}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        tabIndex={-1}
        {...props}
      >
        {/* Ícone */}
        {displayIcon && (
          <div className={toastIconVariants({ size })} aria-hidden="true">
            {displayIcon}
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-current mb-01">
              {title}
            </div>
          )}
          {description && (
            <div className="text-current opacity-90">
              {description}
            </div>
          )}
          {actions && (
            <div className="mt-03 flex gap-02">
              {actions}
            </div>
          )}
        </div>

        {/* Botão de fechar */}
        {closable && (
          <button
            className={toastCloseButtonVariants({ variant })}
            onClick={handleClose}
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Barra de progresso */}
        {showProgress && duration > 0 && (
          <div
            className={toastProgressVariants()}
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

// Display name
Toast.displayName = 'Toast';

// Exportar tipos para uso externo
// Tipos já exportados acima
export {
  toastVariants,
  toastIconVariants,
  toastCloseButtonVariants,
  toastProgressVariants,
};