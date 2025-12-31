/**
 * Kitchen Station Routing System
 *
 * Maps menu items to stations and splits OrderItems
 * into station SubTasks with their own statuses and timers.
 */

// ==========================================
// STATION DEFINITIONS
// ==========================================

export type KitchenStationType =
  | 'grill'      // Гриль
  | 'fry'        // Фритюр/Сковорода
  | 'salad'      // Холодний цех
  | 'hot'        // Гарячий цех
  | 'dessert'    // Десерти
  | 'bar'        // Бар
  | 'pass'       // Видача
  | 'prep';      // Заготівля

// Extended station type for UI (includes stations from station-queue)
export type StationType =
  | 'hot'      // Гарячий цех
  | 'cold'     // Холодний цех
  | 'pastry'   // Кондитерська
  | 'bar'      // Бар
  | 'pass';    // Видача

export interface KitchenStation {
  documentId: string;
  slug: string;
  type: KitchenStationType;
  name: string;
  nameUk: string;
  displayOrder: number;
  color: string;
  icon: string;

  // Capacity and load
  maxConcurrent: number;      // Max items at once
  currentLoad: number;        // Current items in progress
  queuedCount: number;        // Items waiting

  // SLA configuration
  targetPrepTimeMs: number;   // Target prep time
  warningThresholdMs: number; // Yellow warning
  criticalThresholdMs: number; // Red warning

  // Staff assignment
  assignedStaffIds: string[];

  // Status
  isActive: boolean;
  isPaused: boolean;
  pauseReason?: string;
}

export const DEFAULT_STATIONS: Omit<KitchenStation, 'documentId' | 'currentLoad' | 'queuedCount' | 'assignedStaffIds'>[] = [
  {
    slug: 'grill',
    type: 'grill',
    name: 'Grill',
    nameUk: 'Гриль',
    displayOrder: 1,
    color: '#EF4444',
    icon: 'flame',
    maxConcurrent: 6,
    targetPrepTimeMs: 600000,    // 10 min
    warningThresholdMs: 480000,  // 8 min
    criticalThresholdMs: 720000, // 12 min
    isActive: true,
    isPaused: false,
  },
  {
    slug: 'fry',
    type: 'fry',
    name: 'Fry',
    nameUk: 'Фритюр',
    displayOrder: 2,
    color: '#F59E0B',
    icon: 'zap',
    maxConcurrent: 8,
    targetPrepTimeMs: 300000,    // 5 min
    warningThresholdMs: 240000,  // 4 min
    criticalThresholdMs: 420000, // 7 min
    isActive: true,
    isPaused: false,
  },
  {
    slug: 'salad',
    type: 'salad',
    name: 'Salad',
    nameUk: 'Холодний цех',
    displayOrder: 3,
    color: '#10B981',
    icon: 'leaf',
    maxConcurrent: 10,
    targetPrepTimeMs: 180000,    // 3 min
    warningThresholdMs: 150000,  // 2.5 min
    criticalThresholdMs: 300000, // 5 min
    isActive: true,
    isPaused: false,
  },
  {
    slug: 'hot',
    type: 'hot',
    name: 'Hot Kitchen',
    nameUk: 'Гарячий цех',
    displayOrder: 4,
    color: '#F97316',
    icon: 'thermometer',
    maxConcurrent: 8,
    targetPrepTimeMs: 480000,    // 8 min
    warningThresholdMs: 360000,  // 6 min
    criticalThresholdMs: 600000, // 10 min
    isActive: true,
    isPaused: false,
  },
  {
    slug: 'dessert',
    type: 'dessert',
    name: 'Dessert',
    nameUk: 'Десерти',
    displayOrder: 5,
    color: '#EC4899',
    icon: 'cake',
    maxConcurrent: 6,
    targetPrepTimeMs: 240000,    // 4 min
    warningThresholdMs: 180000,  // 3 min
    criticalThresholdMs: 360000, // 6 min
    isActive: true,
    isPaused: false,
  },
  {
    slug: 'bar',
    type: 'bar',
    name: 'Bar',
    nameUk: 'Бар',
    displayOrder: 6,
    color: '#8B5CF6',
    icon: 'wine',
    maxConcurrent: 12,
    targetPrepTimeMs: 120000,    // 2 min
    warningThresholdMs: 90000,   // 1.5 min
    criticalThresholdMs: 180000, // 3 min
    isActive: true,
    isPaused: false,
  },
];

// ==========================================
// STATION SUBTASK
// ==========================================

export type SubTaskStatus =
  | 'pending'       // Waiting to start
  | 'queued'        // In station queue
  | 'in_progress'   // Being prepared
  | 'ready'         // Ready for pass
  | 'passed'        // Sent to pass station
  | 'cancelled'     // Cancelled
  | 'completed';    // Completed (alias for ready in UI)

// Alias for subtask status used in UI components
export type StationSubTaskStatus = SubTaskStatus;

export interface StationSubTask {
  documentId: string;
  slug: string;

  // Parent reference
  orderItemDocumentId: string;
  orderDocumentId: string;

  // Station assignment
  stationType: KitchenStationType;
  stationDocumentId: string;

  // Task details
  taskDescription: string;       // e.g., "Grill steak medium-rare"
  menuItemName: string;
  quantity: number;

  // Recipe steps (if applicable)
  recipeStepIndex?: number;
  recipeStepDescription?: string;

  // Status
  status: SubTaskStatus;
  statusHistory: SubTaskStatusChange[];

  // Timing
  createdAt: string;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  passedAt?: string;
  elapsedMs: number;

  // SLA
  targetCompletionAt: string;
  isOverdue: boolean;
  overdueMs: number;

  // Assignment
  assignedChefId?: string;
  assignedChefName?: string;

  // Priority
  priority: 'normal' | 'rush' | 'vip';
  priorityScore: number;         // Calculated score for auto-sorting

  // Dependencies
  dependsOn: string[];           // Other subtask documentIds that must complete first
  blockedBy: string[];           // Currently blocking subtasks

  // Notes
  notes?: string;
  modifiers: string[];           // From item comments
}

export interface SubTaskStatusChange {
  timestamp: string;
  fromStatus: SubTaskStatus;
  toStatus: SubTaskStatus;
  actorId: string;
  actorName: string;
  reason?: string;
}

// ==========================================
// MENU ITEM TO STATION MAPPING
// ==========================================

export interface MenuItemStationMapping {
  menuItemDocumentId: string;
  menuItemSlug: string;

  // Primary station
  primaryStation: KitchenStationType;

  // Additional stations (for complex items)
  additionalStations: {
    station: KitchenStationType;
    taskDescription: string;
    dependsOnPrimary: boolean;
    estimatedTimeMs: number;
  }[];

  // Total estimated time
  totalEstimatedTimeMs: number;

  // Auto-routing rules
  autoRoute: boolean;
  routingRules?: RoutingRule[];
}

export interface RoutingRule {
  condition: string;             // e.g., "quantity > 3"
  targetStation: KitchenStationType;
  priority: number;
}

// Example mappings
export const EXAMPLE_STATION_MAPPINGS: Omit<MenuItemStationMapping, 'menuItemDocumentId'>[] = [
  {
    menuItemSlug: 'ribeye-steak',
    primaryStation: 'grill',
    additionalStations: [
      {
        station: 'hot',
        taskDescription: 'Prepare sauce and sides',
        dependsOnPrimary: false,
        estimatedTimeMs: 300000,
      },
    ],
    totalEstimatedTimeMs: 600000,
    autoRoute: true,
  },
  {
    menuItemSlug: 'caesar-salad',
    primaryStation: 'salad',
    additionalStations: [],
    totalEstimatedTimeMs: 180000,
    autoRoute: true,
  },
  {
    menuItemSlug: 'fish-and-chips',
    primaryStation: 'fry',
    additionalStations: [
      {
        station: 'salad',
        taskDescription: 'Prepare coleslaw',
        dependsOnPrimary: false,
        estimatedTimeMs: 120000,
      },
    ],
    totalEstimatedTimeMs: 420000,
    autoRoute: true,
  },
];

// ==========================================
// STATION CAPACITY & LOAD
// ==========================================

export interface StationLoadMetrics {
  stationType: KitchenStationType;
  stationDocumentId: string;

  // Current state
  currentLoad: number;
  maxCapacity: number;
  loadPercent: number;

  // Queue
  queuedTasks: number;
  estimatedQueueTimeMs: number;

  // Performance
  averagePrepTimeMs: number;
  tasksCompletedToday: number;
  slaBreachesToday: number;

  // Predictions
  predictedOverloadIn?: number;  // Minutes until overload
  recommendedAction?: string;
}

export function calculateStationLoad(
  station: KitchenStation,
  activeTasks: StationSubTask[],
  queuedTasks: StationSubTask[]
): StationLoadMetrics {
  const inProgressTasks = activeTasks.filter((t) => t.status === 'in_progress');
  const loadPercent = (inProgressTasks.length / station.maxConcurrent) * 100;

  // Estimate queue time based on average prep time
  const avgPrepTime = station.targetPrepTimeMs;
  const estimatedQueueTimeMs = queuedTasks.length * (avgPrepTime / station.maxConcurrent);

  // Predict overload
  let predictedOverloadIn: number | undefined;
  let recommendedAction: string | undefined;

  if (loadPercent > 80) {
    predictedOverloadIn = 5;
    recommendedAction = 'Consider pausing new orders for this station';
  } else if (loadPercent > 60 && queuedTasks.length > station.maxConcurrent) {
    predictedOverloadIn = 15;
    recommendedAction = 'Station approaching capacity';
  }

  return {
    stationType: station.type,
    stationDocumentId: station.documentId,
    currentLoad: inProgressTasks.length,
    maxCapacity: station.maxConcurrent,
    loadPercent,
    queuedTasks: queuedTasks.length,
    estimatedQueueTimeMs,
    averagePrepTimeMs: avgPrepTime,
    tasksCompletedToday: 0, // Would be calculated from history
    slaBreachesToday: 0,    // Would be calculated from history
    predictedOverloadIn,
    recommendedAction,
  };
}

// ==========================================
// AUTO-PRIORITY CALCULATION
// ==========================================

export interface PriorityFactors {
  baseScore: number;           // 0 = normal, 50 = rush, 100 = vip
  courseWeight: number;        // Earlier courses get higher priority
  slaRiskWeight: number;       // Higher as SLA deadline approaches
  tableWaitWeight: number;     // Higher for tables waiting longer
  dependencyWeight: number;    // Higher if blocking other tasks
}

export function calculatePriorityScore(
  subtask: StationSubTask,
  tableElapsedMs: number,
  station: KitchenStation
): number {
  const factors: PriorityFactors = {
    baseScore: subtask.priority === 'vip' ? 100 : subtask.priority === 'rush' ? 50 : 0,
    courseWeight: 0,
    slaRiskWeight: 0,
    tableWaitWeight: 0,
    dependencyWeight: 0,
  };

  // Course weight (appetizers first)
  const courseOrder = ['appetizer', 'starter', 'soup', 'main', 'dessert', 'drink'];
  // Would need courseType from parent item

  // SLA risk weight
  const targetTime = new Date(subtask.targetCompletionAt).getTime();
  const now = Date.now();
  const timeToDeadline = targetTime - now;

  if (timeToDeadline < 0) {
    factors.slaRiskWeight = 100; // Already overdue
  } else if (timeToDeadline < station.warningThresholdMs) {
    factors.slaRiskWeight = 75;
  } else if (timeToDeadline < station.targetPrepTimeMs) {
    factors.slaRiskWeight = 50;
  }

  // Table wait weight
  if (tableElapsedMs > 3600000) {        // > 1 hour
    factors.tableWaitWeight = 50;
  } else if (tableElapsedMs > 1800000) { // > 30 min
    factors.tableWaitWeight = 30;
  } else if (tableElapsedMs > 900000) {  // > 15 min
    factors.tableWaitWeight = 15;
  }

  // Dependency weight
  factors.dependencyWeight = subtask.blockedBy.length * 10;

  // Calculate final score
  return (
    factors.baseScore +
    factors.courseWeight +
    factors.slaRiskWeight +
    factors.tableWaitWeight -
    factors.dependencyWeight
  );
}

// ==========================================
// SUBTASK CREATION
// ==========================================

export interface CreateSubTasksParams {
  orderItem: {
    documentId: string;
    orderDocumentId: string;
    menuItemDocumentId: string;
    menuItemName: string;
    quantity: number;
    modifiers: string[];
    notes?: string;
  };
  mapping: MenuItemStationMapping;
  tableStartedAt: string;
  priority: 'normal' | 'rush' | 'vip';
}

export function createSubTasksForOrderItem(params: CreateSubTasksParams): StationSubTask[] {
  const { orderItem, mapping, tableStartedAt, priority } = params;
  const now = new Date();
  const subtasks: StationSubTask[] = [];

  // Create primary subtask
  const primarySubtask: StationSubTask = {
    documentId: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug: `${orderItem.menuItemName.toLowerCase().replace(/\s+/g, '-')}-primary-${Date.now()}`,
    orderItemDocumentId: orderItem.documentId,
    orderDocumentId: orderItem.orderDocumentId,
    stationType: mapping.primaryStation,
    stationDocumentId: mapping.primaryStation, // Would be resolved
    taskDescription: `Prepare ${orderItem.menuItemName}`,
    menuItemName: orderItem.menuItemName,
    quantity: orderItem.quantity,
    status: 'pending',
    statusHistory: [],
    createdAt: now.toISOString(),
    elapsedMs: 0,
    targetCompletionAt: new Date(now.getTime() + mapping.totalEstimatedTimeMs).toISOString(),
    isOverdue: false,
    overdueMs: 0,
    priority,
    priorityScore: priority === 'vip' ? 100 : priority === 'rush' ? 50 : 0,
    dependsOn: [],
    blockedBy: [],
    modifiers: orderItem.modifiers,
    notes: orderItem.notes,
  };

  subtasks.push(primarySubtask);

  // Create additional subtasks
  for (const additional of mapping.additionalStations) {
    const additionalSubtask: StationSubTask = {
      documentId: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      slug: `${orderItem.menuItemName.toLowerCase().replace(/\s+/g, '-')}-${additional.station}-${Date.now()}`,
      orderItemDocumentId: orderItem.documentId,
      orderDocumentId: orderItem.orderDocumentId,
      stationType: additional.station,
      stationDocumentId: additional.station,
      taskDescription: additional.taskDescription,
      menuItemName: orderItem.menuItemName,
      quantity: orderItem.quantity,
      status: 'pending',
      statusHistory: [],
      createdAt: now.toISOString(),
      elapsedMs: 0,
      targetCompletionAt: new Date(now.getTime() + additional.estimatedTimeMs).toISOString(),
      isOverdue: false,
      overdueMs: 0,
      priority,
      priorityScore: priority === 'vip' ? 100 : priority === 'rush' ? 50 : 0,
      dependsOn: additional.dependsOnPrimary ? [primarySubtask.documentId] : [],
      blockedBy: additional.dependsOnPrimary ? [primarySubtask.documentId] : [],
      modifiers: [],
    };

    subtasks.push(additionalSubtask);
  }

  return subtasks;
}

// ==========================================
// SUBTASK AGGREGATION TO PARENT
// ==========================================

export type AggregatedItemStatus =
  | 'pending'      // All subtasks pending
  | 'in_progress'  // At least one subtask in progress
  | 'partially_ready' // Some subtasks ready, not all
  | 'ready'        // All subtasks ready
  | 'passed';      // All subtasks passed

export function aggregateSubTaskStatus(subtasks: StationSubTask[]): AggregatedItemStatus {
  if (subtasks.length === 0) return 'pending';

  const statuses = subtasks.map((t) => t.status);

  if (statuses.every((s) => s === 'passed')) return 'passed';
  if (statuses.every((s) => s === 'ready' || s === 'passed')) return 'ready';
  if (statuses.some((s) => s === 'ready')) return 'partially_ready';
  if (statuses.some((s) => s === 'in_progress' || s === 'queued')) return 'in_progress';

  return 'pending';
}

export function getSubTasksProgress(subtasks: StationSubTask[]): {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percent: number;
} {
  const total = subtasks.length;
  const completed = subtasks.filter((t) => t.status === 'ready' || t.status === 'passed').length;
  const inProgress = subtasks.filter((t) => t.status === 'in_progress' || t.status === 'queued').length;
  const pending = subtasks.filter((t) => t.status === 'pending').length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, inProgress, pending, percent };
}
