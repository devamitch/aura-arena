import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent/20 text-accent",
        secondary: "border-transparent bg-s2 text-t2",
        destructive: "border-transparent bg-red-500/20 text-red-400",
        outline: "border-b1 text-t2",
        tier: "border-transparent font-mono",
        discipline: "border-transparent font-medium",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
