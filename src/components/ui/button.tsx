import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonMotionClass = "shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-secondary-background transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          cn("text-main-foreground bg-main border-2 border-border", buttonMotionClass),
        noShadow: "text-main-foreground bg-main border-2 border-border",
        neutral:
          cn("bg-secondary-background text-foreground border-2 border-border hover:bg-muted", buttonMotionClass),
        review:
          cn("bg-[var(--accent-purple)] text-main-foreground border-2 border-border", buttonMotionClass),
        reverse:
          cn("text-main-foreground bg-main border-2 border-border", buttonMotionClass),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function Button({
  className,
  variant,
  size,
  asChild = false,
  mobileInteractive = true,
  tooltip,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    mobileInteractive?: boolean
    tooltip?: string
  }) {
  const Comp = asChild ? Slot : "button"

  const button = (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        !mobileInteractive &&
          "max-md:hover:translate-x-0 max-md:hover:translate-y-0 max-md:hover:shadow-shadow max-md:active:translate-x-0 max-md:active:translate-y-0 max-md:active:shadow-shadow",
        className,
      )}
      {...props}
    />
  )

  if (!tooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" align="center" className="z-[99999] text-xs shadow-none">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export { Button, buttonVariants }
