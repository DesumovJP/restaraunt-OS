/**
 * Planned Orders Configuration
 *
 * Types, interfaces, and configuration constants for planned orders feature.
 * Extracted from planned-orders-view.tsx for better modularity.
 */

import {
  Calendar,
  Cake,
  Briefcase,
  Heart,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ScheduledOrder,
  EventType,
  SeatingArea,
  MenuPreset,
  PaymentStatus,
  ChecklistItem,
} from "@/stores/scheduled-orders-store";

// ==========================================
// TYPES
// ==========================================

export interface PlannedOrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  notes?: string;
  station?: string;
}

export interface PlannedOrder {
  id: string;
  tableNumber: number;
  scheduledTime: Date;
  prepStartTime: Date;
  guestCount: number;
  items: PlannedOrderItem[];
  status: "scheduled" | "activating" | "activated" | "completed";
  specialRequests?: string;
  createdBy: string;
  priority?: "normal" | "vip";
  // HoReCa extensions
  eventType?: EventType;
  eventName?: string;
  seatingArea?: SeatingArea;
  contact?: { name: string; phone: string; email?: string; company?: string };
  paymentStatus?: PaymentStatus;
  depositAmount?: number;
  totalAmount?: number;
  adultsCount?: number;
  childrenCount?: number;
  menuPreset?: MenuPreset;
  assignedCoordinator?: string;
  checklist?: ChecklistItem[];
  decorations?: string;
  cakeDetails?: string;
}

export interface PlannedOrdersViewProps {
  variant?: "kitchen" | "waiter";
  className?: string;
}

// ==========================================
// CONFIGURATIONS
// ==========================================

export interface EventTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const EVENT_TYPES: Record<EventType, EventTypeConfig> = {
  regular: { label: "Бронювання", icon: Calendar, color: "text-gray-600" },
  birthday: { label: "День народження", icon: Cake, color: "text-pink-600" },
  corporate: { label: "Корпоратив", icon: Briefcase, color: "text-blue-600" },
  wedding: { label: "Весілля", icon: Heart, color: "text-red-600" },
  anniversary: { label: "Річниця", icon: PartyPopper, color: "text-purple-600" },
  funeral: { label: "Поминки", icon: Calendar, color: "text-gray-700" },
  baptism: { label: "Хрестини", icon: Heart, color: "text-cyan-600" },
  graduation: { label: "Випускний", icon: GraduationCap, color: "text-amber-600" },
  business: { label: "Бізнес-зустріч", icon: Briefcase, color: "text-slate-600" },
  romantic: { label: "Романтична вечеря", icon: Heart, color: "text-rose-600" },
  other: { label: "Інше", icon: Calendar, color: "text-gray-500" },
};

export const SEATING_AREAS: Record<SeatingArea, string> = {
  main_hall: "Основний зал",
  vip_room: "VIP-кімната",
  terrace: "Тераса",
  private: "Приватна кімната",
  bar_area: "Зона бару",
  outdoor: "На вулиці",
};

export const MENU_PRESETS: Record<MenuPreset, string> = {
  a_la_carte: "По меню",
  set_menu: "Сет-меню",
  buffet: "Фуршет",
  banquet: "Банкет",
  custom: "Індивідуальне",
};

export interface PaymentStatusConfig {
  label: string;
  color: string;
}

export const PAYMENT_STATUSES: Record<PaymentStatus, PaymentStatusConfig> = {
  pending: { label: "Очікує оплати", color: "text-yellow-600 bg-yellow-50" },
  deposit_paid: { label: "Завдаток сплачено", color: "text-blue-600 bg-blue-50" },
  fully_paid: { label: "Сплачено", color: "text-green-600 bg-green-50" },
  refunded: { label: "Повернено", color: "text-gray-600 bg-gray-50" },
};

export interface TimeSlot {
  start: number;
  end: number;
  label: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { start: 9, end: 12, label: "Ранок (9:00 - 12:00)" },
  { start: 12, end: 15, label: "Обід (12:00 - 15:00)" },
  { start: 15, end: 18, label: "Полудень (15:00 - 18:00)" },
  { start: 18, end: 22, label: "Вечір (18:00 - 22:00)" },
];

// Prep time by event type (in minutes)
export const PREP_MINUTES_BY_EVENT: Record<EventType, number> = {
  regular: 30,
  birthday: 45,
  corporate: 60,
  wedding: 90,
  anniversary: 45,
  funeral: 60,
  baptism: 45,
  graduation: 60,
  business: 30,
  romantic: 30,
  other: 30,
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Convert ScheduledOrder from store to PlannedOrder view model
 */
export function convertToPlannedOrder(order: ScheduledOrder): PlannedOrder {
  return {
    id: order.id,
    tableNumber: order.tableNumber,
    scheduledTime: new Date(order.scheduledFor),
    prepStartTime: new Date(order.prepStartAt),
    guestCount: order.guestCount || order.items.reduce((sum, i) => sum + i.quantity, 0),
    items: order.items.map((item, index) => ({
      id: `${order.id}_${index}`,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      notes: item.notes,
      station: item.outputType,
    })),
    status: order.scheduleStatus,
    specialRequests: order.notes,
    createdBy: order.createdBy || "Офіціант",
    priority: "normal",
    // HoReCa extensions
    eventType: order.eventType,
    eventName: order.eventName,
    seatingArea: order.seatingArea,
    contact: order.contact,
    paymentStatus: order.paymentStatus,
    depositAmount: order.depositAmount,
    totalAmount: order.totalAmount,
    adultsCount: order.adultsCount,
    childrenCount: order.childrenCount,
    menuPreset: order.menuPreset,
    assignedCoordinator: order.assignedCoordinator,
    checklist: order.checklist,
    decorations: order.decorations,
    cakeDetails: order.cakeDetails,
  };
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format date for display (short)
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" });
}

/**
 * Format date for display (full)
 */
export function formatDateFull(date: Date): string {
  return date.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Calculate prep time based on event type and service time
 */
export function calculatePrepTime(eventType: EventType, serviceTime: string): string {
  if (!serviceTime) return "";
  const [hours, minutes] = serviceTime.split(":").map(Number);
  const serviceDate = new Date();
  serviceDate.setHours(hours, minutes, 0, 0);
  serviceDate.setMinutes(serviceDate.getMinutes() - PREP_MINUTES_BY_EVENT[eventType]);
  return `${serviceDate.getHours().toString().padStart(2, "0")}:${serviceDate.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Get time display with relative time
 */
export function getTimeDisplay(date: Date): {
  time: string;
  relative: string;
  isOverdue: boolean;
} {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diff / (1000 * 60));

  if (diffMinutes < 0) {
    return {
      time: date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
      relative: `${Math.abs(diffMinutes)} хв тому`,
      isOverdue: true,
    };
  }

  return {
    time: date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
    relative: diffMinutes < 60 ? `через ${diffMinutes} хв` : `через ${Math.floor(diffMinutes / 60)}г`,
    isOverdue: false,
  };
}
