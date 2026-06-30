import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldLabelProps = React.ComponentProps<typeof Label> & {
  required?: boolean;
};

function FieldLabel({ children, className, required, ...props }: FieldLabelProps) {
  return (
    <Label className={cn("inline-flex items-center gap-1 font-heading text-sm text-foreground", className)} {...props}>
      {children}
      {required ? (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      ) : null}
    </Label>
  );
}

function FieldError({ children, className, ...props }: React.ComponentProps<"p">) {
  if (!children) return null;

  return (
    <p className={cn("text-xs font-base text-danger", className)} {...props}>
      {children}
    </p>
  );
}

export { FieldError, FieldLabel };
