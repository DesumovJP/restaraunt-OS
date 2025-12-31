/**
 * Extended API Module
 *
 * API endpoints for courses, comments, bill splitting,
 * SmartStorage, and employee profiles.
 *
 * Ready for Strapi/backend integration.
 * Uses documentId and slug instead of id.
 *
 * TODO: Connect to real backend:
 * - Orders: PATCH /api/orders/{documentId}/items/{slug}
 * - Bill Split: POST /api/orders/{documentId}/split
 * - Storage: POST/GET /api/storage/batches
 * - Profiles: GET /api/profiles/{slug}
 * - KPI: GET /api/kpi/dashboard
 */

import type {
  ExtendedOrderItem,
  CourseType,
  OrderItemStatus,
  ItemComment,
  UndoEntry,
  TableSession,
  BillSplit,
  SplitMode,
  SplitParticipant,
  ExtendedProduct,
  YieldProfile,
  StorageBatch,
  BatchProcess,
  StorageHistory,
  EmployeeProfile,
  KPIDashboard,
  ExtendedApiResponse,
  CommentPreset,
} from '@/types/extended';
import { COMMENT_PRESETS } from '@/types/extended';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateDocumentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSlug(base: string): string {
  return `${base}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
}

// ==========================================
// ORDERS API
// ==========================================

/**
 * Update order item (course, comment, status)
 * TODO: PATCH /api/orders/{documentId}/items/{slug}
 */
export async function updateOrderItem(
  orderDocumentId: string,
  itemSlug: string,
  updates: {
    courseType?: CourseType;
    courseIndex?: number;
    comment?: ItemComment;
    status?: OrderItemStatus;
  }
): Promise<ExtendedApiResponse<ExtendedOrderItem>> {
  // TODO: Replace with real API call
  return {
    data: {} as ExtendedOrderItem,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Undo item status
 * TODO: POST /api/orders/{documentId}/items/{slug}/undo
 */
export async function undoItemStatus(
  orderDocumentId: string,
  itemSlug: string,
  reason: string,
  targetStatus: OrderItemStatus
): Promise<ExtendedApiResponse<{ item: ExtendedOrderItem; undoEntry: UndoEntry }>> {
  // TODO: Replace with real API call
  return {
    data: {} as { item: ExtendedOrderItem; undoEntry: UndoEntry },
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Create or update bill split
 * TODO: POST /api/orders/{documentId}/split
 */
export async function createBillSplit(
  orderDocumentId: string,
  mode: SplitMode,
  participants: Omit<SplitParticipant, 'subtotal' | 'tax' | 'tip' | 'total'>[],
  tipPercent: number = 0
): Promise<ExtendedApiResponse<BillSplit>> {
  // TODO: Replace with real API call
  return {
    data: {} as BillSplit,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

// ==========================================
// TABLE TIME API
// ==========================================

/**
 * Get table timer and per-course timings
 * TODO: GET /api/tables/{slug}/time
 */
export async function getTableTime(
  tableSlug: string
): Promise<ExtendedApiResponse<TableSession>> {
  // TODO: Replace with real API call
  return {
    data: {} as TableSession,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

// ==========================================
// COMMENTS API
// ==========================================

/**
 * Add comment to item
 * TODO: POST /api/orders/{documentId}/items/{slug}/comments
 */
export async function addItemComment(
  orderDocumentId: string,
  itemSlug: string,
  comment: Omit<ItemComment, 'createdAt' | 'createdBy'>
): Promise<ExtendedApiResponse<ItemComment>> {
  // TODO: Replace with real API call
  return {
    data: {} as ItemComment,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Get comment presets
 * TODO: GET /api/config/comment-presets
 */
export async function getCommentPresets(): Promise<
  ExtendedApiResponse<{
    modifiers: CommentPreset[];
    allergies: CommentPreset[];
    dietary: CommentPreset[];
  }>
> {
  // Returns static presets defined in types
  const modifiers = COMMENT_PRESETS.filter((p) => p.category === 'modifier');
  const allergies = COMMENT_PRESETS.filter((p) => p.category === 'allergy');
  const dietary = COMMENT_PRESETS.filter((p) => p.category === 'dietary');

  return {
    data: { modifiers, allergies, dietary },
    success: true,
  };
}

// ==========================================
// SMART STORAGE API
// ==========================================

/**
 * Receive new batch
 * TODO: POST /api/storage/batches
 */
export async function receiveBatch(
  batch: Omit<StorageBatch, 'documentId' | 'slug' | 'processes' | 'usedAmount' | 'wastedAmount' | 'status'>
): Promise<ExtendedApiResponse<StorageBatch>> {
  // TODO: Replace with real API call
  return {
    data: {} as StorageBatch,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Process batch with cleaning
 * TODO: POST /api/storage/batches/{id}/process/cleaning
 */
export async function processClean(
  batchId: string,
  grossInput: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  // TODO: Replace with real API call
  return {
    data: {} as { process: BatchProcess; batch: StorageBatch },
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Process batch with boiling
 * TODO: POST /api/storage/batches/{id}/process/boiling
 */
export async function processBoil(
  batchId: string,
  grossInput: number,
  processTemp: number,
  processTime: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  // TODO: Replace with real API call
  return {
    data: {} as { process: BatchProcess; batch: StorageBatch },
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Process batch with frying
 * TODO: POST /api/storage/batches/{id}/process/frying
 */
export async function processFry(
  batchId: string,
  grossInput: number,
  processTemp: number,
  processTime: number,
  oilUsed: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  // TODO: Replace with real API call
  return {
    data: {} as { process: BatchProcess; batch: StorageBatch },
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Get storage history with filters
 * TODO: GET /api/storage/history
 */
export async function getStorageHistory(filters?: {
  productId?: string;
  batchId?: string;
  operationType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<ExtendedApiResponse<StorageHistory[]> & { pagination: { total: number; page: number; pageSize: number; hasMore: boolean } }> {
  // TODO: Replace with real API call
  return {
    data: [],
    success: true,
    pagination: {
      total: 0,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 50,
      hasMore: false,
    },
  };
}

/**
 * Export storage data
 * TODO: GET /api/storage/export
 */
export async function exportStorageData(
  format: 'csv' | 'tsv',
  type: 'inventory' | 'batches' | 'history' | 'yields',
  filters?: Record<string, string>
): Promise<ExtendedApiResponse<string>> {
  // TODO: Replace with real API call
  return {
    data: '',
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

// ==========================================
// PROFILES API
// ==========================================

/**
 * Get employee profile
 * TODO: GET /api/profiles/{slug}
 */
export async function getProfile(
  slug: string
): Promise<ExtendedApiResponse<EmployeeProfile>> {
  // TODO: Replace with real API call
  return {
    data: {} as EmployeeProfile,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

/**
 * Get KPI dashboard
 * TODO: GET /api/kpi/dashboard
 */
export async function getKPIDashboard(
  period: 'today' | 'week' | 'month' = 'today',
  department?: string,
  role?: string
): Promise<ExtendedApiResponse<KPIDashboard>> {
  // TODO: Replace with real API call
  return {
    data: {} as KPIDashboard,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

// ==========================================
// YIELD PROFILES API
// ==========================================

/**
 * Get yield profiles
 * TODO: GET /api/storage/yield-profiles
 */
export async function getYieldProfiles(): Promise<ExtendedApiResponse<YieldProfile[]>> {
  // TODO: Replace with real API call
  return {
    data: [],
    success: true,
  };
}

/**
 * Create yield profile
 * TODO: POST /api/storage/yield-profiles
 */
export async function createYieldProfile(
  profile: Omit<YieldProfile, 'documentId' | 'createdAt' | 'updatedAt'>
): Promise<ExtendedApiResponse<YieldProfile>> {
  // TODO: Replace with real API call
  return {
    data: {} as YieldProfile,
    success: false,
    message: 'Not implemented - connect to backend',
  };
}

// ==========================================
// PRODUCTS API (Extended)
// ==========================================

/**
 * Get extended products with yield info
 * TODO: GET /api/storage/products
 */
export async function getExtendedProducts(): Promise<ExtendedApiResponse<ExtendedProduct[]>> {
  // TODO: Replace with real API call
  return {
    data: [],
    success: true,
  };
}

// ==========================================
// BATCHES API
// ==========================================

/**
 * Get batches
 * TODO: GET /api/storage/batches
 */
export async function getBatches(): Promise<ExtendedApiResponse<StorageBatch[]>> {
  // TODO: Replace with real API call
  return {
    data: [],
    success: true,
  };
}
