"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 gpu-accelerated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Primary - Navy solid (premium default)
        default: "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg",

        // Accent - Electric Blue (interactive/CTA)
        accent: "bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-lg",

        // Glass - Glassmorphism (premium variant)
        glass: "glass-base text-navy-950 hover:glass-strong shadow-glass hover:shadow-glass-hover",

        // Outline - Bordered
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white",

        // Ghost - Minimal
        ghost: "bg-transparent text-navy-950 hover:bg-slate-100",

        // Link - Text only
        link: "text-accent underline-offset-4 hover:underline",

        // Semantic states
        success: "bg-success text-white hover:bg-success-hover shadow-md hover:shadow-lg",
        warning: "bg-warning text-white hover:bg-warning-hover shadow-md hover:shadow-lg",
        destructive: "bg-error text-white hover:bg-error-hover shadow-md hover:shadow-lg",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-base",
        lg: "h-12 px-8 text-lg",
        xl: "h-14 px-10 text-xl",
        touch: "min-h-touch min-w-touch px-6 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
