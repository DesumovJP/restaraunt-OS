"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function LiveIndicator({ isConnected, className }: LiveIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-label={isConnected ? "Підключено в реальному часі" : "Відключено"}
    >
      <span
        className={cn(
          "relative flex h-3 w-3",
          !isConnected && "opacity-50"
        )}
      >
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-3 w-3",
            isConnected ? "bg-success" : "bg-muted-foreground"
          )}
        />
      </span>
      <span className="text-sm font-medium">
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}
