"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg px-4 py-3 text-base font-medium text-navy-950 transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
  {
    variants: {
      variant: {
        // Default - solid white with border
        default: "border-2 border-slate-200 bg-white hover:border-slate-300 focus:border-accent shadow-sm",

        // Glass - glassmorphism
        glass: "glass-base border border-white/20 shadow-glass hover:glass-strong",

        // Filled - subtle background
        filled: "border-0 bg-slate-50 hover:bg-slate-100 focus:bg-white shadow-inner",

        // Ghost - minimal
        ghost: "border-0 bg-transparent hover:bg-slate-50",
      },
      inputSize: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-11 px-4 py-3 text-base",
        lg: "h-12 px-5 py-3 text-lg",
        touch: "min-h-touch px-4 py-3 text-base",
      },
      hasError: {
        true: "border-error focus:border-error focus:ring-error",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      hasError: false,
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, hasError, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
