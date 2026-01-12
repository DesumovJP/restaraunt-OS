/**
 * Action Type Configuration
 *
 * Centralized configuration for action history display.
 * Includes icons, colors, and labels for actions, modules, and severity levels.
 */

import {
  Plus,
  Pencil,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  LogIn,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  UserMinus,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Action types used in the system
 */
export type ActionType =
  | "create"
  | "update"
  | "delete"
  | "start"
  | "complete"
  | "cancel"
  | "receive"
  | "write_off"
  | "transfer"
  | "login"
  | "logout"
  | "approve"
  | "reject"
  | "assign"
  | "unassign";

/**
 * Module types in the system
 */
export type ModuleType =
  | "pos"
  | "kitchen"
  | "storage"
  | "admin"
  | "reservations"
  | "system";

/**
 * Severity levels
 */
export type SeverityType = "info" | "warning" | "critical";

/**
 * Entity types in the system
 */
export type EntityType =
  | "order"
  | "order_item"
  | "kitchen_ticket"
  | "menu_item"
  | "menu_category"
  | "ingredient"
  | "stock_batch"
  | "inventory_movement"
  | "recipe"
  | "table"
  | "reservation"
  | "scheduled_order"
  | "daily_task"
  | "user"
  | "supplier"
  | "worker_performance";

/**
 * Icons for each action type
 * Using string index signature for flexibility with unknown action types
 */
export const ACTION_ICONS: Record<string, LucideIcon> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  start: Play,
  complete: CheckCircle,
  cancel: XCircle,
  receive: Package,
  write_off: AlertTriangle,
  transfer: ArrowRightLeft,
  login: LogIn,
  logout: LogOut,
  approve: ThumbsUp,
  reject: ThumbsDown,
  assign: UserPlus,
  unassign: UserMinus,
};

/**
 * Default icon for unknown actions
 */
export const DEFAULT_ACTION_ICON: LucideIcon = FileText;

/**
 * Module badge color classes
 * Using string index signature for flexibility with unknown module types
 */
export const MODULE_COLORS: Record<string, string> = {
  pos: "bg-primary/10 text-primary",
  kitchen: "bg-orange-100 text-orange-700",
  storage: "bg-info/10 text-info",
  admin: "bg-secondary/10 text-secondary",
  reservations: "bg-purple-100 text-purple-700",
  system: "bg-muted text-muted-foreground",
};

/**
 * Severity badge color classes
 * Using string index signature for flexibility with unknown severity types
 */
export const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  critical: "bg-error/10 text-error",
};

/**
 * Action background color classes for history items
 */
export const ACTION_BG_COLORS: Record<string, string> = {
  delete: "bg-error/10 text-error",
  cancel: "bg-error/10 text-error",
  create: "bg-success/10 text-success",
  receive: "bg-success/10 text-success",
  start: "bg-orange-100 text-orange-600",
  complete: "bg-success/10 text-success",
  default: "bg-primary/10 text-primary",
};

/**
 * Get background color for an action
 */
export function getActionBgColor(action: string): string {
  return ACTION_BG_COLORS[action] ?? ACTION_BG_COLORS.default;
}

/**
 * Get icon for an action
 */
export function getActionIcon(action: string): LucideIcon {
  return ACTION_ICONS[action as ActionType] ?? DEFAULT_ACTION_ICON;
}

/**
 * Get module color classes
 */
export function getModuleColor(module: string): string {
  return MODULE_COLORS[module as ModuleType] ?? "";
}

/**
 * Get severity color classes
 */
export function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity as SeverityType] ?? "";
}
