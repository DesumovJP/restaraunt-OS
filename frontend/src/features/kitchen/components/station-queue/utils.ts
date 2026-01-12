/**
 * Station Queue Utilities
 *
 * Helper functions for grouping and formatting tasks
 */

import type { StationType } from "@/types/station";
import type { StationTask, TableTaskGroup, TableTaskGroupWithStation } from "./types";

// ==========================================
// GROUPING FUNCTIONS
// ==========================================

/**
 * Group tasks by table number, sorted by priority
 */
export function groupTasksByTable(tasks: StationTask[]): TableTaskGroup[] {
  const groups: Record<number, TableTaskGroup> = {};

  tasks.forEach((task) => {
    if (!groups[task.tableNumber]) {
      groups[task.tableNumber] = {
        tableNumber: task.tableNumber,
        tableOccupiedAt: task.tableOccupiedAt,
        tasks: [],
      };
    }
    groups[task.tableNumber].tasks.push(task);
  });

  // Sort groups by highest priority task
  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map((t) => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map((t) => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

/**
 * Group tasks by table number with station type info
 */
export function groupTasksByTableWithStation(
  tasks: StationTask[]
): TableTaskGroupWithStation[] {
  const groups: Record<number, TableTaskGroupWithStation> = {};

  tasks.forEach((task) => {
    if (!groups[task.tableNumber]) {
      groups[task.tableNumber] = {
        tableNumber: task.tableNumber,
        tableOccupiedAt: task.tableOccupiedAt,
        tasks: [],
        stationTypes: new Set(),
      };
    }
    groups[task.tableNumber].tasks.push(task);
    if (task.stationType) {
      groups[task.tableNumber].stationTypes.add(task.stationType);
    }
  });

  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map((t) => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map((t) => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

// ==========================================
// FORMATTING FUNCTIONS
// ==========================================

/**
 * Format table session time (how long table has been occupied)
 */
export function formatTableTime(occupiedAt: string): string {
  const start = new Date(occupiedAt).getTime();
  const now = Date.now();
  const diff = now - start;

  if (isNaN(diff) || diff < 0) return "";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}г ${minutes}хв`;
  }
  return `${minutes}хв`;
}

// ==========================================
// TIMER THRESHOLDS
// ==========================================

export const TIMER_THRESHOLDS = {
  // Queue wait thresholds (5 min warning, 10 min overdue)
  queueWarningMs: 5 * 60 * 1000,
  queueOverdueMs: 10 * 60 * 1000,

  // Pickup wait thresholds (1 min warning, 2 min overdue)
  pickupWarningMs: 60 * 1000,
  pickupOverdueMs: 2 * 60 * 1000,

  // Table session thresholds (45 min long, 60 min critical)
  tableSessionLongMs: 45 * 60 * 1000,
  tableSessionCriticalMs: 60 * 60 * 1000,
} as const;

// ==========================================
// STATUS HELPERS
// ==========================================

/**
 * Get timer color class based on elapsed time and thresholds
 */
export function getTimerColorClass(
  elapsed: number,
  target: number,
  type: "cooking" | "queue" | "pickup"
): string {
  if (type === "cooking") {
    const isOverdue = elapsed > target;
    const isWarning = !isOverdue && elapsed > target * 0.8;
    return isOverdue
      ? "text-danger font-bold"
      : isWarning
        ? "text-warning"
        : "text-primary";
  }

  if (type === "queue") {
    const isOverdue = elapsed > TIMER_THRESHOLDS.queueOverdueMs;
    const isWarning = !isOverdue && elapsed > TIMER_THRESHOLDS.queueWarningMs;
    return isOverdue
      ? "text-danger font-bold"
      : isWarning
        ? "text-warning"
        : "text-muted-foreground";
  }

  // pickup
  const isOverdue = elapsed > TIMER_THRESHOLDS.pickupOverdueMs;
  const isWarning = !isOverdue && elapsed > TIMER_THRESHOLDS.pickupWarningMs;
  return isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-success";
}

/**
 * Check if task has allergen modifiers
 */
export function hasAllergenModifier(task: StationTask): boolean {
  return (
    task.comment?.presets.some((preset) =>
      ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
    ) ?? false
  );
}
