/**
 * GraphQL Queries
 * Strapi v5 GraphQL queries for Restaurant OS
 *
 * This file re-exports all queries for backward compatibility.
 * For new code, prefer importing from specific domain files:
 *
 * @example
 * // Domain-specific imports (recommended)
 * import { GET_KITCHEN_QUEUE } from "@/graphql/queries/kitchen";
 * import { GET_ACTIVE_ORDERS, GET_TABLES } from "@/graphql/queries/orders";
 * import { GET_ALL_STOCK_BATCHES } from "@/graphql/queries/storage";
 *
 * // Or import everything from one place
 * import { GET_KITCHEN_QUEUE, GET_TABLES } from "@/graphql/queries";
 */

// Re-export all queries from domain files
export * from "./queries/index";
