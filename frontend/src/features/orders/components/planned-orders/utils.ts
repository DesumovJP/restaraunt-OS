/**
 * Planned Orders Utilities
 *
 * Helper functions for date formatting and order conversion
 */

import type { ScheduledOrder, EventType } from "@/stores/scheduled-orders-store";
import type { PlannedOrder, TimeDisplayInfo, CreateOrderFormData } from "./types";
import { PREP_MINUTES_BY_EVENT } from "./config";

// ==========================================
// DATE HELPERS
// ==========================================

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
 * Format date for short display (weekday, day)
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" });
}

/**
 * Format date for full display (weekday, day, month)
 */
export function formatDateFull(date: Date): string {
  return date.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Get time display with relative info
 */
export function getTimeDisplay(date: Date): TimeDisplayInfo {
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

/**
 * Generate dates for date selector (next N days)
 */
export function generateAvailableDates(daysCount: number = 30): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

// ==========================================
// ORDER CONVERSION
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

// ==========================================
// FORM HELPERS
// ==========================================

/**
 * Calculate prep time based on event type and service time
 */
export function calculatePrepTime(eventType: EventType, serviceTime: string): string {
  if (!serviceTime) return "";

  const [hours, minutes] = serviceTime.split(":").map(Number);
  const serviceDate = new Date();
  serviceDate.setHours(hours, minutes, 0, 0);

  const prepMinutes = PREP_MINUTES_BY_EVENT[eventType];
  serviceDate.setMinutes(serviceDate.getMinutes() - prepMinutes);

  return `${serviceDate.getHours().toString().padStart(2, "0")}:${serviceDate.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Get initial form data
 */
export function getInitialFormData(): CreateOrderFormData {
  return {
    tableNumber: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    prepTime: "",
    notes: "",
    guestCount: "2",
    adultsCount: "2",
    childrenCount: "0",
    eventType: "regular",
    eventName: "",
    seatingArea: "main_hall",
    menuPreset: "a_la_carte",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactCompany: "",
    depositAmount: "",
    decorations: "",
    cakeDetails: "",
    assignedCoordinator: "",
  };
}

// ==========================================
// STATS CALCULATION
// ==========================================

/**
 * Calculate day statistics
 */
export function calculateDayStats(orders: PlannedOrder[]) {
  return {
    total: orders.length,
    scheduled: orders.filter((o) => o.status === "scheduled").length,
    activated: orders.filter((o) => o.status === "activated").length,
    completed: orders.filter((o) => o.status === "completed").length,
    reservations: orders.filter((o) => o.entryType === "reservation").length,
    totalGuests: orders.reduce((sum, o) => sum + o.guestCount, 0),
    events: orders.filter((o) => o.eventType && o.eventType !== "regular").length,
  };
}

// ==========================================
// RESERVATION CONVERSION
// ==========================================

export interface ReservationForConversion {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes?: string;
  specialRequests?: string;
  occasion?: string;
  tableId?: string;
  tableNumber: number;
}

/**
 * Convert a Reservation to PlannedOrder view model
 * This allows showing reservations (table bookings) alongside scheduled orders
 */
export function convertReservationToPlannedOrder(res: ReservationForConversion): PlannedOrder {
  // Parse start time
  const [hours, minutes] = res.startTime.split(":").map(Number);
  const scheduledTime = new Date(res.date);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Prep start is same as scheduled for reservations (no prep needed for just booking)
  const prepStartTime = new Date(scheduledTime);

  return {
    id: `reservation_${res.documentId}`,
    tableNumber: res.tableNumber,
    scheduledTime,
    prepStartTime,
    guestCount: res.guestCount,
    items: [], // Reservations have no items
    status: "reservation",
    specialRequests: res.specialRequests || res.notes,
    createdBy: res.contactName || "Гість",
    priority: "normal",
    entryType: "reservation",
    reservationId: res.documentId,
    reservationStatus: res.status as any,
    contact: {
      name: res.contactName,
      phone: res.contactPhone,
      email: res.contactEmail,
    },
    eventType: res.occasion === "birthday" ? "birthday" :
               res.occasion === "anniversary" ? "anniversary" :
               res.occasion === "business" ? "corporate" :
               res.occasion === "romantic" ? "wedding" : "regular",
  };
}
