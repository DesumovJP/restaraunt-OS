"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock, Play, Check, AlertTriangle, Flame, Users, Timer, RefreshCw } from "lucide-react";
import { CourseBadge } from "@/features/orders/course-selector";
import { CommentDisplay } from "@/features/orders/comment-editor";
import { formatDurationMs } from "@/lib/formatters";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { TaskItemRowProps } from "./types";

/**
 * Single task row within a table group
 * Shows item details with phase-specific timer
 */
export function TaskItemRow({
  task,
  isActive = false,
  isCompleted = false,
  isLoading = false,
  onStart,
  onComplete,
  onReturn,
  onServed,
}: TaskItemRowProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(task.elapsedMs);
  const [pickupWait, setPickupWait] = React.useState(0);
  const [queueWait, setQueueWait] = React.useState(0);
  const isPending = !isActive && !isCompleted;

  // Update timer for pending tasks (queue wait time)
  React.useEffect(() => {
    if (!isPending) {
      setQueueWait(0);
      return;
    }

    const createdTime = new Date(task.createdAt).getTime();
    setQueueWait(Date.now() - createdTime);

    const interval = setInterval(() => {
      setQueueWait(Date.now() - createdTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPending, task.createdAt]);

  // Update timer for active tasks (calculate from backend startedAt timestamp)
  React.useEffect(() => {
    if (!isActive) return;

    const startedTime = task.startedAt ? new Date(task.startedAt).getTime() : Date.now();
    setCurrentElapsed(Date.now() - startedTime);

    const interval = setInterval(() => {
      setCurrentElapsed(Date.now() - startedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, task.startedAt]);

  // Update pickup wait timer for completed tasks
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTime = task.readyAt ? new Date(task.readyAt).getTime() : Date.now();
    setPickupWait(Date.now() - readyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - readyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, task.readyAt]);

  // Queue wait status
  const isQueueOverdue = queueWait > TIMER_THRESHOLDS.queueOverdueMs;
  const isQueueWarning = !isQueueOverdue && queueWait > TIMER_THRESHOLDS.queueWarningMs;
  const queueTimerColor = isQueueOverdue
    ? "text-danger font-bold"
    : isQueueWarning
      ? "text-warning"
      : "text-muted-foreground";

  // Cooking time status
  const isOverdue = currentElapsed > task.targetCompletionMs;
  const isWarning = !isOverdue && currentElapsed > task.targetCompletionMs * 0.8;
  const timerColor = isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-primary";

  // Pickup wait status
  const isPickupOverdue = pickupWait > TIMER_THRESHOLDS.pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > TIMER_THRESHOLDS.pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  const hasAllergen = hasAllergenModifier(task);

  return (
    <div
      className={cn(
        "px-3 py-2 flex items-center gap-3",
        task.priority === "rush" && "bg-danger/5",
        task.priority === "vip" && "bg-warning/5",
        isQueueOverdue && isPending && "bg-warning/10",
        isOverdue && isActive && "bg-danger/10",
        isPickupOverdue && isCompleted && "bg-danger/10"
      )}
    >
      {/* Quantity & Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-sm">{task.quantity}x</span>
          <span className="font-medium text-sm truncate">{task.menuItemName}</span>
          <CourseBadge course={task.courseType} size="sm" />
          {hasAllergen && (
            <AlertTriangle className="h-3 w-3 text-danger shrink-0" />
          )}
        </div>
        {(task.modifiers.length > 0 || task.comment) && (
          <div className="mt-0.5 flex items-center gap-2">
            {task.modifiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {task.modifiers.join(", ")}
              </p>
            )}
            {task.comment && (
              <CommentDisplay comment={task.comment} size="sm" />
            )}
          </div>
        )}
        {task.assignedChefName && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {task.assignedChefName}
          </div>
        )}
      </div>

      {/* Phase-specific timer with label */}
      <div
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
          isPending && "bg-muted/50",
          isActive && (isOverdue ? "bg-danger/10" : "bg-primary/10"),
          isCompleted && (isPickupOverdue ? "bg-danger/10" : "bg-success/10")
        )}
      >
        {isPending && (
          <>
            <Clock className={cn("h-3.5 w-3.5", queueTimerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">в черзі</span>
              <span className={cn("font-mono font-medium leading-none", queueTimerColor)}>
                {formatDurationMs(queueWait)}
              </span>
            </div>
          </>
        )}
        {isActive && (
          <>
            <Flame className={cn("h-3.5 w-3.5", timerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">готується</span>
              <span className={cn("font-mono font-medium leading-none", timerColor)}>
                {formatDurationMs(currentElapsed)}
              </span>
            </div>
          </>
        )}
        {isCompleted && (
          <>
            <Timer className={cn("h-3.5 w-3.5", pickupTimerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">очікує</span>
              <span className={cn("font-mono font-medium leading-none", pickupTimerColor)}>
                {formatDurationMs(pickupWait)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isActive && !isCompleted && onStart && (
          <Button size="sm" className="h-7 text-xs" onClick={onStart} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {isLoading ? "..." : "Почати"}
          </Button>
        )}
        {isActive && onComplete && (
          <Button size="sm" variant="default" className="h-7 text-xs" onClick={onComplete} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            {isLoading ? "..." : "Готово"}
          </Button>
        )}
        {isCompleted && (
          <>
            {onReturn && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onReturn} disabled={isLoading}>
                <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                {isLoading ? "..." : "Повернути"}
              </Button>
            )}
            {onServed && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-success hover:bg-success/90"
                onClick={onServed}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                {isLoading ? "..." : "Видано"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
