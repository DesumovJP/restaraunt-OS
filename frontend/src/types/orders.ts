/**
 * Orders Domain Types
 *
 * Types for orders, order items, courses, tables, and scheduling.
 */

import type { MenuItem, OrderStatus } from "./index";

// ==========================================
// COURSE SYSTEM
// ==========================================

export type CourseType =
  | "appetizer" // Закуска
  | "starter" // Стартер
  | "soup" // Суп
  | "main" // Основне блюдо
  | "dessert" // Десерт
  | "drink"; // Напій

export const COURSE_ORDER: CourseType[] = [
  "appetizer",
  "starter",
  "soup",
  "main",
  "dessert",
  "drink",
];

export const COURSE_LABELS: Record<CourseType, { uk: string; en: string }> = {
  appetizer: { uk: "Закуска", en: "Appetizer" },
  starter: { uk: "Стартер", en: "Starter" },
  soup: { uk: "Суп", en: "Soup" },
  main: { uk: "Основне блюдо", en: "Main Course" },
  dessert: { uk: "Десерт", en: "Dessert" },
  drink: { uk: "Напій", en: "Drink" },
};

// ==========================================
// ORDER ITEM STATUS
// ==========================================

export type OrderItemStatus =
  | "queued" // In cart, not yet sent to kitchen
  | "pending" // Sent to kitchen, waiting
  | "in_progress" // Chef started cooking
  | "ready" // Ready to serve
  | "served" // Delivered to table
  | "returned" // Returned (undo from ready/served)
  | "cancelled"; // Cancelled by waiter/manager

export const STATUS_LABELS: Record<
  OrderItemStatus,
  { uk: string; en: string }
> = {
  queued: { uk: "В черзі", en: "Queued" },
  pending: { uk: "Очікує", en: "Pending" },
  in_progress: { uk: "Готується", en: "In Progress" },
  ready: { uk: "Готово", en: "Ready" },
  served: { uk: "Подано", en: "Served" },
  returned: { uk: "Повернено", en: "Returned" },
  cancelled: { uk: "Скасовано", en: "Cancelled" },
};

// ==========================================
// UNDO / AUDIT SYSTEM
// ==========================================

export interface UndoEntry {
  timestamp: string;
  operatorId: string;
  operatorName: string;
  previousStatus: OrderItemStatus;
  newStatus: OrderItemStatus;
  reason: string;
  itemDocumentId: string;
}

export const UNDO_REASONS = [
  {
    key: "customer_refused",
    label: { uk: "Клієнт відмовився", en: "Customer refused" },
  },
  {
    key: "wrong_preparation",
    label: { uk: "Неправильне приготування", en: "Wrong preparation" },
  },
  { key: "allergy_concern", label: { uk: "Алергія", en: "Allergy concern" } },
  { key: "contamination", label: { uk: "Забруднення", en: "Contamination" } },
  {
    key: "quality_issue",
    label: { uk: "Проблема з якістю", en: "Quality issue" },
  },
  { key: "other", label: { uk: "Інше", en: "Other" } },
];

// ==========================================
// EXTENDED ORDER ITEM
// ==========================================

import type { ItemComment, CommentHistoryEntry } from "./comments";

export interface ExtendedOrderItem {
  documentId: string;
  slug: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: OrderItemStatus;

  // Course fields
  courseType: CourseType;
  courseIndex: number;

  // Comments
  comment?: ItemComment;
  commentHistory: CommentHistoryEntry[];

  // Timing
  prepStartAt?: string;
  prepElapsedMs: number;
  servedAt?: string;

  // Undo reference
  undoRef?: string;
}

// ==========================================
// TABLE SESSION
// ==========================================

export type TableSessionStatus = "active" | "billing" | "closed";

export interface CourseTimingEntry {
  courseType: CourseType;
  startedAt?: string;
  completedAt?: string;
  elapsedMs: number;
  itemCount: number;
}

export interface TableSession {
  documentId: string;
  slug: string;
  tableNumber: number;
  startedAt: string;
  endedAt?: string;
  status: TableSessionStatus;
  guestCount: number;
  waiterId: string;
  orders: string[];

  // Timing
  elapsedMs: number;
  courseTimings: CourseTimingEntry[];
}

// ==========================================
// EXTENDED ORDER
// ==========================================

import type { BillSplit } from "./billing";

export type ScheduleStatus =
  | "scheduled"
  | "activating"
  | "activated"
  | "completed";

export interface ExtendedOrder {
  documentId: string;
  slug: string;
  tableNumber: number;
  tableDocumentId?: string; // For table close functionality
  items: ExtendedOrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  waiterId: string;

  // New fields
  tableSessionId: string;
  tableStartAt: string;
  tableElapsedMs: number;
  splitConfig?: BillSplit;
  undoHistory: UndoEntry[];

  // Scheduling fields for planned orders
  scheduledFor?: string; // ISO date - when guests arrive / order should be ready
  prepStartAt?: string; // ISO date - when kitchen should start preparation
  scheduleStatus?: ScheduleStatus; // Status of scheduled order
  isScheduled?: boolean; // True if this is a scheduled order
}
