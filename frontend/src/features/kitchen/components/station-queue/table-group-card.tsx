"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Timer, Calendar } from "lucide-react";
import { formatDurationMs } from "@/lib/formatters";
import { TableSessionTimer } from "./table-session-timer";
import { TaskItemRow } from "./task-item-row";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { TableGroupCardProps } from "./types";

/**
 * Grouped table card - shows all tasks for one table
 */
export function TableGroupCard({
  group,
  isActive = false,
  isCompleted = false,
  loadingTaskId,
  onTaskStart,
  onTaskComplete,
  onTaskReturn,
  onTaskServed,
}: TableGroupCardProps) {
  const [pickupWait, setPickupWait] = React.useState(0);

  // Track pickup wait time for completed groups
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTimes = group.tasks
      .map((t) => (t.readyAt ? new Date(t.readyAt).getTime() : Date.now()))
      .filter((t) => !isNaN(t));

    const oldestReadyTime = readyTimes.length > 0 ? Math.min(...readyTimes) : Date.now();
    setPickupWait(Date.now() - oldestReadyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - oldestReadyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, group.tasks]);

  // Check if any task has allergen
  const hasAllergen = group.tasks.some(hasAllergenModifier);

  // Check if any task is rush/vip/scheduled
  const hasRush = group.tasks.some((t) => t.priority === "rush");
  const hasVip = group.tasks.some((t) => t.priority === "vip");
  const hasScheduled = group.tasks.some((t) => t.isScheduled);

  // Get max elapsed time for the group header
  const maxElapsedMs = Math.max(...group.tasks.map((t) => t.elapsedMs));
  const maxTargetMs = Math.max(...group.tasks.map((t) => t.targetCompletionMs));
  const isOverdue = maxElapsedMs > maxTargetMs;
  const isWarning = !isOverdue && maxElapsedMs > maxTargetMs * 0.8;
  const timerColor = isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-foreground";

  // Pickup wait status
  const isPickupOverdue = pickupWait > TIMER_THRESHOLDS.pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > TIMER_THRESHOLDS.pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  return (
    <div
      className={cn(
        "rounded-lg border transition-all overflow-hidden",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/5 border-danger"
            : "bg-success/5 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && hasRush && "ring-2 ring-danger",
        !isCompleted && hasVip && !hasRush && "ring-2 ring-warning",
        !isCompleted && isOverdue && !hasRush && !hasVip && "ring-2 ring-danger/50 bg-danger/5",
        isCompleted && isPickupOverdue && "ring-2 ring-danger"
      )}
    >
      {/* Table Header */}
      <div
        className={cn(
          "px-3 py-2 border-b flex items-center justify-between",
          isCompleted
            ? isPickupOverdue
              ? "bg-danger/10"
              : "bg-success/10"
            : isActive
              ? "bg-primary/10"
              : "bg-muted/50",
          isOverdue && !isCompleted && "bg-danger/10"
        )}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
            Стіл {group.tableNumber}
          </Badge>
          {group.tableOccupiedAt && (
            <TableSessionTimer occupiedAt={group.tableOccupiedAt} />
          )}
          {hasRush && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Терміново
            </Badge>
          )}
          {hasVip && !hasRush && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              VIP
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {hasScheduled && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-0.5 border-purple-300 text-purple-700 bg-purple-50"
            >
              <Calendar className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {group.tasks.length}{" "}
            {group.tasks.length === 1
              ? "страва"
              : group.tasks.length < 5
                ? "страви"
                : "страв"}
          </Badge>
          {isCompleted ? (
            <div className={cn("font-mono text-xs flex items-center gap-1", pickupTimerColor)}>
              <Clock className="h-3 w-3" />
              {formatDurationMs(pickupWait)}
            </div>
          ) : (
            <div className={cn("font-mono text-xs flex items-center gap-1", timerColor)}>
              <Timer className="h-3 w-3" />
              {formatDurationMs(maxElapsedMs)}
            </div>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div className="divide-y">
        {group.tasks.map((task) => (
          <TaskItemRow
            key={task.documentId}
            task={task}
            isActive={isActive}
            isCompleted={isCompleted}
            isLoading={loadingTaskId === task.documentId}
            onStart={onTaskStart ? () => onTaskStart(task.documentId) : undefined}
            onComplete={onTaskComplete ? () => onTaskComplete(task.documentId) : undefined}
            onReturn={onTaskReturn ? () => onTaskReturn(task.documentId) : undefined}
            onServed={onTaskServed ? () => onTaskServed(task.documentId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
