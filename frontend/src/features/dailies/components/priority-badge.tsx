"use client";

import { cn } from "@/lib/utils";
import { TaskPriority, TASK_PRIORITY_LABELS } from "@/types/daily-tasks";

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { color: string; dot: string }> = {
  low: {
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  normal: {
    color: "text-foreground",
    dot: "bg-foreground",
  },
  high: {
    color: "text-warning",
    dot: "bg-warning",
  },
  urgent: {
    color: "text-error",
    dot: "bg-error animate-pulse",
  },
};

const sizeConfig = {
  sm: { text: "text-xs", dot: "h-1.5 w-1.5", gap: "gap-1" },
  md: { text: "text-sm", dot: "h-2 w-2", gap: "gap-1.5" },
  lg: { text: "text-base", dot: "h-2.5 w-2.5", gap: "gap-2" },
};

export function PriorityBadge({
  priority,
  size = "md",
  showLabel = true,
  className,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const sizes = sizeConfig[size];
  const label = TASK_PRIORITY_LABELS[priority].uk;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        config.color,
        sizes.text,
        sizes.gap,
        className
      )}
    >
      <span className={cn("rounded-full", config.dot, sizes.dot)} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// Simple icon variant for compact displays
export function PriorityDot({
  priority,
  size = "md",
  className,
}: Omit<PriorityBadgeProps, "showLabel">) {
  const config = priorityConfig[priority];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn("rounded-full", config.dot, sizes.dot, className)}
      title={TASK_PRIORITY_LABELS[priority].uk}
    />
  );
}
