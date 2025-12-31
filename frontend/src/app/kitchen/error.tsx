"use client";

import * as React from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

/**
 * Kitchen Error Boundary
 *
 * Handles errors in the kitchen module with kitchen-specific messaging.
 */
export default function KitchenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Kitchen error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <ErrorFallback
        title="Помилка в кухонному модулі"
        error={error}
        reset={reset}
        size="lg"
      />
    </div>
  );
}
