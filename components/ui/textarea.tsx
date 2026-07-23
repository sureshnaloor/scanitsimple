import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-md border border-primary-light bg-primary-slate px-4 py-3 text-base text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent-teal focus-visible:shadow-glow-teal disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
