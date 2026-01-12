"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTableTime, TIMER_THRESHOLDS } from "./utils";

interface TableSessionTimerProps {
  occupiedAt?: string;
}

/**
 * Displays how long a table has been occupied
 * Updates every 30 seconds
 */
export function TableSessionTimer({ occupiedAt }: TableSessionTimerProps) {
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
  const isLong = elapsedMs >= TIMER_THRESHOLDS.tableSessionLongMs;
  const isCritical = elapsedMs >= TIMER_THRESHOLDS.tableSessionCriticalMs;

  return (
    <span
      className={cn(
        "text-[10px] font-mono",
        isCritical
          ? "text-danger"
          : isLong
            ? "text-warning"
            : "text-muted-foreground"
      )}
    >
      {tableTime}
    </span>
  );
}
