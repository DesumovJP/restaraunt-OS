"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { StockBarProps } from "@/types/storage-ui";

// ==========================================
// STOCK CALCULATION HELPERS
// ==========================================

function getStockPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max((current / max) * 100, 0), 100);
}

function getStockLevel(
  current: number,
  min: number,
  max: number
): "critical" | "low" | "medium" | "good" {
  const percentage = getStockPercentage(current, max);

  if (current <= 0) return "critical";
  if (current <= min) return "low";
  if (percentage <= 40) return "medium";
  return "good";
}

const LEVEL_COLORS = {
  critical: "bg-red-500",
  low: "bg-amber-500",
  medium: "bg-yellow-500",
  good: "bg-green-500",
};

// ==========================================
// MINI STOCK BAR
// ==========================================

interface StockMiniBarProps {
  current: number;
  max: number;
  min?: number;
  className?: string;
}

/**
 * Compact inline stock bar for list views
 * Shows just the progress bar without labels
 */
export function StockMiniBar({
  current,
  max,
  min = 0,
  className,
}: StockMiniBarProps) {
  const percentage = getStockPercentage(current, max);
  const level = getStockLevel(current, min, max);

  return (
    <div
      className={cn("w-16 h-1.5 bg-muted rounded-full overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full transition-all", LEVEL_COLORS[level])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ==========================================
// FULL STOCK BAR
// ==========================================

/**
 * Full stock progress bar with labels
 */
export function StockBar({
  current,
  min,
  max,
  unit = "",
  variant = "full",
  showLabels = true,
}: StockBarProps) {
  const percentage = getStockPercentage(current, max);
  const level = getStockLevel(current, min, max);

  if (variant === "mini") {
    return <StockMiniBar current={current} max={max} min={min} />;
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <StockMiniBar current={current} max={max} min={min} />
        <span className="text-xs text-muted-foreground">
          {current}/{max}
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {current} {unit}
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            LEVEL_COLORS[level]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Мін: {min}</span>
          <span>Макс: {max}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// STOCK OVERVIEW
// ==========================================

interface StockOverviewProps {
  current: number;
  min: number;
  max: number;
  unit: string;
  reorderPoint?: number;
  className?: string;
}

/**
 * Detailed stock overview for preview panel
 */
export function StockOverview({
  current,
  min,
  max,
  unit,
  reorderPoint,
  className,
}: StockOverviewProps) {
  const percentage = getStockPercentage(current, max);
  const level = getStockLevel(current, min, max);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with current stock */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{current}</span>
          <span className="text-lg text-muted-foreground">/ {max} {unit}</span>
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            level === "critical" && "text-red-600",
            level === "low" && "text-amber-600",
            level === "medium" && "text-yellow-600",
            level === "good" && "text-green-600"
          )}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Min marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/30 z-10"
          style={{ left: `${(min / max) * 100}%` }}
        />

        {/* Reorder point marker */}
        {reorderPoint && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${(reorderPoint / max) * 100}%` }}
          />
        )}

        {/* Progress fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            LEVEL_COLORS[level]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          Мін: {min} {unit}
        </span>
        {reorderPoint && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Поповнення: {reorderPoint} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
