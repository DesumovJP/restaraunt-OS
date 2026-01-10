import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScheduleStatus } from "@/types/extended";
import type { ItemComment } from "@/types/extended";

// HoReCa Event Types
export type EventType =
  | "regular"      // Звичайне бронювання
  | "birthday"     // День народження
  | "corporate"    // Корпоратив
  | "wedding"      // Весілля
  | "anniversary"  // Річниця
  | "funeral"      // Поминки
  | "baptism"      // Хрестини
  | "graduation"   // Випускний
  | "business"     // Бізнес-зустріч
  | "romantic"     // Романтична вечеря
  | "other";       // Інше

// Seating/Room options
export type SeatingArea =
  | "main_hall"    // Основний зал
  | "vip_room"     // VIP-кімната
  | "terrace"      // Тераса
  | "private"      // Приватна кімната
  | "bar_area"     // Зона бару
  | "outdoor";     // На вулиці

// Menu preset types
export type MenuPreset =
  | "a_la_carte"   // По меню
  | "set_menu"     // Сет-меню
  | "buffet"       // Фуршет
  | "banquet"      // Банкет
  | "custom";      // Індивідуальне

// Payment status
export type PaymentStatus =
  | "pending"      // Очікує оплати
  | "deposit_paid" // Завдаток сплачено
  | "fully_paid"   // Повністю сплачено
  | "refunded";    // Повернено

// Dietary requirements
export interface DietaryRequirements {
  vegetarian?: number;      // К-сть вегетаріанців
  vegan?: number;           // К-сть веганів
  glutenFree?: number;      // Безглютенове
  lactoseFree?: number;     // Безлактозне
  halal?: number;           // Халяль
  kosher?: number;          // Кошерне
  allergies?: string[];     // Алергії (текстом)
  other?: string;           // Інші вимоги
}

// Contact information
export interface ContactInfo {
  name: string;             // Ім'я контактної особи
  phone: string;            // Телефон
  email?: string;           // Email
  company?: string;         // Компанія (для корпоративів)
}

// Pre-event checklist item
export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueTime?: string;         // ISO date
  assignedTo?: string;      // Відповідальний
}

// Course service timeline
export interface CourseTimeline {
  courseNumber: number;
  courseName: string;       // Напр. "Холодні закуски"
  plannedTime: string;      // ISO date
  actualTime?: string;      // ISO date
  status: "pending" | "serving" | "completed";
}

export interface ScheduledOrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
  comment?: ItemComment | null;
  outputType?: string;
  preparationTime?: number;
  courseNumber?: number;    // До якої подачі належить
}

export interface ScheduledOrder {
  id: string;
  tableNumber: number;
  tableId: string;
  items: ScheduledOrderItem[];
  totalAmount: number;
  scheduledFor: string;     // ISO date - коли гості прибудуть
  prepStartAt: string;      // ISO date - коли кухня починає готувати
  scheduleStatus: ScheduleStatus;
  createdAt: string;
  createdBy?: string;       // Хто створив
  notes?: string;
  guestCount?: number;

  // === HoReCa Extensions ===
  // Event details
  eventType?: EventType;
  eventName?: string;       // Назва події (напр. "День народження Марії")
  seatingArea?: SeatingArea;

  // Guest breakdown
  adultsCount?: number;
  childrenCount?: number;

  // Contact
  contact?: ContactInfo;

  // Menu & Dietary
  menuPreset?: MenuPreset;
  dietaryRequirements?: DietaryRequirements;

  // Payment
  paymentStatus?: PaymentStatus;
  depositAmount?: number;
  depositPaidAt?: string;
  depositMethod?: string;   // Спосіб оплати завдатку

  // Service
  assignedCoordinator?: string;  // Відповідальний менеджер/офіціант
  courseTimeline?: CourseTimeline[];
  checklist?: ChecklistItem[];

  // Special requests
  decorations?: string;     // Декорації
  musicPreference?: string; // Музичні побажання
  cakeDetails?: string;     // Деталі торту (для днів народження)

  // Confirmation
  confirmedAt?: string;     // Коли підтверджено
  confirmationSentAt?: string; // Коли надіслано підтвердження
  reminderSentAt?: string;  // Коли надіслано нагадування
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
