"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Restaurant OS Card Component
 *
 * Переваги над конкурентами:
 * - Теплі тіні (не холодні як у Square)
 * - Чітка elevation hierarchy
 * - Interactive states для clickable cards
 * - Semantic structure (header, content, footer)
 */

const cardVariants = cva(
  // Base styles - using design tokens
  [
    "rounded-xl",
    "bg-card",
    "border border-border",
    "overflow-hidden",
  ],
  {
    variants: {
      // Elevation - using shadow tokens
      elevation: {
        flat: "shadow-none",
        raised: "shadow-sm",
        floating: "shadow-md",
        overlay: "shadow-lg",
      },
      // Interactive variant
      interactive: {
        true: [
          "cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:shadow-md",
          "hover:border-slate-300",
          "active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ],
        false: "",
      },
      // Selected state (for multi-select scenarios)
      selected: {
        true: [
          "border-accent",
          "ring-2 ring-accent-light",
        ],
        false: "",
      },
      // Padding preset
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4 md:p-5",
        lg: "p-5 md:p-6",
      },
    },
    defaultVariants: {
      elevation: "raised",
      interactive: false,
      selected: false,
      padding: "none",
    },
  }
);

// =============================================================================
// CARD ROOT
// =============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Make card focusable and interactive */
  asButton?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      elevation,
      interactive,
      selected,
      padding,
      asButton,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Auto-enable interactive when onClick is provided
    const isInteractive = interactive ?? !!onClick;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({
            elevation,
            interactive: isInteractive,
            selected,
            padding,
          }),
          className
        )}
        role={asButton ? "button" : undefined}
        tabIndex={asButton ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          asButton
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

// =============================================================================
// CARD HEADER
// =============================================================================

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Action element (e.g., button, menu) */
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start justify-between gap-4",
        "px-4 pt-4 pb-2 md:px-5 md:pt-5",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0 space-y-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

// =============================================================================
// CARD TITLE
// =============================================================================

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }
>(({ className, as: Comp = "h3", ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-normal", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// =============================================================================
// CARD CONTENT
// =============================================================================

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 pb-4 md:px-5 md:pb-5", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

// =============================================================================
// CARD FOOTER
// =============================================================================

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2",
      "px-4 py-3 md:px-5 md:py-4",
      "border-t border-border",
      "bg-muted",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// =============================================================================
// CARD MEDIA (for images)
// =============================================================================

interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  aspectRatio?: "video" | "square" | "wide";
}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, src, alt, aspectRatio = "video", children, ...props }, ref) => {
    const aspectClasses = {
      video: "aspect-video",
      square: "aspect-square",
      wide: "aspect-[21/9]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-slate-100",
          aspectClasses[aspectRatio],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || ""}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          children
        )}
      </div>
    );
  }
);
CardMedia.displayName = "CardMedia";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  cardVariants,
};
