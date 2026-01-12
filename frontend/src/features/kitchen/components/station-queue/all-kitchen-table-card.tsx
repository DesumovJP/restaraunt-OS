"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar, ChevronDown } from "lucide-react";
import { formatDurationMs } from "@/lib/formatters";
import { STATION_DISPLAY_CONFIGS } from "@/lib/config/station-config";
import { TableSessionTimer } from "./table-session-timer";
import { TaskItemRow } from "./task-item-row";
import { TIMER_THRESHOLDS, hasAllergenModifier } from "./utils";
import type { AllKitchenTableCardProps } from "./types";
import type { StationType } from "@/types/station";

/**
 * All Kitchen Table Card - shows station badges and tasks for one table
 * Optimized for mobile with collapsible content and touch-friendly design
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
        "rounded-xl border transition-all overflow-hidden shadow-sm",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/5 border-danger/50"
            : "bg-success/5 border-success/30"
          : isActive
            ? "bg-primary/5 border-primary/30"
            : "bg-white border-slate-200 hover:border-primary/30",
        !isCompleted && hasRush && "ring-2 ring-danger shadow-danger/20",
        !isCompleted && hasVip && !hasRush && "ring-2 ring-warning shadow-warning/20",
        !isCompleted && hasOverdue && !hasRush && !hasVip && "ring-2 ring-danger/40 bg-danger/5",
        isCompleted && isPickupOverdue && "ring-2 ring-danger shadow-danger/20"
      )}
    >
      {/* Table Header - Tap to collapse/expand */}
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
          hasOverdue && !isCompleted && "bg-danger/10 border-danger/20"
        )}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap flex-1 min-w-0">
          {/* Table number - larger touch area */}
          <Badge
            variant="secondary"
            className={cn(
              "text-sm px-2.5 sm:px-3 py-1 sm:py-0.5 font-bold flex-shrink-0 rounded-lg",
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

          {/* Station badges - Compact on mobile */}
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from(taskStations).slice(0, 3).map((station) => {
              const config = STATION_DISPLAY_CONFIGS[station as StationType];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <Badge
                  key={station}
                  variant="outline"
                  className={cn(
                    "text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 gap-0.5",
                    config.color
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{config.nameUk}</span>
                </Badge>
              );
            })}
            {taskStations.size > 3 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                +{taskStations.size - 3}
              </Badge>
            )}
          </div>

          {/* Priority badges */}
          {hasRush && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 animate-pulse">
              Терміново
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {hasScheduled && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 gap-0.5 border-purple-300 text-purple-700 bg-purple-50"
            >
              <Calendar className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Task count */}
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-6 bg-white/80 font-medium rounded-lg">
            {group.tasks.length}
          </Badge>

          {/* Timer for completed */}
          {isCompleted && (
            <div className={cn(
              "font-mono text-sm flex items-center gap-1.5 tabular-nums px-2 py-1 rounded-lg",
              isPickupOverdue ? "bg-danger/15" : "bg-success/15",
              pickupTimerColor
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatDurationMs(pickupWait)}
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
