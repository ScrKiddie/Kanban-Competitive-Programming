import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center shrink-0 rounded-base border-2 border-border transition-[transform,box-shadow,background-color] duration-150 ease-out [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary-background disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-main text-main-foreground shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none",
        danger:
          "bg-[var(--danger)] text-[var(--danger-foreground)] shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none",
      },
      size: {
        sm: "h-7 w-7 [&_svg]:size-3",
        md: "h-8 w-8 [&_svg]:size-4",
        lg: "h-9 w-9 [&_svg]:size-4",
        xl: "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
)

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function IconButton({
  className,
  variant,
  size,
  disabled,
  mobileInteractive = true,
  tooltip,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    mobileInteractive?: boolean
    tooltip?: string
  }) {
  const button = (
    <button
      type="button"
      data-slot="icon-button"
      disabled={disabled}
      className={cn(
        iconButtonVariants({ variant, size }),
        !mobileInteractive &&
          "max-md:hover:translate-x-0 max-md:hover:translate-y-0 max-md:hover:shadow-shadow max-md:active:translate-x-0 max-md:active:translate-y-0 max-md:active:shadow-shadow",
        disabled &&
          "translate-x-0 translate-y-0",
        className,
      )}
      {...props}
    />
  )

  if (!tooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" align="center" className="z-50 text-xs shadow-none">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export { IconButton, iconButtonVariants }
