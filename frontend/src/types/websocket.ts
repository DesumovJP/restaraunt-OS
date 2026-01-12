/**
 * WebSocket Domain Types
 *
 * Types for real-time WebSocket events.
 */

// ==========================================
// WEBSOCKET EXTENDED EVENTS
// ==========================================

export type ExtendedWSEventType =
  | "ticket:new"
  | "ticket:update"
  | "order:update"
  | "inventory:low"
  | "alert:new"
  | "table:timer"
  | "comment:new"
  | "split:update"
  | "undo:request"
  | "course:update"
  | "batch:process"
  | "profile:status";

export interface ExtendedWSEvent<T = unknown> {
  type: ExtendedWSEventType;
  payload: T;
  timestamp: string;
}
