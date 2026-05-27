import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white hover:bg-neutral-800",
        outline:
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
        ghost: "text-neutral-900 hover:bg-neutral-100",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
