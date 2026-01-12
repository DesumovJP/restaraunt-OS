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
          value: Math.round(sessionKPIs.avgTimeToTakeOrderMs / 1000),
          previousValue: 0,
          unit: "сек",
          trend: "stable",
          category: "performance",
        },
        {
          id: "avg-first-item",
          name: "Час до першої страви",
          value: Math.round(sessionKPIs.avgTimeToFirstItemMs / 1000),
          previousValue: 0,
          unit: "сек",
          trend: "stable",
          category: "performance",
        },
        {
          id: "avg-session",
          name: "Середня тривалість сесії",
          value: Math.round(sessionKPIs.avgTotalSessionTimeMs / 60000),
          previousValue: 0,
          unit: "хв",
          trend: "stable",
          category: "performance",
        },
        {
          id: "total-orders",
          name: "Замовлень сьогодні",
          value: sessionKPIs.totalOrders,
          previousValue: 0,
          unit: "",
          trend: "up",
          category: "orders",
        },
        {
          id: "total-sessions",
          name: "Сесій сьогодні",
          value: sessionKPIs.totalSessions,
          previousValue: 0,
          unit: "",
          trend: "stable",
          category: "orders",
        },
      ];

      return { data: kpis, success: true };
    } catch (error) {
      console.error("[Analytics] Failed to get KPIs:", error);
      return { data: [], success: false, message: "Помилка отримання KPI" };
    }
  },

  /**
   * Get system alerts - smart grouping, no spam
   * Focuses on anomalies and actionable warnings
   */
  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const client = getUrqlClient();
      const alerts: Alert[] = [];
      const today = new Date().toISOString().split('T')[0]; // For daily reset

      // Get read alerts from localStorage (reset daily)
      const readAlertsKey = `read-alerts-${today}`;
      let readAlerts: string[] = [];
      if (typeof window !== 'undefined') {
        readAlerts = JSON.parse(localStorage.getItem(readAlertsKey) || '[]');
      }

      // 1. Check low stock - GROUP into one alert
      const stockResult = await client.query(GET_STOCK_ALERTS, {}).toPromise();
      if (!stockResult.error) {
        const ingredients = stockResult.data?.ingredients || [];
        const lowStock = ingredients.filter((ing: any) => ing.currentStock < ing.minStock);
        const criticalStock = lowStock.filter((ing: any) => ing.currentStock <= 0);
        const warningStock = lowStock.filter((ing: any) => ing.currentStock > 0);

        // Critical: completely out of stock
        if (criticalStock.length > 0) {
          const names = criticalStock.slice(0, 3).map((i: any) => i.nameUk || i.name);
          const moreCount = criticalStock.length > 3 ? ` (+${criticalStock.length - 3})` : '';
          alerts.push({
            id: 'critical-stock',
            severity: 'critical',
            category: 'inventory',
            title: `Закінчились ${criticalStock.length} інгредієнтів`,
            message: `${names.join(', ')}${moreCount}`,
            createdAt: new Date(),
            read: readAlerts.includes('critical-stock'),
            actionUrl: '/storage',
          });
        }

        // Warning: low but not zero - only if > 3 items
        if (warningStock.length >= 3) {
          alerts.push({
            id: 'low-stock-summary',
            severity: 'warning',
            category: 'inventory',
            title: `${warningStock.length} інгредієнтів на межі`,
            message: 'Запаси нижче мінімуму, потрібне поповнення',
            createdAt: new Date(),
            read: readAlerts.includes('low-stock-summary'),
            actionUrl: '/storage',
          });
        }
      }

      // 2. TODO: Add more smart alerts
      // - Expiring batches (within 2 days)
      // - Long cooking tickets (> 30 min)
      // - Revenue anomalies
      // - Unconfirmed reservations

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
   * Mark alert as read - persists in localStorage (resets daily)
   */
  async markAlertRead(alertId: string): Promise<ApiResponse<Alert>> {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const readAlertsKey = `read-alerts-${today}`;
      const readAlerts: string[] = JSON.parse(localStorage.getItem(readAlertsKey) || '[]');

      if (!readAlerts.includes(alertId)) {
        readAlerts.push(alertId);
        localStorage.setItem(readAlertsKey, JSON.stringify(readAlerts));
      }
    }

    return { data: { id: alertId, read: true } as unknown as Alert, success: true };
  },
};
