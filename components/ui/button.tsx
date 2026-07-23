import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-md",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md",
        secondary:
          "border border-accent-teal bg-transparent text-accent-teal hover:bg-[rgba(0,180,216,0.15)] hover:text-white rounded-full px-7 py-3",
        ghost:
          "bg-transparent text-text-secondary font-medium hover:bg-primary-slate hover:text-text-primary rounded-md px-4 py-2",
        link: "text-accent-teal underline-offset-4 hover:underline",
        cta:
          "bg-cta-gradient text-white shadow-glow-orange rounded-full px-7 py-3 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95",
        "cta-secondary":
          "border border-accent-teal bg-transparent text-accent-teal rounded-full px-7 py-3 hover:bg-[rgba(0,180,216,0.15)] hover:text-white",
        icon:
          "size-10 bg-primary-slate text-text-secondary rounded-md hover:bg-primary-light hover:text-accent-teal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-full px-8 text-base",
        icon: "h-9 w-9",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
