import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TruncatedTextProps {
  text: string
  lines?: 1 | 2 | 3
  className?: string
  showTooltip?: boolean
  children?: React.ReactNode
}

const TruncatedText = React.forwardRef<
  HTMLDivElement,
  TruncatedTextProps
>(({ text, lines = 2, className, showTooltip = true, children, ...props }, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [shouldTruncate, setShouldTruncate] = React.useState(false)
  const textRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = textRef.current
    if (element) {
      const lineHeight = parseInt(getComputedStyle(element).lineHeight)
      const maxHeight = lineHeight * lines
      setShouldTruncate(element.scrollHeight > maxHeight)
    }
  }, [text, lines])

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  const content = (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      <div
        ref={textRef}
        className={cn(
          "text-sm leading-relaxed",
          !isExpanded && shouldTruncate && `line-clamp-${lines}`,
          isExpanded && "whitespace-pre-wrap"
        )}
      >
        {text}
      </div>
      
      {shouldTruncate && (
        <button
          onClick={toggleExpanded}
          className="show-more-trigger mt-1"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Ver menos" : "Ver mais"}
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
      
      {children}
    </div>
  )

  if (showTooltip && shouldTruncate && !isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
})

TruncatedText.displayName = "TruncatedText"

export { TruncatedText }