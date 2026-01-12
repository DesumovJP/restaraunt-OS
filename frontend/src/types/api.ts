/**
 * API Domain Types
 *
 * Types for API responses and offline queue.
 */

// ==========================================
// API EXTENDED RESPONSE TYPES
// ==========================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ExtendedApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  error?: ApiError;
}

// ==========================================
// OFFLINE QUEUE
// ==========================================

export type QueuedActionType =
  | "order"
  | "status"
  | "comment"
  | "split"
  | "process";

export type QueuedActionStatus = "pending" | "syncing" | "failed" | "synced";

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: unknown;
  timestamp: number;
  retries: number;
  status: QueuedActionStatus;
}
