"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
  {
    variants: {
      variant: {
        // Primary - Navy
        default: "border-transparent bg-primary text-white shadow-sm",

        // Accent - Electric Blue
        accent: "border-transparent bg-accent text-white shadow-sm",

        // Glass - Glassmorphism
        glass: "glass-base text-navy-950 shadow-sm",

        // Semantic colors
        success: "border-transparent bg-success text-white shadow-sm",
        warning: "border-transparent bg-warning text-white shadow-sm",
        error: "border-transparent bg-error text-white shadow-sm",
        info: "border-transparent bg-info text-white shadow-sm",

        // Outline variants
        outline: "border-2 border-slate-300 bg-transparent text-navy-950",
        outlineAccent: "border-2 border-accent bg-transparent text-accent",

        // Status variants (for orders/tickets)
        new: "border-transparent bg-info text-white shadow-sm",
        "in-progress": "border-transparent bg-warning text-white shadow-sm",
        ready: "border-transparent bg-success text-white shadow-sm",
        completed: "border-transparent bg-slate-400 text-white",

        // Priority variants
        rush: "border-transparent bg-error text-white shadow-md animate-pulse-soft",
        normal: "border-transparent bg-slate-100 text-slate-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
