import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const govCollapseVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "bg-[var(--collapse-bg-default)] border border-[var(--collapse-border-default)]",
        card: "bg-[var(--collapse-bg-default)] border border-[var(--collapse-border-default)] rounded-[var(--collapse-border-radius)] shadow-sm",
        compact: "bg-transparent border-0"
      },
      size: {
        default: "",
        sm: "[&_[data-collapse-trigger]]:min-h-[40px] [&_[data-collapse-trigger]]:px-3 [&_[data-collapse-trigger]]:py-2",
        lg: "[&_[data-collapse-trigger]]:min-h-[56px] [&_[data-collapse-trigger]]:px-6 [&_[data-collapse-trigger]]:py-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const govCollapseTriggerVariants = cva(
  [
    "flex flex-1 items-center justify-between w-full",
    "min-h-[var(--collapse-trigger-height)] px-[var(--collapse-trigger-padding-x)] py-[var(--collapse-trigger-padding-y)]",
    "text-base font-medium text-left",
    "text-[var(--collapse-text-default)]",
    "transition-[var(--collapse-transition)]",
    "hover:bg-[var(--collapse-bg-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-government-500 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "[&[data-state=open]>svg]:rotate-180"
  ]
)

export interface GovCollapseProps 
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>,
    VariantProps<typeof govCollapseVariants> {}

export interface GovCollapseTriggerProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> {}

export interface GovCollapseContentProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent> {}

const GovCollapse = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  GovCollapseProps
>(({ className, variant, size, children, defaultOpen, ...props }, ref) => (
  <CollapsiblePrimitive.Root
    ref={ref}
    className={cn(govCollapseVariants({ variant, size }), className)}
    defaultOpen={defaultOpen}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.Root>
))
GovCollapse.displayName = "GovCollapse"

const GovCollapseTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  GovCollapseTriggerProps
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    data-collapse-trigger
    className={cn(govCollapseTriggerVariants(), className)}
    {...props}
  >
    {children}
    <ChevronDown 
      className="h-[var(--collapse-icon-size)] w-[var(--collapse-icon-size)] shrink-0 transition-transform duration-200" 
      aria-hidden="true"
    />
  </CollapsiblePrimitive.CollapsibleTrigger>
))
GovCollapseTrigger.displayName = "GovCollapseTrigger"

const GovCollapseContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  GovCollapseContentProps
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden transition-all duration-200 ease-in-out",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="px-[var(--collapse-trigger-padding-x)] pb-[var(--collapse-trigger-padding-y)]">
      {children}
    </div>
  </CollapsiblePrimitive.CollapsibleContent>
))
GovCollapseContent.displayName = "GovCollapseContent"

// Compound component for easy usage
export interface GovCollapseItemProps 
  extends Omit<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>, 'content'>,
    VariantProps<typeof govCollapseVariants> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  content: React.ReactNode
}

const GovCollapseItem = React.forwardRef<
  React.ElementRef<typeof GovCollapse>,
  GovCollapseItemProps
>(({ title, subtitle, icon, content, ...props }, ref) => (
  <GovCollapse ref={ref} {...props}>
    <GovCollapseTrigger>
      <div className="flex items-center gap-3">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="flex-1 text-left">
          <div className="font-medium">{title}</div>
          {subtitle && (
            <div className="text-sm text-[var(--collapse-text-secondary)] mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </GovCollapseTrigger>
    <GovCollapseContent>
      {content}
    </GovCollapseContent>
  </GovCollapse>
))
GovCollapseItem.displayName = "GovCollapseItem"

export { 
  GovCollapse, 
  GovCollapseTrigger, 
  GovCollapseContent, 
  GovCollapseItem,
  govCollapseVariants 
}