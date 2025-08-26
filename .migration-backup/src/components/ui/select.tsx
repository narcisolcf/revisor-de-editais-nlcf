import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // DSGov dropdown styles - altura 48px conforme padrão governamental
      "flex h-12 w-full items-center justify-between",
      // Bordas e raios conforme DSGov
      "rounded-[var(--select-radius)] border border-[hsl(var(--select-border))]",
      // Cores de fundo e texto seguindo padrão governamental
      "bg-[hsl(var(--select-background))] text-[hsl(var(--select-foreground))]",
      // Padding interno seguindo especificação DSGov
      "px-4 py-3 text-sm",
      // Estados de foco seguindo padrão governamental
      "focus:outline-none focus:border-[hsl(var(--select-border-focus))] focus:ring-2 focus:ring-[hsl(var(--select-border-focus))] focus:ring-offset-0",
      // Estado hover seguindo DSGov
      "hover:bg-[hsl(var(--select-background-hover))]",
      // Estado disabled seguindo padrão governamental
      "disabled:cursor-not-allowed disabled:bg-[hsl(var(--select-background-disabled))] disabled:text-[hsl(var(--select-foreground-disabled))]",
      // Transições suaves
      "transition-colors duration-200",
      // Placeholder styling
      "placeholder:text-[hsl(var(--muted-foreground))]",
      // Text overflow
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ui-open:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // DSGov dropdown content styles com elevação Camada 2
        "relative z-[9999] max-h-96 min-w-[8rem] overflow-hidden",
        // Bordas e raios conforme DSGov
        "rounded-[var(--select-radius)] border border-[hsl(var(--select-border))]",
        // Cores de fundo seguindo padrão governamental
        "bg-[hsl(var(--select-background))] text-[hsl(var(--select-foreground))]",
        // Sombra conforme especificação DSGov - Camada 2
        "shadow-[var(--select-shadow)]",
        // Animações suaves de entrada e saída
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Posicionamento conforme DSGov
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          // Padding interno conforme DSGov
          "p-2",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // DSGov item styles - altura mínima 44px para acessibilidade
      "relative flex w-full cursor-default select-none items-center min-h-11",
      // Bordas e raios conforme DSGov
      "rounded-[var(--select-radius)]",
      // Padding interno seguindo especificação DSGov
      "py-3 pl-12 pr-4 text-sm",
      // Estados hover e focus seguindo padrão governamental
      "hover:bg-[hsl(var(--select-item-hover))] focus:bg-[hsl(var(--select-item-focus))]",
      // Transições suaves
      "transition-colors duration-200",
      // Estado selected
      "data-[state=checked]:bg-[hsl(var(--select-item-focus))]",
      // Estado disabled seguindo padrão governamental
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      // Remove outline default
      "outline-none",
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[hsl(var(--select-border-focus))]" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
