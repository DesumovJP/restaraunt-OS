"use client";

import * as React from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FileDown,
  Truck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { StorageBatch, BatchStatus } from "@/types/extended";
import { useStockBatches, useTodaysBatches } from "@/hooks/use-graphql-stock";
// Fallback to mock data if GraphQL fails
import { MOCK_BATCHES } from "./batches-list";

// ==========================================
// BATCH STATUS CONFIG
// ==========================================

const BATCH_STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  received: { label: "Отримано", variant: "default" },
  processed: { label: "Оброблено", variant: "secondary" },
  in_use: { label: "В роботі", variant: "default" },
  processing: { label: "Обробляється", variant: "outline" },
  available: { label: "Доступно", variant: "default" },
  depleted: { label: "Вичерпано", variant: "secondary" },
  expired: { label: "Прострочено", variant: "destructive" },
  written_off: { label: "Списано", variant: "destructive" },
};

// ==========================================
// SUMMARY STRIP
// ==========================================

interface BatchSummaryStripProps {
  count: number;
  totalWeight: number;
  totalCost: number;
  onExport: () => void;
}

function BatchSummaryStrip({
  count,
  totalWeight,
  totalCost,
  onExport,
}: BatchSummaryStripProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Сьогодні:</span>
      </div>

      <div className="flex items-center gap-4 text-sm flex-1">
        <span>
          <strong>{count}</strong> партій
        </span>
        <span className="text-muted-foreground">•</span>
        <span>
          <strong>{totalWeight.toFixed(1)}</strong> кг
        </span>
        <span className="text-muted-foreground">•</span>
        <span>
          <strong>{totalCost.toLocaleString()}</strong> ₴
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
        <FileDown className="h-4 w-4" />
        <span className="hidden sm:inline">Експорт</span>
      </Button>
    </div>
  );
}

// ==========================================
// STATUS FILTER PILLS
// ==========================================

interface StatusFilterProps {
  value: BatchStatus | "all";
  onChange: (status: BatchStatus | "all") => void;
  counts: Record<string, number>;
}

function StatusFilter({ value, onChange, counts }: StatusFilterProps) {
  const filters: Array<{ value: BatchStatus | "all"; label: string }> = [
    { value: "all", label: "Всі" },
    { value: "received", label: "Отримано" },
    { value: "in_use", label: "В роботі" },
    { value: "available", label: "Доступно" },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? "default" : "outline"}
          size="sm"
          className="shrink-0 h-7 text-xs gap-1.5"
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
          {counts[filter.value] !== undefined && (
            <span
              className={cn(
                value === filter.value ? "opacity-80" : "text-muted-foreground"
              )}
            >
              {filter.value === "all" ? counts.all : counts[filter.value] || 0}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}

// ==========================================
// SORT HEADER
// ==========================================

type SortField = "product" | "received" | "expiry" | "quantity" | "cost" | "status";

interface SortHeaderProps {
  field: SortField;
  currentField: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

function SortHeader({
  field,
  currentField,
  order,
  onSort,
  children,
  align = "left",
}: SortHeaderProps) {
  const isActive = field === currentField;

  return (
    <button
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        "hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        align === "right" && "justify-end w-full"
      )}
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        order === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

// ==========================================
// FRESHNESS CELL
// ==========================================

function BatchFreshnessCell({ batch }: { batch: StorageBatch }) {
  if (!batch.expiryDate) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry <= 0) {
    return (
      <span className="text-xs font-medium text-red-600 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Прострочено
      </span>
    );
  }

  const getColor = () => {
    if (daysUntilExpiry <= 2) return "text-red-600";
    if (daysUntilExpiry <= 5) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <span className={cn("text-xs font-medium tabular-nums", getColor())}>
      {daysUntilExpiry} дн.
    </span>
  );
}

// ==========================================
// TABLE ROW
// ==========================================

interface BatchTableRowProps {
  batch: StorageBatch;
  onSelect?: (batch: StorageBatch) => void;
  selected?: boolean;
}

function BatchTableRow({ batch, onSelect, selected }: BatchTableRowProps) {
  const statusConfig = BATCH_STATUS_CONFIG[batch.status];
  const isToday =
    new Date(batch.receivedAt).toDateString() === new Date().toDateString();
  const usagePercent =
    batch.grossIn > 0
      ? Math.round(((batch.usedAmount + batch.wastedAmount) / batch.grossIn) * 100)
      : 0;

  return (
    <tr
      className={cn(
        "border-b cursor-pointer transition-colors",
        "hover:bg-muted/50",
        selected && "bg-primary/5",
        isToday && "bg-green-50/50 dark:bg-green-950/20"
      )}
      onClick={() => onSelect?.(batch)}
    >
      {/* Checkbox */}
      <td className="py-2.5 px-3 w-10">
        <Checkbox
          checked={selected}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          aria-label={`Вибрати ${batch.productName}`}
        />
      </td>

      {/* Product + Batch */}
      <td className="py-2.5 px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate max-w-[180px]">
              {batch.productName}
            </span>
            {isToday && (
              <Badge variant="outline" className="h-5 text-[10px] shrink-0">
                Сьогодні
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {batch.batchNumber} • {batch.invoiceNumber}
          </div>
        </div>
      </td>

      {/* Supplier */}
      <td className="py-2.5 px-3 hidden lg:table-cell">
        <span className="text-sm text-muted-foreground truncate block max-w-[120px]">
          {batch.supplierName || "—"}
        </span>
      </td>

      {/* Received date */}
      <td className="py-2.5 px-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {new Date(batch.receivedAt).toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </td>

      {/* Expiry / Freshness */}
      <td className="py-2.5 px-3 hidden sm:table-cell">
        <BatchFreshnessCell batch={batch} />
      </td>

      {/* Quantity with usage bar */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                usagePercent >= 80 && "bg-red-500",
                usagePercent >= 50 && usagePercent < 80 && "bg-amber-500",
                usagePercent < 50 && "bg-green-500"
              )}
              style={{ width: `${100 - usagePercent}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums min-w-[60px]">
            {batch.netAvailable.toFixed(1)} кг
          </span>
        </div>
      </td>

      {/* Cost */}
      <td className="py-2.5 px-3 text-right hidden xl:table-cell">
        <span className="text-sm tabular-nums">
          {batch.totalCost.toLocaleString()} ₴
        </span>
      </td>

      {/* Status */}
      <td className="py-2.5 px-3">
        <Badge variant={statusConfig.variant} className="text-xs">
          {statusConfig.label}
        </Badge>
      </td>
    </tr>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface BatchesListOptimizedProps {
  onCloseShift: () => void;
  className?: string;
}

export function BatchesListOptimized({
  onCloseShift,
  className,
}: BatchesListOptimizedProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<BatchStatus | "all">("all");
  const [sortField, setSortField] = React.useState<SortField>("received");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Fetch batches from GraphQL
  const { batches: graphqlBatches, isLoading, error, refetch } = useStockBatches();
  const { summary: todaysSummary, batches: todaysBatches } = useTodaysBatches();

  // Use GraphQL data or fallback to mock if empty/error
  const allBatches = React.useMemo(() => {
    if (graphqlBatches.length > 0) {
      return graphqlBatches;
    }
    // Fallback to mock data if no GraphQL data
    if (!isLoading && error) {
      console.warn("[BatchesList] Using mock data due to GraphQL error:", error);
      return MOCK_BATCHES;
    }
    return graphqlBatches;
  }, [graphqlBatches, isLoading, error]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort batches
  const filteredBatches = React.useMemo(() => {
    let result = [...allBatches];

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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
      switch (sortField) {
        case "product":
          comparison = (a.productName || "").localeCompare(b.productName || "");
          break;
        case "received":
          comparison = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
          break;
        case "expiry":
          const aExp = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const bExp = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          comparison = aExp - bExp;
          break;
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
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allBatches, statusFilter, searchQuery, sortField, sortOrder]);

  // Calculate totals from todaysSummary or fallback
  const todaysTotals = React.useMemo(() => {
    if (todaysSummary.count > 0) {
      return todaysSummary;
    }
    // Fallback calculation from allBatches
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return allBatches
      .filter((b) => new Date(b.receivedAt) >= todayStart)
      .reduce(
        (acc, batch) => ({
          count: acc.count + 1,
          totalCost: acc.totalCost + batch.totalCost,
          totalWeight: acc.totalWeight + batch.grossIn,
        }),
        { count: 0, totalCost: 0, totalWeight: 0 }
      );
  }, [todaysSummary, allBatches]);

  // Status counts
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: allBatches.length };
    allBatches.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [allBatches]);

  // Total value of filtered batches
  const totalValue = filteredBatches.reduce((sum, b) => sum + b.totalCost, 0);
  const totalWeight = filteredBatches.reduce((sum, b) => sum + b.netAvailable, 0);

  // Loading skeleton
  if (isLoading && allBatches.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span>Помилка завантаження з сервера. Показані тестові дані.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Повторити
          </Button>
        </div>
      )}

      {/* Summary strip */}
      {todaysTotals.count > 0 && (
        <BatchSummaryStrip
          count={todaysTotals.count}
          totalWeight={todaysTotals.totalWeight}
          totalCost={todaysTotals.totalCost}
          onExport={onCloseShift}
        />
      )}

      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук партій..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shrink-0"
            title="Оновити"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Batches table */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          type="inventory"
          title="Немає партій"
          description="Партії з'являться після отримання поставок"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="py-2.5 px-3 w-10">
                    <Checkbox aria-label="Вибрати всі" />
                  </th>
                  <th className="py-2.5 px-3 text-left">
                    <SortHeader
                      field="product"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                    >
                      Продукт / Партія
                    </SortHeader>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden lg:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Постачальник
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden md:table-cell">
                    <SortHeader
                      field="received"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                    >
                      Отримано
                    </SortHeader>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden sm:table-cell">
                    <SortHeader
                      field="expiry"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                    >
                      Свіжість
                    </SortHeader>
                  </th>
                  <th className="py-2.5 px-3 text-left">
                    <SortHeader
                      field="quantity"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                    >
                      Залишок
                    </SortHeader>
                  </th>
                  <th className="py-2.5 px-3 text-right hidden xl:table-cell">
                    <SortHeader
                      field="cost"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                      align="right"
                    >
                      Вартість
                    </SortHeader>
                  </th>
                  <th className="py-2.5 px-3 text-left">
                    <SortHeader
                      field="status"
                      currentField={sortField}
                      order={sortOrder}
                      onSort={handleSort}
                    >
                      Статус
                    </SortHeader>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <BatchTableRow key={batch.documentId} batch={batch} />
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3">
                    <span className="text-sm font-medium">
                      Всього: {filteredBatches.length} партій • {totalWeight.toFixed(1)} кг
                    </span>
                  </td>
                  <td className="py-2.5 px-3 hidden xl:table-cell" />
                  <td className="py-2.5 px-3 text-right hidden xl:table-cell">
                    <span className="text-sm font-semibold tabular-nums">
                      {totalValue.toLocaleString()} ₴
                    </span>
                  </td>
                  <td className="py-2.5 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
