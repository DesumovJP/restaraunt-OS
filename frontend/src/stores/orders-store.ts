// @ts-nocheck
/**
 * Extended Orders Store
 *
 * Manages orders with courses, comments, timers, and undo functionality.
 * Integrates with FSM for status transitions and event logging.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ExtendedOrder,
  ExtendedOrderItem,
  CourseType,
  OrderItemStatus,
  ItemComment,
  CommentHistoryEntry,
  UndoEntry,
  TableSession,
  CourseTimingEntry,
  BillSplit,
} from '@/types/extended';
import { COURSE_ORDER } from '@/types/extended';
import { canTransition, getAvailableTransitions, type UndoReasonCode } from '@/types/fsm';
import { createEvent, type EventLog } from '@/types/event-log';

// ==========================================
// STORE STATE INTERFACE
// ==========================================

interface OrdersState {
  // Data
  orders: ExtendedOrder[];
  tableSessions: TableSession[];
  activeSplits: Map<string, BillSplit>; // orderId -> split
  eventLog: EventLog[]; // Audit trail

  // UI State
  selectedOrderId: string | null;
  selectedItemId: string | null;
  courseFilter: CourseType | 'all';

  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface OrdersActions {
  // Order CRUD
  setOrders: (orders: ExtendedOrder[]) => void;
  addOrder: (order: ExtendedOrder) => void;
  updateOrder: (documentId: string, updates: Partial<ExtendedOrder>) => void;
  removeOrder: (documentId: string) => void;

  // Item management
  addItemToOrder: (orderId: string, item: ExtendedOrderItem) => void;
  updateItem: (orderId: string, itemId: string, updates: Partial<ExtendedOrderItem>) => void;
  removeItem: (orderId: string, itemId: string) => void;

  // Course management
  setItemCourse: (orderId: string, itemId: string, courseType: CourseType, courseIndex?: number) => void;
  reorderItemsInCourse: (orderId: string, courseType: CourseType, itemIds: string[]) => void;

  // Comments
  addComment: (orderId: string, itemId: string, comment: ItemComment) => void;
  updateComment: (orderId: string, itemId: string, comment: ItemComment) => void;

  // Status management (FSM-based)
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus, actorRole?: string) => boolean;
  undoItemStatus: (orderId: string, itemId: string, reason: UndoReasonCode, customReason: string | undefined, operatorId: string, operatorName: string, operatorRole: string) => boolean;
  canTransitionItem: (orderId: string, itemId: string, targetStatus: OrderItemStatus, role: string) => boolean;
  getAvailableItemTransitions: (orderId: string, itemId: string, role: string) => OrderItemStatus[];

  // Timers
  startItemPrep: (orderId: string, itemId: string) => void;
  updateItemElapsed: (orderId: string, itemId: string, elapsedMs: number) => void;
  markItemServed: (orderId: string, itemId: string) => void;

  // Table sessions
  startTableSession: (tableNumber: number, guestCount: number, waiterId: string) => TableSession;
  endTableSession: (sessionId: string) => void;
  updateSessionTimer: (sessionId: string) => void;
  updateCourseTimings: (sessionId: string, courseType: CourseType, action: 'start' | 'complete') => void;

  // Bill splits
  setSplit: (orderId: string, split: BillSplit) => void;
  removeSplit: (orderId: string) => void;

  // UI actions
  selectOrder: (orderId: string | null) => void;
  selectItem: (itemId: string | null) => void;
  setCourseFilter: (filter: CourseType | 'all') => void;

  // Computed
  getOrderById: (documentId: string) => ExtendedOrder | undefined;
  getOrderItems: (orderId: string) => ExtendedOrderItem[];
  getItemsByCourse: (orderId: string, courseType: CourseType) => ExtendedOrderItem[];
  getActiveSession: (tableNumber: number) => TableSession | undefined;
  getOrdersForTable: (tableNumber: number) => ExtendedOrder[];

  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type OrdersStore = OrdersState & OrdersActions;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateDocumentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSlug(base: string): string {
  return `${base}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
}

function getNextCourseIndex(items: ExtendedOrderItem[], courseType: CourseType): number {
  const courseItems = items.filter((item) => item.courseType === courseType);
  if (courseItems.length === 0) return 0;
  return Math.max(...courseItems.map((item) => item.courseIndex)) + 1;
}

// ==========================================
// STORE IMPLEMENTATION
// ==========================================

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      // Initial state
      orders: [],
      tableSessions: [],
      activeSplits: new Map(),
      eventLog: [],
      selectedOrderId: null,
      selectedItemId: null,
      courseFilter: 'all',
      isLoading: false,
      error: null,

      // Order CRUD
      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({
          orders: [...state.orders, order],
        })),

      updateOrder: (documentId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.documentId === documentId
              ? { ...order, ...updates, updatedAt: new Date().toISOString() }
              : order
          ),
        })),

      removeOrder: (documentId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.documentId !== documentId),
        })),

      // Item management
      addItemToOrder: (orderId, item) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            const courseIndex = getNextCourseIndex(order.items, item.courseType);
            const newItem = { ...item, courseIndex };

            return {
              ...order,
              items: [...order.items, newItem],
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateItem: (orderId, itemId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) =>
                item.documentId === itemId ? { ...item, ...updates } : item
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      removeItem: (orderId, itemId) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.filter((item) => item.documentId !== itemId),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      // Course management
      setItemCourse: (orderId, itemId, courseType, courseIndex) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            const newIndex =
              courseIndex ?? getNextCourseIndex(order.items, courseType);

            return {
              ...order,
              items: order.items.map((item) =>
                item.documentId === itemId
                  ? { ...item, courseType, courseIndex: newIndex }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      reorderItemsInCourse: (orderId, courseType, itemIds) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) => {
                if (item.courseType !== courseType) return item;

                const newIndex = itemIds.indexOf(item.documentId);
                if (newIndex === -1) return item;

                return { ...item, courseIndex: newIndex };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      // Comments
      addComment: (orderId, itemId, comment) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) => {
                if (item.documentId !== itemId) return item;

                const historyEntry: CommentHistoryEntry = {
                  timestamp: comment.createdAt,
                  authorId: comment.createdBy,
                  authorName: '', // Would be filled by API
                  value: comment.text,
                  presets: comment.presets,
                };

                return {
                  ...item,
                  comment,
                  commentHistory: [...item.commentHistory, historyEntry],
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateComment: (orderId, itemId, comment) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) => {
                if (item.documentId !== itemId) return item;

                const historyEntry: CommentHistoryEntry = {
                  timestamp: new Date().toISOString(),
                  authorId: comment.createdBy,
                  authorName: '',
                  value: comment.text,
                  presets: comment.presets,
                };

                return {
                  ...item,
                  comment,
                  commentHistory: [...item.commentHistory, historyEntry],
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      // Status management (FSM-based)
      updateItemStatus: (orderId, itemId, status, actorRole = 'chef') => {
        const state = get();
        const order = state.orders.find((o) => o.documentId === orderId);
        if (!order) return false;

        const item = order.items.find((i) => i.documentId === itemId);
        if (!item) return false;

        // Validate transition using FSM
        if (!canTransition('orderItem', item.status, status, actorRole)) {
          console.warn(`Invalid transition: ${item.status} -> ${status} for role ${actorRole}`);
          return false;
        }

        set((state) => {
          // Create event log entry
          const event = createEvent({
            category: 'order',
            eventType: 'item.status_changed',
            severity: 'info',
            resourceType: 'order_item',
            resourceDocumentId: itemId,
            previousState: item.status,
            newState: status,
            actorId: 'current_user',
            actorName: 'Поточний користувач',
            actorRole,
          });

          return {
            orders: state.orders.map((order) => {
              if (order.documentId !== orderId) return order;

              return {
                ...order,
                items: order.items.map((i) => {
                  if (i.documentId !== itemId) return i;

                  const updates: Partial<ExtendedOrderItem> = { status };

                  // Start timer when entering cooking
                  if (status === 'cooking' && !i.prepStartAt) {
                    updates.prepStartAt = new Date().toISOString();
                  }

                  // Record served time
                  if (status === 'served') {
                    updates.servedAt = new Date().toISOString();
                  }

                  return { ...i, ...updates };
                }),
                updatedAt: new Date().toISOString(),
              };
            }),
            eventLog: [...state.eventLog, event],
          };
        });

        return true;
      },

      undoItemStatus: (orderId, itemId, reason, customReason, operatorId, operatorName, operatorRole) => {
        const state = get();
        const order = state.orders.find((o) => o.documentId === orderId);
        if (!order) return false;

        const item = order.items.find((i) => i.documentId === itemId);
        if (!item) return false;

        // Determine target status based on current (go back one step)
        const undoMap: Record<OrderItemStatus, OrderItemStatus> = {
          sent: 'pending',
          cooking: 'sent',
          plating: 'cooking',
          ready: 'plating',
          served: 'ready',
          pending: 'pending',
          cancelled: 'pending',
        };

        const targetStatus = undoMap[item.status];

        set((state) => {
          const undoEntry: UndoEntry = {
            timestamp: new Date().toISOString(),
            operatorId,
            operatorName,
            previousStatus: item.status,
            newStatus: targetStatus,
            reason: customReason || reason,
            itemDocumentId: itemId,
          };

          // Create event log entry
          const event = createEvent({
            category: 'order',
            eventType: 'item.undo',
            severity: 'warning',
            resourceType: 'order_item',
            resourceDocumentId: itemId,
            previousState: item.status,
            newState: targetStatus,
            actorId: operatorId,
            actorName: operatorName,
            actorRole: operatorRole,
            reason: customReason || reason,
            reasonCode: reason,
          });

          return {
            orders: state.orders.map((order) => {
              if (order.documentId !== orderId) return order;

              return {
                ...order,
                items: order.items.map((i) =>
                  i.documentId === itemId
                    ? { ...i, status: targetStatus, undoRef: undoEntry.timestamp }
                    : i
                ),
                undoHistory: [...order.undoHistory, undoEntry],
                updatedAt: new Date().toISOString(),
              };
            }),
            eventLog: [...state.eventLog, event],
          };
        });

        return true;
      },

      canTransitionItem: (orderId, itemId, targetStatus, role) => {
        const state = get();
        const order = state.orders.find((o) => o.documentId === orderId);
        if (!order) return false;

        const item = order.items.find((i) => i.documentId === itemId);
        if (!item) return false;

        return canTransition('orderItem', item.status, targetStatus, role);
      },

      getAvailableItemTransitions: (orderId, itemId, role) => {
        const state = get();
        const order = state.orders.find((o) => o.documentId === orderId);
        if (!order) return [];

        const item = order.items.find((i) => i.documentId === itemId);
        if (!item) return [];

        return getAvailableTransitions('orderItem', item.status, role) as OrderItemStatus[];
      },

      // Timers
      startItemPrep: (orderId, itemId) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) =>
                item.documentId === itemId
                  ? {
                      ...item,
                      prepStartAt: new Date().toISOString(),
                      status: 'in_progress' as OrderItemStatus,
                    }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateItemElapsed: (orderId, itemId, elapsedMs) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) =>
                item.documentId === itemId ? { ...item, prepElapsedMs: elapsedMs } : item
              ),
            };
          }),
        })),

      markItemServed: (orderId, itemId) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.documentId !== orderId) return order;

            return {
              ...order,
              items: order.items.map((item) =>
                item.documentId === itemId
                  ? {
                      ...item,
                      status: 'served' as OrderItemStatus,
                      servedAt: new Date().toISOString(),
                    }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      // Table sessions
      startTableSession: (tableNumber, guestCount, waiterId) => {
        const session: TableSession = {
          documentId: generateDocumentId('session'),
          slug: generateSlug(`table-${tableNumber}`),
          tableNumber,
          startedAt: new Date().toISOString(),
          status: 'active',
          guestCount,
          waiterId,
          orders: [],
          elapsedMs: 0,
          courseTimings: COURSE_ORDER.map((courseType) => ({
            courseType,
            elapsedMs: 0,
            itemCount: 0,
          })),
        };

        set((state) => ({
          tableSessions: [...state.tableSessions, session],
        }));

        return session;
      },

      endTableSession: (sessionId) =>
        set((state) => ({
          tableSessions: state.tableSessions.map((session) =>
            session.documentId === sessionId
              ? {
                  ...session,
                  status: 'closed' as const,
                  endedAt: new Date().toISOString(),
                }
              : session
          ),
        })),

      updateSessionTimer: (sessionId) =>
        set((state) => ({
          tableSessions: state.tableSessions.map((session) => {
            if (session.documentId !== sessionId) return session;

            const startTime = new Date(session.startedAt).getTime();
            const elapsedMs = Date.now() - startTime;

            return { ...session, elapsedMs };
          }),
        })),

      updateCourseTimings: (sessionId, courseType, action) =>
        set((state) => ({
          tableSessions: state.tableSessions.map((session) => {
            if (session.documentId !== sessionId) return session;

            return {
              ...session,
              courseTimings: session.courseTimings.map((timing) => {
                if (timing.courseType !== courseType) return timing;

                if (action === 'start' && !timing.startedAt) {
                  return { ...timing, startedAt: new Date().toISOString() };
                }

                if (action === 'complete') {
                  const completedAt = new Date().toISOString();
                  const startTime = timing.startedAt
                    ? new Date(timing.startedAt).getTime()
                    : Date.now();
                  const elapsedMs = Date.now() - startTime;

                  return { ...timing, completedAt, elapsedMs };
                }

                return timing;
              }),
            };
          }),
        })),

      // Bill splits
      setSplit: (orderId, split) =>
        set((state) => {
          const newSplits = new Map(state.activeSplits);
          newSplits.set(orderId, split);
          return { activeSplits: newSplits };
        }),

      removeSplit: (orderId) =>
        set((state) => {
          const newSplits = new Map(state.activeSplits);
          newSplits.delete(orderId);
          return { activeSplits: newSplits };
        }),

      // UI actions
      selectOrder: (orderId) => set({ selectedOrderId: orderId }),
      selectItem: (itemId) => set({ selectedItemId: itemId }),
      setCourseFilter: (filter) => set({ courseFilter: filter }),

      // Computed
      getOrderById: (documentId) => {
        return get().orders.find((order) => order.documentId === documentId);
      },

      getOrderItems: (orderId) => {
        const order = get().orders.find((o) => o.documentId === orderId);
        if (!order) return [];

        // Sort by course order, then by courseIndex
        return [...order.items].sort((a, b) => {
          const courseOrderA = COURSE_ORDER.indexOf(a.courseType);
          const courseOrderB = COURSE_ORDER.indexOf(b.courseType);

          if (courseOrderA !== courseOrderB) {
            return courseOrderA - courseOrderB;
          }

          return a.courseIndex - b.courseIndex;
        });
      },

      getItemsByCourse: (orderId, courseType) => {
        const items = get().getOrderItems(orderId);
        return items.filter((item) => item.courseType === courseType);
      },

      getActiveSession: (tableNumber) => {
        return get().tableSessions.find(
          (session) => session.tableNumber === tableNumber && session.status === 'active'
        );
      },

      getOrdersForTable: (tableNumber) => {
        return get().orders.filter((order) => order.tableNumber === tableNumber);
      },

      // Loading
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'restaurant-orders',
      partialize: (state) => ({
        orders: state.orders,
        tableSessions: state.tableSessions,
      }),
    }
  )
);

// ==========================================
// SELECTOR HOOKS
// ==========================================

export const useSelectedOrder = () => {
  const selectedOrderId = useOrdersStore((state) => state.selectedOrderId);
  const getOrderById = useOrdersStore((state) => state.getOrderById);

  return selectedOrderId ? getOrderById(selectedOrderId) : undefined;
};

export const useOrderItemsByCourse = (orderId: string) => {
  const getOrderItems = useOrdersStore((state) => state.getOrderItems);
  const items = getOrderItems(orderId);

  const grouped: Record<CourseType, ExtendedOrderItem[]> = {
    appetizer: [],
    starter: [],
    soup: [],
    main: [],
    dessert: [],
    drink: [],
  };

  for (const item of items) {
    grouped[item.courseType].push(item);
  }

  return grouped;
};

export const useActiveTableSession = (tableNumber: number) => {
  return useOrdersStore((state) => state.getActiveSession(tableNumber));
};
