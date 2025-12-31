"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Error Fallback Component
 *
 * Displays user-friendly error UI with optional retry functionality.
 * Use this component for error states in data fetching and error boundaries.
 *
 * @component
 *
 * @example
 * // Basic usage
 * <ErrorFallback error={error} />
 *
 * @example
 * // With retry
 * <ErrorFallback
 *   error={error}
 *   onRetry={() => refetch()}
 * />
 *
 * @example
 * // Custom title
 * <ErrorFallback
 *   title="Не вдалося завантажити замовлення"
 *   error={error}
 *   onRetry={reset}
 * />
 */

export interface ErrorFallbackProps {
  /** Error object or message */
  error?: Error | string | null;
  /** Custom title (default: "Щось пішло не так") */
  title?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Reset callback (for error boundaries) */
  reset?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show full error message in development */
  showDetails?: boolean;
}

const sizeClasses = {
  sm: {
    container: "p-4 gap-2",
    icon: "w-8 h-8",
    title: "text-sm font-medium",
    message: "text-xs",
    button: "text-xs px-3 py-1.5",
  },
  md: {
    container: "p-6 gap-3",
    icon: "w-12 h-12",
    title: "text-base font-semibold",
    message: "text-sm",
    button: "text-sm px-4 py-2",
  },
  lg: {
    container: "p-8 gap-4",
    icon: "w-16 h-16",
    title: "text-lg font-semibold",
    message: "text-base",
    button: "text-base px-6 py-2.5",
  },
};

export function ErrorFallback({
  error,
  title = "Щось пішло не так",
  onRetry,
  reset,
  className,
  size = "md",
  showDetails = process.env.NODE_ENV === "development",
}: ErrorFallbackProps) {
  const styles = sizeClasses[size];
  const errorMessage = error instanceof Error ? error.message : error;
  const handleRetry = onRetry || reset;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "bg-error-light/50 border border-error/20 rounded-xl",
        styles.container,
        className
      )}
    >
      {/* Error Icon */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-error/10 text-error",
          styles.icon
        )}
      >
        <svg
          className="w-1/2 h-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className={cn("text-error-dark", styles.title)}>{title}</h3>

      {/* Error Message */}
      {showDetails && errorMessage && (
        <p className={cn("text-foreground-secondary max-w-md", styles.message)}>
          {errorMessage}
        </p>
      )}

      {/* Retry Button */}
      {handleRetry && (
        <button
          onClick={handleRetry}
          className={cn(
            "mt-2 rounded-lg font-medium",
            "bg-error text-white",
            "hover:bg-error-hover active:scale-[0.98]",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-error/50 focus:ring-offset-2",
            styles.button
          )}
        >
          Спробувати знову
        </button>
      )}
    </div>
  );
}

/**
 * Inline Error Message
 *
 * Smaller, inline error display for form fields and small components.
 */
export function InlineError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "text-sm text-error flex items-center gap-1.5 mt-1",
        className
      )}
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {message}
    </p>
  );
}

/**
 * Empty State with Error
 *
 * Full-page or section empty state with error indication.
 */
export function EmptyStateError({
  title = "Не вдалося завантажити дані",
  description = "Перевірте підключення до інтернету та спробуйте ще раз",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-foreground-secondary mb-4 max-w-sm">
        {description}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary-hover active:scale-[0.98]",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          )}
        >
          Спробувати знову
        </button>
      )}
    </div>
  );
}
