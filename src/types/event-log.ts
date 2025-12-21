/**
 * Unified Event Log System
 *
 * Append-only audit log capturing all state changes across the system.
 * Supports full traceability, compliance, and debugging.
 */

// ==========================================
// EVENT LOG TYPES
// ==========================================

export type EventCategory =
  | 'order'
  | 'order_item'
  | 'table_session'
  | 'bill'
  | 'storage'
  | 'batch'
  | 'profile'
  | 'auth'
  | 'system';

export type EventSeverity = 'debug' | 'info' | 'warning' | 'critical';

export interface EventLog {
  // Identity
  documentId: string;
  slug: string;
  sequence: number;           // Global sequence number for ordering

  // Event classification
  category: EventCategory;
  eventType: string;          // e.g., 'item.status_changed', 'batch.processed'
  severity: EventSeverity;

  // Resource reference
  resourceType: string;       // e.g., 'OrderItem', 'StorageBatch'
  resourceDocumentId: string;
  resourceSlug?: string;

  // Parent references (for hierarchical events)
  parentResourceType?: string;
  parentResourceDocumentId?: string;

  // State change
  previousState?: string;
  newState?: string;
  previousValue?: unknown;
  newValue?: unknown;
  delta?: Record<string, { from: unknown; to: unknown }>;

  // Actor information
  actorId: string;
  actorName: string;
  actorRole: string;
  actorIp?: string;
  actorUserAgent?: string;

  // Context
  sessionId?: string;
  correlationId?: string;     // For tracing related events
  requestId?: string;

  // Audit fields
  reason?: string;
  reasonCode?: string;
  approvedBy?: string;
  approvalTimestamp?: string;

  // Metadata
  metadata?: Record<string, unknown>;
  tags?: string[];

  // Timestamps
  timestamp: string;          // ISO 8601
  serverTimestamp: string;    // Server-side timestamp
  processedAt?: string;       // When event was processed by consumers
}

// ==========================================
// EVENT TYPE DEFINITIONS
// ==========================================

export const EVENT_TYPES = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_COMPLETED: 'order.completed',

  // Order item events
  ITEM_ADDED: 'item.added',
  ITEM_REMOVED: 'item.removed',
  ITEM_UPDATED: 'item.updated',
  ITEM_STATUS_CHANGED: 'item.status_changed',
  ITEM_COURSE_CHANGED: 'item.course_changed',
  ITEM_COMMENT_ADDED: 'item.comment_added',
  ITEM_COMMENT_UPDATED: 'item.comment_updated',
  ITEM_UNDO: 'item.undo',

  // Table session events
  TABLE_SESSION_STARTED: 'table_session.started',
  TABLE_SESSION_ENDED: 'table_session.ended',
  TABLE_TIMER_SYNCED: 'table_session.timer_synced',
  TABLE_SLA_BREACH: 'table_session.sla_breach',

  // Bill events
  BILL_SPLIT_CREATED: 'bill.split_created',
  BILL_SPLIT_UPDATED: 'bill.split_updated',
  BILL_SPLIT_CONFIRMED: 'bill.split_confirmed',
  BILL_PAYMENT_RECEIVED: 'bill.payment_received',
  BILL_RECEIPT_GENERATED: 'bill.receipt_generated',

  // Storage events
  BATCH_RECEIVED: 'storage.batch_received',
  BATCH_INSPECTED: 'storage.batch_inspected',
  BATCH_PROCESSED: 'storage.batch_processed',
  BATCH_RESERVED: 'storage.batch_reserved',
  BATCH_USED: 'storage.batch_used',
  BATCH_WRITTEN_OFF: 'storage.batch_written_off',
  BATCH_YIELD_CALIBRATED: 'storage.yield_calibrated',
  STOCK_LOW: 'storage.stock_low',
  STOCK_EXPIRING: 'storage.stock_expiring',

  // Profile events
  PROFILE_CREATED: 'profile.created',
  PROFILE_UPDATED: 'profile.updated',
  SHIFT_STARTED: 'profile.shift_started',
  SHIFT_ENDED: 'profile.shift_ended',
  KPI_UPDATED: 'profile.kpi_updated',

  // Auth events
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  PERMISSION_DENIED: 'auth.permission_denied',

  // System events
  FEATURE_FLAG_CHANGED: 'system.feature_flag_changed',
  CONFIG_CHANGED: 'system.config_changed',
  MIGRATION_RUN: 'system.migration_run',
  ERROR: 'system.error',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// ==========================================
// EVENT BUILDER
// ==========================================

export interface CreateEventParams {
  category: EventCategory;
  eventType: EventType | string;
  severity?: EventSeverity;
  resourceType: string;
  resourceDocumentId: string;
  resourceSlug?: string;
  parentResourceType?: string;
  parentResourceDocumentId?: string;
  previousState?: string;
  newState?: string;
  previousValue?: unknown;
  newValue?: unknown;
  actorId: string;
  actorName: string;
  actorRole: string;
  sessionId?: string;
  correlationId?: string;
  reason?: string;
  reasonCode?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

let globalSequence = 0;

export function createEvent(params: CreateEventParams): EventLog {
  const timestamp = new Date().toISOString();

  // Calculate delta if previous and new values provided
  let delta: Record<string, { from: unknown; to: unknown }> | undefined;

  if (
    params.previousValue &&
    params.newValue &&
    typeof params.previousValue === 'object' &&
    typeof params.newValue === 'object'
  ) {
    delta = {};
    const prev = params.previousValue as Record<string, unknown>;
    const next = params.newValue as Record<string, unknown>;

    for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      if (prev[key] !== next[key]) {
        delta[key] = { from: prev[key], to: next[key] };
      }
    }
  }

  return {
    documentId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug: `${params.eventType.replace(/\./g, '-')}-${Date.now()}`,
    sequence: ++globalSequence,
    category: params.category,
    eventType: params.eventType,
    severity: params.severity || 'info',
    resourceType: params.resourceType,
    resourceDocumentId: params.resourceDocumentId,
    resourceSlug: params.resourceSlug,
    parentResourceType: params.parentResourceType,
    parentResourceDocumentId: params.parentResourceDocumentId,
    previousState: params.previousState,
    newState: params.newState,
    previousValue: params.previousValue,
    newValue: params.newValue,
    delta,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    sessionId: params.sessionId,
    correlationId: params.correlationId,
    reason: params.reason,
    reasonCode: params.reasonCode,
    metadata: params.metadata,
    tags: params.tags,
    timestamp,
    serverTimestamp: timestamp,
  };
}

// ==========================================
// EVENT LOG STORE INTERFACE
// ==========================================

export interface EventLogQuery {
  // Filters
  category?: EventCategory | EventCategory[];
  eventType?: string | string[];
  severity?: EventSeverity | EventSeverity[];
  resourceType?: string;
  resourceDocumentId?: string;
  actorId?: string;
  actorRole?: string;
  correlationId?: string;
  reasonCode?: string;
  tags?: string[];

  // Time range
  from?: string;
  to?: string;

  // Pagination
  limit?: number;
  offset?: number;
  afterSequence?: number;

  // Sorting
  sortBy?: 'timestamp' | 'sequence';
  sortOrder?: 'asc' | 'desc';
}

export interface EventLogQueryResult {
  events: EventLog[];
  total: number;
  hasMore: boolean;
  lastSequence: number;
}

// ==========================================
// TIMELINE VIEW
// ==========================================

export interface TimelineEntry {
  event: EventLog;
  formattedTime: string;
  relativeTime: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  canUndo: boolean;
}

export function formatEventForTimeline(event: EventLog): TimelineEntry {
  const eventDate = new Date(event.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  let relativeTime: string;
  if (diffMins < 1) {
    relativeTime = 'щойно';
  } else if (diffMins < 60) {
    relativeTime = `${diffMins} хв тому`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} год тому`;
  } else {
    relativeTime = eventDate.toLocaleDateString('uk-UA');
  }

  // Map event types to visual properties
  const eventConfig = EVENT_DISPLAY_CONFIG[event.eventType] || {
    icon: 'circle',
    color: 'gray',
    title: event.eventType,
  };

  let description = '';
  if (event.previousState && event.newState) {
    description = `${event.previousState} → ${event.newState}`;
  }
  if (event.reason) {
    description += description ? ` (${event.reason})` : event.reason;
  }

  const canUndo =
    event.eventType === EVENT_TYPES.ITEM_STATUS_CHANGED &&
    ['ready', 'served'].includes(event.newState || '') &&
    diffMins < 10;

  return {
    event,
    formattedTime: eventDate.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    relativeTime,
    icon: eventConfig.icon,
    color: eventConfig.color,
    title: eventConfig.title,
    description,
    canUndo,
  };
}

const EVENT_DISPLAY_CONFIG: Record<string, { icon: string; color: string; title: string }> = {
  [EVENT_TYPES.ORDER_CREATED]: { icon: 'plus-circle', color: 'green', title: 'Замовлення створено' },
  [EVENT_TYPES.ORDER_SUBMITTED]: { icon: 'send', color: 'blue', title: 'Замовлення відправлено' },
  [EVENT_TYPES.ORDER_CANCELLED]: { icon: 'x-circle', color: 'red', title: 'Замовлення скасовано' },
  [EVENT_TYPES.ITEM_STATUS_CHANGED]: { icon: 'refresh-cw', color: 'blue', title: 'Статус змінено' },
  [EVENT_TYPES.ITEM_UNDO]: { icon: 'undo', color: 'orange', title: 'Статус повернено' },
  [EVENT_TYPES.ITEM_COMMENT_ADDED]: { icon: 'message-circle', color: 'purple', title: 'Коментар додано' },
  [EVENT_TYPES.BATCH_RECEIVED]: { icon: 'package', color: 'green', title: 'Партію отримано' },
  [EVENT_TYPES.BATCH_PROCESSED]: { icon: 'settings', color: 'blue', title: 'Партію оброблено' },
  [EVENT_TYPES.BATCH_WRITTEN_OFF]: { icon: 'trash-2', color: 'red', title: 'Списання' },
  [EVENT_TYPES.TABLE_SLA_BREACH]: { icon: 'alert-triangle', color: 'red', title: 'Порушення SLA' },
  [EVENT_TYPES.BILL_PAYMENT_RECEIVED]: { icon: 'credit-card', color: 'green', title: 'Оплату отримано' },
};

// ==========================================
// CORRELATION ID GENERATOR
// ==========================================

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
// EVENT AGGREGATION
// ==========================================

export interface EventAggregation {
  period: string;
  category: EventCategory;
  eventType: string;
  count: number;
  uniqueActors: number;
  uniqueResources: number;
}

export function aggregateEvents(
  events: EventLog[],
  groupBy: 'hour' | 'day' | 'category' | 'eventType'
): EventAggregation[] {
  const groups = new Map<string, EventLog[]>();

  for (const event of events) {
    let key: string;

    switch (groupBy) {
      case 'hour':
        key = event.timestamp.slice(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        key = event.timestamp.slice(0, 10); // YYYY-MM-DD
        break;
      case 'category':
        key = event.category;
        break;
      case 'eventType':
        key = event.eventType;
        break;
      default:
        key = 'all';
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }

  return Array.from(groups.entries()).map(([period, groupEvents]) => ({
    period,
    category: groupEvents[0].category,
    eventType: groupEvents[0].eventType,
    count: groupEvents.length,
    uniqueActors: new Set(groupEvents.map((e) => e.actorId)).size,
    uniqueResources: new Set(groupEvents.map((e) => e.resourceDocumentId)).size,
  }));
}
