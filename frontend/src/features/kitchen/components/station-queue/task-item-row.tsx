"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Check, AlertTriangle, Flame, Users, Timer, RefreshCw, Loader2 } from "lucide-react";
import { CourseBadge } from "@/features/orders/course-selector";
import { CommentDisplay } from "@/features/orders/comment-editor";
import { formatDurationMs } from "@/lib/formatters";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { TaskItemRowProps } from "./types";

/**
 * Single task row within a table group
 * Optimized for mobile with touch-friendly targets and responsive typography
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
        "px-3 sm:px-4 py-3 sm:py-2.5 transition-all",
        task.priority === "rush" && "bg-danger/5",
        task.priority === "vip" && "bg-warning/5",
        isQueueOverdue && isPending && "bg-warning/10",
        isOverdue && isActive && "bg-danger/10",
        isPickupOverdue && isCompleted && "bg-danger/10"
      )}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Quantity badge - prominent, larger for touch */}
        <div className="flex-shrink-0">
          <span className={cn(
            "inline-flex items-center justify-center font-bold tabular-nums",
            "w-8 h-8 sm:w-7 sm:h-7 rounded-xl text-sm",
            "bg-primary/15 text-primary shadow-sm"
          )}>
            {task.quantity}
          </span>
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          {/* Name and badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm sm:text-base leading-tight text-foreground">{task.menuItemName}</span>
            <CourseBadge course={task.courseType} size="sm" />
            {hasAllergen && (
              <Badge variant="destructive" className="h-5 px-1.5 gap-1 text-[9px] sm:text-[10px]">
                <AlertTriangle className="h-3 w-3" />
                <span className="hidden sm:inline">Алерген</span>
              </Badge>
            )}
          </div>

          {/* Modifiers */}
          {task.modifiers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {task.modifiers.join(" • ")}
            </p>
          )}

          {/* Comment */}
          {task.comment && (
            <div className="mt-1.5">
              <CommentDisplay comment={task.comment} size="sm" />
            </div>
          )}

          {/* Chef assignment */}
          {task.assignedChefName && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="truncate">{task.assignedChefName}</span>
            </div>
          )}
        </div>

        {/* Timer column - larger and clearer */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs transition-colors",
            isPending && "bg-slate-100/80",
            isActive && (isOverdue ? "bg-danger/15" : "bg-primary/10"),
            isCompleted && (isPickupOverdue ? "bg-danger/15" : "bg-success/15")
          )}
        >
          {isPending && (
            <>
              <Clock className={cn("h-4 w-4 flex-shrink-0", queueTimerColor)} />
              <div className="flex flex-col items-end min-w-[44px]">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-none mb-0.5">в черзі</span>
                <span className={cn("font-mono font-bold text-xs leading-tight tabular-nums", queueTimerColor)}>
                  {formatDurationMs(queueWait)}
                </span>
              </div>
            </>
          )}
          {isActive && (
            <>
              <Flame className={cn("h-4 w-4 flex-shrink-0", isOverdue && "animate-pulse", timerColor)} />
              <div className="flex flex-col items-end min-w-[44px]">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-none mb-0.5">готується</span>
                <span className={cn("font-mono font-bold text-xs leading-tight tabular-nums", timerColor)}>
                  {formatDurationMs(currentElapsed)}
                </span>
              </div>
            </>
          )}
          {isCompleted && (
            <>
              <Timer className={cn("h-4 w-4 flex-shrink-0", isPickupOverdue && "animate-pulse", pickupTimerColor)} />
              <div className="flex flex-col items-end min-w-[44px]">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-none mb-0.5">очікує</span>
                <span className={cn("font-mono font-bold text-xs leading-tight tabular-nums", pickupTimerColor)}>
                  {formatDurationMs(pickupWait)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions row - Full width buttons on mobile for better touch targets */}
      <div className="flex items-center justify-end gap-2.5 mt-3 sm:mt-2">
        {!isActive && !isCompleted && onStart && (
          <Button
            size="sm"
            className={cn(
              "h-11 sm:h-9 px-5 sm:px-4 text-sm sm:text-xs font-semibold rounded-xl",
              "touch-feedback active:scale-[0.97] transition-all",
              "shadow-md hover:shadow-lg"
            )}
            onClick={onStart}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Запуск..." : "Почати"}
          </Button>
        )}
        {isActive && onComplete && (
          <Button
            size="sm"
            variant="default"
            className={cn(
              "h-11 sm:h-9 px-5 sm:px-4 text-sm sm:text-xs font-semibold rounded-xl",
              "touch-feedback active:scale-[0.97] transition-all",
              "bg-success hover:bg-success/90 shadow-md hover:shadow-lg"
            )}
            onClick={onComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "..." : "Готово"}
          </Button>
        )}
        {isCompleted && (
          <div className="flex items-center gap-2.5">
            {onReturn && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-11 sm:h-9 w-11 sm:w-auto sm:px-4 text-xs font-medium rounded-xl",
                  "touch-feedback active:scale-[0.97] transition-all"
                )}
                onClick={onReturn}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span className="ml-2 hidden sm:inline">{isLoading ? "..." : "Повернути"}</span>
              </Button>
            )}
            {onServed && (
              <Button
                size="sm"
                variant="default"
                className={cn(
                  "h-11 sm:h-9 px-5 sm:px-4 text-sm sm:text-xs font-semibold rounded-xl",
                  "touch-feedback active:scale-[0.97] transition-all",
                  "bg-success hover:bg-success/90 shadow-md hover:shadow-lg"
                )}
                onClick={onServed}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "..." : "Видано"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
