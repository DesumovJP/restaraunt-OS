"use client";

/**
 * useTaskTimers Hook
 *
 * Shared hook for task timer logic used across TaskCard and TaskItemRow.
 * Handles queue wait, cooking time, and pickup wait timers.
 */

import * as React from "react";
import {
  type StationTask,
  QUEUE_THRESHOLDS,
  PICKUP_THRESHOLDS,
  COOKING_WARNING_PERCENT,
} from "../station-queue-config";

export interface TaskTimerState {
  // Timer values (in ms)
  queueWait: number;
  cookingElapsed: number;
  pickupWait: number;

  // Status flags
  isQueueWarning: boolean;
  isQueueOverdue: boolean;
  isCookingWarning: boolean;
  isCookingOverdue: boolean;
  isPickupWarning: boolean;
  isPickupOverdue: boolean;

  // Color classes
  queueTimerColor: string;
  cookingTimerColor: string;
  pickupTimerColor: string;
}

interface UseTaskTimersOptions {
  task: StationTask;
  isActive: boolean;
  isCompleted: boolean;
}

/**
 * Hook for managing task timers with automatic updates
 */
export function useTaskTimers({
  task,
  isActive,
  isCompleted,
}: UseTaskTimersOptions): TaskTimerState {
  const isPending = !isActive && !isCompleted;

  const [queueWait, setQueueWait] = React.useState(0);
  const [cookingElapsed, setCookingElapsed] = React.useState(task.elapsedMs);
  const [pickupWait, setPickupWait] = React.useState(0);

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

  // Update timer for active tasks (cooking time)
  React.useEffect(() => {
    if (!isActive) return;

    // Use backend startedAt timestamp for accurate time across all clients
    const startedTime = task.startedAt
      ? new Date(task.startedAt).getTime()
      : Date.now();
    setCookingElapsed(Date.now() - startedTime);

    const interval = setInterval(() => {
      setCookingElapsed(Date.now() - startedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, task.startedAt]);

  // Update pickup wait timer for completed tasks
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTime = task.readyAt
      ? new Date(task.readyAt).getTime()
      : Date.now();
    setPickupWait(Date.now() - readyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - readyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, task.readyAt]);

  // Calculate queue status
  const isQueueOverdue = queueWait > QUEUE_THRESHOLDS.overdueMs;
  const isQueueWarning = !isQueueOverdue && queueWait > QUEUE_THRESHOLDS.warningMs;
  const queueTimerColor = isQueueOverdue
    ? "text-danger font-bold"
    : isQueueWarning
      ? "text-warning"
      : "text-muted-foreground";

  // Calculate cooking status
  const isCookingOverdue = cookingElapsed > task.targetCompletionMs;
  const isCookingWarning =
    !isCookingOverdue &&
    cookingElapsed > task.targetCompletionMs * COOKING_WARNING_PERCENT;
  const cookingTimerColor = isCookingOverdue
    ? "text-danger font-bold"
    : isCookingWarning
      ? "text-warning"
      : "text-primary";

  // Calculate pickup status
  const isPickupOverdue = pickupWait > PICKUP_THRESHOLDS.overdueMs;
  const isPickupWarning =
    !isPickupOverdue && pickupWait > PICKUP_THRESHOLDS.warningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  return {
    queueWait,
    cookingElapsed,
    pickupWait,
    isQueueWarning,
    isQueueOverdue,
    isCookingWarning,
    isCookingOverdue,
    isPickupWarning,
    isPickupOverdue,
    queueTimerColor,
    cookingTimerColor,
    pickupTimerColor,
  };
}

/**
 * Hook for managing group-level pickup timer
 */
export function useGroupPickupTimer(
  tasks: StationTask[],
  isCompleted: boolean
): {
  pickupWait: number;
  isPickupWarning: boolean;
  isPickupOverdue: boolean;
  pickupTimerColor: string;
} {
  const [pickupWait, setPickupWait] = React.useState(0);

  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    // Get the oldest ready time (longest waiting)
    const readyTimes = tasks
      .map((t) => (t.readyAt ? new Date(t.readyAt).getTime() : Date.now()))
      .filter((t) => !isNaN(t));

    const oldestReadyTime =
      readyTimes.length > 0 ? Math.min(...readyTimes) : Date.now();
    setPickupWait(Date.now() - oldestReadyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - oldestReadyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, tasks]);

  const isPickupOverdue = pickupWait > PICKUP_THRESHOLDS.overdueMs;
  const isPickupWarning =
    !isPickupOverdue && pickupWait > PICKUP_THRESHOLDS.warningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  return {
    pickupWait,
    isPickupWarning,
    isPickupOverdue,
    pickupTimerColor,
  };
}
