"use client";

import { cn } from "@/lib/utils";
import { TaskStatus, TASK_STATUS_LABELS } from "@/types/daily-tasks";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ElementType; className: string }
> = {
  pending: {
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    icon: PlayCircle,
    className: "bg-accent/10 text-accent border-accent/30",
  },
  completed: {
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/30",
  },
  cancelled: {
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-border line-through",
  },
  overdue: {
    icon: AlertTriangle,
    className: "bg-error/10 text-error border-error/30",
  },
};

const sizeConfig = {
  sm: "text-xs px-1.5 py-0.5 gap-1",
  md: "text-sm px-2 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

const iconSizeConfig = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const label = TASK_STATUS_LABELS[status].uk;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.className,
        sizeConfig[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizeConfig[size]} />}
      <span>{label}</span>
    </span>
  );
}
