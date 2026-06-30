import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  scrollable?: boolean
  hideClose?: boolean
  preventDismiss?: boolean
  isPending?: boolean
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
  contentClassName,
  scrollable = true,
  hideClose = false,
  preventDismiss = false,
  isPending = false,
}: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (preventDismiss && !nextOpen) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        hideClose={hideClose}
        isPending={isPending}
        onEscapeKeyDown={(event) => {
          if (preventDismiss) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (preventDismiss) event.preventDefault()
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <DialogHeader className="shrink-0 border-b-2 border-border bg-secondary-background">
          <DialogTitle className="text-xl sm:text-2xl font-medium pr-8">
            {title}
          </DialogTitle>
        </DialogHeader>
        {scrollable ? (
          <ScrollArea className="flex-1 min-h-0 w-full bg-background scrollbar">
            <div className={contentClassName}>
              {children}
            </div>
          </ScrollArea>
        ) : (
          <div className={cn("flex-1 min-h-0 w-full bg-background flex flex-col overflow-hidden", contentClassName)}>
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
