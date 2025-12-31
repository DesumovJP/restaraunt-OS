/**
 * Mock Data Exports
 *
 * This file exports empty arrays for all data types.
 * Replace with real data from your backend/database.
 *
 * TODO: Connect to real data source:
 * - Categories: GET /api/menu/categories
 * - Menu Items: GET /api/menu/items
 * - Products: GET /api/inventory/products
 * - Recipes: GET /api/recipes
 * - Kitchen Tickets: WebSocket /ws/kitchen
 * - KPIs: GET /api/analytics/kpis
 * - Alerts: GET /api/alerts
 */

import type {
  Category,
  MenuItem,
  Product,
  Recipe,
  KitchenTicket,
  Order,
  Supply,
  WriteOff,
  KPI,
  Alert,
  ActionLog,
} from "@/types";

// ==========================================
// CATEGORIES
// ==========================================

export const mockCategories: Category[] = [];

// ==========================================
// MENU ITEMS
// ==========================================

export const mockMenuItems: MenuItem[] = [];

// ==========================================
// PRODUCTS (Inventory)
// ==========================================

export const mockProducts: Product[] = [];

// ==========================================
// RECIPES
// ==========================================

export const mockRecipes: Recipe[] = [];

// ==========================================
// KITCHEN TICKETS
// ==========================================

export const mockKitchenTickets: KitchenTicket[] = [];

// ==========================================
// SUPPLIES
// ==========================================

export const mockSupplies: Supply[] = [];

// ==========================================
// WRITE-OFFS
// ==========================================

export const mockWriteOffs: WriteOff[] = [];

// ==========================================
// KPI
// ==========================================

export const mockKPIs: KPI[] = [];

// ==========================================
// ALERTS
// ==========================================

export const mockAlerts: Alert[] = [];

// ==========================================
// ACTION LOG
// ==========================================

export const mockActionLogs: ActionLog[] = [];
