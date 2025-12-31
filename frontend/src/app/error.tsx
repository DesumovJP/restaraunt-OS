"use client";

import * as React from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

/**
 * Global Error Boundary
 *
 * Catches unhandled errors in the application and displays a user-friendly error page.
 * This is a Next.js App Router error boundary that wraps route segments.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error to monitoring service
  React.useEffect(() => {
    // TODO: Send to error monitoring service (Sentry, etc.)
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorFallback
          title="Виникла помилка"
          error={error}
          reset={reset}
          size="lg"
          showDetails={process.env.NODE_ENV === "development"}
        />

        {/* Additional help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-foreground-secondary mb-3">
            Якщо проблема повторюється, спробуйте:
          </p>
          <ul className="text-sm text-foreground-tertiary space-y-1">
            <li>Оновити сторінку</li>
            <li>Очистити кеш браузера</li>
            <li>Зв&apos;язатися з підтримкою</li>
          </ul>
        </div>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mt-4 text-xs text-foreground-tertiary text-center">
            Код помилки: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
