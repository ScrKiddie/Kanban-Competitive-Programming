"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-main text-main-foreground border-border border-2 font-heading shadow-shadow rounded-base text-[13px] flex items-center gap-2.5 p-4 w-[356px] [&:has(button)]:justify-between [&_[data-title]]:!text-current [&_[data-description]]:!text-current",
          title: "font-heading",
          description: "font-base opacity-90",
          actionButton:
            "font-base border-2 text-[12px] h-6 px-2 bg-secondary-background text-foreground border-border rounded-base shrink-0",
          cancelButton:
            "font-base border-2 text-[12px] h-6 px-2 bg-background text-foreground border-border rounded-base shrink-0",
          success: "!bg-[var(--main)] !text-[var(--main-foreground)]",
          info: "!bg-[var(--main)] !text-[var(--main-foreground)]",
          warning: "!bg-[var(--accent-yellow)] !text-[var(--main-foreground)]",
          error: "!bg-[var(--danger)] !text-[var(--danger-foreground)]",
          loading:
            "bg-main text-main-foreground [&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
