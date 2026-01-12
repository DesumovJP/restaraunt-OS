/**
 * Action History Configuration
 *
 * Types, interfaces, and configuration for the action history feature.
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ActionHistoryItem {
  documentId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  descriptionUk?: string;
  dataBefore?: Record<string, unknown>;
  dataAfter?: Record<string, unknown>;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
  performedByName?: string;
  performedByRole?: string;
  module: string;
  severity: string;
  createdAt: string;
  performedBy?: {
    documentId: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface FilterState {
  fromDate: string;
  toDate: string;
  entityType: string;
  action: string;
  module: string;
  severity: string;
}

// ==========================================
// METADATA TYPES
// ==========================================

export interface IngredientUsed {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface ConsumptionDetail {
  ingredient: string;
  batch: string;
  quantity: number;
  unit: string;
  cost: number;
  expiryDate: string;
  stockBefore: number;
  stockAfter: number;
}

export interface TimingData {
  queueTimeSeconds?: number;
  cookingTimeSeconds?: number;
  pickupWaitSeconds?: number;
  totalTimeSeconds?: number;
}

export interface TimingFormatted {
  queueTime?: string;
  cookingTime?: string;
  pickupWait?: string;
  totalTime?: string;
}

export interface TimestampData {
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  servedAt?: string;
}

export interface ReleasedItem {
  ingredientName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
}

// ==========================================
// DEFAULTS & UTILITIES
// ==========================================

/**
 * Get default filter state (all actions, no date limit)
 */
export function getDefaultFilters(): FilterState {
  return {
    fromDate: "", // No date filter - show all
    toDate: "",   // No date filter - show all
    entityType: "all",
    action: "all",
    module: "all",
    severity: "all",
  };
}

/**
 * Build query variables from filter state
 */
export function buildQueryVariables(
  filters: FilterState,
  page: number,
  pageSize: number
): Record<string, unknown> {
  const vars: Record<string, unknown> = {
    limit: pageSize,
    offset: page * pageSize,
  };

  if (filters.fromDate) {
    vars.fromDate = new Date(filters.fromDate).toISOString();
  }
  if (filters.toDate) {
    const endDate = new Date(filters.toDate);
    endDate.setHours(23, 59, 59, 999);
    vars.toDate = endDate.toISOString();
  }
  if (filters.entityType !== "all") vars.entityType = filters.entityType;
  if (filters.action !== "all") vars.action = filters.action;
  if (filters.module !== "all") vars.module = filters.module;
  if (filters.severity !== "all") vars.severity = filters.severity;

  return vars;
}

/**
 * Determine detail view type based on action history item
 */
export function getDetailViewType(item: ActionHistoryItem): "kitchen_start" | "kitchen_timing" | "inventory_release" | "generic" {
  const metadata = item.metadata || {};

  if (
    item.entityType === "kitchen_ticket" &&
    item.action === "start" &&
    !!metadata.ingredientsUsed
  ) {
    return "kitchen_start";
  }

  if (
    item.entityType === "kitchen_ticket" &&
    (item.action === "complete" || !!metadata.timings || !!metadata.timestamps)
  ) {
    return "kitchen_timing";
  }

  if (
    item.entityType === "inventory_movement" &&
    item.action === "cancel" &&
    !!metadata.releasedItems
  ) {
    return "inventory_release";
  }

  return "generic";
}
