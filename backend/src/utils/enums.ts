/**
 * Centralized Enums for Restaurant OS Backend
 *
 * This file contains all enum values used across content types.
 * Use these constants to ensure consistency across the application.
 *
 * Note: Strapi schemas define enums inline in JSON. These TypeScript
 * definitions serve as a single source of truth for documentation
 * and type safety in custom code.
 */

// ==========================================
// KITCHEN STATIONS
// ==========================================

/**
 * Kitchen preparation stations.
 * Used in: kitchen-ticket, menu-item, recipe-step, worker-shift, worker-performance, daily-task, user
 */
export const KITCHEN_STATIONS = [
  'grill',    // Гриль
  'fry',      // Фритюр
  'salad',    // Салати
  'hot',      // Гаряча
  'dessert',  // Десерти
  'bar',      // Бар
  'pass',     // Видача
  'prep',     // Заготовка
] as const;

export type KitchenStation = (typeof KITCHEN_STATIONS)[number];

/**
 * Extended stations including front-of-house areas.
 * Used in: daily-task, worker-performance, user
 */
export const EXTENDED_STATIONS = [
  ...KITCHEN_STATIONS,
  'front',    // Зал (фронт)
  'back',     // Підсобка
] as const;

export type ExtendedStation = (typeof EXTENDED_STATIONS)[number];

/**
 * Shift stations (includes 'none' option).
 * Used in: worker-shift
 */
export const SHIFT_STATIONS = [
  ...KITCHEN_STATIONS,
  'none',
] as const;

export type ShiftStation = (typeof SHIFT_STATIONS)[number];

// ==========================================
// DEPARTMENTS
// ==========================================

/**
 * Core departments.
 * Used in: worker-performance, user
 */
export const DEPARTMENTS = [
  'management', // Менеджмент
  'kitchen',    // Кухня
  'service',    // Сервіс
  'bar',        // Бар
  'none',       // Не призначено
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/**
 * Extended departments (includes cleaning).
 * Used in: worker-shift
 */
export const EXTENDED_DEPARTMENTS = [
  'management',
  'kitchen',
  'service',
  'bar',
  'cleaning',   // Прибирання
  'none',
] as const;

export type ExtendedDepartment = (typeof EXTENDED_DEPARTMENTS)[number];

// ==========================================
// UNITS OF MEASUREMENT
// ==========================================

/**
 * Units for ingredients and inventory.
 * Used in: ingredient, recipe-ingredient, inventory-movement
 */
export const UNITS = [
  'kg',       // Кілограми
  'g',        // Грами
  'l',        // Літри
  'ml',       // Мілілітри
  'pcs',      // Штуки
  'portion',  // Порції
] as const;

export type Unit = (typeof UNITS)[number];

/**
 * Portion units (smaller subset).
 * Used in: menu-item
 */
export const PORTION_UNITS = ['g', 'ml', 'pcs'] as const;

export type PortionUnit = (typeof PORTION_UNITS)[number];

// ==========================================
// OUTPUT TYPES
// ==========================================

/**
 * Kitchen output destinations.
 * Used in: menu-item, recipe
 */
export const OUTPUT_TYPES = [
  'kitchen',  // Кухня
  'bar',      // Бар
  'pastry',   // Кондитерська
  'cold',     // Холодний цех
] as const;

export type OutputType = (typeof OUTPUT_TYPES)[number];

// ==========================================
// COURSE TYPES
// ==========================================

/**
 * Serving course types.
 * Used in: menu-item, order-item
 */
export const COURSE_TYPES = [
  'appetizer', // Аперитив
  'starter',   // Закуска
  'soup',      // Суп
  'main',      // Основна страва
  'dessert',   // Десерт
  'drink',     // Напій
] as const;

export type CourseType = (typeof COURSE_TYPES)[number];

// ==========================================
// STATUS ENUMS
// ==========================================

/**
 * Order status FSM.
 * Used in: order
 */
export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'in_kitchen',
  'ready',
  'served',
  'cancelled',
  'paid',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Order item status FSM.
 * Used in: order-item
 */
export const ORDER_ITEM_STATUSES = [
  'draft',
  'queued',
  'pending',
  'in_progress',
  'ready',
  'served',
  'returned',
  'cancelled',
  'voided',
] as const;

export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

/**
 * Kitchen ticket status FSM.
 * Used in: kitchen-ticket
 */
export const TICKET_STATUSES = [
  'queued',
  'started',
  'paused',
  'resumed',
  'ready',
  'served',
  'failed',
  'cancelled',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

/**
 * Stock batch status FSM.
 * Used in: stock-batch
 */
export const BATCH_STATUSES = [
  'received',
  'inspecting',
  'processing',
  'available',
  'reserved',
  'depleted',
  'expired',
  'quarantine',
  'written_off',
] as const;

export type BatchStatus = (typeof BATCH_STATUSES)[number];

/**
 * Table status.
 * Used in: table
 */
export const TABLE_STATUSES = [
  'free',
  'occupied',
  'reserved',
] as const;

export type TableStatus = (typeof TABLE_STATUSES)[number];

/**
 * Reservation status.
 * Used in: reservation
 */
export const RESERVATION_STATUSES = [
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/**
 * Scheduled order status.
 * Used in: scheduled-order
 */
export const SCHEDULED_ORDER_STATUSES = [
  'scheduled',
  'activating',
  'activated',
  'completed',
  'cancelled',
] as const;

export type ScheduledOrderStatus = (typeof SCHEDULED_ORDER_STATUSES)[number];

/**
 * Daily task status.
 * Used in: daily-task
 */
export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'overdue',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Worker shift status.
 * Used in: worker-shift
 */
export const SHIFT_STATUSES = [
  'scheduled',
  'started',
  'completed',
  'missed',
  'cancelled',
] as const;

export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

// ==========================================
// PRIORITY LEVELS
// ==========================================

/**
 * Task priority levels.
 * Used in: daily-task
 */
export const TASK_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent',
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Kitchen ticket priority.
 * Used in: kitchen-ticket
 */
export const TICKET_PRIORITIES = [
  'normal',
  'rush',
  'vip',
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

// ==========================================
// INVENTORY MOVEMENT
// ==========================================

/**
 * Inventory movement types.
 * Used in: inventory-movement
 */
export const MOVEMENT_TYPES = [
  'receive',      // Отримання
  'recipe_use',   // Використання за рецептом
  'process',      // Обробка
  'write_off',    // Списання
  'transfer',     // Переміщення
  'adjust',       // Коригування
  'return',       // Повернення
  'reserve',      // Резервування
  'release',      // Вивільнення
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

// ==========================================
// STORAGE CATEGORIES
// ==========================================

/**
 * Main storage categories.
 * Used in: ingredient
 */
export const MAIN_CATEGORIES = [
  'raw',          // Сировина
  'prep',         // Заготовки
  'dry-goods',    // Сухі товари
  'seasonings',   // Приправи
  'oils-fats',    // Олії та жири
  'dairy',        // Молочні
  'beverages',    // Напої
  'frozen',       // Заморожені
  'ready-made',   // Готові
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

/**
 * Storage conditions.
 * Used in: ingredient
 */
export const STORAGE_CONDITIONS = [
  'ambient',      // Кімнатна температура
  'refrigerated', // Холодильник
  'frozen',       // Морозильник
  'dry-cool',     // Сухе прохолодне
] as const;

export type StorageCondition = (typeof STORAGE_CONDITIONS)[number];

// ==========================================
// RECIPE PROCESSING
// ==========================================

/**
 * Recipe processing types.
 * Used in: recipe-step
 */
export const PROCESS_TYPES = [
  'cleaning',     // Чистка
  'boiling',      // Варіння
  'frying',       // Смаження
  'rendering',    // Топлення
  'baking',       // Випікання
  'grilling',     // Гриль
  'portioning',   // Порціювання
] as const;

export type ProcessType = (typeof PROCESS_TYPES)[number];

// ==========================================
// ACTION LOGGING
// ==========================================

/**
 * Action types for history logging.
 * Used in: action-history, action-logger.ts
 */
export const ACTION_TYPES = [
  'create',
  'update',
  'delete',
  'start',
  'complete',
  'cancel',
  'receive',
  'write_off',
  'transfer',
  'login',
  'logout',
  'approve',
  'reject',
  'assign',
  'unassign',
  // Table/Order specific actions
  'emergency_close',
  'merge',
  'unmerge',
  'recall',
  'add_items',
  // Storage/Inventory specific actions
  'consume',
  'process',
  'adjust',
  'reserve',
  'release',
  'count',
  'expire',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

/**
 * Application modules.
 * Used in: action-history
 */
export const MODULES = [
  'pos',
  'kitchen',
  'storage',
  'admin',
  'reservations',
  'system',
] as const;

export type Module = (typeof MODULES)[number];

/**
 * Severity levels.
 * Used in: action-history
 */
export const SEVERITY_LEVELS = [
  'info',
  'warning',
  'critical',
] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

// ==========================================
// USER ROLES
// ==========================================

/**
 * System roles.
 * Used in: user
 */
export const SYSTEM_ROLES = [
  'admin',
  'manager',
  'chef',
  'cook',
  'waiter',
  'host',
  'bartender',
  'cashier',
  'viewer',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/**
 * Actor roles for events.
 * Used in: table-session-event
 */
export const ACTOR_ROLES = [
  'waiter',
  'chef',
  'cashier',
  'system',
] as const;

export type ActorRole = (typeof ACTOR_ROLES)[number];

// ==========================================
// EVENT TYPES
// ==========================================

/**
 * Ticket event types.
 * Used in: ticket-event
 */
export const TICKET_EVENT_TYPES = [
  'created',
  'started',
  'paused',
  'resumed',
  'completed',
  'served',
  'failed',
  'cancelled',
  'inventory_locked',
  'inventory_released',
] as const;

export type TicketEventType = (typeof TICKET_EVENT_TYPES)[number];

/**
 * Table session event types.
 * Used in: table-session-event
 */
export const TABLE_SESSION_EVENT_TYPES = [
  'table_seated',
  'order_taken',
  'item_started',
  'item_ready',
  'item_served',
  'bill_requested',
  'payment_received',
  'table_cleared',
] as const;

export type TableSessionEventType = (typeof TABLE_SESSION_EVENT_TYPES)[number];

// ==========================================
// PAYMENT & RESERVATION
// ==========================================

/**
 * Payment methods.
 * Used in: order
 */
export const PAYMENT_METHODS = [
  'cash',
  'card',
  'paylater',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Payment status.
 * Used in: scheduled-order
 */
export const PAYMENT_STATUSES = [
  'pending',
  'deposit_paid',
  'fully_paid',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Reservation occasions.
 * Used in: reservation
 */
export const OCCASIONS = [
  'none',
  'birthday',
  'anniversary',
  'business',
  'romantic',
  'other',
] as const;

export type Occasion = (typeof OCCASIONS)[number];

/**
 * Reservation sources.
 * Used in: reservation
 */
export const RESERVATION_SOURCES = [
  'phone',
  'walk_in',
  'website',
  'app',
  'third_party',
] as const;

export type ReservationSource = (typeof RESERVATION_SOURCES)[number];

// ==========================================
// SCHEDULED ORDER OPTIONS
// ==========================================

/**
 * Event types for scheduled orders.
 * Used in: scheduled-order
 */
export const EVENT_TYPES = [
  'regular',
  'birthday',
  'corporate',
  'wedding',
  'anniversary',
  'funeral',
  'baptism',
  'graduation',
  'business',
  'romantic',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Seating areas.
 * Used in: scheduled-order
 */
export const SEATING_AREAS = [
  'main_hall',
  'vip_room',
  'terrace',
  'private',
  'bar_area',
  'outdoor',
] as const;

export type SeatingArea = (typeof SEATING_AREAS)[number];

/**
 * Menu presets.
 * Used in: scheduled-order
 */
export const MENU_PRESETS = [
  'a_la_carte',
  'set_menu',
  'buffet',
  'banquet',
  'custom',
] as const;

export type MenuPreset = (typeof MENU_PRESETS)[number];

// ==========================================
// TASK CATEGORIES
// ==========================================

/**
 * Daily task categories.
 * Used in: daily-task
 */
export const TASK_CATEGORIES = [
  'prep',
  'cleaning',
  'inventory',
  'maintenance',
  'training',
  'admin',
  'service',
  'other',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

/**
 * Recurring patterns.
 * Used in: daily-task
 */
export const RECURRING_PATTERNS = [
  'daily',
  'weekdays',
  'weekly',
  'monthly',
] as const;

export type RecurringPattern = (typeof RECURRING_PATTERNS)[number];

// ==========================================
// SHIFT TYPES
// ==========================================

/**
 * Shift types.
 * Used in: worker-shift
 */
export const SHIFT_TYPES = [
  'morning',
  'afternoon',
  'evening',
  'night',
  'split',
] as const;

export type ShiftType = (typeof SHIFT_TYPES)[number];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if a value is a valid enum member
 */
export function isValidEnum<T extends readonly string[]>(
  value: string,
  enumArray: T
): value is T[number] {
  return enumArray.includes(value as T[number]);
}

/**
 * Get enum values as options for forms
 */
export function getEnumOptions<T extends readonly string[]>(
  enumArray: T,
  labels?: Record<T[number], string>
): Array<{ value: T[number]; label: string }> {
  return enumArray.map((value) => ({
    value,
    label: labels?.[value] ?? value,
  }));
}

// ==========================================
// UKRAINIAN LABELS
// ==========================================

export const STATION_LABELS_UK: Record<ExtendedStation, string> = {
  grill: 'Гриль',
  fry: 'Фритюр',
  salad: 'Салати',
  hot: 'Гаряча',
  dessert: 'Десерти',
  bar: 'Бар',
  pass: 'Видача',
  prep: 'Заготовка',
  front: 'Зал',
  back: 'Підсобка',
};

export const DEPARTMENT_LABELS_UK: Record<ExtendedDepartment, string> = {
  management: 'Менеджмент',
  kitchen: 'Кухня',
  service: 'Сервіс',
  bar: 'Бар',
  cleaning: 'Прибирання',
  none: 'Не призначено',
};

export const UNIT_LABELS_UK: Record<Unit, string> = {
  kg: 'кг',
  g: 'г',
  l: 'л',
  ml: 'мл',
  pcs: 'шт',
  portion: 'порц',
};

export const COURSE_TYPE_LABELS_UK: Record<CourseType, string> = {
  appetizer: 'Аперитив',
  starter: 'Закуска',
  soup: 'Суп',
  main: 'Основна страва',
  dessert: 'Десерт',
  drink: 'Напій',
};

export const OUTPUT_TYPE_LABELS_UK: Record<OutputType, string> = {
  kitchen: 'Кухня',
  bar: 'Бар',
  pastry: 'Кондитерська',
  cold: 'Холодний цех',
};

export default {
  // Arrays
  KITCHEN_STATIONS,
  EXTENDED_STATIONS,
  SHIFT_STATIONS,
  DEPARTMENTS,
  EXTENDED_DEPARTMENTS,
  UNITS,
  PORTION_UNITS,
  OUTPUT_TYPES,
  COURSE_TYPES,
  ORDER_STATUSES,
  ORDER_ITEM_STATUSES,
  TICKET_STATUSES,
  BATCH_STATUSES,
  TABLE_STATUSES,
  RESERVATION_STATUSES,
  SCHEDULED_ORDER_STATUSES,
  TASK_STATUSES,
  SHIFT_STATUSES,
  TASK_PRIORITIES,
  TICKET_PRIORITIES,
  MOVEMENT_TYPES,
  MAIN_CATEGORIES,
  STORAGE_CONDITIONS,
  PROCESS_TYPES,
  ACTION_TYPES,
  MODULES,
  SEVERITY_LEVELS,
  SYSTEM_ROLES,
  ACTOR_ROLES,
  TICKET_EVENT_TYPES,
  TABLE_SESSION_EVENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  OCCASIONS,
  RESERVATION_SOURCES,
  EVENT_TYPES,
  SEATING_AREAS,
  MENU_PRESETS,
  TASK_CATEGORIES,
  RECURRING_PATTERNS,
  SHIFT_TYPES,
  // Labels
  STATION_LABELS_UK,
  DEPARTMENT_LABELS_UK,
  UNIT_LABELS_UK,
  COURSE_TYPE_LABELS_UK,
  OUTPUT_TYPE_LABELS_UK,
  // Helpers
  isValidEnum,
  getEnumOptions,
};
