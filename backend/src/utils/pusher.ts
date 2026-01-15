/**
 * Pusher Service Utility
 * Provides real-time event broadcasting via Pusher
 *
 * @see https://pusher.com/docs
 */

import Pusher from 'pusher';

// Event types matching frontend websocket-events.ts
export const PUSHER_EVENTS = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_CANCELLED: 'order.cancelled',

  // Order item events
  ITEM_STATUS_CHANGED: 'item.status_changed',
  ITEM_ADDED: 'item.added',
  ITEM_REMOVED: 'item.removed',

  // Kitchen ticket events
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',

  // Station events
  STATION_TASK_CREATED: 'station.task_created',
  STATION_TASK_STARTED: 'station.task_started',
  STATION_TASK_COMPLETED: 'station.task_completed',
  STATION_LOAD_CHANGED: 'station.load_changed',

  // Storage events
  STORAGE_LOW_STOCK: 'storage.low_stock',
  STORAGE_BATCH_RECEIVED: 'storage.batch_received',
  STORAGE_EXPIRING: 'storage.expiring',

  // Table events
  TABLE_STATUS_CHANGED: 'table.status_changed',

  // Timer events
  TIMER_SLA_WARNING: 'timer.sla_warning',
  TIMER_SLA_BREACH: 'timer.sla_breach',
} as const;

export type PusherEventType = typeof PUSHER_EVENTS[keyof typeof PUSHER_EVENTS];

// Channel names
export const CHANNELS = {
  ORDERS: 'orders',
  KITCHEN: 'kitchen',
  INVENTORY: 'inventory',
  TABLES: 'tables',
  ALERTS: 'alerts',
  // Dynamic channels
  table: (number: number) => `table-${number}`,
  station: (type: string) => `station-${type}`,
  order: (documentId: string) => `order-${documentId}`,
} as const;

// Singleton Pusher instance
let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher instance
 */
function getPusher(): Pusher | null {
  if (pusherInstance) return pusherInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || 'eu';

  if (!appId || !key || !secret) {
    // Pusher not configured - silently skip
    return null;
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherInstance;
}

/**
 * Check if Pusher is configured and available
 */
export function isPusherEnabled(): boolean {
  return !!process.env.PUSHER_APP_ID && !!process.env.PUSHER_KEY && !!process.env.PUSHER_SECRET;
}

/**
 * Broadcast event to channel(s)
 */
export async function trigger(
  channel: string | string[],
  event: PusherEventType | string,
  data: Record<string, any>
): Promise<boolean> {
  const pusher = getPusher();
  if (!pusher) return false;

  try {
    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      serverTimestamp: new Date().toISOString(),
    };

    await pusher.trigger(channel, event, payload);
    return true;
  } catch (error) {
    console.error('[Pusher] Failed to trigger event:', error);
    return false;
  }
}

/**
 * Broadcast to multiple channels with the same event
 */
export async function broadcast(
  channels: string[],
  event: PusherEventType | string,
  data: Record<string, any>
): Promise<boolean> {
  // Pusher allows max 10 channels per trigger
  const chunks: string[][] = [];
  for (let i = 0; i < channels.length; i += 10) {
    chunks.push(channels.slice(i, i + 10));
  }

  const results = await Promise.all(
    chunks.map(chunk => trigger(chunk, event, data))
  );

  return results.every(r => r);
}

// ==========================================
// ORDER EVENTS
// ==========================================

export async function emitOrderCreated(order: {
  documentId: string;
  orderNumber: string;
  tableNumber?: number;
  status: string;
  totalAmount?: number;
  itemCount?: number;
}): Promise<void> {
  const channels: string[] = [CHANNELS.ORDERS];
  if (order.tableNumber) {
    channels.push(CHANNELS.table(order.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.ORDER_CREATED, {
    orderDocumentId: order.documentId,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    itemCount: order.itemCount,
  });
}

export async function emitOrderUpdated(order: {
  documentId: string;
  orderNumber: string;
  tableNumber?: number;
  status: string;
  previousStatus?: string;
}): Promise<void> {
  const channels: string[] = [CHANNELS.ORDERS, CHANNELS.order(order.documentId)];
  if (order.tableNumber) {
    channels.push(CHANNELS.table(order.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.ORDER_UPDATED, {
    orderDocumentId: order.documentId,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    status: order.status,
    previousStatus: order.previousStatus,
  });
}

export async function emitOrderCancelled(order: {
  documentId: string;
  orderNumber: string;
  tableNumber?: number;
  reason?: string;
}): Promise<void> {
  const channels: string[] = [CHANNELS.ORDERS, CHANNELS.KITCHEN];
  if (order.tableNumber) {
    channels.push(CHANNELS.table(order.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.ORDER_CANCELLED, {
    orderDocumentId: order.documentId,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    reason: order.reason,
  });
}

// ==========================================
// KITCHEN TICKET EVENTS
// ==========================================

export async function emitTicketCreated(ticket: {
  documentId: string;
  ticketNumber: string;
  station?: string;
  priority?: string;
  orderNumber?: string;
  tableNumber?: number;
  menuItemName?: string;
}): Promise<void> {
  const channels: string[] = [CHANNELS.KITCHEN];
  if (ticket.station) {
    channels.push(CHANNELS.station(ticket.station));
  }
  if (ticket.tableNumber) {
    channels.push(CHANNELS.table(ticket.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.TICKET_CREATED, {
    ticketDocumentId: ticket.documentId,
    ticketNumber: ticket.ticketNumber,
    station: ticket.station,
    priority: ticket.priority,
    orderNumber: ticket.orderNumber,
    tableNumber: ticket.tableNumber,
    menuItemName: ticket.menuItemName,
  });
}

export async function emitTicketStatusChanged(ticket: {
  documentId: string;
  ticketNumber: string;
  station?: string;
  previousStatus: string;
  newStatus: string;
  tableNumber?: number;
  elapsedSeconds?: number;
}): Promise<void> {
  const channels: string[] = [CHANNELS.KITCHEN];
  if (ticket.station) {
    channels.push(CHANNELS.station(ticket.station));
  }
  if (ticket.tableNumber) {
    channels.push(CHANNELS.table(ticket.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.TICKET_STATUS_CHANGED, {
    ticketDocumentId: ticket.documentId,
    ticketNumber: ticket.ticketNumber,
    station: ticket.station,
    previousStatus: ticket.previousStatus,
    newStatus: ticket.newStatus,
    tableNumber: ticket.tableNumber,
    elapsedSeconds: ticket.elapsedSeconds,
  });
}

// ==========================================
// ORDER ITEM EVENTS
// ==========================================

export async function emitItemStatusChanged(item: {
  documentId: string;
  orderDocumentId: string;
  menuItemName: string;
  previousStatus: string;
  newStatus: string;
  tableNumber?: number;
  station?: string;
}): Promise<void> {
  const channels: string[] = [CHANNELS.ORDERS, CHANNELS.KITCHEN];
  if (item.tableNumber) {
    channels.push(CHANNELS.table(item.tableNumber));
  }
  if (item.station) {
    channels.push(CHANNELS.station(item.station));
  }

  await trigger(channels, PUSHER_EVENTS.ITEM_STATUS_CHANGED, {
    itemDocumentId: item.documentId,
    orderDocumentId: item.orderDocumentId,
    menuItemName: item.menuItemName,
    previousStatus: item.previousStatus,
    newStatus: item.newStatus,
    tableNumber: item.tableNumber,
    station: item.station,
  });
}

// ==========================================
// INVENTORY EVENTS
// ==========================================

export async function emitLowStock(ingredient: {
  documentId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
}): Promise<void> {
  await trigger([CHANNELS.INVENTORY, CHANNELS.ALERTS], PUSHER_EVENTS.STORAGE_LOW_STOCK, {
    ingredientDocumentId: ingredient.documentId,
    ingredientName: ingredient.name,
    currentStock: ingredient.currentStock,
    minStock: ingredient.minStock,
    unit: ingredient.unit,
    severity: ingredient.currentStock === 0 ? 'critical' : 'warning',
  });
}

export async function emitBatchReceived(batch: {
  documentId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  supplierName?: string;
}): Promise<void> {
  await trigger(CHANNELS.INVENTORY, PUSHER_EVENTS.STORAGE_BATCH_RECEIVED, {
    batchDocumentId: batch.documentId,
    ingredientName: batch.ingredientName,
    quantity: batch.quantity,
    unit: batch.unit,
    supplierName: batch.supplierName,
  });
}

// ==========================================
// TABLE EVENTS
// ==========================================

export async function emitTableStatusChanged(table: {
  documentId: string;
  number: number;
  previousStatus: string;
  newStatus: string;
  currentGuests?: number;
}): Promise<void> {
  await trigger([CHANNELS.TABLES, CHANNELS.table(table.number)], PUSHER_EVENTS.TABLE_STATUS_CHANGED, {
    tableDocumentId: table.documentId,
    tableNumber: table.number,
    previousStatus: table.previousStatus,
    newStatus: table.newStatus,
    currentGuests: table.currentGuests,
  });
}

// ==========================================
// ALERT EVENTS
// ==========================================

export async function emitSLAWarning(data: {
  type: 'ticket' | 'order' | 'table';
  resourceId: string;
  resourceName: string;
  tableNumber?: number;
  elapsedMs: number;
  thresholdMs: number;
  severity: 'warning' | 'critical';
  message: string;
}): Promise<void> {
  const channels: string[] = [CHANNELS.ALERTS, CHANNELS.KITCHEN];
  if (data.tableNumber) {
    channels.push(CHANNELS.table(data.tableNumber));
  }

  await trigger(channels, PUSHER_EVENTS.TIMER_SLA_WARNING, data);
}

// Export all functions
export default {
  isPusherEnabled,
  trigger,
  broadcast,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderCancelled,
  emitTicketCreated,
  emitTicketStatusChanged,
  emitItemStatusChanged,
  emitLowStock,
  emitBatchReceived,
  emitTableStatusChanged,
  emitSLAWarning,
  PUSHER_EVENTS,
  CHANNELS,
};
