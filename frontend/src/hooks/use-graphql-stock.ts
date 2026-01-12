// @ts-nocheck
"use client";

/**
 * GraphQL Stock Hooks
 *
 * Provides React hooks for stock batch management with GraphQL backend.
 * Includes retry logic and error handling.
 *
 * @module hooks/use-graphql-stock
 *
 * @example
 * const { batches, isLoading, error, refetch } = useStockBatches();
 *
 * @example Response
 * {
 *   batches: [
 *     {
 *       documentId: "batch-123",
 *       batchNumber: "B-001-2024",
 *       ingredientName: "Tomatoes",
 *       grossIn: 10,
 *       netAvailable: 8.5,
 *       status: "available"
 *     }
 *   ],
 *   isLoading: false,
 *   error: null
 * }
 */

import * as React from "react";
import { useQuery, useMutation } from "urql";
import { GET_ALL_STOCK_BATCHES, GET_TODAYS_BATCHES } from "@/graphql/queries";
import { CREATE_STOCK_BATCH, UPDATE_STOCK_BATCH_STATUS } from "@/graphql/mutations";
import type { StorageBatch, BatchStatus } from "@/types/extended";

// ==========================================
// TYPES
// ==========================================

interface StockBatchFromAPI {
  documentId: string;
  batchNumber: string;
  barcode?: string;
  grossIn: number;
  netAvailable: number;
  usedAmount: number;
  wastedAmount: number;
  unitCost: number;
  totalCost: number;
  receivedAt: string;
  expiryDate?: string;
  status: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  invoiceNumber?: string;
  processes?: unknown[];
  ingredient?: {
    documentId: string;
    name: string;
    nameUk?: string;
    unit: string;
    mainCategory?: string;
  };
  supplier?: {
    documentId: string;
    name: string;
  };
}

interface CreateBatchInput {
  ingredientId: string;
  grossIn: number;
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  expiryDate?: string;
  batchNumber?: string;
}

// ==========================================
// TRANSFORM FUNCTIONS
// ==========================================

/**
 * Transform API response to StorageBatch type
 */
function transformBatch(batch: StockBatchFromAPI): StorageBatch {
  return {
    documentId: batch.documentId,
    slug: batch.batchNumber?.toLowerCase().replace(/\s+/g, "-") || batch.documentId,
    productId: batch.ingredient?.documentId || "",
    productDocumentId: batch.ingredient?.documentId || "",
    productName: batch.ingredient?.nameUk || batch.ingredient?.name || "Unknown",
    batchNumber: batch.batchNumber,
    invoiceNumber: batch.invoiceNumber,
    grossIn: batch.grossIn,
    netAvailable: batch.netAvailable,
    usedAmount: batch.usedAmount || 0,
    wastedAmount: batch.wastedAmount || 0,
    unitCost: batch.unitCost,
    totalCost: batch.totalCost || batch.grossIn * batch.unitCost,
    receivedAt: batch.receivedAt,
    expiryDate: batch.expiryDate,
    status: batch.status as BatchStatus,
    isLocked: batch.isLocked || false,
    lockedBy: batch.lockedBy,
    lockedAt: batch.lockedAt,
    supplierId: batch.supplier?.documentId,
    supplierName: batch.supplier?.name,
    processes: Array.isArray(batch.processes) ? batch.processes : [],
  };
}

// ==========================================
// HOOKS
// ==========================================

/**
 * Fetch all stock batches from GraphQL
 *
 * @param options - Query options
 * @returns batches, loading state, error, and refetch function
 */
export function useStockBatches(options?: {
  status?: BatchStatus[];
  limit?: number;
}) {
  const statusFilter = options?.status || [
    "received",
    "available",
    "processing",
    "in_use",
    "depleted",
  ];
  const limit = options?.limit || 200;

  const [result, reexecuteQuery] = useQuery({
    query: GET_ALL_STOCK_BATCHES,
    variables: {
      status: statusFilter,
      limit,
    },
  });

  const batches = React.useMemo(() => {
    if (!result.data?.stockBatches) return [];
    return result.data.stockBatches.map(transformBatch);
  }, [result.data]);

  const refetch = React.useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  return {
    batches,
    isLoading: result.fetching,
    error: result.error?.message || null,
    refetch,
  };
}

/**
 * Fetch today's stock batches (for shift summary)
 */
export function useTodaysBatches() {
  const todayStart = React.useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, []);

  const [result, reexecuteQuery] = useQuery({
    query: GET_TODAYS_BATCHES,
    variables: { fromDate: todayStart },
  });

  const batches = React.useMemo(() => {
    if (!result.data?.stockBatches) return [];
    return result.data.stockBatches.map(transformBatch);
  }, [result.data]);

  const summary = React.useMemo(() => {
    return batches.reduce(
      (acc, batch) => ({
        count: acc.count + 1,
        totalWeight: acc.totalWeight + batch.grossIn,
        totalCost: acc.totalCost + batch.totalCost,
      }),
      { count: 0, totalWeight: 0, totalCost: 0 }
    );
  }, [batches]);

  const refetch = React.useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  return {
    batches,
    summary,
    isLoading: result.fetching,
    error: result.error?.message || null,
    refetch,
  };
}

/**
 * Create a new stock batch
 */
export function useCreateStockBatch() {
  const [result, executeMutation] = useMutation(CREATE_STOCK_BATCH);

  const createBatch = React.useCallback(
    async (input: CreateBatchInput) => {
      // Generate batch number if not provided
      const batchNumber =
        input.batchNumber ||
        `B-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`;

      const data = {
        batchNumber,
        ingredient: input.ingredientId,
        grossIn: input.grossIn,
        netAvailable: input.grossIn, // Initially, net = gross
        unitCost: input.unitCost,
        totalCost: input.grossIn * input.unitCost,
        receivedAt: new Date().toISOString(),
        expiryDate: input.expiryDate,
        supplier: input.supplierId,
        invoiceNumber: input.invoiceNumber,
        status: "received",
        usedAmount: 0,
        wastedAmount: 0,
        isLocked: false,
      };

      const response = await executeMutation({ data });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.createStockBatch
        ? transformBatch(response.data.createStockBatch)
        : null;
    },
    [executeMutation]
  );

  return {
    createBatch,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

/**
 * Update stock batch status
 */
export function useUpdateBatchStatus() {
  const [result, executeMutation] = useMutation(UPDATE_STOCK_BATCH_STATUS);

  const updateStatus = React.useCallback(
    async (documentId: string, status: BatchStatus) => {
      const response = await executeMutation({ documentId, status });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.updateStockBatch
        ? transformBatch(response.data.updateStockBatch)
        : null;
    },
    [executeMutation]
  );

  return {
    updateStatus,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}
