/**
 * Station Queue Configuration
 *
 * Types, interfaces, and configuration constants for kitchen station queue.
 * Extracted from station-queue.tsx for better modularity.
 */

import type { StationType, StationSubTaskStatus } from "@/types/station";
import type { CourseType, ItemComment } from "@/types/extended";

// ==========================================
// TYPES
// ==========================================

/**
 * Task interface for station queue items
 */
export interface StationTask {
  documentId: string;
  orderItemDocumentId: string;
  orderDocumentId: string;
  menuItemName: string;
  quantity: number;
  tableNumber: number;
  tableOccupiedAt?: string;
  courseType: CourseType;
  status: StationSubTaskStatus;
  priority: "normal" | "rush" | "vip";
  priorityScore: number;
  elapsedMs: number;
  targetCompletionMs: number;
  isOverdue: boolean;
  assignedChefName?: string;
  modifiers: string[];
  comment: ItemComment | null;
  createdAt: string;
  // Scheduled order fields
  isScheduled?: boolean;
  scheduledOrderId?: string;
  // Timer tracking timestamps
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
  // Extended field for all-kitchen view
  stationType?: StationType;
}

/**
 * Station queue panel props
 */
export interface StationQueueProps {
  stationType: StationType;
  tasks: StationTask[];
  currentLoad: number;
  maxCapacity: number;
  isPaused?: boolean;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
  onPauseToggle: () => void;
  className?: string;
}

/**
 * Grouped tasks by table
 */
export interface TableTaskGroup {
  tableNumber: number;
  tableOccupiedAt?: string;
  tasks: StationTask[];
}

/**
 * Extended table group with station info
 */
export interface TableTaskGroupWithStation extends TableTaskGroup {
  stationTypes: Set<StationType>;
}

/**
 * Task card/row props
 */
export interface TaskItemProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
  onServed?: () => void;
}

/**
 * Table group card props
 */
export interface TableGroupCardProps {
  group: TableTaskGroup;
  isActive?: boolean;
  isCompleted?: boolean;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskReturn?: (taskId: string) => void;
  onTaskServed?: (taskId: string) => void;
}

/**
 * Station overview props
 */
export interface StationOverviewProps {
  stations: Array<{
    type: StationType;
    taskCount: number;
    currentLoad: number;
    maxCapacity: number;
    isPaused: boolean;
    overdueCount: number;
  }>;
  onSelectStation: (stationType: StationType | "all") => void;
  selectedStation?: StationType | "all";
  className?: string;
}

/**
 * All kitchen view props
 */
export interface AllKitchenViewProps {
  tasksByStation: Record<StationType, StationTask[]>;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
  className?: string;
}

// ==========================================
// TIMER THRESHOLDS
// ==========================================

/**
 * Queue wait time thresholds (in milliseconds)
 */
export const QUEUE_THRESHOLDS = {
  warningMs: 5 * 60 * 1000,   // 5 minutes
  overdueMs: 10 * 60 * 1000,  // 10 minutes
} as const;

/**
 * Pickup wait time thresholds (in milliseconds)
 */
export const PICKUP_THRESHOLDS = {
  warningMs: 60 * 1000,       // 1 minute
  overdueMs: 2 * 60 * 1000,   // 2 minutes
} as const;

/**
 * Table session time thresholds (in milliseconds)
 */
export const TABLE_SESSION_THRESHOLDS = {
  longMs: 45 * 60 * 1000,     // 45 minutes
  criticalMs: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Cooking time warning threshold (percentage of target)
 */
export const COOKING_WARNING_PERCENT = 0.8;

// ==========================================
// ALLERGEN PRESETS
// ==========================================

/**
 * Allergen preset values that should trigger allergen indicator
 */
export const ALLERGEN_PRESETS = [
  "gluten_free",
  "dairy_free",
  "nut_free",
  "shellfish_free",
] as const;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Group tasks by table number
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

  // Sort groups by highest priority score
  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map((t) => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map((t) => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

/**
 * Group tasks by table with station type tracking
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

  // Sort groups by highest priority score
  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map((t) => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map((t) => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

/**
 * Format table session time
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

/**
 * Get timer color class based on thresholds
 */
export function getTimerColorClass(
  elapsedMs: number,
  warningMs: number,
  overdueMs: number
): string {
  if (elapsedMs > overdueMs) {
    return "text-danger font-bold";
  }
  if (elapsedMs > warningMs) {
    return "text-warning";
  }
  return "text-muted-foreground";
}

/**
 * Get cooking timer color class
 */
export function getCookingTimerColorClass(
  elapsedMs: number,
  targetMs: number
): string {
  const isOverdue = elapsedMs > targetMs;
  const isWarning = !isOverdue && elapsedMs > targetMs * COOKING_WARNING_PERCENT;

  if (isOverdue) return "text-danger font-bold";
  if (isWarning) return "text-warning";
  return "text-primary";
}

/**
 * Check if task has allergen
 */
export function hasTaskAllergen(task: StationTask): boolean {
  return task.comment?.presets.some((preset) =>
    (ALLERGEN_PRESETS as readonly string[]).includes(preset)
  ) ?? false;
}

/**
 * Check if any task in group has allergen
 */
export function hasGroupAllergen(tasks: StationTask[]): boolean {
  return tasks.some(hasTaskAllergen);
}

/**
 * Get load status based on percentage
 */
export function getLoadStatus(
  currentLoad: number,
  maxCapacity: number
): "normal" | "warning" | "critical" {
  const loadPercent = (currentLoad / maxCapacity) * 100;
  if (loadPercent >= 90) return "critical";
  if (loadPercent >= 70) return "warning";
  return "normal";
}

/**
 * Active cooking stations (excluding pass)
 */
export const ACTIVE_COOKING_STATIONS: StationType[] = ["hot", "cold", "pastry", "bar"];
