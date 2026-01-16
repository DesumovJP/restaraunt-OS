"use client";

import * as React from "react";
import type { StorageBatch, ProcessType } from "@/types/extended";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// ==========================================
// FETCH BATCHES
// ==========================================

interface UseBatchesOptions {
  status?: string;
  ingredientId?: string;
  limit?: number;
}

interface UseBatchesResult {
  batches: StorageBatch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBatches(options: UseBatchesOptions = {}): UseBatchesResult {
  const [batches, setBatches] = React.useState<StorageBatch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBatches = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `${STRAPI_URL}/api/stock-batches?populate=ingredient,supplier`;

      if (options.status) {
        url += `&filters[status][$eq]=${options.status}`;
      }
      if (options.ingredientId) {
        url += `&filters[ingredient][documentId][$eq]=${options.ingredientId}`;
      }
      if (options.limit) {
        url += `&pagination[limit]=${options.limit}`;
      }

      url += "&sort=receivedAt:desc";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }

      const data = await response.json();
      const items = data.data || [];

      // Transform Strapi response to StorageBatch format
      const transformedBatches: StorageBatch[] = items.map((item: any) => ({
        documentId: item.documentId,
        slug: item.batchNumber?.toLowerCase().replace(/\s+/g, "-") || item.documentId,
        productId: item.ingredient?.documentId || "",
        productName: item.ingredient?.nameUk || item.ingredient?.name || "Невідомий",
        yieldProfileId: item.ingredient?.yieldProfile?.documentId || "",
        grossIn: parseFloat(item.grossIn) || 0,
        unitCost: parseFloat(item.unitCost) || 0,
        totalCost: parseFloat(item.totalCost) || 0,
        supplierId: item.supplier?.documentId || "",
        invoiceNumber: item.invoiceNumber || "",
        receivedAt: item.receivedAt || item.createdAt,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber || item.documentId.slice(-8).toUpperCase(),
        barcode: item.barcode,
        processes: item.processes || [],
        netAvailable: parseFloat(item.netAvailable) || 0,
        usedAmount: parseFloat(item.usedAmount) || 0,
        wastedAmount: parseFloat(item.wastedAmount) || 0,
        status: item.status || "available",
        isLocked: item.isLocked || false,
        lockedBy: item.lockedBy,
        lockedAt: item.lockedAt,
      }));

      setBatches(transformedBatches);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError(err instanceof Error ? err.message : "Помилка завантаження партій");
    } finally {
      setIsLoading(false);
    }
  }, [options.status, options.ingredientId, options.limit]);

  React.useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    isLoading,
    error,
    refetch: fetchBatches,
  };
}

// ==========================================
// BATCH MUTATIONS
// ==========================================

interface BatchMutations {
  processBatch: (
    batchId: string,
    processType: ProcessType,
    yieldRatio: number,
    notes?: string
  ) => Promise<void>;
  writeOffBatch: (
    batchId: string,
    reason: string,
    quantity: number,
    notes?: string
  ) => Promise<void>;
  countBatch: (
    batchId: string,
    actualQuantity: number,
    notes?: string
  ) => Promise<void>;
  lockBatch: (batchId: string) => Promise<void>;
  unlockBatch: (batchId: string) => Promise<void>;
  receiveBatch: (data: {
    ingredientId: string;
    grossIn: number;
    unitCost: number;
    expiryDate?: string;
    supplierId?: string;
    invoiceNumber?: string;
    batchNumber?: string;
  }) => Promise<any>;
  consumeIngredient: (
    ingredientId: string,
    quantity: number,
    kitchenTicketId?: string,
    reason?: string
  ) => Promise<any>;
}

export function useBatchMutations(): BatchMutations {
  const processBatch = async (
    batchId: string,
    processType: ProcessType,
    yieldRatio: number,
    notes?: string
  ) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/${batchId}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processType, yieldRatio, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка обробки партії");
    }

    return response.json();
  };

  const writeOffBatch = async (
    batchId: string,
    reason: string,
    quantity: number,
    notes?: string
  ) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/${batchId}/write-off`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, quantity, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка списання партії");
    }

    return response.json();
  };

  const countBatch = async (
    batchId: string,
    actualQuantity: number,
    notes?: string
  ) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/${batchId}/count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualQuantity, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка інвентаризації");
    }

    return response.json();
  };

  const lockBatch = async (batchId: string) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/${batchId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка блокування партії");
    }

    return response.json();
  };

  const unlockBatch = async (batchId: string) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/${batchId}/lock`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка розблокування партії");
    }

    return response.json();
  };

  const receiveBatch = async (data: {
    ingredientId: string;
    grossIn: number;
    unitCost: number;
    expiryDate?: string;
    supplierId?: string;
    invoiceNumber?: string;
    batchNumber?: string;
  }) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка отримання партії");
    }

    return response.json();
  };

  const consumeIngredient = async (
    ingredientId: string,
    quantity: number,
    kitchenTicketId?: string,
    reason?: string
  ) => {
    const response = await fetch(`${STRAPI_URL}/api/stock-batches/consume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientId, quantity, kitchenTicketId, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Помилка списання інгредієнта");
    }

    return response.json();
  };

  return {
    processBatch,
    writeOffBatch,
    countBatch,
    lockBatch,
    unlockBatch,
    receiveBatch,
    consumeIngredient,
  };
}

// ==========================================
// ALERTS HOOKS
// ==========================================

interface ExpiryAlert {
  documentId: string;
  batchNumber: string;
  ingredient: string;
  ingredientUk: string;
  netAvailable: number;
  unit: string;
  expiryDate: string;
  daysUntilExpiry?: number;
  supplier?: string;
}

interface LowStockAlert {
  documentId: string;
  name: string;
  nameUk: string;
  currentStock: number;
  minStock: number;
  unit: string;
  shortage: number;
  isCritical: boolean;
}

interface AlertsResult {
  expiringSoon: ExpiryAlert[];
  alreadyExpired: ExpiryAlert[];
  lowStock: LowStockAlert[];
  critical: LowStockAlert[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStorageAlerts(expiryDays: number = 7): AlertsResult {
  const [expiringSoon, setExpiringSoon] = React.useState<ExpiryAlert[]>([]);
  const [alreadyExpired, setAlreadyExpired] = React.useState<ExpiryAlert[]>([]);
  const [lowStock, setLowStock] = React.useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAlerts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [expiryRes, lowStockRes] = await Promise.all([
        fetch(`${STRAPI_URL}/api/stock-batches/expiring?days=${expiryDays}`),
        fetch(`${STRAPI_URL}/api/stock-batches/low-stock`),
      ]);

      if (expiryRes.ok) {
        const expiryData = await expiryRes.json();
        setExpiringSoon(expiryData.expiringSoon || []);
        setAlreadyExpired(expiryData.alreadyExpired || []);
      }

      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json();
        const all = lowStockData.lowStock || [];
        setLowStock(all);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err instanceof Error ? err.message : "Помилка завантаження сповіщень");
    } finally {
      setIsLoading(false);
    }
  }, [expiryDays]);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const critical = React.useMemo(
    () => lowStock.filter((item) => item.isCritical),
    [lowStock]
  );

  return {
    expiringSoon,
    alreadyExpired,
    lowStock,
    critical,
    isLoading,
    error,
    refetch: fetchAlerts,
  };
}
