/**
 * Station Queue Types
 *
 * Shared interfaces for station queue components
 */

import type { StationType, StationSubTaskStatus } from "@/types/station";
import type { CourseType, ItemComment } from "@/types/extended";

// ==========================================
// TASK INTERFACES
// ==========================================

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
  // Optional station type for grouped views
  stationType?: StationType;
}

// ==========================================
// GROUP INTERFACES
// ==========================================

export interface TableTaskGroup {
  tableNumber: number;
  tableOccupiedAt?: string;
  tasks: StationTask[];
}

export interface TableTaskGroupWithStation extends TableTaskGroup {
  stationTypes: Set<StationType>;
}

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface StationQueueProps {
  stationType: StationType;
  tasks: StationTask[];
  currentLoad: number;
  maxCapacity: number;
  isPaused?: boolean;
  loadingTaskId?: string | null;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
  onPauseToggle: () => void;
  className?: string;
}

export interface TaskCardProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
  onServed?: () => void;
}

export interface TableGroupCardProps {
  group: TableTaskGroup;
  isActive?: boolean;
  isCompleted?: boolean;
  loadingTaskId?: string | null;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskReturn?: (taskId: string) => void;
  onTaskServed?: (taskId: string) => void;
}

export interface TaskItemRowProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  isLoading?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
  onServed?: () => void;
}

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

export interface AllKitchenViewProps {
  tasksByStation: Record<StationType, StationTask[]>;
  loadingTaskId?: string | null;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
  className?: string;
}

export interface AllKitchenTableCardProps {
  group: TableTaskGroupWithStation;
  isActive?: boolean;
  isCompleted?: boolean;
  loadingTaskId?: string | null;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskReturn?: (taskId: string) => void;
  onTaskServed?: (taskId: string) => void;
}
