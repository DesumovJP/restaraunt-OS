/**
 * Internationalization Labels
 *
 * Centralized Ukrainian labels for various system entities, actions, and modules.
 * Used for consistent translations across the application.
 */

import type {
  ActionType,
  EntityType,
  ModuleType,
} from "./action-type-config";

/**
 * Ukrainian labels for action types
 * Using string index signature for flexibility with unknown action types
 */
export const ACTION_LABELS_UK: Record<string, string> = {
  create: "Створено",
  update: "Оновлено",
  delete: "Видалено",
  start: "Розпочато",
  complete: "Завершено",
  cancel: "Скасовано",
  receive: "Отримано",
  write_off: "Списано",
  transfer: "Переміщено",
  login: "Вхід",
  logout: "Вихід",
  approve: "Схвалено",
  reject: "Відхилено",
  assign: "Призначено",
  unassign: "Знято призначення",
};

/**
 * Ukrainian labels for entity types
 * Using string index signature for flexibility with unknown entity types
 */
export const ENTITY_LABELS_UK: Record<string, string> = {
  order: "Замовлення",
  order_item: "Позиція замовлення",
  kitchen_ticket: "Тікет кухні",
  menu_item: "Страва меню",
  menu_category: "Категорія меню",
  ingredient: "Інгредієнт",
  stock_batch: "Партія товару",
  inventory_movement: "Рух інвентаря",
  recipe: "Рецепт",
  table: "Стіл",
  reservation: "Бронювання",
  scheduled_order: "Заплановане замовлення",
  daily_task: "Щоденна задача",
  user: "Користувач",
  supplier: "Постачальник",
  worker_performance: "Продуктивність працівника",
};

/**
 * Ukrainian labels for module types
 * Using string index signature for flexibility with unknown module types
 */
export const MODULE_LABELS_UK: Record<string, string> = {
  pos: "POS",
  kitchen: "Кухня",
  storage: "Склад",
  admin: "Адмін",
  reservations: "Резервації",
  system: "Система",
};

/**
 * Ukrainian labels for severity levels
 */
export const SEVERITY_LABELS_UK: Record<string, string> = {
  info: "Інформація",
  warning: "Попередження",
  critical: "Критичний",
};

/**
 * Get action label in Ukrainian
 */
export function getActionLabelUk(action: string): string {
  return ACTION_LABELS_UK[action as ActionType] ?? action;
}

/**
 * Get entity label in Ukrainian
 */
export function getEntityLabelUk(entityType: string): string {
  return ENTITY_LABELS_UK[entityType as EntityType] ?? entityType;
}

/**
 * Get module label in Ukrainian
 */
export function getModuleLabelUk(module: string): string {
  return MODULE_LABELS_UK[module as ModuleType] ?? module;
}

/**
 * Get severity label in Ukrainian
 */
export function getSeverityLabelUk(severity: string): string {
  return SEVERITY_LABELS_UK[severity] ?? severity;
}
