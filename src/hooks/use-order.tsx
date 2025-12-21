"use client";

import * as React from "react";
import type {
  OrderItemStatus,
  CourseType,
  ItemComment,
  ExtendedOrder,
  ExtendedOrderItem,
} from "@/types/extended";
import type { UndoReasonCode } from "@/types/fsm";
import { canTransition, getAvailableTransitions } from "@/types/fsm";
import { createEvent } from "@/types/event-log";

// Order context for sharing state across components
interface OrderContextValue {
  order: ExtendedOrder | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  updateItemStatus: (itemDocumentId: string, newStatus: OrderItemStatus) => Promise<void>;
  undoItemStatus: (itemDocumentId: string, reason: UndoReasonCode, customReason?: string) => Promise<void>;
  updateItemCourse: (itemDocumentId: string, courseType: CourseType, courseIndex: number) => Promise<void>;
  updateItemComment: (itemDocumentId: string, comment: ItemComment | null) => Promise<void>;
  submitOrder: () => Promise<void>;
  cancelOrder: () => Promise<void>;
  // Helpers
  canTransitionItem: (itemDocumentId: string, targetStatus: OrderItemStatus) => boolean;
  getAvailableItemTransitions: (itemDocumentId: string) => OrderItemStatus[];
}

const OrderContext = React.createContext<OrderContextValue | null>(null);

export function useOrderContext() {
  const context = React.useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderContext must be used within OrderProvider");
  }
  return context;
}

interface OrderProviderProps {
  orderDocumentId: string;
  children: React.ReactNode;
}

export function OrderProvider({ orderDocumentId, children }: OrderProviderProps) {
  const [order, setOrder] = React.useState<ExtendedOrder | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch order on mount
  React.useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      setError(null);
      try {
        // In real app, this would be an API call
        const response = await fetch(`/api/orders/${orderDocumentId}`);
        if (!response.ok) throw new Error("Failed to fetch order");
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderDocumentId]);

  // Update item status
  const updateItemStatus = React.useCallback(
    async (itemDocumentId: string, newStatus: OrderItemStatus) => {
      if (!order) return;

      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return;

      // Validate transition
      const role = "chef"; // Would come from auth context
      if (!canTransition("orderItem", item.status, newStatus, role)) {
        throw new Error(`Cannot transition from ${item.status} to ${newStatus}`);
      }

      // Optimistic update
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.documentId === itemDocumentId
              ? {
                  ...i,
                  status: newStatus,
                  prepStartAt:
                    newStatus === "cooking" && !i.prepStartAt
                      ? new Date().toISOString()
                      : i.prepStartAt,
                  servedAt:
                    newStatus === "served" ? new Date().toISOString() : i.servedAt,
                }
              : i
          ),
        };
      });

      // API call
      try {
        await fetch(`/api/orders/${orderDocumentId}/items/${itemDocumentId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        // Rollback on error
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.documentId === itemDocumentId ? { ...i, status: item.status } : i
            ),
          };
        });
        throw err;
      }
    },
    [order, orderDocumentId]
  );

  // Undo item status
  const undoItemStatus = React.useCallback(
    async (
      itemDocumentId: string,
      reason: UndoReasonCode,
      customReason?: string
    ) => {
      if (!order) return;

      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return;

      // Determine target status based on current
      const undoMap: Record<OrderItemStatus, OrderItemStatus> = {
        sent: "pending",
        cooking: "sent",
        plating: "cooking",
        ready: "plating",
        served: "ready",
        pending: "pending",
        cancelled: "pending",
      };

      const targetStatus = undoMap[item.status];

      // Optimistic update
      const previousStatus = item.status;
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.documentId === itemDocumentId
              ? { ...i, status: targetStatus, undoRef: `undo_${Date.now()}` }
              : i
          ),
          undoHistory: [
            ...prev.undoHistory,
            {
              itemDocumentId,
              previousStatus,
              newStatus: targetStatus,
              reason,
              customReason,
              timestamp: new Date().toISOString(),
              actorId: "current_user",
              actorName: "Поточний користувач",
            },
          ],
        };
      });

      // API call
      try {
        await fetch(`/api/orders/${orderDocumentId}/items/${itemDocumentId}/undo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, customReason }),
        });
      } catch (err) {
        // Rollback
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.documentId === itemDocumentId
                ? { ...i, status: previousStatus, undoRef: undefined }
                : i
            ),
            undoHistory: prev.undoHistory.slice(0, -1),
          };
        });
        throw err;
      }
    },
    [order, orderDocumentId]
  );

  // Update item course
  const updateItemCourse = React.useCallback(
    async (itemDocumentId: string, courseType: CourseType, courseIndex: number) => {
      if (!order) return;

      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return;

      // Optimistic update
      const previousCourse = item.courseType;
      const previousIndex = item.courseIndex;
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.documentId === itemDocumentId
              ? { ...i, courseType, courseIndex }
              : i
          ),
        };
      });

      // API call
      try {
        await fetch(`/api/orders/${orderDocumentId}/items/${itemDocumentId}/course`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseType, courseIndex }),
        });
      } catch (err) {
        // Rollback
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.documentId === itemDocumentId
                ? { ...i, courseType: previousCourse, courseIndex: previousIndex }
                : i
            ),
          };
        });
        throw err;
      }
    },
    [order, orderDocumentId]
  );

  // Update item comment
  const updateItemComment = React.useCallback(
    async (itemDocumentId: string, comment: ItemComment | null) => {
      if (!order) return;

      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return;

      // Optimistic update
      const previousComment = item.comment;
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.documentId === itemDocumentId
              ? {
                  ...i,
                  comment,
                  commentHistory: comment
                    ? [...i.commentHistory, { ...comment, savedAt: new Date().toISOString() }]
                    : i.commentHistory,
                }
              : i
          ),
        };
      });

      // API call
      try {
        await fetch(`/api/orders/${orderDocumentId}/items/${itemDocumentId}/comment`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment }),
        });
      } catch (err) {
        // Rollback
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.documentId === itemDocumentId
                ? { ...i, comment: previousComment }
                : i
            ),
          };
        });
        throw err;
      }
    },
    [order, orderDocumentId]
  );

  // Submit order
  const submitOrder = React.useCallback(async () => {
    if (!order) return;

    setOrder((prev) => (prev ? { ...prev, status: "submitted" } : prev));

    try {
      await fetch(`/api/orders/${orderDocumentId}/submit`, {
        method: "POST",
      });
    } catch (err) {
      setOrder((prev) => (prev ? { ...prev, status: "draft" } : prev));
      throw err;
    }
  }, [order, orderDocumentId]);

  // Cancel order
  const cancelOrder = React.useCallback(async () => {
    if (!order) return;

    setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));

    try {
      await fetch(`/api/orders/${orderDocumentId}/cancel`, {
        method: "POST",
      });
    } catch (err) {
      setOrder((prev) => (prev ? { ...prev, status: order.status } : prev));
      throw err;
    }
  }, [order, orderDocumentId]);

  // Helper: can transition item
  const canTransitionItem = React.useCallback(
    (itemDocumentId: string, targetStatus: OrderItemStatus): boolean => {
      if (!order) return false;
      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return false;
      return canTransition("orderItem", item.status, targetStatus, "chef");
    },
    [order]
  );

  // Helper: get available transitions
  const getAvailableItemTransitions = React.useCallback(
    (itemDocumentId: string): OrderItemStatus[] => {
      if (!order) return [];
      const item = order.items.find((i) => i.documentId === itemDocumentId);
      if (!item) return [];
      return getAvailableTransitions("orderItem", item.status, "chef") as OrderItemStatus[];
    },
    [order]
  );

  const value = React.useMemo(
    () => ({
      order,
      isLoading,
      error,
      updateItemStatus,
      undoItemStatus,
      updateItemCourse,
      updateItemComment,
      submitOrder,
      cancelOrder,
      canTransitionItem,
      getAvailableItemTransitions,
    }),
    [
      order,
      isLoading,
      error,
      updateItemStatus,
      undoItemStatus,
      updateItemCourse,
      updateItemComment,
      submitOrder,
      cancelOrder,
      canTransitionItem,
      getAvailableItemTransitions,
    ]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

// Hook for order items with real-time elapsed time
export function useOrderItemTimer(
  prepStartAt: string | undefined,
  isActive: boolean
): number {
  const [elapsedMs, setElapsedMs] = React.useState(() => {
    if (!prepStartAt) return 0;
    return Date.now() - new Date(prepStartAt).getTime();
  });

  React.useEffect(() => {
    if (!isActive || !prepStartAt) return;

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - new Date(prepStartAt).getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [prepStartAt, isActive]);

  return elapsedMs;
}

// Hook for table session timer
export function useTableTimer(
  startedAt: string | undefined,
  isActive: boolean
): number {
  const [elapsedMs, setElapsedMs] = React.useState(() => {
    if (!startedAt) return 0;
    return Date.now() - new Date(startedAt).getTime();
  });

  React.useEffect(() => {
    if (!isActive || !startedAt) return;

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - new Date(startedAt).getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isActive]);

  return elapsedMs;
}

// Hook for course timing tracking
interface CourseTimingState {
  courseType: CourseType;
  status: "pending" | "active" | "completed";
  startedAt?: string;
  completedAt?: string;
  elapsedMs: number;
}

export function useCourseTimings(
  items: Array<{ courseType: CourseType; status: OrderItemStatus; prepStartAt?: string; servedAt?: string }>
): CourseTimingState[] {
  const [timings, setTimings] = React.useState<CourseTimingState[]>([]);

  // Calculate course timings from items
  React.useEffect(() => {
    const courses: CourseType[] = ["appetizer", "starter", "soup", "main", "dessert", "drink"];

    const newTimings = courses.map((courseType) => {
      const courseItems = items.filter((i) => i.courseType === courseType);

      if (courseItems.length === 0) {
        return { courseType, status: "pending" as const, elapsedMs: 0 };
      }

      const allServed = courseItems.every((i) => i.status === "served");
      const anyActive = courseItems.some((i) =>
        ["cooking", "plating", "ready"].includes(i.status)
      );
      const anySent = courseItems.some((i) => i.status === "sent");

      const startedAt = courseItems
        .filter((i) => i.prepStartAt)
        .map((i) => new Date(i.prepStartAt!).getTime())
        .sort()[0];

      const completedAt = allServed
        ? courseItems
            .filter((i) => i.servedAt)
            .map((i) => new Date(i.servedAt!).getTime())
            .sort()
            .pop()
        : undefined;

      const status = allServed
        ? "completed"
        : anyActive || anySent
          ? "active"
          : "pending";

      const elapsedMs = startedAt
        ? (completedAt || Date.now()) - startedAt
        : 0;

      return {
        courseType,
        status: status as "pending" | "active" | "completed",
        startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
        completedAt: completedAt ? new Date(completedAt).toISOString() : undefined,
        elapsedMs,
      };
    });

    setTimings(newTimings);
  }, [items]);

  // Update active course timers
  React.useEffect(() => {
    const hasActive = timings.some((t) => t.status === "active");
    if (!hasActive) return;

    const interval = setInterval(() => {
      setTimings((prev) =>
        prev.map((t) => {
          if (t.status !== "active" || !t.startedAt) return t;
          return {
            ...t,
            elapsedMs: Date.now() - new Date(t.startedAt).getTime(),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timings]);

  return timings;
}
