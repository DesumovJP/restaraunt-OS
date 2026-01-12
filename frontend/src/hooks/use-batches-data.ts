/**
 * useBatchesData Hook
 *
 * Unified hook for fetching and managing batch data.
 * Handles GraphQL fetching with mock data fallback.
 */

import * as React from "react";
import type { StorageBatch, BatchStatus } from "@/types/extended";
import { useStockBatches, useTodaysBatches } from "@/hooks/use-graphql-stock";

/**
 * Sort field options
 */
export type BatchSortField = "product" | "received" | "expiry" | "quantity" | "cost" | "status";

/**
 * Sort order options
 */
export type SortOrder = "asc" | "desc";

/**
 * Filter state for batches
 */
export interface BatchFilters {
  status: BatchStatus | "all";
  search: string;
}

/**
 * Sort state for batches
 */
export interface BatchSort {
  field: BatchSortField;
  order: SortOrder;
}

/**
 * Today's summary data
 */
export interface TodaysSummary {
  count: number;
  totalCost: number;
  totalWeight: number;
}

/**
 * Status counts
 */
export type StatusCounts = Record<string, number>;

/**
 * Hook options
 */
export interface UseBatchesDataOptions {
  initialFilters?: Partial<BatchFilters>;
  initialSort?: Partial<BatchSort>;
}

/**
 * Hook return type
 */
export interface UseBatchesDataReturn {
  // Data
  batches: StorageBatch[];
  filteredBatches: StorageBatch[];
  todaysSummary: TodaysSummary;
  statusCounts: StatusCounts;
  totalValue: number;
  totalWeight: number;

  // State
  filters: BatchFilters;
  sort: BatchSort;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStatusFilter: (status: BatchStatus | "all") => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: BatchSortField) => void;
  toggleSortOrder: () => void;
  refetch: () => void;
}

/**
 * Mock batches data for fallback
 */
const createMockBatches = (): StorageBatch[] => {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
  };

  return [
    {
      documentId: "batch_001",
      slug: "pork-shoulder-001",
      productId: "prod_001",
      productName: "Свинина (лопатка)",
      yieldProfileId: "yield_pork",
      grossIn: 25,
      unitCost: 185,
      totalCost: 4625,
      supplierId: "supplier_001",
      invoiceNumber: "INV-2024-1201",
      receivedAt: formatDate(0),
      expiryDate: formatDate(5),
      batchNumber: "B-001-1221",
      processes: [],
      netAvailable: 25,
      usedAmount: 0,
      wastedAmount: 0,
      status: "received",
    },
    {
      documentId: "batch_002",
      slug: "chicken-whole-001",
      productId: "prod_003",
      productName: "Курка (ціла)",
      yieldProfileId: "yield_chicken",
      grossIn: 30,
      unitCost: 98,
      totalCost: 2940,
      supplierId: "supplier_002",
      invoiceNumber: "INV-2024-1202",
      receivedAt: formatDate(0),
      expiryDate: formatDate(4),
      batchNumber: "B-002-1221",
      processes: [],
      netAvailable: 30,
      usedAmount: 0,
      wastedAmount: 0,
      status: "received",
    },
    {
      documentId: "batch_003",
      slug: "salmon-fillet-001",
      productId: "prod_005",
      productName: "Лосось (філе)",
      yieldProfileId: "yield_salmon",
      grossIn: 8,
      unitCost: 820,
      totalCost: 6560,
      supplierId: "supplier_003",
      invoiceNumber: "INV-2024-1203",
      receivedAt: formatDate(0),
      expiryDate: formatDate(3),
      batchNumber: "B-003-1221",
      processes: [],
      netAvailable: 8,
      usedAmount: 0,
      wastedAmount: 0,
      status: "received",
    },
    {
      documentId: "batch_006",
      slug: "beef-tenderloin-001",
      productId: "prod_002",
      productName: "Яловичина (вирізка)",
      yieldProfileId: "yield_beef",
      grossIn: 12,
      unitCost: 480,
      totalCost: 5760,
      supplierId: "supplier_001",
      invoiceNumber: "INV-2024-1195",
      receivedAt: formatDate(-1),
      expiryDate: formatDate(4),
      batchNumber: "B-006-1220",
      processes: [],
      netAvailable: 6.5,
      usedAmount: 2.14,
      wastedAmount: 3.36,
      status: "in_use",
    },
    {
      documentId: "batch_007",
      slug: "duck-whole-001",
      productId: "prod_004",
      productName: "Качка (ціла)",
      yieldProfileId: "yield_duck",
      grossIn: 8,
      unitCost: 290,
      totalCost: 2320,
      supplierId: "supplier_002",
      invoiceNumber: "INV-2024-1196",
      receivedAt: formatDate(-1),
      expiryDate: formatDate(3),
      batchNumber: "B-007-1220",
      processes: [],
      netAvailable: 8,
      usedAmount: 0,
      wastedAmount: 0,
      status: "available",
    },
  ];
};

/**
 * Unified hook for batch data management
 */
export function useBatchesData(options: UseBatchesDataOptions = {}): UseBatchesDataReturn {
  // Initialize state
  const [filters, setFilters] = React.useState<BatchFilters>({
    status: options.initialFilters?.status ?? "all",
    search: options.initialFilters?.search ?? "",
  });

  const [sort, setSort] = React.useState<BatchSort>({
    field: options.initialSort?.field ?? "received",
    order: options.initialSort?.order ?? "desc",
  });

  // GraphQL hooks
  const { batches: graphqlBatches, isLoading, error, refetch } = useStockBatches();
  const { summary: todaysGraphqlSummary } = useTodaysBatches();

  // Use GraphQL data or fallback to mock
  const allBatches = React.useMemo(() => {
    if (graphqlBatches.length > 0) {
      return graphqlBatches;
    }
    if (!isLoading && error) {
      console.warn("[useBatchesData] Using mock data due to GraphQL error:", error);
      return createMockBatches();
    }
    return graphqlBatches.length > 0 ? graphqlBatches : createMockBatches();
  }, [graphqlBatches, isLoading, error]);

  // Filter and sort batches
  const filteredBatches = React.useMemo(() => {
    let result = [...allBatches];

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((b) => b.status === filters.status);
    }

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.productName?.toLowerCase().includes(query) ||
          b.batchNumber?.toLowerCase().includes(query) ||
          b.invoiceNumber?.toLowerCase().includes(query) ||
          b.supplierName?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case "product":
          comparison = (a.productName || "").localeCompare(b.productName || "");
          break;
        case "received":
          comparison = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
          break;
        case "expiry": {
          const aExp = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const bExp = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          comparison = aExp - bExp;
          break;
        }
        case "quantity":
          comparison = a.netAvailable - b.netAvailable;
          break;
        case "cost":
          comparison = a.totalCost - b.totalCost;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sort.order === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allBatches, filters, sort]);

  // Today's summary
  const todaysSummary = React.useMemo(() => {
    if (todaysGraphqlSummary && todaysGraphqlSummary.count > 0) {
      return todaysGraphqlSummary;
    }
    // Fallback calculation
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return allBatches
      .filter((b: StorageBatch) => new Date(b.receivedAt) >= todayStart)
      .reduce(
        (acc: TodaysSummary, batch: StorageBatch) => ({
          count: acc.count + 1,
          totalCost: acc.totalCost + batch.totalCost,
          totalWeight: acc.totalWeight + batch.grossIn,
        }),
        { count: 0, totalCost: 0, totalWeight: 0 }
      );
  }, [todaysGraphqlSummary, allBatches]);

  // Status counts
  const statusCounts = React.useMemo(() => {
    const counts: StatusCounts = { all: allBatches.length };
    allBatches.forEach((b: StorageBatch) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [allBatches]);

  // Totals for filtered batches
  const totalValue = filteredBatches.reduce((sum, b) => sum + b.totalCost, 0);
  const totalWeight = filteredBatches.reduce((sum, b) => sum + b.netAvailable, 0);

  // Actions
  const setStatusFilter = React.useCallback((status: BatchStatus | "all") => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setSearchQuery = React.useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setSortField = React.useCallback((field: BatchSortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field ? (prev.order === "asc" ? "desc" : "asc") : "asc",
    }));
  }, []);

  const toggleSortOrder = React.useCallback(() => {
    setSort((prev) => ({
      ...prev,
      order: prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  return {
    batches: allBatches,
    filteredBatches,
    todaysSummary,
    statusCounts,
    totalValue,
    totalWeight,
    filters,
    sort,
    isLoading,
    error,
    setStatusFilter,
    setSearchQuery,
    setSortField,
    toggleSortOrder,
    refetch,
  };
}
