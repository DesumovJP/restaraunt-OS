"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, Timer, Pause } from "lucide-react";
import type { CourseType } from "@/types/extended";
import { COURSE_CONFIGS, getCourseConfig } from "@/features/orders/course-selector";

// SLA thresholds in milliseconds
const SLA_THRESHOLDS = {
  table: {
    warning: 45 * 60 * 1000, // 45 minutes
    critical: 60 * 60 * 1000, // 60 minutes
  },
  course: {
    appetizer: { warning: 10 * 60 * 1000, critical: 15 * 60 * 1000 },
    starter: { warning: 12 * 60 * 1000, critical: 18 * 60 * 1000 },
    soup: { warning: 10 * 60 * 1000, critical: 15 * 60 * 1000 },
    main: { warning: 20 * 60 * 1000, critical: 30 * 60 * 1000 },
    dessert: { warning: 10 * 60 * 1000, critical: 15 * 60 * 1000 },
    drink: { warning: 5 * 60 * 1000, critical: 8 * 60 * 1000 },
  },
};

// Format duration from milliseconds
function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Get timer status based on elapsed time
function getTimerStatus(
  elapsedMs: number,
  warningMs: number,
  criticalMs: number
): "normal" | "warning" | "critical" {
  if (elapsedMs >= criticalMs) return "critical";
  if (elapsedMs >= warningMs) return "warning";
  return "normal";
}

// Main table timer component
interface TableTimerProps {
  tableNumber: number;
  startedAt: string;
  elapsedMs: number;
  isPaused?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TableTimer({
  tableNumber,
  startedAt,
  elapsedMs,
  isPaused = false,
  size = "md",
  showLabel = true,
  className,
}: TableTimerProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(elapsedMs);

  // Update timer every second if not paused
  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const startTime = new Date(startedAt).getTime();
      const now = Date.now();
      setCurrentElapsed(now - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isPaused]);

  // Sync with external elapsed value
  React.useEffect(() => {
    setCurrentElapsed(elapsedMs);
  }, [elapsedMs]);

  const status = getTimerStatus(
    currentElapsed,
    SLA_THRESHOLDS.table.warning,
    SLA_THRESHOLDS.table.critical
  );

  const statusStyles = {
    normal: "text-foreground",
    warning: "text-warning",
    critical: "text-danger animate-pulse",
  };

  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg font-semibold",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-mono",
        statusStyles[status],
        sizeStyles[size],
        className
      )}
      title={`Стіл ${tableNumber} - час з ${new Date(startedAt).toLocaleTimeString("uk-UA")}`}
    >
      {isPaused ? (
        <Pause className={iconSizes[size]} />
      ) : status === "critical" ? (
        <AlertTriangle className={iconSizes[size]} />
      ) : (
        <Clock className={iconSizes[size]} />
      )}
      {showLabel && <span className="text-muted-foreground font-sans">Стіл:</span>}
      <span>{formatDurationMs(currentElapsed)}</span>
    </div>
  );
}

// Course timer component
interface CourseTimerProps {
  course: CourseType;
  startedAt?: string;
  elapsedMs: number;
  completedAt?: string;
  status: "pending" | "active" | "completed";
  size?: "sm" | "md";
  className?: string;
}

export function CourseTimer({
  course,
  startedAt,
  elapsedMs,
  completedAt,
  status,
  size = "md",
  className,
}: CourseTimerProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(elapsedMs);
  const courseConfig = getCourseConfig(course);
  const threshold = SLA_THRESHOLDS.course[course];

  // Update timer every second if active
  React.useEffect(() => {
    if (status !== "active" || !startedAt) return;

    const interval = setInterval(() => {
      const startTime = new Date(startedAt).getTime();
      const now = Date.now();
      setCurrentElapsed(now - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, status]);

  // Sync with external elapsed value
  React.useEffect(() => {
    setCurrentElapsed(elapsedMs);
  }, [elapsedMs]);

  const timerStatus =
    status === "completed"
      ? "completed"
      : getTimerStatus(currentElapsed, threshold.warning, threshold.critical);

  const Icon = courseConfig.icon;

  const statusStyles = {
    normal: "border-border",
    warning: "border-warning bg-warning/5",
    critical: "border-danger bg-danger/5 animate-pulse",
    completed: "border-success bg-success/5",
  };

  const textStyles = {
    normal: "text-foreground",
    warning: "text-warning",
    critical: "text-danger",
    completed: "text-success",
  };

  const sizeStyles = {
    sm: "p-1.5 text-xs",
    md: "p-2 text-sm",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border",
        statusStyles[timerStatus],
        sizeStyles[size],
        className
      )}
    >
      <Icon
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          courseConfig.color
        )}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{courseConfig.labelUk}</span>
      </div>
      <div className={cn("font-mono", textStyles[timerStatus])}>
        {status === "pending" ? (
          <span className="text-muted-foreground">--:--</span>
        ) : status === "completed" ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            <span>{formatDurationMs(currentElapsed)}</span>
          </div>
        ) : (
          <span>{formatDurationMs(currentElapsed)}</span>
        )}
      </div>
    </div>
  );
}

// Course timeline view
interface CourseTimelineProps {
  courses: Array<{
    courseType: CourseType;
    startedAt?: string;
    completedAt?: string;
    elapsedMs: number;
    status: "pending" | "active" | "completed";
    itemCount: number;
  }>;
  className?: string;
}

export function CourseTimeline({ courses, className }: CourseTimelineProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {courses.map((course) => (
        <div key={course.courseType} className="flex items-center gap-2">
          <CourseTimer
            course={course.courseType}
            startedAt={course.startedAt}
            elapsedMs={course.elapsedMs}
            completedAt={course.completedAt}
            status={course.status}
            size="sm"
            className="flex-1"
          />
          {course.itemCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {course.itemCount}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// SLA indicator badge
interface SLAIndicatorProps {
  elapsedMs: number;
  targetMs: number;
  warningMs: number;
  criticalMs: number;
  label?: string;
  className?: string;
}

export function SLAIndicator({
  elapsedMs,
  targetMs,
  warningMs,
  criticalMs,
  label,
  className,
}: SLAIndicatorProps) {
  const status = getTimerStatus(elapsedMs, warningMs, criticalMs);
  const remainingMs = targetMs - elapsedMs;
  const isOverdue = remainingMs < 0;

  const statusStyles = {
    normal: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    critical: "bg-danger/10 text-danger border-danger/20 animate-pulse",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {status === "normal" ? (
        <Timer className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {label && <span>{label}:</span>}
      <span className="font-mono">
        {isOverdue ? "+" : ""}
        {formatDurationMs(Math.abs(remainingMs))}
      </span>
    </div>
  );
}

// Active items timer summary
interface ActiveItemsTimerProps {
  items: Array<{
    itemDocumentId: string;
    menuItemName: string;
    elapsedMs: number;
    status: string;
    station?: string;
  }>;
  maxDisplay?: number;
  className?: string;
}

export function ActiveItemsTimer({
  items,
  maxDisplay = 3,
  className,
}: ActiveItemsTimerProps) {
  const activeItems = items.filter((item) =>
    ["cooking", "plating"].includes(item.status)
  );

  if (activeItems.length === 0) {
    return null;
  }

  const displayItems = activeItems.slice(0, maxDisplay);
  const remainingCount = activeItems.length - maxDisplay;

  return (
    <div className={cn("space-y-1", className)}>
      {displayItems.map((item) => (
        <div
          key={item.itemDocumentId}
          className="flex items-center justify-between text-xs"
        >
          <span className="truncate max-w-[120px]" title={item.menuItemName}>
            {item.menuItemName}
          </span>
          <span className="font-mono text-muted-foreground">
            {formatDurationMs(item.elapsedMs)}
          </span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount} ще готується
        </span>
      )}
    </div>
  );
}
