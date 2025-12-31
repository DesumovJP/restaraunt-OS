import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MenuItem } from "@/types";

export type PaymentMethod = 'cash' | 'card' | 'paylater';

interface CartState {
  items: CartItem[];
  tableNumber: number | null;
  paymentMethod: PaymentMethod;

  // Actions
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  setTableNumber: (tableNumber: number | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;

  // Computed
  getTotalItems: () => number;
  getTotalAmount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableNumber: null,
      paymentMethod: 'cash',

      addItem: (menuItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.menuItem.id === menuItem.id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.menuItem.id === menuItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { menuItem, quantity: 1 }],
          };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.menuItem.id !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === menuItemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateNotes: (menuItemId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === menuItemId ? { ...item, notes } : item
          ),
        }));
      },

      setTableNumber: (tableNumber) => {
        set({ tableNumber });
      },

      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },

      clearCart: () => {
        set({ items: [], tableNumber: null, paymentMethod: 'cash' });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        );
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * 0.1; // 10% tax
      },

      getTotalAmount: () => {
        return get().getSubtotal() + get().getTax();
      },
    }),
    {
      name: "restaurant-cart",
      partialize: (state) => ({
        items: state.items,
        tableNumber: state.tableNumber,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);
