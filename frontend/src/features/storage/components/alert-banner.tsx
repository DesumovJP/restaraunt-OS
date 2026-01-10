"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { AlertBannerProps, AlertItem, AlertType } from "@/types/storage-ui";
import { ALERT_TYPE_LABELS } from "@/types/storage-ui";

// ==========================================
// ALERT CONFIG
// ==========================================

const ALERT_ICONS: Record<AlertType, string> = {
  low_stock: "📉",
  expiring: "⏰",
  expired: "❌",
  out_of_stock: "🚫",
};

// ==========================================
// ALERT BANNER COMPONENT
// ==========================================

/**
 * Collapsible alert banner for storage warnings
 */
export function AlertBanner({
  alerts,
  collapsible = true,
  onViewAll,
  onDismiss,
}: AlertBannerProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Filter out zero-count alerts
  const activeAlerts = alerts.filter((a) => a.count > 0);
  const totalCount = activeAlerts.reduce((sum, a) => sum + a.count, 0);

  // Don't render if no alerts
  if (totalCount === 0) {
    return null;
  }

  const isCritical = activeAlerts.some(
    (a) => a.type === "expired" || a.type === "out_of_stock"
  );

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        isCritical
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Indicator */}
        <div
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isCritical ? "bg-red-500 animate-pulse" : "bg-amber-500"
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-sm font-medium",
              isCritical ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
            )}
          >
            {totalCount} {totalCount === 1 ? "товар потребує" : "товарів потребують"} уваги
          </span>

          {/* Inline summary when collapsed */}
          {!expanded && activeAlerts.length > 1 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({activeAlerts.map((a) => `${a.count} ${ALERT_TYPE_LABELS[a.type].toLowerCase()}`).join(", ")})
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className={cn(
                "h-7 text-xs",
                isCritical
                  ? "text-red-700 hover:text-red-800 hover:bg-red-100"
                  : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"
              )}
            >
              Переглянути
            </Button>
          )}

          {collapsible && activeAlerts.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-7 w-7"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && activeAlerts.length > 0 && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          <div className="h-px bg-border" />
          {activeAlerts.map((alert) => (
            <AlertRow key={alert.type} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ALERT ROW
// ==========================================

function AlertRow({ alert }: { alert: AlertItem }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{ALERT_ICONS[alert.type]}</span>
      <span className="text-muted-foreground">{ALERT_TYPE_LABELS[alert.type]}:</span>
      <span className="font-medium">{alert.count}</span>
      {alert.items && alert.items.length > 0 && (
        <span className="text-xs text-muted-foreground truncate">
          ({alert.items.slice(0, 3).map((i) => i.name).join(", ")}
          {alert.items.length > 3 && ` +${alert.items.length - 3}`})
        </span>
      )}
    </div>
  );
}

// ==========================================
// COMPACT ALERT INDICATOR
// ==========================================

interface AlertIndicatorProps {
  count: number;
  critical?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Compact alert indicator for header badge
 */
export function AlertIndicator({
  count,
  critical = false,
  onClick,
  className,
}: AlertIndicatorProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
        critical
          ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {count}
    </button>
  );
}
