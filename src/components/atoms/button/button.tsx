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
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium text-sm",
    "rounded-lg",
    "transition-all duration-150 ease-out",
    // Focus styles (WCAG AA)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary",
    // Disabled styles
    "disabled:pointer-events-none disabled:opacity-50",
    // Touch interaction
    "active:scale-[0.98]",
    // Prevent text selection
    "select-none",
  ],
  {
    variants: {
      // Visual variant
      variant: {
        // Primary - main CTAs
        primary: [
          "bg-[#4A7C4E] text-white",
          "hover:bg-[#3D6340]",
          "active:bg-[#345236]",
          "shadow-sm hover:shadow-md",
        ],
        // Secondary - less prominent actions
        secondary: [
          "bg-[#EADBE6] text-[#9B7A94]",
          "hover:bg-[#DBBFD2]",
          "active:bg-[#C699B6] active:text-white",
        ],
        // Outline - tertiary actions
        outline: [
          "border-2 border-[#E8E2DD] bg-transparent",
          "text-[#1A1A1A]",
          "hover:bg-[#F1EDE9] hover:border-[#D9D1CA]",
          "active:bg-[#E8E2DD]",
        ],
        // Ghost - minimal visual weight
        ghost: [
          "bg-transparent",
          "text-[#666666]",
          "hover:bg-[#F1EDE9] hover:text-[#1A1A1A]",
          "active:bg-[#E8E2DD]",
        ],
        // Destructive - dangerous actions
        destructive: [
          "bg-[#E11D48] text-white",
          "hover:bg-[#BE123C]",
          "active:bg-[#9F1239]",
          "focus-visible:ring-[#F43F5E]",
        ],
        // Success - positive actions
        success: [
          "bg-[#059669] text-white",
          "hover:bg-[#047857]",
          "active:bg-[#065F46]",
          "focus-visible:ring-[#10B981]",
        ],
        // Warning - caution actions
        warning: [
          "bg-[#D97706] text-white",
          "hover:bg-[#B45309]",
          "active:bg-[#92400E]",
          "focus-visible:ring-[#F59E0B]",
        ],
        // Link - text-only style
        link: [
          "bg-transparent text-[#4A7C4E] underline-offset-4",
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
