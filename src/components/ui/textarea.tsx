import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  error?: boolean;
  success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles - DSGov standards  
          "flex w-full min-h-[96px] text-sm font-normal transition-all duration-200 resize-y",
          "px-[var(--form-input-padding-x)] py-[var(--form-input-padding-y)]",
          "rounded-[var(--form-border-radius)] border-[var(--form-border-width)]",
          "bg-background placeholder:text-muted-foreground",
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
Textarea.displayName = "Textarea"

export { Textarea }
