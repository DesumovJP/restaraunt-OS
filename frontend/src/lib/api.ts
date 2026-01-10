/**
 * API Module
 *
 * Provides typed API interfaces for the restaurant management system.
 * Most endpoints now connect to real backend via GraphQL.
 *
 * NOTE: For new features, prefer using GraphQL hooks from @/hooks/use-graphql-*
 * instead of this REST-style API layer.
 */

import type { ApiResponse, MenuItem, Category, Product, KitchenTicket, KPI, Alert, Recipe, Order } from "@/types";
import { tableSessionEventsApi, type SessionKPIs } from "@/lib/api-events";
import { getUrqlClient } from "@/lib/urql-client";
import { GET_STOCK_ALERTS } from "@/graphql/queries";

// ==========================================
// MENU API
// ==========================================

export const menuApi = {
  /**
   * Get all menu categories
   * TODO: GET /api/menu/categories
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };
  },

  /**
   * Get menu items, optionally filtered by category
   * TODO: GET /api/menu/items?categoryId={categoryId}
   */
  async getMenuItems(categoryId?: string): Promise<ApiResponse<MenuItem[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };
  },

  /**
   * Get single menu item by ID
   * TODO: GET /api/menu/items/{id}
   */
  async getMenuItem(id: string): Promise<ApiResponse<MenuItem | null>> {
    // TODO: Replace with real API call
    return { data: null, success: false, message: "Not implemented" };
  },
};

// ==========================================
// ORDERS API
// ==========================================

export const ordersApi = {
  /**
   * Create new order
   * TODO: POST /api/orders
   */
  async createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Order>> {
    // TODO: Replace with real API call
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { data: newOrder, success: true, message: "Замовлення створено" };
  },

  /**
   * Update order status
   * TODO: PATCH /api/orders/{id}
   */
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<ApiResponse<Order>> {
    // TODO: Replace with real API call
    return {
      data: { id: orderId, status } as Order,
      success: true,
      message: "Статус оновлено",
    };
  },
};

// ==========================================
// KITCHEN API
// ==========================================

export const kitchenApi = {
  /**
   * Get all kitchen tickets
   * TODO: GET /api/kitchen/tickets
   */
  async getTickets(): Promise<ApiResponse<KitchenTicket[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };
  },

  /**
   * Update kitchen ticket status
   * TODO: PATCH /api/kitchen/tickets/{id}
   */
  async updateTicketStatus(
    ticketId: string,
    status: KitchenTicket["status"]
  ): Promise<ApiResponse<KitchenTicket>> {
    // TODO: Replace with real API call
    return {
      data: {} as KitchenTicket,
      success: false,
      message: "Not implemented"
    };
  },
};

// ==========================================
// INVENTORY API
// ==========================================

export const inventoryApi = {
  /**
   * Get all products
   * TODO: GET /api/inventory/products
   */
  async getProducts(): Promise<ApiResponse<Product[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };
  },

  /**
   * Get single product by ID
   * TODO: GET /api/inventory/products/{id}
   */
  async getProduct(id: string): Promise<ApiResponse<Product | null>> {
    // TODO: Replace with real API call
    return { data: null, success: false, message: "Not implemented" };
  },

  /**
   * Add new product
   * TODO: POST /api/inventory/products
   */
  async addProduct(product: Omit<Product, "id" | "lastUpdated">): Promise<ApiResponse<Product>> {
    // TODO: Replace with real API call
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date(),
    };
    return { data: newProduct, success: true, message: "Товар додано" };
  },

  /**
   * Update product stock
   * TODO: PATCH /api/inventory/products/{id}/stock
   */
  async updateStock(productId: string, quantity: number): Promise<ApiResponse<Product>> {
    // TODO: Replace with real API call
    return {
      data: {} as Product,
      success: false,
      message: "Not implemented",
    };
  },
};

// ==========================================
// RECIPES API
// ==========================================

export const recipesApi = {
  /**
   * Get all recipes
   * TODO: GET /api/recipes
   */
  async getRecipes(): Promise<ApiResponse<Recipe[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };
  },

  /**
   * Get single recipe by ID
   * TODO: GET /api/recipes/{id}
   */
  async getRecipe(id: string): Promise<ApiResponse<Recipe | null>> {
    // TODO: Replace with real API call
    return { data: null, success: false, message: "Not implemented" };
  },

  /**
   * Calculate recipe cost for given portions
   * TODO: GET /api/recipes/{id}/cost?portions={portions}
   */
  async calculateCost(recipeId: string, portions: number): Promise<ApiResponse<number>> {
    // TODO: Replace with real API call
    return { data: 0, success: false, message: "Not implemented" };
  },
};

// ==========================================
// ANALYTICS API
// ==========================================

export const analyticsApi = {
  /**
   * Get KPI metrics for today
   * Uses real data from tableSessionEventsApi
   */
  async getKPIs(): Promise<ApiResponse<KPI[]>> {
    try {
      // Get today's range
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const sessionKPIs = await tableSessionEventsApi.getKPIs(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      // Transform to KPI format
      const kpis: KPI[] = [
        {
          id: "avg-order-time",
          name: "Час прийому замовлення",
          value: tableSessionEventsApi.formatDuration(sessionKPIs.avgTimeToTakeOrderMs),
          trend: "neutral",
          change: 0,
        },
        {
          id: "avg-first-item",
          name: "Час до першої страви",
          value: tableSessionEventsApi.formatDuration(sessionKPIs.avgTimeToFirstItemMs),
          trend: "neutral",
          change: 0,
        },
        {
          id: "avg-session",
          name: "Середня тривалість сесії",
          value: tableSessionEventsApi.formatDuration(sessionKPIs.avgTotalSessionTimeMs),
          trend: "neutral",
          change: 0,
        },
        {
          id: "total-orders",
          name: "Замовлень сьогодні",
          value: String(sessionKPIs.totalOrders),
          trend: "up",
          change: 0,
        },
        {
          id: "total-sessions",
          name: "Сесій сьогодні",
          value: String(sessionKPIs.totalSessions),
          trend: "neutral",
          change: 0,
        },
      ];

      return { data: kpis, success: true };
    } catch (error) {
      console.error("[Analytics] Failed to get KPIs:", error);
      return { data: [], success: false, message: "Помилка отримання KPI" };
    }
  },

  /**
   * Get system alerts (low stock, etc.)
   * Uses real data from GraphQL
   */
  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const client = getUrqlClient();
      const result = await client.query(GET_STOCK_ALERTS, {}).toPromise();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const ingredients = result.data?.ingredients || [];

      // Create alerts for low stock items
      const alerts: Alert[] = ingredients
        .filter((ing: any) => ing.currentStock < ing.minStock)
        .map((ing: any) => ({
          id: `low-stock-${ing.documentId}`,
          type: "warning" as const,
          message: `Низький запас: ${ing.nameUk || ing.name}`,
          description: `Поточний: ${ing.currentStock} ${ing.unit}, мінімум: ${ing.minStock} ${ing.unit}`,
          createdAt: new Date(),
          isRead: false,
        }));

      return { data: alerts, success: true };
    } catch (error) {
      console.error("[Analytics] Failed to get alerts:", error);
      return { data: [], success: false, message: "Помилка отримання сповіщень" };
    }
  },

  /**
   * Get extended KPIs for a date range
   */
  async getKPIsForPeriod(from: string, to: string): Promise<SessionKPIs> {
    return tableSessionEventsApi.getKPIs(from, to);
  },

  /**
   * Mark alert as read (local only for now)
   */
  async markAlertRead(alertId: string): Promise<ApiResponse<Alert>> {
    // Alerts are generated dynamically, no need to persist read status
    return { data: { id: alertId, isRead: true } as Alert, success: true };
  },
};
