import { create } from "zustand";
import type { Product, Alert } from "@/types";

interface InventoryState {
  products: Product[];
  alerts: Alert[];
  searchQuery: string;
  categoryFilter: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  setAlerts: (alerts: Alert[]) => void;
  markAlertRead: (alertId: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;

  // Computed
  getFilteredProducts: () => Product[];
  getLowStockProducts: () => Product[];
  getExpiringProducts: (days: number) => Product[];
  getUnreadAlertsCount: () => number;
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  products: [],
  alerts: [],
  searchQuery: "",
  categoryFilter: null,

  setProducts: (products) => {
    set({ products });
  },

  addProduct: (product) => {
    set((state) => ({
      products: [product, ...state.products],
    }));
  },

  updateProduct: (productId, updates) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, ...updates, lastUpdated: new Date() }
          : product
      ),
    }));
  },

  setAlerts: (alerts) => {
    set({ alerts });
  },

  markAlertRead: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      ),
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
  },

  getFilteredProducts: () => {
    const { products, searchQuery, categoryFilter } = get();

    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !categoryFilter || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  },

  getLowStockProducts: () => {
    return get().products.filter(
      (product) => product.minStock !== undefined && product.currentStock <= product.minStock
    );
  },

  getExpiringProducts: (days) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return get().products.filter(
      (product) => product.expiryDate && new Date(product.expiryDate) <= futureDate
    );
  },

  getUnreadAlertsCount: () => {
    return get().alerts.filter((alert) => !alert.read).length;
  },
}));
