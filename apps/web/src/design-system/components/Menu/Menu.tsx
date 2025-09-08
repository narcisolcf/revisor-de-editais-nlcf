import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

/**
 * Variantes do componente Menu DSGov
 */
const menuVariants = cva(
  [
    'relative inline-block text-left',
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

const menuTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-02',
    'rounded-sm',
    'border border-gray-20',
    'bg-white',
    'text-text-primary',
    'transition-dsgov',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
    'hover:bg-gray-5',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-20 bg-white hover:bg-gray-5',
        primary: 'border-primary bg-primary text-white hover:bg-primary-dark',
        secondary: 'border-secondary bg-secondary text-white hover:bg-secondary-dark',
        ghost: 'border-transparent bg-transparent hover:bg-gray-5',
        outline: 'border-primary bg-transparent text-primary hover:bg-primary-light',
      },
      size: {
        sm: 'px-02 py-01 text-01',
        md: 'px-03 py-02 text-02',
        lg: 'px-04 py-03 text-03',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const menuContentVariants = cva(
  [
    'absolute z-50',
    'min-w-48',
    'rounded-sm',
    'border border-gray-20',
    'bg-white',
    'shadow-elevation-03',
    'py-01',
    'focus:outline-none',
  ],
  {
    variants: {
      position: {
        'bottom-start': 'top-full left-0 mt-01',
        'bottom-end': 'top-full right-0 mt-01',
        'top-start': 'bottom-full left-0 mb-01',
        'top-end': 'bottom-full right-0 mb-01',
        'right-start': 'left-full top-0 ml-01',
        'left-start': 'right-full top-0 mr-01',
      },
    },
    defaultVariants: {
      position: 'bottom-start',
    },
  }
);

const menuItemVariants = cva(
  [
    'relative flex items-center gap-02',
    'w-full px-03 py-02',
    'text-left text-02',
    'text-text-primary',
    'transition-dsgov',
    'cursor-pointer',
    'focus:outline-none focus-visible:bg-primary-light focus-visible:text-primary',
    'hover:bg-gray-5',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-gray-5',
        destructive: 'text-error hover:bg-error-light hover:text-error',
        success: 'text-success hover:bg-success-light hover:text-success',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
        false: '',
      },
      selected: {
        true: 'bg-primary-light text-primary',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      disabled: false,
      selected: false,
    },
  }
);

const menuSeparatorVariants = cva(
  'h-px bg-gray-20 my-01 mx-01'
);

const menuLabelVariants = cva(
  'px-03 py-02 text-01 font-medium text-text-secondary'
);

export interface MenuItem {
  /** Identificador único do item */
  id: string;
  /** Texto a ser exibido */
  label: string;
  /** Ícone do item */
  icon?: React.ReactNode;
  /** Se o item está desabilitado */
  disabled?: boolean;
  /** Se o item está selecionado */
  selected?: boolean;
  /** Variante visual do item */
  variant?: 'default' | 'destructive' | 'success';
  /** Função de clique */
  onClick?: () => void;
  /** Submenu (para menus aninhados) */
  submenu?: MenuItem[];
  /** Separador após o item */
  separator?: boolean;
  /** Props adicionais para acessibilidade */
  'aria-label'?: string;
}

export interface MenuProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof menuVariants> {
  /** Elemento que dispara o menu */
  trigger: React.ReactNode;
  /** Lista de itens do menu */
  items: MenuItem[];
  /** Posição do menu em relação ao trigger */
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'left-start';
  /** Se o menu está aberto (controlado) */
  open?: boolean;
  /** Função chamada quando o estado de abertura muda */
  onOpenChange?: (open: boolean) => void;
  /** Se deve fechar ao clicar em um item */
  closeOnItemClick?: boolean;
  /** Função chamada quando um item é clicado */
  onItemClick?: (item: MenuItem) => void;
  /** Largura mínima do menu */
  minWidth?: string;
}

export interface MenuItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof menuItemVariants> {
  /** Item do menu */
  item: MenuItem;
  /** Função de clique */
  onItemClick?: (item: MenuItem) => void;
  /** Se deve fechar o menu ao clicar */
  closeOnClick?: boolean;
  /** Função para fechar o menu */
  onClose?: () => void;
  /** Nível de aninhamento (para submenu) */
  level?: number;
}

export interface MenuSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface MenuLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Hook para gerenciar estado do menu
 */
function useMenuState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setActiveSubmenu(null);
  };
  const toggle = () => setIsOpen(!isOpen);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fechar menu ao pressionar Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return {
    isOpen,
    activeSubmenu,
    setActiveSubmenu,
    open,
    close,
    toggle,
    menuRef,
    triggerRef,
  };
}

/**
 * Componente MenuSeparator
 */
export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(menuSeparatorVariants(), className)}
      role="separator"
      {...props}
    />
  )
);

/**
 * Componente MenuLabel
 */
export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(menuLabelVariants(), className)}
      {...props}
    >
      {children}
    </div>
  )
);

/**
 * Componente MenuItem
 */
export const MenuItemComponent = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      className,
      item,
      onItemClick,
      closeOnClick = true,
      onClose,
      level = 0,
      ...props
    },
    ref
  ) => {
    const [showSubmenu, setShowSubmenu] = useState(false);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const handleClick = () => {
      if (item.disabled) return;

      if (hasSubmenu) {
        setShowSubmenu(!showSubmenu);
      } else {
        item.onClick?.();
        onItemClick?.(item);
        if (closeOnClick) {
          onClose?.();
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (item.disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      } else if (e.key === 'ArrowRight' && hasSubmenu) {
        e.preventDefault();
        setShowSubmenu(true);
      } else if (e.key === 'ArrowLeft' && level > 0) {
        e.preventDefault();
        setShowSubmenu(false);
      }
    };

    return (
      <div className="relative">
        <div
          ref={ref}
          className={cn(
            menuItemVariants({
              variant: item.variant,
              disabled: item.disabled,
              selected: item.selected,
            }),
            className
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={item.disabled ? -1 : 0}
          role="menuitem"
          aria-disabled={item.disabled}
          aria-expanded={hasSubmenu ? showSubmenu : undefined}
          aria-haspopup={hasSubmenu ? 'menu' : undefined}
          aria-label={item['aria-label']}
          {...props}
        >
          {/* Ícone do item */}
          {item.icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
          )}

          {/* Label do item */}
          <span className="flex-1 truncate">{item.label}</span>

          {/* Indicador de seleção */}
          {item.selected && (
            <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          )}

          {/* Indicador de submenu */}
          {hasSubmenu && (
            <ChevronRight
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-transform',
                showSubmenu && 'rotate-90'
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Submenu */}
        {hasSubmenu && showSubmenu && (
          <div
            className={cn(
              menuContentVariants({ position: 'right-start' }),
              'left-full top-0 ml-01'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {item.submenu!.map((subItem, index) => (
              <React.Fragment key={subItem.id}>
                <MenuItemComponent
                  item={subItem}
                  onItemClick={onItemClick}
                  closeOnClick={closeOnClick}
                  onClose={onClose}
                  level={level + 1}
                />
                {subItem.separator && index < item.submenu!.length - 1 && (
                  <MenuSeparator />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
);

/**
 * Componente Menu DSGov
 * 
 * Implementa as diretrizes de design governamental com foco em:
 * - Acessibilidade WCAG 2.1 AA
 * - Navegação por teclado completa
 * - Suporte a submenus aninhados
 * - Estados visuais claros
 * - Posicionamento inteligente
 * 
 * @example
 * ```tsx
 * const menuItems = [
 *   {
 *     id: '1',
 *     label: 'Editar',
 *     icon: <Edit className="h-4 w-4" />,
 *     onClick: () => console.log('Editar'),
 *   },
 *   {
 *     id: '2',
 *     label: 'Excluir',
 *     icon: <Trash className="h-4 w-4" />,
 *     variant: 'destructive',
 *     onClick: () => console.log('Excluir'),
 *   },
 * ];
 * 
 * <Menu
 *   trigger={<Button>Ações</Button>}
 *   items={menuItems}
 *   position="bottom-start"
 * />
 * ```
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  (
    {
      className,
      size,
      trigger,
      items,
      position = 'bottom-start',
      open: controlledOpen,
      onOpenChange,
      closeOnItemClick = true,
      onItemClick,
      minWidth,
      ...props
    },
    ref
  ) => {
    const {
      isOpen,
      open,
      close,
      toggle,
      menuRef,
      triggerRef,
    } = useMenuState();

    // Usar estado controlado se fornecido
    const menuOpen = controlledOpen !== undefined ? controlledOpen : isOpen;

    const handleOpenChange = (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        if (newOpen) {
          open();
        } else {
          close();
        }
      }
      onOpenChange?.(newOpen);
    };

    const handleTriggerClick = () => {
      handleOpenChange(!menuOpen);
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpenChange(!menuOpen);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleOpenChange(true);
        // Focar primeiro item do menu
        setTimeout(() => {
          const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
          firstItem?.focus();
        }, 0);
      }
    };

    const handleItemClick = (item: MenuItem) => {
      onItemClick?.(item);
      if (closeOnItemClick) {
        handleOpenChange(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(menuVariants({ size }), className)}
        {...props}
      >
        {/* Trigger */}
        {React.isValidElement(trigger) ? (
          React.cloneElement(trigger as React.ReactElement, {
            ref: triggerRef,
            onClick: handleTriggerClick,
            onKeyDown: handleTriggerKeyDown,
            'aria-expanded': menuOpen,
            'aria-haspopup': 'menu',
          })
        ) : (
          <button
            ref={triggerRef}
            className={menuTriggerVariants({ size })}
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {trigger}
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                menuOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Menu Content */}
        {menuOpen && (
          <div
            ref={menuRef}
            className={cn(
              menuContentVariants({ position }),
              minWidth && `min-w-[${minWidth}]`
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <MenuItemComponent
                  item={item}
                  onItemClick={handleItemClick}
                  closeOnClick={closeOnItemClick}
                  onClose={() => handleOpenChange(false)}
                />
                {item.separator && index < items.length - 1 && (
                  <MenuSeparator />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
);

// Display names
Menu.displayName = 'Menu';
MenuItemComponent.displayName = 'MenuItem';
MenuSeparator.displayName = 'MenuSeparator';
MenuLabel.displayName = 'MenuLabel';

// Exportar tipos para uso externo
// Tipos já exportados acima
export {
  menuVariants,
  menuTriggerVariants,
  menuContentVariants,
  menuItemVariants,
  menuSeparatorVariants,
  menuLabelVariants,
};