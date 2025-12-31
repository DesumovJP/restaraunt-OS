/**
 * Smart Storage Store
 *
 * Manages extended inventory with yield profiles, batch processing,
 * and storage history.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ExtendedProduct,
  YieldProfile,
  StorageBatch,
  BatchProcess,
  StorageHistory,
  ProcessType,
  StorageOperationType,
  BatchStatus,
  ProductUnit,
  ExtendedWriteOffReason,
} from '@/types/extended';
import {
  calculateBaseYield,
  calculateVariance,
  createBatchProcess,
} from '@/lib/yield-calculator';

// ==========================================
// STORE STATE INTERFACE
// ==========================================

interface SmartStorageState {
  // Data
  products: ExtendedProduct[];
  yieldProfiles: YieldProfile[];
  batches: StorageBatch[];
  history: StorageHistory[];

  // Filters
  searchQuery: string;
  categoryFilter: string[];
  processFilter: ProcessType[];
  statusFilter: BatchStatus[];

  // UI State
  selectedProductId: string | null;
  selectedBatchId: string | null;
  scannerActive: boolean;

  // Loading
  isLoading: boolean;
  error: string | null;
}

interface SmartStorageActions {
  // Products
  setProducts: (products: ExtendedProduct[]) => void;
  addProduct: (product: ExtendedProduct) => void;
  updateProduct: (documentId: string, updates: Partial<ExtendedProduct>) => void;
  updateStock: (documentId: string, quantity: number, operation: 'add' | 'subtract' | 'set') => void;

  // Yield Profiles
  setYieldProfiles: (profiles: YieldProfile[]) => void;
  addYieldProfile: (profile: YieldProfile) => void;
  updateYieldProfile: (documentId: string, updates: Partial<YieldProfile>) => void;
  getYieldProfileForProduct: (productId: string) => YieldProfile | undefined;

  // Batches
  setBatches: (batches: StorageBatch[]) => void;
  receiveBatch: (batch: Omit<StorageBatch, 'documentId' | 'slug' | 'processes' | 'usedAmount' | 'wastedAmount' | 'status'>) => StorageBatch;
  processBatch: (batchId: string, process: Omit<BatchProcess, 'documentId'>) => void;
  useBatchStock: (batchId: string, amount: number, orderId?: string, recipeId?: string) => void;
  writeOffBatch: (batchId: string, amount: number, reason: ExtendedWriteOffReason, notes?: string) => void;
  updateBatchStatus: (batchId: string, status: BatchStatus) => void;

  // History
  setHistory: (history: StorageHistory[]) => void;
  addHistoryEntry: (entry: Omit<StorageHistory, 'documentId'>) => void;
  getHistoryForProduct: (productId: string) => StorageHistory[];
  getHistoryForBatch: (batchId: string) => StorageHistory[];

  // Filters
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (categories: string[]) => void;
  setProcessFilter: (processes: ProcessType[]) => void;
  setStatusFilter: (statuses: BatchStatus[]) => void;
  clearFilters: () => void;

  // UI
  selectProduct: (productId: string | null) => void;
  selectBatch: (batchId: string | null) => void;
  setScannerActive: (active: boolean) => void;

  // Computed
  getFilteredProducts: () => ExtendedProduct[];
  getFilteredBatches: () => StorageBatch[];
  getLowStockProducts: () => ExtendedProduct[];
  getExpiringBatches: (days: number) => StorageBatch[];
  getAvailableBatchesForProduct: (productId: string) => StorageBatch[];
  getTotalStockForProduct: (productId: string) => number;
  getAverageCostForProduct: (productId: string) => number;

  // Barcode
  lookupByBarcode: (barcode: string) => ExtendedProduct | StorageBatch | undefined;

  // Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SmartStorageStore = SmartStorageState & SmartStorageActions;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateDocumentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSlug(base: string): string {
  return `${base}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
}

// ==========================================
// STORE IMPLEMENTATION
// ==========================================

export const useSmartStorageStore = create<SmartStorageStore>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      yieldProfiles: [],
      batches: [],
      history: [],
      searchQuery: '',
      categoryFilter: [],
      processFilter: [],
      statusFilter: [],
      selectedProductId: null,
      selectedBatchId: null,
      scannerActive: false,
      isLoading: false,
      error: null,

      // Products
      setProducts: (products) => set({ products }),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (documentId, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.documentId === documentId
              ? { ...product, ...updates, lastUpdated: new Date().toISOString() }
              : product
          ),
        })),

      updateStock: (documentId, quantity, operation) =>
        set((state) => ({
          products: state.products.map((product) => {
            if (product.documentId !== documentId) return product;

            let newStock: number;
            switch (operation) {
              case 'add':
                newStock = product.currentStock + quantity;
                break;
              case 'subtract':
                newStock = Math.max(0, product.currentStock - quantity);
                break;
              case 'set':
                newStock = quantity;
                break;
              default:
                newStock = product.currentStock;
            }

            return {
              ...product,
              currentStock: newStock,
              lastUpdated: new Date().toISOString(),
            };
          }),
        })),

      // Yield Profiles
      setYieldProfiles: (profiles) => set({ yieldProfiles: profiles }),

      addYieldProfile: (profile) =>
        set((state) => ({
          yieldProfiles: [...state.yieldProfiles, profile],
        })),

      updateYieldProfile: (documentId, updates) =>
        set((state) => ({
          yieldProfiles: state.yieldProfiles.map((profile) =>
            profile.documentId === documentId
              ? { ...profile, ...updates, updatedAt: new Date().toISOString() }
              : profile
          ),
        })),

      getYieldProfileForProduct: (productId) => {
        const product = get().products.find((p) => p.documentId === productId);
        if (!product?.yieldProfileId) return undefined;

        return get().yieldProfiles.find(
          (profile) => profile.documentId === product.yieldProfileId
        );
      },

      // Batches
      setBatches: (batches) => set({ batches }),

      receiveBatch: (batchData) => {
        const batch: StorageBatch = {
          ...batchData,
          documentId: generateDocumentId('batch'),
          slug: generateSlug(`batch-${batchData.productId}`),
          processes: [],
          usedAmount: 0,
          wastedAmount: 0,
          status: 'received',
        };

        set((state) => ({
          batches: [...state.batches, batch],
        }));

        // Add history entry
        get().addHistoryEntry({
          productId: batch.productId,
          batchId: batch.documentId,
          operationType: 'receive',
          quantity: batch.grossIn,
          unit: 'kg',
          timestamp: new Date().toISOString(),
          operatorId: 'system',
          operatorName: 'System',
          notes: batch.invoiceNumber ? `Invoice: ${batch.invoiceNumber}` : undefined,
        });

        // Update product stock
        get().updateStock(batch.productId, batch.grossIn, 'add');

        return batch;
      },

      processBatch: (batchId, process) => {
        const fullProcess: BatchProcess = {
          ...process,
          documentId: generateDocumentId('process'),
        };

        set((state) => ({
          batches: state.batches.map((batch) => {
            if (batch.documentId !== batchId) return batch;

            // Calculate new available amount
            const newNetAvailable = batch.netAvailable - process.grossInput + process.netOutput;
            const newWastedAmount = batch.wastedAmount + process.wasteOutput;

            return {
              ...batch,
              processes: [...batch.processes, fullProcess],
              netAvailable: Math.max(0, newNetAvailable),
              wastedAmount: newWastedAmount,
              status: newNetAvailable > 0 ? 'available' : 'depleted',
            };
          }),
        }));

        // Add history entry
        const batch = get().batches.find((b) => b.documentId === batchId);
        if (batch) {
          get().addHistoryEntry({
            productId: batch.productId,
            batchId,
            operationType: 'process',
            quantity: process.netOutput,
            unit: 'kg',
            timestamp: process.processedAt,
            operatorId: process.operatorId,
            operatorName: process.operatorName,
            notes: `${process.processType}: ${process.grossInput}kg → ${process.netOutput}kg`,
          });
        }
      },

      useBatchStock: (batchId, amount, orderId, recipeId) => {
        set((state) => ({
          batches: state.batches.map((batch) => {
            if (batch.documentId !== batchId) return batch;

            const newUsedAmount = batch.usedAmount + amount;
            const newNetAvailable = Math.max(0, batch.netAvailable - amount);

            return {
              ...batch,
              usedAmount: newUsedAmount,
              netAvailable: newNetAvailable,
              status: newNetAvailable > 0 ? batch.status : 'depleted',
            };
          }),
        }));

        // Add history entry
        const batch = get().batches.find((b) => b.documentId === batchId);
        if (batch) {
          get().addHistoryEntry({
            productId: batch.productId,
            batchId,
            operationType: 'use',
            quantity: amount,
            unit: 'kg',
            orderId,
            recipeId,
            timestamp: new Date().toISOString(),
            operatorId: 'system',
            operatorName: 'System',
          });

          // Update product stock
          get().updateStock(batch.productId, amount, 'subtract');
        }
      },

      writeOffBatch: (batchId, amount, reason, notes) => {
        set((state) => ({
          batches: state.batches.map((batch) => {
            if (batch.documentId !== batchId) return batch;

            const newWastedAmount = batch.wastedAmount + amount;
            const newNetAvailable = Math.max(0, batch.netAvailable - amount);

            return {
              ...batch,
              wastedAmount: newWastedAmount,
              netAvailable: newNetAvailable,
              status: newNetAvailable > 0 ? batch.status : 'written_off',
            };
          }),
        }));

        // Add history entry
        const batch = get().batches.find((b) => b.documentId === batchId);
        if (batch) {
          get().addHistoryEntry({
            productId: batch.productId,
            batchId,
            operationType: 'write_off',
            quantity: amount,
            unit: 'kg',
            writeOffReason: reason,
            timestamp: new Date().toISOString(),
            operatorId: 'system',
            operatorName: 'System',
            notes,
          });

          // Update product stock
          get().updateStock(batch.productId, amount, 'subtract');
        }
      },

      updateBatchStatus: (batchId, status) =>
        set((state) => ({
          batches: state.batches.map((batch) =>
            batch.documentId === batchId ? { ...batch, status } : batch
          ),
        })),

      // History
      setHistory: (history) => set({ history }),

      addHistoryEntry: (entry) => {
        const fullEntry: StorageHistory = {
          ...entry,
          documentId: generateDocumentId('hist'),
        };

        set((state) => ({
          history: [...state.history, fullEntry],
        }));
      },

      getHistoryForProduct: (productId) => {
        return get()
          .history.filter((h) => h.productId === productId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      getHistoryForBatch: (batchId) => {
        return get()
          .history.filter((h) => h.batchId === batchId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      // Filters
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (categories) => set({ categoryFilter: categories }),
      setProcessFilter: (processes) => set({ processFilter: processes }),
      setStatusFilter: (statuses) => set({ statusFilter: statuses }),

      clearFilters: () =>
        set({
          searchQuery: '',
          categoryFilter: [],
          processFilter: [],
          statusFilter: [],
        }),

      // UI
      selectProduct: (productId) => set({ selectedProductId: productId }),
      selectBatch: (batchId) => set({ selectedBatchId: batchId }),
      setScannerActive: (active) => set({ scannerActive: active }),

      // Computed
      getFilteredProducts: () => {
        const { products, searchQuery, categoryFilter } = get();

        return products.filter((product) => {
          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
              product.name.toLowerCase().includes(query) ||
              product.sku.toLowerCase().includes(query) ||
              product.barcode?.toLowerCase().includes(query);
            if (!matchesSearch) return false;
          }

          // Category filter (deep path matching)
          if (categoryFilter.length > 0) {
            const matchesCategory = categoryFilter.every((cat, index) =>
              product.categoryPath[index]?.toLowerCase() === cat.toLowerCase()
            );
            if (!matchesCategory) return false;
          }

          return true;
        });
      },

      getFilteredBatches: () => {
        const { batches, statusFilter, processFilter } = get();

        return batches.filter((batch) => {
          // Status filter
          if (statusFilter.length > 0 && !statusFilter.includes(batch.status)) {
            return false;
          }

          // Process filter
          if (processFilter.length > 0) {
            const hasProcess = batch.processes.some((p) =>
              processFilter.includes(p.processType)
            );
            if (!hasProcess) return false;
          }

          return true;
        });
      },

      getLowStockProducts: () => {
        return get().products.filter(
          (product) => product.currentStock <= product.minStock
        );
      },

      getExpiringBatches: (days) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);

        return get().batches.filter((batch) => {
          if (!batch.expiryDate) return false;
          if (batch.status === 'depleted' || batch.status === 'written_off') return false;

          const expiryDate = new Date(batch.expiryDate);
          return expiryDate <= cutoffDate;
        });
      },

      getAvailableBatchesForProduct: (productId) => {
        return get()
          .batches.filter(
            (batch) =>
              batch.productId === productId &&
              batch.netAvailable > 0 &&
              batch.status !== 'depleted' &&
              batch.status !== 'written_off' &&
              batch.status !== 'expired'
          )
          .sort((a, b) => {
            // FIFO: oldest first
            return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
          });
      },

      getTotalStockForProduct: (productId) => {
        const batches = get().getAvailableBatchesForProduct(productId);
        return batches.reduce((sum, batch) => sum + batch.netAvailable, 0);
      },

      getAverageCostForProduct: (productId) => {
        const batches = get().getAvailableBatchesForProduct(productId);
        if (batches.length === 0) return 0;

        const totalCost = batches.reduce((sum, batch) => {
          const remainingCost = (batch.netAvailable / batch.grossIn) * batch.totalCost;
          return sum + remainingCost;
        }, 0);

        const totalStock = batches.reduce((sum, batch) => sum + batch.netAvailable, 0);

        return totalStock > 0 ? totalCost / totalStock : 0;
      },

      // Barcode
      lookupByBarcode: (barcode) => {
        // First check products
        const product = get().products.find((p) => p.barcode === barcode);
        if (product) return product;

        // Then check batches
        const batch = get().batches.find((b) => b.barcode === barcode);
        return batch;
      },

      // Loading
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'restaurant-smart-storage',
      partialize: (state) => ({
        products: state.products,
        yieldProfiles: state.yieldProfiles,
        batches: state.batches,
        history: state.history.slice(-1000), // Keep last 1000 entries
      }),
    }
  )
);

// ==========================================
// SELECTOR HOOKS
// ==========================================

export const useSelectedProduct = () => {
  const selectedProductId = useSmartStorageStore((state) => state.selectedProductId);
  const products = useSmartStorageStore((state) => state.products);

  return selectedProductId
    ? products.find((p) => p.documentId === selectedProductId)
    : undefined;
};

export const useSelectedBatch = () => {
  const selectedBatchId = useSmartStorageStore((state) => state.selectedBatchId);
  const batches = useSmartStorageStore((state) => state.batches);

  return selectedBatchId
    ? batches.find((b) => b.documentId === selectedBatchId)
    : undefined;
};

export const useLowStockAlerts = () => {
  const getLowStockProducts = useSmartStorageStore((state) => state.getLowStockProducts);
  return getLowStockProducts();
};

export const useExpiringBatchAlerts = (days: number = 7) => {
  const getExpiringBatches = useSmartStorageStore((state) => state.getExpiringBatches);
  return getExpiringBatches(days);
};

// ==========================================
// ACTION HELPERS
// ==========================================

/**
 * Process a batch with automatic yield calculation
 */
export function processWithYield(
  batchId: string,
  processType: ProcessType,
  grossInput: number,
  actualNetOutput: number,
  operatorId: string,
  operatorName: string,
  options: { processTemp?: number; processTime?: number; notes?: string } = {}
) {
  const store = useSmartStorageStore.getState();
  const batch = store.batches.find((b) => b.documentId === batchId);

  if (!batch) {
    throw new Error('Batch not found');
  }

  const yieldProfile = store.getYieldProfileForProduct(batch.productId);

  if (!yieldProfile) {
    throw new Error('No yield profile found for product');
  }

  const process = createBatchProcess(
    processType,
    grossInput,
    actualNetOutput,
    yieldProfile,
    operatorId,
    operatorName,
    options
  );

  store.processBatch(batchId, process);

  // Check variance and return alert if needed
  const variance = calculateVariance(
    process.expectedYield,
    grossInput,
    actualNetOutput
  );

  return {
    process,
    variance,
    alert: !variance.withinTolerance
      ? {
          severity: Math.abs(variance.variancePercent) > 10 ? 'critical' : 'warning',
          message: `Variance: ${variance.variancePercent.toFixed(1)}%`,
        }
      : null,
  };
}

/**
 * Use stock from batches using FIFO method
 */
export function useStockFIFO(
  productId: string,
  amount: number,
  orderId?: string,
  recipeId?: string
): { success: boolean; usedBatches: Array<{ batchId: string; amount: number }> } {
  const store = useSmartStorageStore.getState();
  const batches = store.getAvailableBatchesForProduct(productId);

  let remaining = amount;
  const usedBatches: Array<{ batchId: string; amount: number }> = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const useAmount = Math.min(remaining, batch.netAvailable);
    store.useBatchStock(batch.documentId, useAmount, orderId, recipeId);

    usedBatches.push({ batchId: batch.documentId, amount: useAmount });
    remaining -= useAmount;
  }

  return {
    success: remaining <= 0,
    usedBatches,
  };
}
