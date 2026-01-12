"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { formatDurationMs } from "@/lib/formatters";
import { STATION_DISPLAY_CONFIGS } from "@/lib/config/station-config";
import { TableSessionTimer } from "./table-session-timer";
import { TaskItemRow } from "./task-item-row";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { AllKitchenTableCardProps } from "./types";
import type { StationType } from "@/types/station";

/**
 * All Kitchen Table Card - shows station badges and tasks for one table
 */
export function AllKitchenTableCard({
  group,
  isActive = false,
  isCompleted = false,
  loadingTaskId,
  onTaskStart,
  onTaskComplete,
  onTaskReturn,
  onTaskServed,
}: AllKitchenTableCardProps) {
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

  const hasAllergen = group.tasks.some(hasAllergenModifier);
  const hasRush = group.tasks.some((t) => t.priority === "rush");
  const hasVip = group.tasks.some((t) => t.priority === "vip");
  const hasScheduled = group.tasks.some((t) => t.isScheduled);

  // Get unique stations for this group
  const taskStations = new Set(
    group.tasks.map((t) => t.stationType).filter(Boolean)
  );

  // Check if any task is overdue
  const hasOverdue = group.tasks.some((t) => t.elapsedMs > t.targetCompletionMs);

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
        !isCompleted && hasOverdue && !hasRush && !hasVip && "ring-2 ring-danger/50 bg-danger/5",
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
          hasOverdue && !isCompleted && "bg-danger/10"
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
            Стіл {group.tableNumber}
          </Badge>
          {group.tableOccupiedAt && (
            <TableSessionTimer occupiedAt={group.tableOccupiedAt} />
          )}
          {/* Station badges */}
          {Array.from(taskStations).map((station) => {
            const config = STATION_DISPLAY_CONFIGS[station as StationType];
            if (!config) return null;
            return (
              <Badge
                key={station}
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", config.color)}
              >
                {config.nameUk}
              </Badge>
            );
          })}
          {hasRush && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Терміново
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
            {group.tasks.length} страв
          </Badge>
          {isCompleted && (
            <div className={cn("font-mono text-xs flex items-center gap-1", pickupTimerColor)}>
              <Clock className="h-3 w-3" />
              {formatDurationMs(pickupWait)}
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
