import * as React from "react"
import { cn } from "@lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn("flex min-h-[80px] w-full rounded-lg border border-b1 bg-s2 px-4 py-2 text-sm text-t1 placeholder:text-t3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 resize-none", className)}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"
export { Textarea }
