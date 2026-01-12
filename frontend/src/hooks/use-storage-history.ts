/**
 * useStorageHistory Hook
 *
 * Unified hook for storage history data management.
 * Handles filtering, grouping by date, and operation counts.
 */

import * as React from "react";
import {
  storageHistoryApi,
  type StorageHistoryEntry,
} from "@/hooks/use-inventory-deduction";
import type { StorageOperationType } from "@/lib/config/storage-config";

/**
 * Filter state for history
 */
export interface HistoryFilters {
  operationType: StorageOperationType | "all";
  search: string;
}

/**
 * Grouped entries by date
 */
export type GroupedEntries = Record<string, StorageHistoryEntry[]>;

/**
 * Operation counts
 */
export type OperationCounts = Record<string, number>;

/**
 * Hook options
 */
export interface UseStorageHistoryOptions {
  limit?: number;
  pollInterval?: number;
  initialFilter?: StorageOperationType | "all";
}

/**
 * Hook return type
 */
export interface UseStorageHistoryReturn {
  // Data
  entries: StorageHistoryEntry[];
  filteredEntries: StorageHistoryEntry[];
  groupedEntries: GroupedEntries;
  operationCounts: OperationCounts;

  // State
  filters: HistoryFilters;
  isLoading: boolean;

  // Actions
  setOperationFilter: (operationType: StorageOperationType | "all") => void;
  setSearchQuery: (query: string) => void;
  refresh: () => void;
}

/**
 * Format date for grouping (relative: Сьогодні, Вчора, or full date)
 */
function formatRelativeDay(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Сьогодні";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Вчора";
  }
  return date.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Unified hook for storage history
 */
export function useStorageHistory(
  options: UseStorageHistoryOptions = {}
): UseStorageHistoryReturn {
  const { limit = 100, pollInterval = 10000, initialFilter = "all" } = options;

  const [entries, setEntries] = React.useState<StorageHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<HistoryFilters>({
    operationType: initialFilter,
    search: "",
  });

  // Fetch entries
  const fetchEntries = React.useCallback(() => {
    try {
      const allEntries = storageHistoryApi.getEntries({ limit });
      setEntries(allEntries);
    } catch (err) {
      console.error("[useStorageHistory] Error fetching entries:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, pollInterval);
    return () => clearInterval(interval);
  }, [fetchEntries, pollInterval]);

  // Filter entries
  const filteredEntries = React.useMemo(() => {
    let result = entries;

    // Operation type filter
    if (filters.operationType !== "all") {
      result = result.filter((e) => e.operationType === filters.operationType);
    }

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.productName.toLowerCase().includes(query) ||
          e.menuItemName?.toLowerCase().includes(query) ||
          e.operatorName?.toLowerCase().includes(query) ||
          e.batchDocumentId?.toLowerCase().includes(query) ||
          e.orderDocumentId?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entries, filters]);

  // Group entries by date
  const groupedEntries = React.useMemo(() => {
    const groups: GroupedEntries = {};

    filteredEntries.forEach((entry) => {
      const dateKey = formatRelativeDay(entry.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  // Operation counts
  const operationCounts = React.useMemo(() => {
    const counts: OperationCounts = { all: entries.length };
    entries.forEach((e) => {
      counts[e.operationType] = (counts[e.operationType] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // Actions
  const setOperationFilter = React.useCallback(
    (operationType: StorageOperationType | "all") => {
      setFilters((prev) => ({ ...prev, operationType }));
    },
    []
  );

  const setSearchQuery = React.useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const refresh = React.useCallback(() => {
    setIsLoading(true);
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    filteredEntries,
    groupedEntries,
    operationCounts,
    filters,
    isLoading,
    setOperationFilter,
    setSearchQuery,
    refresh,
  };
}
