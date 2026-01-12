/**
 * Extended Types for Restaurant OS
 *
 * This file re-exports all types for backward compatibility.
 * For new code, prefer importing from specific domain files:
 *
 * @example
 * // Domain-specific imports (recommended)
 * import { CourseType, ExtendedOrder } from "@/types/orders";
 * import { StorageBatch, BatchStatus } from "@/types/storage";
 * import { EmployeeProfile, Department } from "@/types/employees";
 *
 * // Or import everything from one place
 * import { CourseType, StorageBatch } from "@/types/extended";
 */

// Re-export all types from domain files
export * from "./orders";
export * from "./comments";
export * from "./billing";
export * from "./employees";
export * from "./storage";
export * from "./websocket";
export * from "./api";
