import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
