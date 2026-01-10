"use client";

import { cn } from "@/lib/utils";
import {
  DailyTask,
  isTaskOverdue,
  formatTaskTime,
} from "@/types/daily-tasks";
import { useAuthStore } from "@/stores/auth-store";
import { getTaskPermissions } from "@/lib/task-permissions";
import { PriorityDot } from "./priority-badge";
import { CategoryIcon } from "./category-icon";
import { Button } from "@/components/ui/button";
import {
  Play,
  Check,
  Clock,
  Timer,
  Loader2,
} from "lucide-react";

interface PinnedTaskCardProps {
  task: DailyTask;
  onStart?: () => void;
  onComplete?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Compact pinned task card for quick access
 * Shows minimal info with quick action buttons
 */
export function PinnedTaskCard({
  task,
  onStart,
  onComplete,
  loading = false,
  className,
}: PinnedTaskCardProps) {
  const user = useAuthStore((state) => state.user);

  const permissions = user
    ? getTaskPermissions(user.documentId, user.systemRole, task)
    : {
        canEdit: false,
        canStart: false,
        canComplete: false,
        isAssignee: false,
      };

  const isOverdue = isTaskOverdue(task);
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";

  // Get border/background colors
  const getCardStyles = () => {
    if (isCompleted) return "bg-success/10 border-success/30";
    if (isInProgress) return "bg-primary/10 border-primary/30 ring-2 ring-primary/20";
    if (isOverdue) return "bg-error/10 border-error/30";
    if (task.priority === "urgent") return "bg-error/5 border-error/20";
    if (task.priority === "high") return "bg-warning/5 border-warning/20";
    return "bg-card border-border hover:border-primary/30";
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border transition-all",
        "min-w-[200px] max-w-[280px]",
        getCardStyles(),
        isCompleted && "opacity-60",
        className
      )}
    >
      {/* Priority indicator */}
      <PriorityDot priority={task.priority} size="sm" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <CategoryIcon category={task.category} size="xs" />
          <h4
            className={cn(
              "text-sm font-medium truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {/* Time info */}
          {task.dueTime && (
            <span className={cn("flex items-center gap-0.5", isOverdue && "text-error")}>
              <Clock className="h-3 w-3" />
              {task.dueTime.slice(0, 5)}
            </span>
          )}

          {/* Duration */}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5">
              <Timer className="h-3 w-3" />
              {formatTaskTime(task.estimatedMinutes)}
            </span>
          )}

          {/* In progress indicator */}
          {isInProgress && (
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <Play className="h-3 w-3 fill-current" />
              В роботі
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="shrink-0">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : isPending && permissions.canStart && onStart ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            onClick={onStart}
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : isInProgress && permissions.canComplete && onComplete ? (
          <Button
            size="icon"
            variant="default"
            className="h-8 w-8"
            onClick={onComplete}
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : isCompleted ? (
          <Check className="h-5 w-5 text-success" />
        ) : null}
      </div>
    </div>
  );
}
