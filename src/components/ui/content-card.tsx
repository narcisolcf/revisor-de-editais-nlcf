import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShowMore } from "@/components/ui/show-more"
import { ScrollArea } from "@/components/ui/scroll-area"

const contentCardVariants = cva(
  "relative",
  {
    variants: {
      variant: {
        default: "border",
        subtle: "border-0 bg-muted/50",
        elevated: "shadow-md",
      },
      overflow: {
        truncate: "",
        scroll: "",
        expand: "",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      overflow: "expand",
      size: "md",
    },
  }
)

interface ContentCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentCardVariants> {
  title?: string
  subtitle?: string
  children: React.ReactNode
  maxHeight?: string
  icon?: React.ReactNode
}

const ContentCard = React.forwardRef<
  HTMLDivElement,
  ContentCardProps
>(({ 
  className, 
  variant, 
  overflow, 
  size, 
  title, 
  subtitle, 
  children, 
  maxHeight,
  icon,
  ...props 
}, ref) => {
  const getMaxHeight = () => {
    if (maxHeight) return maxHeight
    switch (size) {
      case "sm": return "var(--content-max-height-sm)"
      case "lg": return "var(--content-max-height-lg)"
      default: return "var(--content-max-height-md)"
    }
  }

  const renderContent = () => {
    switch (overflow) {
      case "scroll":
        return (
          <ScrollArea 
            className="scrollbar-thin"
            style={{ maxHeight: getMaxHeight() }}
          >
            {children}
          </ScrollArea>
        )
      case "expand":
        return (
          <ShowMore maxHeight={getMaxHeight()}>
            {children}
          </ShowMore>
        )
      case "truncate":
      default:
        return (
          <div 
            className="overflow-hidden"
            style={{ maxHeight: getMaxHeight() }}
          >
            {children}
          </div>
        )
    }
  }

  return (
    <Card ref={ref} className={cn(contentCardVariants({ variant, className }))} {...props}>
      {(title || subtitle || icon) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  )
})

ContentCard.displayName = "ContentCard"

export { ContentCard, contentCardVariants }