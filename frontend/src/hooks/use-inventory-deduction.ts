"use client";

import { useCallback } from "react";
import { useStorageContext } from "@/hooks/use-storage";
import { getUrqlClient } from "@/lib/urql-client";
import { GET_MENU_ITEM_RECIPE } from "@/graphql/queries";
import type { KitchenTask } from "@/stores/kitchen-store";

/**
 * Storage History Entry
 * Records all inventory movements for audit and analytics
 */
export interface StorageHistoryEntry {
  id: string;
  timestamp: string;
  operationType: "use" | "receive" | "adjust" | "write_off" | "transfer";
  productDocumentId: string;
  productName: string;
  batchDocumentId?: string;
  quantity: number;
  unit: string;
  // For "use" operations
  orderDocumentId?: string;
  menuItemName?: string;
  recipeDocumentId?: string;
  // For all operations
  operatorName?: string;
  operatorRole?: "chef" | "waiter" | "manager" | "system";
  notes?: string;
  // Calculated values
  yieldApplied?: number; // If yield profile was applied
  grossRequired?: number; // Before yield
  netRequired?: number; // After yield
}

// In-memory history store (in production, this would go to backend)
let historyEntries: StorageHistoryEntry[] = [];

// History API
export const storageHistoryApi = {
  addEntry: (entry: Omit<StorageHistoryEntry, "id" | "timestamp">) => {
    const newEntry: StorageHistoryEntry = {
      ...entry,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    historyEntries = [newEntry, ...historyEntries];
    return newEntry;
  },

  getEntries: (filters?: {
    operationType?: StorageHistoryEntry["operationType"];
    productDocumentId?: string;
    orderDocumentId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): StorageHistoryEntry[] => {
    let result = [...historyEntries];

    if (filters?.operationType) {
      result = result.filter((e) => e.operationType === filters.operationType);
    }
    if (filters?.productDocumentId) {
      result = result.filter((e) => e.productDocumentId === filters.productDocumentId);
    }
    if (filters?.orderDocumentId) {
      result = result.filter((e) => e.orderDocumentId === filters.orderDocumentId);
    }
    if (filters?.from) {
      result = result.filter((e) => e.timestamp >= filters.from!);
    }
    if (filters?.to) {
      result = result.filter((e) => e.timestamp <= filters.to!);
    }
    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  },

  clearHistory: () => {
    historyEntries = [];
  },
};

/**
 * Recipe ingredient (simplified)
 * In production, this would come from the recipe API
 */
interface RecipeIngredient {
  productDocumentId: string;
  productName: string;
  quantity: number;
  unit: string;
  yieldProfileId?: string;
}

/**
 * Fetch recipe for menu item via GraphQL
 * Uses urql client directly (not a hook) for use in callbacks
 */
async function getRecipeForMenuItem(
  menuItemId: string
): Promise<{ documentId: string; ingredients: RecipeIngredient[] } | null> {
  try {
    console.log(`[Inventory] Looking up recipe for menu item: ${menuItemId}`);

    const client = getUrqlClient();
    const result = await client
      .query(GET_MENU_ITEM_RECIPE, { menuItemId })
      .toPromise();

    if (result.error) {
      console.error("[Inventory] GraphQL error:", result.error.message);
      return null;
    }

    const menuItem = result.data?.menuItem;
    if (!menuItem?.recipe) {
      console.log(`[Inventory] No recipe found for menu item: ${menuItemId}`);
      return null;
    }

    const recipe = menuItem.recipe;
    console.log(`[Inventory] Found recipe: ${recipe.name} with ${recipe.ingredients.length} ingredients`);

    // Transform to expected format
    const ingredients: RecipeIngredient[] = recipe.ingredients.map((ri: any) => ({
      productDocumentId: ri.ingredient.documentId,
      productName: ri.ingredient.nameUk || ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit || ri.ingredient.unit,
      yieldProfileId: ri.ingredient.yieldProfile?.documentId,
    }));

    return {
      documentId: recipe.documentId,
      ingredients,
    };
  } catch (err) {
    console.error("[Inventory] Failed to fetch recipe:", err);
    return null;
  }
}

/**
 * Inventory Deduction Hook
 *
 * Provides functions to deduct inventory when:
 * - Chef starts cooking a FOOD item (hot, cold, pastry stations)
 * - Order is placed for BAR items (immediate deduction)
 *
 * Features:
 * - FIFO consumption from batches
 * - Yield profile application for gross calculations
 * - History tracking for all deductions
 *
 * @example
 * const { deductForTask, deductForBarItems } = useInventoryDeduction();
 *
 * // When chef starts cooking
 * await deductForTask(task);
 *
 * // When order is placed (for bar items)
 * await deductForBarItems(barItems, orderId);
 */
export function useInventoryDeduction() {
  const { consumeFIFOForProduct, yieldProfiles, getAvailableStock } = useStorageContext();

  /**
   * Deduct inventory for a kitchen task (when chef starts cooking)
   */
  const deductForTask = useCallback(
    async (task: KitchenTask, chefName?: string) => {
      // Don't deduct for bar items - they use immediate deduction
      if (task.stationType === "bar") {
        console.log("[Inventory] Skipping bar item - uses immediate deduction");
        return;
      }

      try {
        // Get recipe for the menu item
        const recipe = await getRecipeForMenuItem(task.documentId);

        if (!recipe || recipe.ingredients.length === 0) {
          console.log(`[Inventory] No recipe found for: ${task.menuItemName}`);
          return;
        }

        console.log(`[Inventory] Deducting for task: ${task.menuItemName} x${task.quantity}`);

        // Process each ingredient
        for (const ingredient of recipe.ingredients) {
          // Calculate required quantity (net * task quantity)
          const netRequired = ingredient.quantity * task.quantity;

          // Get yield profile if available
          const yieldProfile = ingredient.yieldProfileId
            ? yieldProfiles.get(ingredient.yieldProfileId)
            : undefined;

          // Calculate gross required (applying yield ratio)
          const yieldRatio = yieldProfile?.baseYieldRatio || 1;
          const grossRequired = netRequired / yieldRatio;

          // Check available stock
          const availableStock = getAvailableStock(ingredient.productDocumentId);
          if (availableStock < grossRequired) {
            console.warn(
              `[Inventory] Insufficient stock for ${ingredient.productName}: need ${grossRequired}, have ${availableStock}`
            );
            // Continue anyway - log the shortage but don't block cooking
          }

          // Consume using FIFO
          try {
            await consumeFIFOForProduct(
              ingredient.productDocumentId,
              grossRequired,
              task.orderDocumentId
            );

            // Record history entry
            storageHistoryApi.addEntry({
              operationType: "use",
              productDocumentId: ingredient.productDocumentId,
              productName: ingredient.productName,
              quantity: grossRequired,
              unit: ingredient.unit,
              orderDocumentId: task.orderDocumentId,
              menuItemName: task.menuItemName,
              recipeDocumentId: recipe.documentId,
              operatorName: chefName || task.assignedChefName,
              operatorRole: "chef",
              yieldApplied: yieldRatio,
              grossRequired,
              netRequired,
            });

            console.log(
              `[Inventory] Deducted ${grossRequired} ${ingredient.unit} of ${ingredient.productName}`
            );
          } catch (err) {
            console.error(
              `[Inventory] Failed to deduct ${ingredient.productName}:`,
              err
            );
          }
        }
      } catch (err) {
        console.error("[Inventory] Deduction failed:", err);
      }
    },
    [consumeFIFOForProduct, yieldProfiles, getAvailableStock]
  );

  /**
   * Deduct inventory for bar items (immediate deduction when order is placed)
   */
  const deductForBarItems = useCallback(
    async (
      items: Array<{
        menuItemId: string;
        menuItemName: string;
        quantity: number;
      }>,
      orderId: string
    ) => {
      console.log(`[Inventory] Immediate deduction for ${items.length} bar items`);

      for (const item of items) {
        // Get recipe for the menu item
        const recipe = await getRecipeForMenuItem(item.menuItemId);

        if (!recipe || recipe.ingredients.length === 0) {
          console.log(`[Inventory] No recipe found for bar item: ${item.menuItemName}`);
          continue;
        }

        // Process each ingredient
        for (const ingredient of recipe.ingredients) {
          const netRequired = ingredient.quantity * item.quantity;
          const yieldProfile = ingredient.yieldProfileId
            ? yieldProfiles.get(ingredient.yieldProfileId)
            : undefined;
          const yieldRatio = yieldProfile?.baseYieldRatio || 1;
          const grossRequired = netRequired / yieldRatio;

          try {
            await consumeFIFOForProduct(ingredient.productDocumentId, grossRequired, orderId);

            // Record history
            storageHistoryApi.addEntry({
              operationType: "use",
              productDocumentId: ingredient.productDocumentId,
              productName: ingredient.productName,
              quantity: grossRequired,
              unit: ingredient.unit,
              orderDocumentId: orderId,
              menuItemName: item.menuItemName,
              recipeDocumentId: recipe.documentId,
              operatorRole: "system",
              notes: "Автоматичне списання (бар)",
              yieldApplied: yieldRatio,
              grossRequired,
              netRequired,
            });

            console.log(
              `[Inventory] Bar deduction: ${grossRequired} ${ingredient.unit} of ${ingredient.productName}`
            );
          } catch (err) {
            console.error(`[Inventory] Bar deduction failed for ${ingredient.productName}:`, err);
          }
        }
      }
    },
    [consumeFIFOForProduct, yieldProfiles]
  );

  /**
   * Get history entries with optional filters
   */
  const getHistory = useCallback(
    (filters?: {
      operationType?: StorageHistoryEntry["operationType"];
      productDocumentId?: string;
      orderDocumentId?: string;
      from?: string;
      to?: string;
      limit?: number;
    }) => {
      return storageHistoryApi.getEntries(filters);
    },
    []
  );

  return {
    deductForTask,
    deductForBarItems,
    getHistory,
  };
}
