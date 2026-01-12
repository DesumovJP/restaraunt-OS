/**
 * GraphQL Queries Index
 * Re-exports all domain-specific queries for easy importing
 */

// Kitchen domain
export { GET_KITCHEN_QUEUE } from "./kitchen";

// Menu domain
export { GET_ALL_CATEGORIES, GET_RECIPES, GET_MENU_ITEM_RECIPE } from "./menu";

// Orders domain
export { GET_ACTIVE_ORDERS, GET_ORDER_DETAILS, GET_TABLES } from "./orders";

// Storage domain
export {
  GET_STOCK_ALERTS,
  GET_ALL_INGREDIENTS,
  GET_ALL_SUPPLIERS,
  GET_AVAILABLE_BATCHES,
  GET_INVENTORY_MOVEMENTS,
  GET_ALL_STOCK_BATCHES,
  GET_TODAYS_BATCHES,
} from "./storage";

// Scheduled Orders domain
export {
  GET_SCHEDULED_ORDERS,
  GET_SCHEDULED_ORDER,
  GET_ORDERS_READY_TO_ACTIVATE,
} from "./scheduled-orders";

// Reservations domain
export {
  GET_RESERVATIONS_FOR_DATE,
  GET_RESERVATIONS_FOR_TABLE,
  GET_UPCOMING_RESERVATIONS,
} from "./reservations";

// Workers domain
export {
  GET_WORKER_PERFORMANCE,
  GET_TEAM_PERFORMANCE,
  GET_ALL_WORKERS_PERFORMANCE,
  GET_WORKER_SHIFTS,
  GET_TEAM_SCHEDULE,
  GET_TODAYS_SHIFTS,
  GET_ALL_WORKERS,
} from "./workers";

// Admin domain
export {
  GET_ACTION_HISTORY,
  GET_ACTION_HISTORY_COUNT,
  GET_RECENT_ACTIONS,
} from "./admin";
