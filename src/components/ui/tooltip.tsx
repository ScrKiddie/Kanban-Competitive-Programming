"use client"

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useInteractions,
  type Placement,
} from "@floating-ui/react"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"

import { cn } from "@/lib/utils"

const TOOLTIP_WINDOW_CHANGE_SUPPRESSION_MS = 900

type TooltipProviderProps = React.PropsWithChildren<{
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
}>

type TooltipContextValue = {
  delayDuration: number
  skipDelayDuration: number
  isSuppressed: boolean
  suppressTooltipOpen: () => void
}

type TooltipRootContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  refs: ReturnType<typeof useFloating>["refs"]
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"]
  getReferenceProps: ReturnType<typeof useInteractions>["getReferenceProps"]
  getFloatingProps: ReturnType<typeof useInteractions>["getFloatingProps"]
  side: TooltipSide
  align: TooltipAlign
  setPlacementOptions: (options: { side: TooltipSide; align: TooltipAlign; sideOffset: number }) => void
}

type TooltipSide = "top" | "right" | "bottom" | "left"
type TooltipAlign = "start" | "center" | "end"

const TooltipProviderContext = React.createContext<TooltipContextValue | null>(null)
const TooltipRootContext = React.createContext<TooltipRootContextValue | null>(null)

function getPlacement(side: TooltipSide, align: TooltipAlign): Placement {
  if (align === "center") {
    return side
  }

  return `${side}-${align}` as Placement
}

function useTooltipProvider() {
  const context = React.useContext(TooltipProviderContext)

  if (!context) {
    return {
      delayDuration: 300,
      skipDelayDuration: 0,
      isSuppressed: false,
      suppressTooltipOpen: () => {},
    }
  }

  return context
}

function useTooltipRoot(componentName: string) {
  const context = React.useContext(TooltipRootContext)

  if (!context) {
    throw new Error(`${componentName} must be used within Tooltip`)
  }

  return context
}

function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 0,
  children,
}: TooltipProviderProps) {
  const [isSuppressed, setIsSuppressed] = React.useState(false)
  const suppressionTimeoutRef = React.useRef<number | undefined>(undefined)

  const suppressTooltipOpen = React.useCallback(() => {
    setIsSuppressed(true)

    if (suppressionTimeoutRef.current) {
      window.clearTimeout(suppressionTimeoutRef.current)
    }

    suppressionTimeoutRef.current = window.setTimeout(() => {
      setIsSuppressed(false)
    }, TOOLTIP_WINDOW_CHANGE_SUPPRESSION_MS)
  }, [])

  React.useEffect(() => {
    let cleanupTauriMoveListener: (() => void) | undefined
    let isMounted = true

    window.addEventListener("resize", suppressTooltipOpen)
    window.addEventListener("scroll", suppressTooltipOpen, true)
    window.addEventListener("pointerdown", suppressTooltipOpen, true)

    void import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => getCurrentWindow().onMoved(suppressTooltipOpen))
      .then((unlisten) => {
        if (isMounted) {
          cleanupTauriMoveListener = unlisten
        } else {
          unlisten()
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
      window.removeEventListener("resize", suppressTooltipOpen)
      window.removeEventListener("scroll", suppressTooltipOpen, true)
      window.removeEventListener("pointerdown", suppressTooltipOpen, true)
      cleanupTauriMoveListener?.()

      if (suppressionTimeoutRef.current) {
        window.clearTimeout(suppressionTimeoutRef.current)
      }
    }
  }, [suppressTooltipOpen])

  const contextValue = React.useMemo(
    () => ({
      delayDuration,
      skipDelayDuration,
      isSuppressed,
      suppressTooltipOpen,
    }),
    [delayDuration, isSuppressed, skipDelayDuration, suppressTooltipOpen],
  )

  return (
    <TooltipProviderContext.Provider value={contextValue}>
      {children}
    </TooltipProviderContext.Provider>
  )
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: React.PropsWithChildren<{
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}>) {
  const { isSuppressed } = useTooltipProvider()
  const [open, setOpenState] = React.useState(defaultOpen)
  const [placementOptions, setPlacementOptions] = React.useState({
    side: "top" as TooltipSide,
    align: "center" as TooltipAlign,
    sideOffset: 4,
  })
  const controlledOpen = openProp ?? open
  const displayedOpen = isSuppressed ? false : controlledOpen

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isSuppressed && nextOpen) {
        return
      }

      if (openProp === undefined) {
        setOpenState(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isSuppressed, onOpenChange, openProp],
  )

  const { refs, floatingStyles, context } = useFloating({
    open: displayedOpen,
    onOpenChange: setOpen,
    placement: getPlacement(placementOptions.side, placementOptions.align),
    middleware: [
      offset(placementOptions.sideOffset),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const focus = useFocus(context, {
    visibleOnly: true,
  })
  const dismiss = useDismiss(context, {
    escapeKey: true,
    referencePress: true,
    outsidePress: true,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([focus, dismiss])

  React.useEffect(() => {
    if (isSuppressed) {
      setOpen(false)
    }
  }, [isSuppressed, setOpen])

  const contextValue = React.useMemo(
    () => ({
      open: displayedOpen,
      setOpen,
      refs,
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      side: placementOptions.side,
      align: placementOptions.align,
      setPlacementOptions,
    }),
    [
      displayedOpen,
      floatingStyles,
      getFloatingProps,
      getReferenceProps,
      placementOptions.align,
      placementOptions.side,
      refs,
      setOpen,
    ],
  )

  return (
    <TooltipRootContext.Provider value={contextValue}>
      {children}
    </TooltipRootContext.Provider>
  )
}

function TooltipTrigger({
  asChild = false,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean
}) {
  const { refs, getReferenceProps, setOpen } = useTooltipRoot("TooltipTrigger")
  const { delayDuration, isSuppressed, suppressTooltipOpen } = useTooltipProvider()
  const hoverTimeoutRef = React.useRef<number | undefined>(undefined)
  const isPointerHoveringRef = React.useRef(false)
  const Comp = asChild ? Slot : "button"

  const clearHoverTimer = React.useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = undefined
    }
  }, [])

  const startHoverTimer = React.useCallback(() => {
    clearHoverTimer()

    if (isSuppressed) {
      return
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setOpen(true)
      hoverTimeoutRef.current = undefined
    }, delayDuration)
  }, [clearHoverTimer, delayDuration, isSuppressed, setOpen])

  React.useEffect(() => clearHoverTimer, [clearHoverTimer])

  React.useEffect(() => {
    if (!isSuppressed && isPointerHoveringRef.current) {
      startHoverTimer()
    }
  }, [isSuppressed, startHoverTimer])

  return (
    <Comp
      data-slot="tooltip-trigger"
      ref={refs.setReference}
      {...getReferenceProps({
        ...props,
        onPointerEnter: (event) => {
          isPointerHoveringRef.current = event.pointerType === "mouse"

          if (event.pointerType === "mouse") {
            startHoverTimer()
          }

          onPointerEnter?.(event as React.PointerEvent<HTMLButtonElement>)
        },
        onPointerLeave: (event) => {
          isPointerHoveringRef.current = false
          clearHoverTimer()
          setOpen(false)
          onPointerLeave?.(event as React.PointerEvent<HTMLButtonElement>)
        },
        onPointerDown: (event) => {
          isPointerHoveringRef.current = false
          clearHoverTimer()
          setOpen(false)
          suppressTooltipOpen()
          onPointerDown?.(event as React.PointerEvent<HTMLButtonElement>)
        },
        onClick: (event) => {
          isPointerHoveringRef.current = false
          clearHoverTimer()
          setOpen(false)
          suppressTooltipOpen()
          onClick?.(event as React.MouseEvent<HTMLButtonElement>)
        },
      })}
    />
  )
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 4,
  hidden,
  children,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  side?: TooltipSide
  align?: TooltipAlign
  sideOffset?: number
}) {
  const {
    open,
    refs,
    floatingStyles,
    getFloatingProps,
    side: currentSide,
    align: currentAlign,
    setPlacementOptions,
  } = useTooltipRoot("TooltipContent")

  React.useLayoutEffect(() => {
    setPlacementOptions({ side, align, sideOffset })
  }, [align, side, sideOffset, setPlacementOptions])

  if (!open || hidden) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        data-slot="tooltip-content"
        data-side={currentSide}
        data-align={currentAlign}
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          ...style,
        }}
        className="z-[99999]"
        {...getFloatingProps(props)}
      >
        <div
          className={cn(
            "overflow-hidden rounded-base border-2 border-border bg-main px-3 py-1.5 text-xs font-base text-main-foreground shadow-none animate-in fade-in-0 zoom-in-95",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </FloatingPortal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
