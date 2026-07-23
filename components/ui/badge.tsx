import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "border border-primary-light bg-primary-slate text-text-secondary",
        active: "border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.15)] text-success",
        pending: "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-warning",
        inactive: "border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-error",
        teal: "border border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
        orange: "border border-accent-orange/30 bg-accent-orange/10 text-accent-orange",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
