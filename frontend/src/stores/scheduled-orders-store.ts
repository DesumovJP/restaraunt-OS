import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScheduleStatus } from "@/types/extended";
import type { ItemComment } from "@/types/extended";

export interface ScheduledOrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
  comment?: ItemComment | null;
  outputType?: string;
  preparationTime?: number;
}

export interface ScheduledOrder {
  id: string;
  tableNumber: number;
  tableId: string;
  items: ScheduledOrderItem[];
  totalAmount: number;
  scheduledFor: string; // ISO date - when guests arrive / order should be ready
  prepStartAt: string; // ISO date - when kitchen should start
  scheduleStatus: ScheduleStatus;
  createdAt: string;
  createdBy?: string; // Waiter name
  notes?: string;
  guestCount?: number;
}

interface ScheduledOrdersStore {
  orders: ScheduledOrder[];

  // Actions
  addOrder: (order: Omit<ScheduledOrder, "id" | "createdAt" | "scheduleStatus">) => string;
  updateOrderStatus: (orderId: string, status: ScheduleStatus) => void;
  updateOrder: (orderId: string, updates: Partial<ScheduledOrder>) => void;
  removeOrder: (orderId: string) => void;
  clearCompletedOrders: () => void;

  // Getters
  getOrdersByDate: (date: string) => ScheduledOrder[];
  getOrdersReadyToActivate: () => ScheduledOrder[];
  getPendingOrders: () => ScheduledOrder[];
  getOrderById: (orderId: string) => ScheduledOrder | undefined;
}

export const useScheduledOrdersStore = create<ScheduledOrdersStore>()(
  persist(
    (set, get) => ({
      orders: [] as ScheduledOrder[],

      addOrder: (orderData) => {
        const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newOrder: ScheduledOrder = {
          ...orderData,
          id,
          createdAt: new Date().toISOString(),
          scheduleStatus: "scheduled",
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
        }));

        return id;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, scheduleStatus: status } : order
          ),
        }));
      },

      updateOrder: (orderId, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, ...updates } : order
          ),
        }));
      },

      removeOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
        }));
      },

      clearCompletedOrders: () => {
        set((state) => ({
          orders: state.orders.filter((order) => order.scheduleStatus !== "completed"),
        }));
      },

      getOrdersByDate: (date) => {
        const targetDate = new Date(date).toDateString();
        return get().orders.filter((order) => {
          const orderDate = new Date(order.scheduledFor).toDateString();
          return orderDate === targetDate;
        });
      },

      getOrdersReadyToActivate: () => {
        const now = Date.now();
        return get().orders.filter((order) => {
          if (order.scheduleStatus !== "scheduled") return false;
          const prepStart = new Date(order.prepStartAt).getTime();
          return prepStart <= now;
        });
      },

      getPendingOrders: () => {
        return get().orders.filter((order) => order.scheduleStatus === "scheduled");
      },

      getOrderById: (orderId) => {
        return get().orders.find((order) => order.id === orderId);
      },
    }),
    {
      name: "scheduled-orders-storage",
      skipHydration: true,
    }
  )
);

// Hydrate store on client side
if (typeof window !== "undefined") {
  useScheduledOrdersStore.persist.rehydrate();
}
