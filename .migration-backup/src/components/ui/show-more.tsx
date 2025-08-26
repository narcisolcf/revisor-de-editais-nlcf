import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ShowMoreProps {
  children: React.ReactNode
  maxHeight?: string
  className?: string
  buttonText?: {
    showMore: string
    showLess: string
  }
  defaultExpanded?: boolean
}

const ShowMore = React.forwardRef<
  HTMLDivElement,
  ShowMoreProps
>(({ 
  children, 
  maxHeight = "var(--content-max-height-md)", 
  className, 
  buttonText = { showMore: "Ver mais", showLess: "Ver menos" },
  defaultExpanded = false,
  ...props 
}, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [shouldShowButton, setShouldShowButton] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = contentRef.current
    if (element) {
      const maxHeightValue = parseInt(maxHeight.replace(/\D/g, ''))
      setShouldShowButton(element.scrollHeight > maxHeightValue)
    }
  }, [maxHeight, children])

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  return (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          !isExpanded && shouldShowButton && "fade-bottom"
        )}
        style={{
          maxHeight: isExpanded || !shouldShowButton ? 'none' : maxHeight,
        }}
        aria-expanded={isExpanded}
      >
        {children}
      </div>
      
      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className="w-full justify-center gap-2 text-primary hover:text-primary/80"
          aria-expanded={isExpanded}
          aria-controls="show-more-content"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {buttonText.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {buttonText.showMore}
            </>
          )}
        </Button>
      )}
    </div>
  )
})

ShowMore.displayName = "ShowMore"

export { ShowMore }