/**
 * WebSocket Event Schemas
 *
 * Defines event types, payloads, and subscription patterns
 * for real-time updates across the system.
 */

// ==========================================
// EVENT TYPE DEFINITIONS
// ==========================================

export const WS_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_CANCELLED: 'order.cancelled',

  // Order item events
  ITEM_ADDED: 'item.added',
  ITEM_REMOVED: 'item.removed',
  ITEM_STATUS_CHANGED: 'item.status_changed',
  ITEM_COURSE_CHANGED: 'item.course_changed',
  ITEM_UNDO: 'item.undo',

  // Comment events
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_CONFLICT: 'comment.conflict', // Allergy/dietary conflict detected

  // Timer events
  TIMER_SYNC: 'timer.sync',
  TIMER_SLA_WARNING: 'timer.sla_warning',
  TIMER_SLA_BREACH: 'timer.sla_breach',

  // Table session events
  TABLE_SESSION_STARTED: 'table.session_started',
  TABLE_SESSION_ENDED: 'table.session_ended',
  TABLE_COURSE_STARTED: 'table.course_started',
  TABLE_COURSE_COMPLETED: 'table.course_completed',

  // Bill split events
  SPLIT_CREATED: 'split.created',
  SPLIT_UPDATED: 'split.updated',
  SPLIT_CONFIRMED: 'split.confirmed',
  SPLIT_PAYMENT: 'split.payment',

  // Station events
  STATION_TASK_CREATED: 'station.task_created',
  STATION_TASK_STARTED: 'station.task_started',
  STATION_TASK_COMPLETED: 'station.task_completed',
  STATION_LOAD_CHANGED: 'station.load_changed',
  STATION_OVERLOAD_WARNING: 'station.overload_warning',

  // Storage events
  STORAGE_BATCH_RECEIVED: 'storage.batch_received',
  STORAGE_BATCH_PROCESSED: 'storage.batch_processed',
  STORAGE_BATCH_USED: 'storage.batch_used',
  STORAGE_LOW_STOCK: 'storage.low_stock',
  STORAGE_EXPIRING: 'storage.expiring',
  STORAGE_YIELD_VARIANCE: 'storage.yield_variance',

  // System events
  SYSTEM_ALERT: 'system.alert',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  FEATURE_FLAG_CHANGED: 'system.feature_flag',
} as const;

export type WSEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ==========================================
// BASE EVENT STRUCTURE
// ==========================================

export interface WSEventBase<T extends WSEventType, P = unknown> {
  type: T;
  timestamp: string;
  serverTimestamp: string;
  sequence: number;
  correlationId?: string;
  payload: P;
}

// ==========================================
// ORDER EVENT PAYLOADS
// ==========================================

export interface OrderCreatedPayload {
  orderDocumentId: string;
  orderSlug: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  itemCount: number;
  totalAmount: number;
}

export interface OrderSubmittedPayload {
  orderDocumentId: string;
  tableNumber: number;
  items: Array<{
    documentId: string;
    menuItemName: string;
    quantity: number;
    courseType: string;
    station: string;
  }>;
  priority: 'normal' | 'rush' | 'vip';
}

// ==========================================
// ITEM EVENT PAYLOADS
// ==========================================

export interface ItemStatusChangedPayload {
  orderDocumentId: string;
  itemDocumentId: string;
  itemSlug: string;
  menuItemName: string;
  tableNumber: number;
  previousStatus: string;
  newStatus: string;
  courseType: string;
  station?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  elapsedMs: number;
}

export interface ItemUndoPayload {
  orderDocumentId: string;
  itemDocumentId: string;
  menuItemName: string;
  tableNumber: number;
  previousStatus: string;
  newStatus: string;
  reason: string;
  reasonCode: string;
  actorId: string;
  actorName: string;
}

export interface ItemCourseChangedPayload {
  orderDocumentId: string;
  itemDocumentId: string;
  menuItemName: string;
  previousCourse: string;
  newCourse: string;
  newCourseIndex: number;
}

// ==========================================
// COMMENT EVENT PAYLOADS
// ==========================================

export interface CommentCreatedPayload {
  orderDocumentId: string;
  itemDocumentId: string;
  menuItemName: string;
  tableNumber: number;
  comment: {
    text: string;
    presets: string[];
    visibility: string[];
  };
  authorId: string;
  authorName: string;
}

export interface CommentConflictPayload {
  orderDocumentId: string;
  itemDocumentId: string;
  menuItemName: string;
  tableNumber: number;
  conflictType: 'allergy' | 'dietary' | 'ingredient';
  conflictDetails: {
    presetKey: string;
    presetLabel: string;
    severity: 'warning' | 'critical';
    message: string;
  };
  tablePreferences?: string[]; // Table-level allergens/dietary
}

// ==========================================
// TIMER EVENT PAYLOADS
// ==========================================

export interface TimerSyncPayload {
  tableNumber: number;
  sessionDocumentId: string;
  tableElapsedMs: number;
  serverTime: string;
  courseTimings: Array<{
    courseType: string;
    elapsedMs: number;
    startedAt?: string;
    completedAt?: string;
    status: 'pending' | 'active' | 'completed';
  }>;
  activeItems: Array<{
    itemDocumentId: string;
    menuItemName: string;
    elapsedMs: number;
    status: string;
    station?: string;
  }>;
}

export interface TimerSLAWarningPayload {
  type: 'course' | 'item' | 'table';
  tableNumber: number;
  resourceDocumentId: string;
  resourceName: string;
  elapsedMs: number;
  thresholdMs: number;
  severity: 'warning' | 'critical';
  message: string;
  suggestedAction?: string;
}

// ==========================================
// SPLIT EVENT PAYLOADS
// ==========================================

export interface SplitUpdatedPayload {
  orderDocumentId: string;
  splitDocumentId: string;
  mode: 'even' | 'by_items' | 'mixed';
  participantCount: number;
  participants: Array<{
    personId: string;
    name?: string;
    total: number;
    itemCount: number;
    isPaid: boolean;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    unassigned: number;
  };
  updatedBy: string;
}

export interface SplitPaymentPayload {
  orderDocumentId: string;
  splitDocumentId: string;
  personId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'paylater';
  receiptNumber?: string;
  allPaid: boolean;
}

// ==========================================
// STATION EVENT PAYLOADS
// ==========================================

export interface StationTaskCreatedPayload {
  taskDocumentId: string;
  orderDocumentId: string;
  itemDocumentId: string;
  stationType: string;
  stationName: string;
  menuItemName: string;
  taskDescription: string;
  quantity: number;
  priority: 'normal' | 'rush' | 'vip';
  priorityScore: number;
  targetCompletionAt: string;
  modifiers: string[];
}

export interface StationLoadChangedPayload {
  stationType: string;
  stationDocumentId: string;
  currentLoad: number;
  maxCapacity: number;
  loadPercent: number;
  queuedTasks: number;
  estimatedQueueTimeMs: number;
  status: 'normal' | 'busy' | 'overloaded';
}

// ==========================================
// STORAGE EVENT PAYLOADS
// ==========================================

export interface StorageBatchProcessedPayload {
  batchDocumentId: string;
  productDocumentId: string;
  productName: string;
  processType: string;
  grossInput: number;
  netOutput: number;
  wasteOutput: number;
  expectedYield: number;
  actualYield: number;
  variancePercent: number;
  isWithinTolerance: boolean;
  operatorId: string;
  operatorName: string;
}

export interface StorageYieldVariancePayload {
  batchDocumentId: string;
  productName: string;
  processType: string;
  expectedYield: number;
  actualYield: number;
  variancePercent: number;
  severity: 'warning' | 'critical';
  requiresCalibration: boolean;
}

export interface StorageLowStockPayload {
  productDocumentId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  daysUntilDepleted?: number;
  suggestedOrderQuantity?: number;
}

// ==========================================
// EVENT TYPE MAPPING
// ==========================================

export interface WSEventPayloads {
  [WS_EVENTS.ORDER_CREATED]: OrderCreatedPayload;
  [WS_EVENTS.ORDER_SUBMITTED]: OrderSubmittedPayload;
  [WS_EVENTS.ITEM_STATUS_CHANGED]: ItemStatusChangedPayload;
  [WS_EVENTS.ITEM_UNDO]: ItemUndoPayload;
  [WS_EVENTS.ITEM_COURSE_CHANGED]: ItemCourseChangedPayload;
  [WS_EVENTS.COMMENT_CREATED]: CommentCreatedPayload;
  [WS_EVENTS.COMMENT_CONFLICT]: CommentConflictPayload;
  [WS_EVENTS.TIMER_SYNC]: TimerSyncPayload;
  [WS_EVENTS.TIMER_SLA_WARNING]: TimerSLAWarningPayload;
  [WS_EVENTS.TIMER_SLA_BREACH]: TimerSLAWarningPayload;
  [WS_EVENTS.SPLIT_UPDATED]: SplitUpdatedPayload;
  [WS_EVENTS.SPLIT_PAYMENT]: SplitPaymentPayload;
  [WS_EVENTS.STATION_TASK_CREATED]: StationTaskCreatedPayload;
  [WS_EVENTS.STATION_LOAD_CHANGED]: StationLoadChangedPayload;
  [WS_EVENTS.STORAGE_BATCH_PROCESSED]: StorageBatchProcessedPayload;
  [WS_EVENTS.STORAGE_YIELD_VARIANCE]: StorageYieldVariancePayload;
  [WS_EVENTS.STORAGE_LOW_STOCK]: StorageLowStockPayload;
}

export type WSEvent<T extends WSEventType = WSEventType> = T extends keyof WSEventPayloads
  ? WSEventBase<T, WSEventPayloads[T]>
  : WSEventBase<T, unknown>;

// ==========================================
// SUBSCRIPTION CHANNELS
// ==========================================

export type SubscriptionChannel =
  | 'orders'                    // All order events
  | `orders:${string}`          // Specific order by documentId
  | 'tables'                    // All table events
  | `tables:${number}`          // Specific table by number
  | 'stations'                  // All station events
  | `stations:${string}`        // Specific station by type
  | 'storage'                   // All storage events
  | `storage:${string}`         // Specific product
  | 'splits'                    // All bill split events
  | `splits:${string}`          // Specific split
  | 'timers'                    // All timer sync events
  | 'alerts'                    // System alerts
  | 'admin';                    // Admin-level events

export interface SubscriptionRequest {
  action: 'subscribe' | 'unsubscribe';
  channels: SubscriptionChannel[];
  filters?: {
    tableNumbers?: number[];
    stations?: string[];
    priorities?: ('normal' | 'rush' | 'vip')[];
    severities?: ('info' | 'warning' | 'critical')[];
  };
}

export interface SubscriptionResponse {
  success: boolean;
  subscribedChannels: SubscriptionChannel[];
  errors?: string[];
}

// ==========================================
// CLIENT IMPLEMENTATION EXAMPLE
// ==========================================

export interface WSClientOptions {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectDelayMs?: number;
  heartbeatIntervalMs?: number;
}

export interface WSClientState {
  connected: boolean;
  reconnecting: boolean;
  lastEventSequence: number;
  subscribedChannels: Set<SubscriptionChannel>;
  pendingEvents: WSEvent[];
}

// Example client usage:
/*
const client = createWSClient({
  url: 'wss://api.restaurant.com/ws',
  token: 'jwt-token-here',
  reconnectAttempts: 5,
  reconnectDelayMs: 1000,
  heartbeatIntervalMs: 30000,
});

// Subscribe to channels
await client.subscribe(['orders', 'tables:5', 'stations:grill']);

// Listen for events
client.on(WS_EVENTS.ITEM_STATUS_CHANGED, (event) => {
  console.log(`Item ${event.payload.menuItemName} changed to ${event.payload.newStatus}`);
});

client.on(WS_EVENTS.TIMER_SLA_WARNING, (event) => {
  showNotification({
    type: 'warning',
    title: 'SLA Warning',
    message: event.payload.message,
  });
});

// Send timer sync request
client.send({
  type: 'timer.sync_request',
  payload: { tableNumber: 5 },
});
*/

// ==========================================
// BACKPRESSURE & RATE LIMITING
// ==========================================

export interface RateLimitConfig {
  eventsPerSecond: number;
  burstSize: number;
  dropPolicy: 'oldest' | 'newest' | 'random';
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'timer.sync': {
    eventsPerSecond: 1,
    burstSize: 5,
    dropPolicy: 'oldest',
  },
  'item.status_changed': {
    eventsPerSecond: 10,
    burstSize: 50,
    dropPolicy: 'newest',
  },
  'station.load_changed': {
    eventsPerSecond: 2,
    burstSize: 10,
    dropPolicy: 'oldest',
  },
  default: {
    eventsPerSecond: 20,
    burstSize: 100,
    dropPolicy: 'oldest',
  },
};

// ==========================================
// EVENT BATCHING
// ==========================================

export interface BatchConfig {
  maxBatchSize: number;
  maxDelayMs: number;
  eventTypes: WSEventType[];
}

export const BATCH_CONFIGS: BatchConfig[] = [
  {
    maxBatchSize: 10,
    maxDelayMs: 100,
    eventTypes: [WS_EVENTS.ITEM_STATUS_CHANGED, WS_EVENTS.STATION_TASK_CREATED],
  },
  {
    maxBatchSize: 5,
    maxDelayMs: 500,
    eventTypes: [WS_EVENTS.TIMER_SYNC],
  },
];

export interface BatchedEvent {
  batchId: string;
  timestamp: string;
  events: WSEvent[];
  count: number;
}

// ==========================================
// DRIFT CORRECTION
// ==========================================

export interface DriftCorrectionConfig {
  maxDriftMs: number;           // Max acceptable drift
  syncIntervalMs: number;       // How often to sync
  correctionStrategy: 'jump' | 'gradual';
}

export const TIMER_DRIFT_CONFIG: DriftCorrectionConfig = {
  maxDriftMs: 1000,             // 1 second max drift
  syncIntervalMs: 30000,        // Sync every 30 seconds
  correctionStrategy: 'gradual', // Smoothly correct drift
};

export interface TimerDriftReport {
  clientTime: string;
  serverTime: string;
  driftMs: number;
  correctionApplied: number;
  syncsToday: number;
}
