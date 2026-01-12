"use client";

/**
 * TableSessionTimer Component
 *
 * Displays how long a table has been occupied.
 * Shows warning colors for long sessions.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTableTime, TABLE_SESSION_THRESHOLDS } from "../station-queue-config";

interface TableSessionTimerProps {
  occupiedAt?: string;
  className?: string;
}

export function TableSessionTimer({ occupiedAt, className }: TableSessionTimerProps) {
  const [tableTime, setTableTime] = React.useState("");

  React.useEffect(() => {
    if (!occupiedAt) return;

    const updateTime = () => {
      setTableTime(formatTableTime(occupiedAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt || !tableTime) return null;

  // Check if table session is long
  const startMs = new Date(occupiedAt).getTime();
  const elapsedMs = Date.now() - startMs;
  const isLong = elapsedMs >= TABLE_SESSION_THRESHOLDS.longMs;
  const isCritical = elapsedMs >= TABLE_SESSION_THRESHOLDS.criticalMs;

  return (
    <span
      className={cn(
        "text-[10px] font-mono",
        isCritical
          ? "text-danger"
          : isLong
            ? "text-warning"
            : "text-muted-foreground",
        className
      )}
    >
      {tableTime}
    </span>
  );
}
