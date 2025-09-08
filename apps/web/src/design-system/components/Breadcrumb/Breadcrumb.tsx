import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Variantes do componente Breadcrumb DSGov
 */
const breadcrumbVariants = cva(
  [
    'flex items-center space-x-01',
    'text-body-small',
  ],
  {
    variants: {
      size: {
        sm: 'text-01',
        md: 'text-02',
        lg: 'text-03',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const breadcrumbItemVariants = cva(
  [
    'flex items-center gap-01',
    'transition-dsgov',
  ],
  {
    variants: {
      active: {
        true: 'text-text-primary font-medium',
        false: 'text-text-secondary hover:text-text-primary',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          'rounded-sm px-01 py-05',
          'hover:bg-gray-5',
        ],
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      active: false,
      interactive: false,
    },
  }
);

const breadcrumbSeparatorVariants = cva(
  [
    'flex items-center justify-center',
    'text-text-secondary',
    'mx-01',
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

export interface BreadcrumbItem {
  /** Identificador único do item */
  id: string;
  /** Texto a ser exibido */
  label: string;
  /** URL ou caminho de navegação */
  href?: string;
  /** Se o item está ativo (página atual) */
  active?: boolean;
  /** Ícone personalizado */
  icon?: React.ReactNode;
  /** Função de clique personalizada */
  onClick?: () => void;
  /** Props adicionais para acessibilidade */
  'aria-label'?: string;
}

export interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  /** Lista de itens do breadcrumb */
  items: BreadcrumbItem[];
  /** Separador personalizado entre itens */
  separator?: React.ReactNode;
  /** Se deve mostrar ícone de home no primeiro item */
  showHomeIcon?: boolean;
  /** Ícone personalizado para home */
  homeIcon?: React.ReactNode;
  /** Máximo de itens visíveis (com reticências) */
  maxItems?: number;
  /** Texto para reticências */
  ellipsisText?: string;
  /** Função de clique em item */
  onItemClick?: (item: BreadcrumbItem) => void;
}

export interface BreadcrumbItemProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbItemVariants> {
  /** Item do breadcrumb */
  item: BreadcrumbItem;
  /** Se é o último item */
  isLast?: boolean;
  /** Função de clique */
  onItemClick?: (item: BreadcrumbItem) => void;
  /** Elemento HTML para renderizar */
  as?: React.ElementType;
}

export interface BreadcrumbSeparatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof breadcrumbSeparatorVariants> {
  /** Ícone do separador */
  icon?: React.ReactNode;
}

/**
 * Componente BreadcrumbItem
 */
export const BreadcrumbItem = forwardRef<HTMLElement, BreadcrumbItemProps>(
  (
    {
      className,
      item,
      isLast = false,
      onItemClick,
      as,
      ...props
    },
    ref
  ) => {
    const isInteractive = !item.active && (!!item.href || !!item.onClick || !!onItemClick);
    const Component = as || (item.href ? 'a' : 'span');

    const handleClick = (e: React.MouseEvent) => {
      if (item.active) {
        e.preventDefault();
        return;
      }

      if (item.onClick) {
        e.preventDefault();
        item.onClick();
      } else if (onItemClick) {
        e.preventDefault();
        onItemClick(item);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (item.onClick) {
          item.onClick();
        } else if (onItemClick) {
          onItemClick(item);
        }
      }
    };

    return (
      <Component
        ref={ref}
        href={item.href}
        className={cn(
          breadcrumbItemVariants({
            active: item.active,
            interactive: isInteractive,
          }),
          className
        )}
        onClick={handleClick}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-current={item.active ? 'page' : undefined}
        aria-label={item['aria-label']}
        {...props}
      >
        {item.icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className={cn(
          'truncate',
          isLast && 'max-w-xs'
        )}>
          {item.label}
        </span>
      </Component>
    );
  }
);

/**
 * Componente BreadcrumbSeparator
 */
export const BreadcrumbSeparator = forwardRef<HTMLSpanElement, BreadcrumbSeparatorProps>(
  ({ className, size, icon, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(breadcrumbSeparatorVariants({ size }), className)}
      aria-hidden="true"
      {...props}
    >
      {icon || <ChevronRight />}
    </span>
  )
);

/**
 * Componente Breadcrumb DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Navegação hierárquica clara
 * - Suporte a truncamento com reticências
 * - Estados visuais para item ativo
 * - Navegação por teclado
 * 
 * @example
 * ```tsx
 * const items = [
 *   { id: '1', label: 'Home', href: '/' },
 *   { id: '2', label: 'Editais', href: '/editais' },
 *   { id: '3', label: 'Análise', active: true },
 * ];
 * 
 * <Breadcrumb
 *   items={items}
 *   showHomeIcon
 *   onItemClick={(item) => navigate(item.href)}
 * />
 * ```
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      className,
      size,
      items,
      separator,
      showHomeIcon = false,
      homeIcon,
      maxItems,
      ellipsisText = '...',
      onItemClick,
      'aria-label': ariaLabel = 'Navegação estrutural',
      ...props
    },
    ref
  ) => {
    // Processar itens com truncamento se necessário
    const processedItems = React.useMemo(() => {
      if (!maxItems || items.length <= maxItems) {
        return items;
      }

      const firstItem = items[0];
      const lastItems = items.slice(-(maxItems - 2));
      const ellipsisItem: BreadcrumbItem = {
        id: 'ellipsis',
        label: ellipsisText,
        active: false,
      };

      return [firstItem, ellipsisItem, ...lastItems];
    }, [items, maxItems, ellipsisText]);

    // Adicionar ícone de home ao primeiro item se solicitado
    const itemsWithHomeIcon = React.useMemo(() => {
      if (!showHomeIcon || processedItems.length === 0) {
        return processedItems;
      }

      const [firstItem, ...restItems] = processedItems;
      const firstItemWithIcon = {
        ...firstItem,
        icon: firstItem.icon || homeIcon || <Home className="h-4 w-4" />,
      };

      return [firstItemWithIcon, ...restItems];
    }, [processedItems, showHomeIcon, homeIcon]);

    return (
      <nav
        ref={ref}
        className={cn(breadcrumbVariants({ size }), className)}
        aria-label={ariaLabel}
        {...props}
      >
        <ol className="flex items-center space-x-01" role="list">
          {itemsWithHomeIcon.map((item, index) => {
            const isLast = index === itemsWithHomeIcon.length - 1;
            const isEllipsis = item.id === 'ellipsis';

            return (
              <li key={item.id} className="flex items-center">
                {/* Item do breadcrumb */}
                <BreadcrumbItem
                  item={item}
                  isLast={isLast}
                  onItemClick={!isEllipsis ? onItemClick : undefined}
                  interactive={!isEllipsis && !item.active}
                />

                {/* Separador */}
                {!isLast && (
                  <BreadcrumbSeparator
                    size={size}
                    icon={separator}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

// Display names
Breadcrumb.displayName = 'Breadcrumb';
BreadcrumbItem.displayName = 'BreadcrumbItem';
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

// Exportar tipos para uso externo
// Tipos já exportados acima
export {
  breadcrumbVariants,
  breadcrumbItemVariants,
  breadcrumbSeparatorVariants,
};