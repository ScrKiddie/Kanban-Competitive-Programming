import { AlertTriangle, Check, RefreshCcw } from "lucide-react";
import { SaveState } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SaveIndicatorProps {
  status: SaveState;
  message: string;
  showLabel?: boolean;
}

export function SaveIndicator({ status, message, showLabel = true }: SaveIndicatorProps) {
  const content = status === "saving"
    ? { label: "Saving", icon: <RefreshCcw className="size-4 animate-spin" />, className: "bg-secondary-background text-foreground" }
    : status === "saved"
      ? { label: "Saved", icon: <Check className="size-4" />, className: "bg-secondary-background text-foreground" }
      : status === "error"
        ? { label: message || "Save failed", icon: <AlertTriangle className="size-4" />, className: "bg-[var(--danger)] text-[var(--danger-foreground)]" }
        : { label: "Saved", icon: <Check className="size-4" />, className: "bg-secondary-background text-foreground" };

  return (
    <div className={cn("inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-base border-2 border-border px-4 text-sm font-medium w-full xl:w-auto xl:justify-start", showLabel ? "gap-3" : "gap-0 px-0", content.className)}>
      {content.icon}
      {showLabel ? <span className="leading-none">{content.label}</span> : null}
    </div>
  )
}
