"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Check,
  AlertTriangle,
  Flame,
  Users,
  Timer,
  RefreshCw,
  Calendar,
  Undo2,
} from "lucide-react";
import { CourseBadge } from "@/features/orders/course-selector";
import { CommentDisplay } from "@/features/orders/comment-editor";
import { formatDurationMs } from "@/lib/formatters";
import { TableSessionTimer } from "./table-session-timer";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { TaskCardProps } from "./types";

/**
 * Standalone task card - shows a single task with full details
 */
export function TaskCard({
  task,
  isActive = false,
  isCompleted = false,
  onStart,
  onComplete,
  onReturn,
  onServed,
  onRecall,
}: TaskCardProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(task.elapsedMs);
  const [pickupWait, setPickupWait] = React.useState(0);
  const [queueWait, setQueueWait] = React.useState(0);
  const isPending = !isActive && !isCompleted;

  // Update timer for pending tasks
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

  // Update timer for active tasks
  React.useEffect(() => {
    if (!isActive) return;

    const startedTime = task.startedAt ? new Date(task.startedAt).getTime() : Date.now();
    setCurrentElapsed(Date.now() - startedTime);

    const interval = setInterval(() => {
      setCurrentElapsed(Date.now() - startedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, task.startedAt]);

  // Update pickup wait timer
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
        "p-2.5 rounded-lg border transition-all",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/10 border-danger"
            : "bg-success/10 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && task.priority === "rush" && "ring-2 ring-danger",
        !isCompleted && task.priority === "vip" && "ring-2 ring-warning",
        isOverdue && isActive && "bg-danger/10 border-danger",
        isPickupOverdue && isCompleted && "ring-2 ring-danger"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
            <span>Стіл {task.tableNumber}</span>
            {task.tableOccupiedAt && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <TableSessionTimer occupiedAt={task.tableOccupiedAt} />
              </>
            )}
          </Badge>
          <CourseBadge course={task.courseType} size="sm" />
          {task.priority !== "normal" && (
            <Badge
              variant={task.priority === "rush" ? "destructive" : "default"}
              className="text-[10px] px-1.5 py-0"
            >
              {task.priority === "rush" ? "Терміново" : "VIP"}
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {task.isScheduled && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-0.5 border-purple-300 text-purple-700 bg-purple-50"
            >
              <Calendar className="h-2.5 w-2.5" />
              Заплановане
            </Badge>
          )}
        </div>

        {/* Phase-specific timer */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
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
      </div>

      {/* Item info */}
      <div className="flex items-start gap-2">
        <span className="font-bold text-primary">{task.quantity}x</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{task.menuItemName}</h4>
          {task.modifiers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {task.modifiers.join(", ")}
            </p>
          )}
          {task.comment && (
            <div className="mt-1">
              <CommentDisplay comment={task.comment} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Assigned chef */}
      {task.assignedChefName && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {task.assignedChefName}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {!isActive && !isCompleted && (
          <>
            {onRecall && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={onRecall}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Відкликати
              </Button>
            )}
            {onStart && (
              <Button size="sm" className="h-7 text-xs" onClick={onStart}>
                <Play className="h-3 w-3 mr-1" />
                Почати
              </Button>
            )}
          </>
        )}
        {isActive && (
          <>
            {onRecall && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={onRecall}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Відкликати
              </Button>
            )}
            {onComplete && (
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={onComplete}>
                <Check className="h-3 w-3 mr-1" />
                Готово
              </Button>
            )}
          </>
        )}
        {isCompleted && (
          <>
            {onReturn && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onReturn}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Повернути
              </Button>
            )}
            {onServed && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-success hover:bg-success/90"
                onClick={onServed}
              >
                <Check className="h-3 w-3 mr-1" />
                Видано
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
