// @ts-nocheck
"use client";

/**
 * Storage Management Hooks
 *
 * Provides React context and hooks for inventory/storage management with:
 * - Batch tracking with FIFO consumption
 * - Yield calculation and variance tracking
 * - Optimistic updates with automatic rollback
 * - Retry logic for API calls (3 attempts, exponential backoff)
 *
 * @module hooks/use-storage
 *
 * @example
 * // Wrap your component tree with StorageProvider
 * <StorageProvider>
 *   <InventoryDashboard />
 * </StorageProvider>
 *
 * @example
 * // Use the context in child components
 * function InventoryDashboard() {
 *   const {
 *     batches,
 *     isLoading,
 *     error,
 *     receiveBatch,
 *     consumeFIFOForProduct
 *   } = useStorageContext();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorFallback error={error} />;
 *
 *   return <BatchList batches={batches} />;
 * }
 *
 * @example Response
 * {
 *   batches: [
 *     {
 *       documentId: "batch-123",
 *       productDocumentId: "product-456",
 *       netAvailable: 5.5,
 *       status: "received",
 *       receivedAt: "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   yieldProfiles: Map<string, YieldProfile>,
 *   isLoading: false,
 *   error: null
 * }
 */

import * as React from "react";
import type { StorageBatch, YieldProfile, ProcessType } from "@/types/extended";
import type { StorageBatchState } from "@/types/fsm";
import { canTransition } from "@/types/fsm";
import {
  calculateChainedYield,
  applyYieldToQuantity,
  type ProcessStep,
} from "@/lib/yield-calculator";
import { consumeFIFO, type FIFOBatch } from "@/lib/bom-integration";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

/**
 * Storage context value interface
 */
interface StorageContextValue {
  batches: StorageBatch[];
  yieldProfiles: Map<string, YieldProfile>;
  isLoading: boolean;
  error: string | null;
  // Actions
  receiveBatch: (batch: Omit<StorageBatch, "documentId" | "slug" | "status" | "processes">) => Promise<StorageBatch>;
  processBatch: (batchDocumentId: string, processType: ProcessType, netOutput: number, wasteOutput: number) => Promise<void>;
  consumeFromBatch: (batchDocumentId: string, quantity: number, orderId?: string) => Promise<void>;
  writeOffBatch: (batchDocumentId: string, quantity: number, reason: string) => Promise<void>;
  lockBatch: (batchDocumentId: string) => Promise<void>;
  unlockBatch: (batchDocumentId: string) => Promise<void>;
  // FIFO operations
  consumeFIFOForProduct: (productDocumentId: string, quantity: number, orderId?: string) => Promise<void>;
  // Queries
  getBatchesByProduct: (productDocumentId: string) => StorageBatch[];
  getAvailableStock: (productDocumentId: string) => number;
  getExpiringBatches: (daysAhead: number) => StorageBatch[];
  getLowStockProducts: () => Array<{ productDocumentId: string; currentStock: number; minStock: number }>;
}

const StorageContext = React.createContext<StorageContextValue | null>(null);

export function useStorageContext() {
  const context = React.useContext(StorageContext);
  if (!context) {
    throw new Error("useStorageContext must be used within StorageProvider");
  }
  return context;
}

interface StorageProviderProps {
  children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [batches, setBatches] = React.useState<StorageBatch[]>([]);
  const [yieldProfiles, setYieldProfiles] = React.useState<Map<string, YieldProfile>>(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch batches on mount with retry logic
  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [batchesData, profilesData] = await fetchWithRetry(
          async () => {
            const [batchesRes, profilesRes] = await Promise.all([
              fetch("/api/storage/batches"),
              fetch("/api/storage/yield-profiles"),
            ]);

            if (!batchesRes.ok || !profilesRes.ok) {
              throw new Error("Не вдалося завантажити дані складу");
            }

            return Promise.all([batchesRes.json(), profilesRes.json()]);
          },
          {
            maxRetries: 3,
            onRetry: (attempt, err) => {
              console.warn(`Retry ${attempt} for fetchData:`, err.message);
            },
          }
        );

        setBatches(batchesData);
        setYieldProfiles(
          new Map(profilesData.map((p: YieldProfile) => [p.documentId, p]))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Невідома помилка");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Receive new batch
  const receiveBatch = React.useCallback(
    async (batchData: Omit<StorageBatch, "documentId" | "slug" | "status" | "processes">): Promise<StorageBatch> => {
      const newBatch: StorageBatch = {
        ...batchData,
        documentId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        slug: `batch-${Date.now()}`,
        status: "received",
        processes: [],
        usedAmount: 0,
        wastedAmount: 0,
        isLocked: false,
      };

      // Optimistic update
      setBatches((prev) => [...prev, newBatch]);

      try {
        const response = await fetch("/api/storage/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchData),
        });

        if (!response.ok) throw new Error("Failed to receive batch");

        const savedBatch = await response.json();
        setBatches((prev) =>
          prev.map((b) => (b.documentId === newBatch.documentId ? savedBatch : b))
        );
        return savedBatch;
      } catch (err) {
        // Rollback
        setBatches((prev) => prev.filter((b) => b.documentId !== newBatch.documentId));
        throw err;
      }
    },
    []
  );

  // Process batch (apply yield calculation)
  const processBatch = React.useCallback(
    async (
      batchDocumentId: string,
      processType: ProcessType,
      netOutput: number,
      wasteOutput: number
    ) => {
      const batch = batches.find((b) => b.documentId === batchDocumentId);
      if (!batch) throw new Error("Batch not found");

      const yieldProfile = batch.yieldProfileId
        ? yieldProfiles.get(batch.yieldProfileId)
        : undefined;

      const expectedYield = yieldProfile?.processYields.find(
        (p) => p.processType === processType
      )?.yieldRatio;

      const grossInput = batch.netAvailable;
      const actualYield = netOutput / grossInput;
      const variancePercent = expectedYield
        ? ((actualYield - expectedYield) / expectedYield) * 100
        : 0;

      const newProcess = {
        processType,
        processedAt: new Date().toISOString(),
        grossInput,
        netOutput,
        wasteOutput,
        expectedYield: expectedYield || 1,
        actualYield,
        variancePercent,
        operatorId: "current_user",
        operatorName: "Поточний оператор",
      };

      // Optimistic update
      setBatches((prev) =>
        prev.map((b) =>
          b.documentId === batchDocumentId
            ? {
                ...b,
                status: "processed" as StorageBatchState,
                netAvailable: netOutput,
                wastedAmount: b.wastedAmount + wasteOutput,
                processes: [...b.processes, newProcess],
              }
            : b
        )
      );

      try {
        await fetch(`/api/storage/batches/${batchDocumentId}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processType, netOutput, wasteOutput }),
        });
      } catch (err) {
        // Rollback
        setBatches((prev) =>
          prev.map((b) =>
            b.documentId === batchDocumentId
              ? {
                  ...b,
                  status: batch.status,
                  netAvailable: batch.netAvailable,
                  wastedAmount: batch.wastedAmount,
                  processes: batch.processes,
                }
              : b
          )
        );
        throw err;
      }
    },
    [batches, yieldProfiles]
  );

  // Consume from batch
  const consumeFromBatch = React.useCallback(
    async (batchDocumentId: string, quantity: number, orderId?: string) => {
      const batch = batches.find((b) => b.documentId === batchDocumentId);
      if (!batch) throw new Error("Batch not found");
      if (batch.netAvailable < quantity) throw new Error("Insufficient stock");
      if (batch.isLocked) throw new Error("Batch is locked");

      // Optimistic update
      setBatches((prev) =>
        prev.map((b) =>
          b.documentId === batchDocumentId
            ? {
                ...b,
                netAvailable: b.netAvailable - quantity,
                usedAmount: b.usedAmount + quantity,
                status:
                  b.netAvailable - quantity <= 0
                    ? ("depleted" as StorageBatchState)
                    : b.status,
              }
            : b
        )
      );

      try {
        await fetch(`/api/storage/batches/${batchDocumentId}/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity, orderId }),
        });
      } catch (err) {
        // Rollback
        setBatches((prev) =>
          prev.map((b) =>
            b.documentId === batchDocumentId
              ? {
                  ...b,
                  netAvailable: batch.netAvailable,
                  usedAmount: batch.usedAmount,
                  status: batch.status,
                }
              : b
          )
        );
        throw err;
      }
    },
    [batches]
  );

  // Write off from batch
  const writeOffBatch = React.useCallback(
    async (batchDocumentId: string, quantity: number, reason: string) => {
      const batch = batches.find((b) => b.documentId === batchDocumentId);
      if (!batch) throw new Error("Batch not found");

      // Optimistic update
      setBatches((prev) =>
        prev.map((b) =>
          b.documentId === batchDocumentId
            ? {
                ...b,
                netAvailable: Math.max(0, b.netAvailable - quantity),
                wastedAmount: b.wastedAmount + quantity,
                status:
                  b.netAvailable - quantity <= 0
                    ? ("depleted" as StorageBatchState)
                    : b.status,
              }
            : b
        )
      );

      try {
        await fetch(`/api/storage/batches/${batchDocumentId}/write-off`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity, reason }),
        });
      } catch (err) {
        // Rollback
        setBatches((prev) =>
          prev.map((b) =>
            b.documentId === batchDocumentId
              ? {
                  ...b,
                  netAvailable: batch.netAvailable,
                  wastedAmount: batch.wastedAmount,
                  status: batch.status,
                }
              : b
          )
        );
        throw err;
      }
    },
    [batches]
  );

  // Lock batch
  const lockBatch = React.useCallback(
    async (batchDocumentId: string) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.documentId === batchDocumentId
            ? { ...b, isLocked: true, lockedBy: "current_user", lockedAt: new Date().toISOString() }
            : b
        )
      );

      try {
        await fetch(`/api/storage/batches/${batchDocumentId}/lock`, {
          method: "POST",
        });
      } catch (err) {
        setBatches((prev) =>
          prev.map((b) =>
            b.documentId === batchDocumentId
              ? { ...b, isLocked: false, lockedBy: undefined, lockedAt: undefined }
              : b
          )
        );
        throw err;
      }
    },
    []
  );

  // Unlock batch
  const unlockBatch = React.useCallback(
    async (batchDocumentId: string) => {
      const batch = batches.find((b) => b.documentId === batchDocumentId);

      setBatches((prev) =>
        prev.map((b) =>
          b.documentId === batchDocumentId
            ? { ...b, isLocked: false, lockedBy: undefined, lockedAt: undefined }
            : b
        )
      );

      try {
        await fetch(`/api/storage/batches/${batchDocumentId}/unlock`, {
          method: "POST",
        });
      } catch (err) {
        if (batch) {
          setBatches((prev) =>
            prev.map((b) =>
              b.documentId === batchDocumentId
                ? { ...b, isLocked: batch.isLocked, lockedBy: batch.lockedBy, lockedAt: batch.lockedAt }
                : b
            )
          );
        }
        throw err;
      }
    },
    [batches]
  );

  // FIFO consumption for product
  const consumeFIFOForProduct = React.useCallback(
    async (productDocumentId: string, quantity: number, orderId?: string) => {
      const productBatches = batches
        .filter(
          (b) =>
            b.productDocumentId === productDocumentId &&
            b.netAvailable > 0 &&
            !b.isLocked &&
            b.status !== "depleted" &&
            b.status !== "expired"
        )
        .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

      const fifoBatches: FIFOBatch[] = productBatches.map((b) => ({
        batchDocumentId: b.documentId,
        productDocumentId: b.productDocumentId,
        availableQuantity: b.netAvailable,
        unitCost: b.unitCost,
        receivedAt: b.receivedAt,
        expiresAt: b.expiryDate,
      }));

      const result = consumeFIFO(fifoBatches, quantity);

      if (result.remainingQuantity > 0) {
        throw new Error(`Insufficient stock. Missing: ${result.remainingQuantity}`);
      }

      // Update all affected batches
      for (const consumption of result.consumptions) {
        await consumeFromBatch(consumption.batchDocumentId, consumption.quantity, orderId);
      }
    },
    [batches, consumeFromBatch]
  );

  // Get batches by product
  const getBatchesByProduct = React.useCallback(
    (productDocumentId: string) => {
      return batches.filter((b) => b.productDocumentId === productDocumentId);
    },
    [batches]
  );

  // Get available stock for product
  const getAvailableStock = React.useCallback(
    (productDocumentId: string) => {
      return batches
        .filter(
          (b) =>
            b.productDocumentId === productDocumentId &&
            b.status !== "depleted" &&
            b.status !== "expired" &&
            !b.isLocked
        )
        .reduce((sum, b) => sum + b.netAvailable, 0);
    },
    [batches]
  );

  // Get expiring batches
  const getExpiringBatches = React.useCallback(
    (daysAhead: number) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      return batches.filter(
        (b) =>
          b.expiryDate &&
          new Date(b.expiryDate) <= cutoffDate &&
          b.netAvailable > 0 &&
          b.status !== "depleted" &&
          b.status !== "expired"
      );
    },
    [batches]
  );

  // Get low stock products (placeholder - needs product min stock data)
  const getLowStockProducts = React.useCallback(() => {
    // Group by product and calculate total stock
    const stockByProduct = batches.reduce(
      (acc, b) => {
        if (b.status === "depleted" || b.status === "expired") return acc;
        if (!acc[b.productDocumentId]) {
          acc[b.productDocumentId] = 0;
        }
        acc[b.productDocumentId] += b.netAvailable;
        return acc;
      },
      {} as Record<string, number>
    );

    // In real app, this would compare against product.minStock
    return Object.entries(stockByProduct)
      .filter(([, stock]) => stock < 10) // Placeholder threshold
      .map(([productDocumentId, currentStock]) => ({
        productDocumentId,
        currentStock,
        minStock: 10, // Placeholder
      }));
  }, [batches]);

  const value = React.useMemo(
    () => ({
      batches,
      yieldProfiles,
      isLoading,
      error,
      receiveBatch,
      processBatch,
      consumeFromBatch,
      writeOffBatch,
      lockBatch,
      unlockBatch,
      consumeFIFOForProduct,
      getBatchesByProduct,
      getAvailableStock,
      getExpiringBatches,
      getLowStockProducts,
    }),
    [
      batches,
      yieldProfiles,
      isLoading,
      error,
      receiveBatch,
      processBatch,
      consumeFromBatch,
      writeOffBatch,
      lockBatch,
      unlockBatch,
      consumeFIFOForProduct,
      getBatchesByProduct,
      getAvailableStock,
      getExpiringBatches,
      getLowStockProducts,
    ]
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

/**
 * Yield Calculation Preview Hook
 *
 * Calculates expected output based on yield profile and processing steps.
 * Useful for previewing yield before actually processing a batch.
 *
 * @param yieldProfile - Yield profile with base and process yields
 * @param grossInput - Input quantity in base units
 * @param processSteps - Array of processing steps to apply
 * @returns Calculated output, waste, and step-by-step breakdown
 *
 * @example
 * const { netOutput, totalWaste, effectiveYield } = useYieldPreview(
 *   yieldProfile,
 *   10, // 10 kg input
 *   [{ processType: "cleaning" }, { processType: "cutting" }]
 * );
 * // Returns: { netOutput: 7.2, totalWaste: 2.8, effectiveYield: 0.72 }
 */
export function useYieldPreview(
  yieldProfile: YieldProfile | undefined,
  grossInput: number,
  processSteps: ProcessStep[]
): {
  netOutput: number;
  totalWaste: number;
  effectiveYield: number;
  stepOutputs: Array<{ processType: ProcessType; input: number; output: number; waste: number }>;
} {
  return React.useMemo(() => {
    if (!yieldProfile || grossInput <= 0) {
      return {
        netOutput: grossInput,
        totalWaste: 0,
        effectiveYield: 1,
        stepOutputs: [],
      };
    }

    const chainResult = calculateChainedYield(
      yieldProfile.baseYieldRatio,
      processSteps
    );

    const netOutput = applyYieldToQuantity(grossInput, chainResult.effectiveYield);
    const totalWaste = grossInput - netOutput;

    const stepOutputs = processSteps.map((step, index) => {
      const previousOutput =
        index === 0
          ? grossInput * yieldProfile.baseYieldRatio
          : stepOutputs[index - 1].output;
      const stepYield =
        yieldProfile.processYields.find((p) => p.processType === step.processType)
          ?.yieldRatio || 1;
      const output = previousOutput * stepYield;

      return {
        processType: step.processType,
        input: previousOutput,
        output,
        waste: previousOutput - output,
      };
    });

    return {
      netOutput,
      totalWaste,
      effectiveYield: chainResult.effectiveYield,
      stepOutputs,
    };
  }, [yieldProfile, grossInput, processSteps]);
}

// ==========================================
// STORAGE PRODUCTS HOOK (GraphQL)
// ==========================================

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

const INGREDIENTS_QUERY = `
  query GetIngredients {
    ingredients(pagination: { limit: 200 }) {
      documentId
      name
      nameUk
      slug
      sku
      barcode
      unit
      currentStock
      minStock
      maxStock
      mainCategory
      subCategory
      storageCondition
      shelfLifeDays
      costPerUnit
      isActive
      yieldProfile {
        documentId
        name
        baseYieldRatio
        processYields
        wasteBreakdown
      }
      stockBatches(pagination: { limit: 10 }) {
        documentId
        expiryDate
        netAvailable
        status
      }
    }
  }
`;

interface StrapiIngredient {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  sku?: string;
  barcode?: string;
  unit: import('@/types/extended').ProductUnit;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  mainCategory: string;
  subCategory?: string;
  storageCondition: import('@/types/extended').StorageCondition;
  shelfLifeDays?: number;
  costPerUnit: number;
  isActive: boolean;
  yieldProfile?: {
    documentId: string;
    name: string;
    baseYieldRatio: number;
    processYields: Array<{ processType: string; yieldRatio: number }>;
    wasteBreakdown: Array<{ reason: string; percentage: number }>;
  };
  stockBatches?: Array<{
    documentId: string;
    expiryDate?: string;
    netAvailable: number;
    status: string;
  }>;
}

function transformToExtendedProduct(ingredient: StrapiIngredient): import('@/types/extended').ExtendedProduct {
  const expiryDates = ingredient.stockBatches
    ?.filter(b => b.expiryDate && b.status === 'available')
    .map(b => new Date(b.expiryDate!))
    .sort((a, b) => a.getTime() - b.getTime());

  const nearestExpiry = expiryDates?.[0];

  const yieldProfile: YieldProfile | undefined = ingredient.yieldProfile
    ? {
        documentId: ingredient.yieldProfile.documentId,
        slug: ingredient.yieldProfile.name.toLowerCase().replace(/\s+/g, '-'),
        name: ingredient.yieldProfile.name,
        productId: ingredient.documentId,
        baseYieldRatio: ingredient.yieldProfile.baseYieldRatio,
        processYields: ingredient.yieldProfile.processYields || [],
        wasteBreakdown: ingredient.yieldProfile.wasteBreakdown || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : undefined;

  return {
    documentId: ingredient.documentId,
    slug: ingredient.slug,
    name: ingredient.nameUk || ingredient.name,
    sku: ingredient.sku || ingredient.slug.toUpperCase(),
    barcode: ingredient.barcode,
    unit: ingredient.unit,
    currentStock: ingredient.currentStock,
    minStock: ingredient.minStock,
    maxStock: ingredient.maxStock || ingredient.minStock * 5,
    mainCategory: (ingredient.mainCategory?.replace(/_/g, '-') || 'raw') as import('@/types/extended').StorageMainCategory,
    subCategory: (ingredient.subCategory || 'vegetables') as import('@/types/extended').StorageSubCategory,
    storageCondition: ingredient.storageCondition || 'ambient',
    costPerUnit: ingredient.costPerUnit,
    lastUpdated: new Date().toISOString(),
    expiryDate: nearestExpiry?.toISOString(),
    yieldProfile,
    yieldProfileId: ingredient.yieldProfile?.documentId,
    categoryPath: [
      ingredient.mainCategory?.replace(/_/g, '-') || 'raw',
      ingredient.subCategory || 'vegetables',
    ],
  };
}

async function fetchGraphQL<T>(query: string): Promise<T | null> {
  const response = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'GraphQL error');
  }

  return result.data;
}

/**
 * Storage Products Hook
 *
 * Fetches ingredients from GraphQL backend and transforms
 * them to ExtendedProduct format for the Storage page.
 *
 * @returns products, isLoading, error, refetch
 *
 * @example
 * const { products, isLoading, error, refetch } = useStorageProducts();
 */
export function useStorageProducts(): {
  products: import('@/types/extended').ExtendedProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [products, setProducts] = React.useState<import('@/types/extended').ExtendedProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithRetry(
        () => fetchGraphQL<{ ingredients: StrapiIngredient[] }>(INGREDIENTS_QUERY),
        { maxRetries: 3 }
      );

      if (data?.ingredients) {
        const transformedProducts = data.ingredients
          .filter(i => i.isActive !== false)
          .map(transformToExtendedProduct);
        setProducts(transformedProducts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load storage data';
      setError(message);
      console.error('useStorageProducts error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, isLoading, error, refetch: fetchData };
}
