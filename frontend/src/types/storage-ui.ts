/**
 * Storage UI Types
 *
 * Types for the redesigned Smart Storage UI with progressive disclosure
 * and multiple view modes.
 */

import type { LucideIcon } from "lucide-react";

// ==========================================
// VIEW MODES
// ==========================================

/**
 * View mode for product lists
 * - cards: Card grid view (default)
 * - table: Spreadsheet-like view for power users
 */
export type ViewMode = "cards" | "table";

// ==========================================
// STATUS SYSTEM
// ==========================================

/**
 * Product status for visual indicators
 * - critical: Immediate action needed (low stock + expiring)
 * - warning: Attention needed (low stock OR expiring soon)
 * - ok: Normal state
 */
export type ProductStatus = "critical" | "warning" | "ok";

/**
 * Alert types for the alert banner
 */
export type AlertType = "low_stock" | "expiring" | "expired" | "out_of_stock";

export interface AlertItem {
  type: AlertType;
  count: number;
  items?: Array<{ id: string; name: string }>;
}

// ==========================================
// UI STATE
// ==========================================

export interface StorageUIState {
  /** Current view mode */
  viewMode: ViewMode;
  /** Product ID being previewed in the side panel */
  previewProductId: string | null;
  /** Whether the alert banner has been dismissed */
  alertsDismissed: boolean;
  /** Current sort field */
  sortBy: "name" | "stock" | "updated" | "category" | "status" | "freshness";
  /** Sort direction */
  sortOrder: "asc" | "desc";
  /** Selected product IDs (for bulk actions) */
  selectedIds: string[];
}

export interface StorageUIActions {
  setViewMode: (mode: ViewMode) => void;
  openPreview: (productId: string) => void;
  closePreview: () => void;
  dismissAlerts: () => void;
  resetAlerts: () => void;
  setSortBy: (field: StorageUIState["sortBy"]) => void;
  toggleSortOrder: () => void;
  selectProduct: (id: string) => void;
  deselectProduct: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
}

// ==========================================
// QUICK ACTIONS
// ==========================================

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
  disabled?: boolean;
}

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface StatusIndicatorProps {
  status: ProductStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  tooltip?: string;
  animated?: boolean;
}

export interface StockBarProps {
  current: number;
  min: number;
  max: number;
  unit?: string;
  variant?: "full" | "mini" | "inline";
  showLabels?: boolean;
}

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export interface AlertBannerProps {
  alerts: AlertItem[];
  collapsible?: boolean;
  onViewAll?: () => void;
  onDismiss?: () => void;
}

// ==========================================
// HELPER TYPES
// ==========================================

export interface ProductPreviewData {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory?: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: ProductStatus;
  costPerUnit: number;
  storageCondition?: string;
  tempRange?: string;
  yieldRatio?: number;
  expiryDate?: string;
  lastUpdated: string;
  recentHistory?: Array<{
    id: string;
    type: string;
    quantity: number;
    timestamp: string;
    note?: string;
  }>;
  activeBatches?: Array<{
    id: string;
    batchNumber: string;
    available: number;
    expiryDate?: string;
  }>;
}

// ==========================================
// CONSTANTS
// ==========================================

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  cards: "Картки",
  table: "Таблиця",
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  critical: "Критично",
  warning: "Увага",
  ok: "Норма",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  low_stock: "Низький запас",
  expiring: "Термін закінчується",
  expired: "Прострочено",
  out_of_stock: "Немає в наявності",
};

export const DEFAULT_UI_STATE: StorageUIState = {
  viewMode: "cards",
  previewProductId: null,
  alertsDismissed: false,
  sortBy: "name",
  sortOrder: "asc",
  selectedIds: [],
};
