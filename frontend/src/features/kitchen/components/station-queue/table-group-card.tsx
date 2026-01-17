"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Timer, Calendar, ChevronDown } from "lucide-react";
import { formatDurationMs } from "@/lib/formatters";
import { TableSessionTimer } from "./table-session-timer";
import { TaskItemRow } from "./task-item-row";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { TableGroupCardProps } from "./types";

/**
 * Grouped table card - shows all tasks for one table
 * iOS-level design with smooth animations and responsive layout
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
  const [isExpanded, setIsExpanded] = React.useState(true);

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
        "rounded-xl border transition-all overflow-hidden shadow-sm",
        // Background and border based on state
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/5 border-danger/50"
            : "bg-success/5 border-success/30"
          : isActive
            ? "bg-primary/5 border-primary/30"
            : "bg-white border-slate-200 hover:border-primary/30",
        // Ring for priority
        !isCompleted && hasRush && "ring-2 ring-danger shadow-danger/20",
        !isCompleted && hasVip && !hasRush && "ring-2 ring-warning shadow-warning/20",
        !isCompleted && isOverdue && !hasRush && !hasVip && "ring-2 ring-danger/40 bg-danger/5",
        isCompleted && isPickupOverdue && "ring-2 ring-danger shadow-danger/20"
      )}
    >
      {/* Table Header - Tap to collapse/expand on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-3 sm:px-4 py-3 sm:py-2.5 border-b flex items-center justify-between gap-2",
          "touch-feedback active:bg-muted/50 transition-colors min-h-[52px] sm:min-h-[44px]",
          isCompleted
            ? isPickupOverdue
              ? "bg-danger/10 border-danger/20"
              : "bg-success/10 border-success/20"
            : isActive
              ? "bg-primary/10 border-primary/20"
              : "bg-slate-50/80 border-slate-100",
          isOverdue && !isCompleted && "bg-danger/10 border-danger/20"
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Table number - prominent with larger touch area */}
          <Badge
            variant="secondary"
            className={cn(
              "text-sm sm:text-sm px-2.5 sm:px-3 py-1 sm:py-0.5 font-bold rounded-lg",
              isCompleted && !isPickupOverdue && "bg-success/20 text-success-foreground",
              isPickupOverdue && "bg-danger/20 text-danger"
            )}
          >
            Стіл {group.tableNumber}
          </Badge>

          {/* Session timer */}
          {group.tableOccupiedAt && (
            <TableSessionTimer occupiedAt={group.tableOccupiedAt} />
          )}

          {/* Priority badges */}
          {hasRush && (
            <Badge variant="destructive" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-5 animate-pulse">
              Терміново
            </Badge>
          )}
          {hasVip && !hasRush && (
            <Badge variant="default" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-5 bg-amber-500">
              VIP
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[9px] sm:text-[10px] px-1 py-0 h-5 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {hasScheduled && (
            <Badge
              variant="outline"
              className="text-[9px] sm:text-[10px] px-1.5 py-0 h-5 gap-0.5 border-purple-300 text-purple-700 bg-purple-50"
            >
              <Calendar className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Task count */}
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-6 bg-white/80 font-medium rounded-lg">
            {group.tasks.length}
            <span className="ml-1 hidden xs:inline">
              {group.tasks.length === 1
                ? "страва"
                : group.tasks.length < 5
                  ? "страви"
                  : "страв"}
            </span>
          </Badge>

          {/* Timer - more prominent */}
          {isCompleted ? (
            <div className={cn(
              "font-mono text-sm flex items-center gap-1.5 tabular-nums px-2 py-1 rounded-lg",
              isPickupOverdue ? "bg-danger/15" : "bg-success/15",
              pickupTimerColor
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatDurationMs(pickupWait)}
            </div>
          ) : (
            <div className={cn(
              "font-mono text-sm flex items-center gap-1.5 tabular-nums px-2 py-1 rounded-lg",
              isOverdue ? "bg-danger/15" : isWarning ? "bg-warning/15" : "bg-muted/40",
              timerColor
            )}>
              <Timer className="h-3.5 w-3.5" />
              {formatDurationMs(maxElapsedMs)}
            </div>
          )}

          {/* Expand/collapse indicator */}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              !isExpanded && "-rotate-90"
            )}
          />
        </div>
      </button>

      {/* Tasks list - Collapsible */}
      <div
        className={cn(
          "transition-all duration-200 ease-out overflow-hidden",
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="divide-y divide-slate-100">
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
    </div>
  );
}
