import type { ApiResponse, MenuItem, Category, Product, KitchenTicket, KPI, Alert, Recipe, Order } from "@/types";
import {
  mockMenuItems,
  mockCategories,
  mockProducts,
  mockKitchenTickets,
  mockKPIs,
  mockAlerts,
  mockRecipes,
} from "@/mocks/data";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Base API configuration
const API_DELAY = 300;

// ==========================================
// MENU API
// ==========================================

export const menuApi = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    await delay(API_DELAY);
    return { data: mockCategories, success: true };
  },

  async getMenuItems(categoryId?: string): Promise<ApiResponse<MenuItem[]>> {
    await delay(API_DELAY);
    const items = categoryId
      ? mockMenuItems.filter((item) => item.categoryId === categoryId)
      : mockMenuItems;
    return { data: items, success: true };
  },

  async getMenuItem(id: string): Promise<ApiResponse<MenuItem | null>> {
    await delay(API_DELAY);
    const item = mockMenuItems.find((i) => i.id === id) || null;
    return { data: item, success: !!item };
  },
};

// ==========================================
// ORDERS API
// ==========================================

export const ordersApi = {
  async createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Order>> {
    await delay(API_DELAY);
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { data: newOrder, success: true, message: "Замовлення створено" };
  },

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<ApiResponse<Order>> {
    await delay(API_DELAY);
    // In real app, this would update the database
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
  async getTickets(): Promise<ApiResponse<KitchenTicket[]>> {
    await delay(API_DELAY);
    return { data: mockKitchenTickets, success: true };
  },

  async updateTicketStatus(
    ticketId: string,
    status: KitchenTicket["status"]
  ): Promise<ApiResponse<KitchenTicket>> {
    await delay(API_DELAY);
    const ticket = mockKitchenTickets.find((t) => t.id === ticketId);
    if (!ticket) {
      return { data: {} as KitchenTicket, success: false, message: "Тікет не знайдено" };
    }

    const updatedTicket = {
      ...ticket,
      status,
      startedAt: status === "in_progress" ? new Date() : ticket.startedAt,
      completedAt: status === "ready" ? new Date() : ticket.completedAt,
    };

    return { data: updatedTicket, success: true };
  },
};

// ==========================================
// INVENTORY API
// ==========================================

export const inventoryApi = {
  async getProducts(): Promise<ApiResponse<Product[]>> {
    await delay(API_DELAY);
    return { data: mockProducts, success: true };
  },

  async getProduct(id: string): Promise<ApiResponse<Product | null>> {
    await delay(API_DELAY);
    const product = mockProducts.find((p) => p.id === id) || null;
    return { data: product, success: !!product };
  },

  async addProduct(product: Omit<Product, "id" | "lastUpdated">): Promise<ApiResponse<Product>> {
    await delay(API_DELAY);
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date(),
    };
    return { data: newProduct, success: true, message: "Товар додано" };
  },

  async updateStock(productId: string, quantity: number): Promise<ApiResponse<Product>> {
    await delay(API_DELAY);
    const product = mockProducts.find((p) => p.id === productId);
    if (!product) {
      return { data: {} as Product, success: false, message: "Товар не знайдено" };
    }

    return {
      data: { ...product, currentStock: quantity, lastUpdated: new Date() },
      success: true,
    };
  },
};

// ==========================================
// RECIPES API
// ==========================================

export const recipesApi = {
  async getRecipes(): Promise<ApiResponse<Recipe[]>> {
    await delay(API_DELAY);
    return { data: mockRecipes, success: true };
  },

  async getRecipe(id: string): Promise<ApiResponse<Recipe | null>> {
    await delay(API_DELAY);
    const recipe = mockRecipes.find((r) => r.id === id) || null;
    return { data: recipe, success: !!recipe };
  },

  async calculateCost(recipeId: string, portions: number): Promise<ApiResponse<number>> {
    await delay(API_DELAY);
    const recipe = mockRecipes.find((r) => r.id === recipeId);
    if (!recipe) {
      return { data: 0, success: false, message: "Рецепт не знайдено" };
    }
    return { data: recipe.costPerPortion * portions, success: true };
  },
};

// ==========================================
// ANALYTICS API
// ==========================================

export const analyticsApi = {
  async getKPIs(): Promise<ApiResponse<KPI[]>> {
    await delay(API_DELAY);
    return { data: mockKPIs, success: true };
  },

  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    await delay(API_DELAY);
    return { data: mockAlerts, success: true };
  },

  async markAlertRead(alertId: string): Promise<ApiResponse<Alert>> {
    await delay(API_DELAY);
    const alert = mockAlerts.find((a) => a.id === alertId);
    if (!alert) {
      return { data: {} as Alert, success: false };
    }
    return { data: { ...alert, read: true }, success: true };
  },
};
