"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Restaurant OS Button Component
 *
 * Переваги над конкурентами:
 * - Мінімальний touch target 44px (iOS HIG)
 * - Чіткі hover/active/focus states
 * - Семантичні варіанти для різних контекстів
 * - Вбудований loading state
 * - Повна accessibility (WCAG AA+)
 */

const buttonVariants = cva(
  // Base styles - using design tokens
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium text-sm",
    "rounded-lg",
    "transition-all duration-150 ease-out",
    // Focus styles (WCAG AA)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
    // Disabled styles
    "disabled:pointer-events-none disabled:opacity-50",
    // Touch interaction
    "active:scale-[0.98]",
    // Prevent text selection
    "select-none",
  ],
  {
    variants: {
      // Visual variant - using design tokens
      variant: {
        // Primary - main CTAs (navy brand)
        primary: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary-hover",
          "active:bg-primary-active",
          "shadow-sm hover:shadow-md",
        ],
        // Secondary - less prominent actions
        secondary: [
          "bg-slate-100 text-slate-600",
          "hover:bg-slate-200",
          "active:bg-slate-300 active:text-slate-700",
        ],
        // Outline - tertiary actions
        outline: [
          "border-2 border-border bg-transparent",
          "text-foreground",
          "hover:bg-muted hover:border-slate-300",
          "active:bg-slate-200",
        ],
        // Ghost - minimal visual weight
        ghost: [
          "bg-transparent",
          "text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "active:bg-slate-200",
        ],
        // Destructive - dangerous actions
        destructive: [
          "bg-error text-white",
          "hover:bg-error-hover",
          "active:bg-error-dark",
          "focus-visible:ring-error",
        ],
        // Success - positive actions
        success: [
          "bg-success text-white",
          "hover:bg-success-hover",
          "active:bg-success-dark",
          "focus-visible:ring-success",
        ],
        // Warning - caution actions
        warning: [
          "bg-warning text-white",
          "hover:bg-warning-hover",
          "active:bg-warning-dark",
          "focus-visible:ring-warning",
        ],
        // Accent - interactive accent color (electric blue)
        accent: [
          "bg-accent text-accent-foreground",
          "hover:bg-accent-hover",
          "active:bg-accent-active",
          "shadow-sm hover:shadow-md",
        ],
        // Link - text-only style
        link: [
          "bg-transparent text-accent underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ],
      },
      // Size variant
      size: {
        // Extra small - for compact UIs
        xs: "h-8 px-2.5 text-xs min-w-[32px]",
        // Small - secondary actions
        sm: "h-9 px-3 text-sm min-w-[36px]",
        // Medium - default
        md: "h-10 px-4 text-sm min-w-[40px]",
        // Large - important actions
        lg: "h-11 px-5 text-base min-w-[44px]",
        // Extra large - hero CTAs (touch optimized)
        xl: "h-14 px-6 text-base min-w-[56px]",
        // Touch - guaranteed 44px minimum
        touch: "min-h-[44px] min-w-[44px] px-4 py-3 text-base",
        // Icon only
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      // Full width
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

// =============================================================================
// COMPONENT
// =============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a different element (e.g., Link) */
  asChild?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Loading text (replaces children when loading) */
  loadingText?: string;
  /** Icon to show before text */
  leftIcon?: React.ReactNode;
  /** Icon to show after text */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Disable button when loading
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        )}

        {/* Left icon (hidden when loading) */}
        {!isLoading && leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Content */}
        {isLoading && loadingText ? loadingText : children}

        {/* Right icon (hidden when loading) */}
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// =============================================================================
// EXPORTS
// =============================================================================

export { Button, buttonVariants };
export type { VariantProps };
