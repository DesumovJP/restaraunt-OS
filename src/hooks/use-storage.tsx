"use client";

import * as React from "react";
import type { StorageBatch, YieldProfile, ProcessType } from "@/types/extended";
import type { StorageBatchStatus } from "@/types/fsm";
import { canTransition } from "@/types/fsm";
import {
  calculateChainedYield,
  applyYieldToQuantity,
  type ProcessStep,
} from "@/lib/yield-calculator";
import { consumeFIFO, type FIFOBatch } from "@/lib/bom-integration";

// Storage context
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

  // Fetch batches on mount
  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [batchesRes, profilesRes] = await Promise.all([
          fetch("/api/storage/batches"),
          fetch("/api/storage/yield-profiles"),
        ]);

        if (!batchesRes.ok || !profilesRes.ok) {
          throw new Error("Failed to fetch storage data");
        }

        const batchesData = await batchesRes.json();
        const profilesData = await profilesRes.json();

        setBatches(batchesData);
        setYieldProfiles(
          new Map(profilesData.map((p: YieldProfile) => [p.documentId, p]))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
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
                status: "processed" as StorageBatchStatus,
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
                    ? ("depleted" as StorageBatchStatus)
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
                    ? ("depleted" as StorageBatchStatus)
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

// Hook for yield calculation preview
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
