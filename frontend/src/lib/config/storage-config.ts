/**
 * Storage Configuration
 *
 * Centralized configuration for storage/inventory management.
 * Includes batch statuses, operation types, and category icons.
 */

import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  Package,
  Beef,
  ChefHat,
  Wheat,
  Flame,
  Droplet,
  Milk,
  Wine,
  Snowflake,
  Cake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BatchStatus } from "@/types/extended";

/**
 * Operation types for storage history
 */
export type StorageOperationType = "use" | "receive" | "adjust" | "write_off" | "transfer";

/**
 * Batch status configuration
 */
export interface BatchStatusConfig {
  label: string;
  labelUk: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "warning";
}

/**
 * Operation type configuration
 */
export interface OperationTypeConfig {
  label: string;
  labelUk: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Batch status configurations
 */
export const BATCH_STATUS_CONFIG: Record<BatchStatus, BatchStatusConfig> = {
  received: { label: "Received", labelUk: "Отримано", variant: "default" },
  processed: { label: "Processed", labelUk: "Оброблено", variant: "secondary" },
  processing: { label: "Processing", labelUk: "Обробляється", variant: "warning" },
  in_use: { label: "In Use", labelUk: "В роботі", variant: "outline" },
  available: { label: "Available", labelUk: "Доступно", variant: "secondary" },
  depleted: { label: "Depleted", labelUk: "Вичерпано", variant: "outline" },
  expired: { label: "Expired", labelUk: "Прострочено", variant: "destructive" },
  written_off: { label: "Written Off", labelUk: "Списано", variant: "destructive" },
};

/**
 * Operation type configurations for storage history
 */
export const OPERATION_TYPE_CONFIG: Record<StorageOperationType, OperationTypeConfig> = {
  use: {
    label: "Used",
    labelUk: "Використано",
    icon: ArrowUpCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    badgeVariant: "secondary",
  },
  receive: {
    label: "Received",
    labelUk: "Отримано",
    icon: ArrowDownCircle,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    badgeVariant: "default",
  },
  adjust: {
    label: "Adjusted",
    labelUk: "Коригування",
    icon: RefreshCw,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    badgeVariant: "outline",
  },
  write_off: {
    label: "Written Off",
    labelUk: "Списано",
    icon: Trash2,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    badgeVariant: "destructive",
  },
  transfer: {
    label: "Transferred",
    labelUk: "Переміщено",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    badgeVariant: "outline",
  },
};

/**
 * Category icons mapping
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  beef: Beef,
  "chef-hat": ChefHat,
  wheat: Wheat,
  flame: Flame,
  droplet: Droplet,
  milk: Milk,
  wine: Wine,
  snowflake: Snowflake,
  cake: Cake,
};

/**
 * Operator role labels
 */
export const OPERATOR_ROLE_LABELS: Record<string, string> = {
  chef: "Кухар",
  waiter: "Офіціант",
  manager: "Менеджер",
  system: "Система",
};

/**
 * Get batch status config
 */
export function getBatchStatusConfig(status: BatchStatus): BatchStatusConfig {
  return BATCH_STATUS_CONFIG[status] ?? BATCH_STATUS_CONFIG.received;
}

/**
 * Get operation type config
 */
export function getOperationConfig(operationType: StorageOperationType): OperationTypeConfig {
  return OPERATION_TYPE_CONFIG[operationType] ?? OPERATION_TYPE_CONFIG.use;
}

/**
 * Get category icon
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICONS[iconName] ?? Beef;
}

/**
 * Get operator role label in Ukrainian
 */
export function getOperatorRoleLabel(role: string): string {
  return OPERATOR_ROLE_LABELS[role] ?? role;
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Get freshness color based on days until expiry
 */
export function getFreshnessColor(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return "text-muted-foreground";
  if (daysUntilExpiry <= 0) return "text-red-600";
  if (daysUntilExpiry <= 2) return "text-red-600";
  if (daysUntilExpiry <= 5) return "text-amber-600";
  return "text-green-600";
}

/**
 * Check if batch is expiring soon (within 2 days)
 */
export function isExpiringSoon(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  const daysUntil = getDaysUntilExpiry(expiryDate);
  return daysUntil !== null && daysUntil <= 2 && daysUntil > 0;
}

/**
 * Check if batch is expired
 */
export function isExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  const daysUntil = getDaysUntilExpiry(expiryDate);
  return daysUntil !== null && daysUntil <= 0;
}

/**
 * Calculate batch usage percentage
 */
export function getBatchUsagePercent(
  grossIn: number,
  usedAmount: number,
  wastedAmount: number
): number {
  if (grossIn <= 0) return 0;
  return Math.round(((usedAmount + wastedAmount) / grossIn) * 100);
}
