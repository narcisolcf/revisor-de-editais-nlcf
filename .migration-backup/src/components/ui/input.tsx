import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles - DSGov standards
          "flex w-full text-sm font-normal transition-all duration-200",
          "px-[var(--form-input-padding-x)] py-[var(--form-input-padding-y)]",
          "h-[var(--form-input-height)] rounded-[var(--form-border-radius)]",
          "border-[var(--form-border-width)] bg-background",
          "placeholder:text-muted-foreground",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Default state
          "border-[var(--form-border-default)]",
          // Focus state
          "focus-visible:outline-none focus-visible:border-[var(--form-border-focus)] focus-visible:shadow-[var(--form-focus-shadow)]",
          // Error state
          error && "border-[var(--form-border-error)] focus-visible:border-[var(--form-border-error)] focus-visible:shadow-[var(--form-error-shadow)]",
          // Success state
          success && "border-[var(--form-border-success)] focus-visible:border-[var(--form-border-success)] focus-visible:shadow-[var(--form-success-shadow)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:bg-[var(--form-bg-disabled)] disabled:text-[var(--form-text-disabled)] disabled:border-[var(--form-border-default)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
