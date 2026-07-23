import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-6 animate-spin rounded-full border-2 border-primary-light border-t-accent-teal",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export { Skeleton, Spinner }
