/**
 * Table Session Events API
 *
 * Provides API for logging table session events for analytics and KPI tracking.
 * Events are stored in Strapi backend and can be queried for dashboards.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export type TableSessionEventType =
  | 'table_seated'
  | 'order_taken'
  | 'item_started'
  | 'item_ready'
  | 'item_served'
  | 'bill_requested'
  | 'bill_paid'
  | 'table_cleared';

export type ActorRole = 'waiter' | 'chef' | 'cashier' | 'system';

export interface CreateEventParams {
  tableNumber: number;
  sessionId: string;
  eventType: TableSessionEventType;
  actorRole?: ActorRole;
  actorName?: string;
  orderDocumentId?: string;
  tableOccupiedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TableSessionEvent {
  id: number;
  documentId: string;
  tableNumber: number;
  orderDocumentId?: string;
  sessionId: string;
  eventType: TableSessionEventType;
  timestamp: string;
  actorRole?: ActorRole;
  actorName?: string;
  durationFromSeatedMs?: number;
  metadata?: Record<string, unknown>;
}

export interface SessionKPIs {
  avgTimeToTakeOrderMs: number;
  avgTimeToFirstItemMs: number;
  avgTotalSessionTimeMs: number;
  totalOrders: number;
  totalSessions: number;
}

export const tableSessionEventsApi = {
  /**
   * Create a new table session event
   * Non-blocking - errors are logged but don't throw
   */
  async createEvent(params: CreateEventParams): Promise<void> {
    const now = Date.now();
    const seatedAt = params.tableOccupiedAt
      ? new Date(params.tableOccupiedAt).getTime()
      : now;
    const durationFromSeatedMs = now - seatedAt;

    try {
      await fetch(`${STRAPI_URL}/api/table-session-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            tableNumber: params.tableNumber,
            sessionId: params.sessionId,
            eventType: params.eventType,
            timestamp: new Date().toISOString(),
            actorRole: params.actorRole || 'system',
            actorName: params.actorName,
            orderDocumentId: params.orderDocumentId,
            durationFromSeatedMs: durationFromSeatedMs > 0 ? durationFromSeatedMs : 0,
            metadata: params.metadata,
          },
        }),
      });
    } catch (error) {
      // Log but don't throw - event logging should not break main flow
      console.error('[Analytics] Failed to log table session event:', error);
    }
  },

  /**
   * Query events for analytics
   */
  async getSessionEvents(filters: {
    tableNumber?: number;
    orderDocumentId?: string;
    sessionId?: string;
    eventType?: TableSessionEventType | TableSessionEventType[];
    from?: string;
    to?: string;
  }): Promise<TableSessionEvent[]> {
    try {
      const params = new URLSearchParams();

      if (filters.tableNumber) {
        params.append('filters[tableNumber][$eq]', String(filters.tableNumber));
      }
      if (filters.orderDocumentId) {
        params.append('filters[orderDocumentId][$eq]', filters.orderDocumentId);
      }
      if (filters.sessionId) {
        params.append('filters[sessionId][$eq]', filters.sessionId);
      }
      if (filters.eventType) {
        const types = Array.isArray(filters.eventType) ? filters.eventType : [filters.eventType];
        types.forEach((type) => {
          params.append('filters[eventType][$in]', type);
        });
      }
      if (filters.from) {
        params.append('filters[timestamp][$gte]', filters.from);
      }
      if (filters.to) {
        params.append('filters[timestamp][$lte]', filters.to);
      }

      params.append('sort', 'timestamp:asc');
      params.append('pagination[limit]', '1000');

      const response = await fetch(`${STRAPI_URL}/api/table-session-events?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[Analytics] Failed to query session events:', error);
      return [];
    }
  },

  /**
   * Calculate KPIs for a time period
   */
  async getKPIs(from: string, to: string): Promise<SessionKPIs> {
    const events = await this.getSessionEvents({ from, to });

    // Group events by sessionId
    const sessions = new Map<string, TableSessionEvent[]>();
    events.forEach((event) => {
      const sessionId = event.sessionId;
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId)!.push(event);
    });

    // Calculate averages
    let totalTimeToOrder = 0;
    let orderCount = 0;
    let totalTimeToFirstItem = 0;
    let firstItemCount = 0;
    let totalSessionTime = 0;
    let completedSessions = 0;

    sessions.forEach((sessionEvents) => {
      const orderTaken = sessionEvents.find((e) => e.eventType === 'order_taken');
      const firstItemReady = sessionEvents.find((e) => e.eventType === 'item_ready');
      const billPaid = sessionEvents.find((e) => e.eventType === 'bill_paid');

      if (orderTaken?.durationFromSeatedMs) {
        totalTimeToOrder += orderTaken.durationFromSeatedMs;
        orderCount++;
      }
      if (firstItemReady?.durationFromSeatedMs) {
        totalTimeToFirstItem += firstItemReady.durationFromSeatedMs;
        firstItemCount++;
      }
      if (billPaid?.durationFromSeatedMs) {
        totalSessionTime += billPaid.durationFromSeatedMs;
        completedSessions++;
      }
    });

    return {
      avgTimeToTakeOrderMs: orderCount > 0 ? Math.round(totalTimeToOrder / orderCount) : 0,
      avgTimeToFirstItemMs: firstItemCount > 0 ? Math.round(totalTimeToFirstItem / firstItemCount) : 0,
      avgTotalSessionTimeMs: completedSessions > 0 ? Math.round(totalSessionTime / completedSessions) : 0,
      totalOrders: orderCount,
      totalSessions: sessions.size,
    };
  },

  /**
   * Format duration for display
   */
  formatDuration(ms: number): string {
    if (ms < 0) return '0с';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}г ${minutes % 60}хв`;
    } else if (minutes > 0) {
      return `${minutes}хв ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  },
};
