"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Calendar,
  Package,
  ChefHat,
  UtensilsCrossed,
  Trash2,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  storageHistoryApi,
  type StorageHistoryEntry,
} from "@/hooks/use-inventory-deduction";

interface StorageHistoryListProps {
  className?: string;
}

const OPERATION_TYPE_CONFIG: Record<
  StorageHistoryEntry["operationType"],
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  use: {
    label: "Використано",
    icon: ArrowUpCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  receive: {
    label: "Отримано",
    icon: ArrowDownCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  adjust: {
    label: "Коригування",
    icon: RefreshCw,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  write_off: {
    label: "Списано",
    icon: Trash2,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  transfer: {
    label: "Переміщено",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

const OPERATOR_ROLE_LABELS: Record<string, string> = {
  chef: "Кухар",
  waiter: "Офіціант",
  manager: "Менеджер",
  system: "Система",
};

function formatDateTime(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
    }),
    time: date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function StorageHistoryList({ className }: StorageHistoryListProps) {
  const [entries, setEntries] = React.useState<StorageHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [operationFilter, setOperationFilter] = React.useState<string>("all");

  // Fetch history entries
  React.useEffect(() => {
    const fetchEntries = () => {
      const allEntries = storageHistoryApi.getEntries({ limit: 100 });
      setEntries(allEntries);
    };

    fetchEntries();

    // Refresh every 10 seconds
    const interval = setInterval(fetchEntries, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter entries
  const filteredEntries = React.useMemo(() => {
    let result = entries;

    // Operation type filter
    if (operationFilter !== "all") {
      result = result.filter((e) => e.operationType === operationFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.productName.toLowerCase().includes(query) ||
          e.menuItemName?.toLowerCase().includes(query) ||
          e.orderDocumentId?.toLowerCase().includes(query) ||
          e.operatorName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entries, operationFilter, searchQuery]);

  // Group entries by date
  const groupedEntries = React.useMemo(() => {
    const groups: Record<string, StorageHistoryEntry[]> = {};

    filteredEntries.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString("uk-UA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const operationCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    entries.forEach((e) => {
      counts[e.operationType] = (counts[e.operationType] || 0) + 1;
    });
    return counts;
  }, [entries]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук за продуктом, стравою, замовленням..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: "Всі" },
          { value: "use", label: "Використано" },
          { value: "receive", label: "Отримано" },
          { value: "write_off", label: "Списано" },
          { value: "adjust", label: "Коригування" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setOperationFilter(option.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              operationFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {option.label}
            <span
              className={cn(
                "text-xs px-1.5 rounded-full",
                operationFilter === option.value ? "bg-white/20" : "bg-background"
              )}
            >
              {operationCounts[option.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedEntries).length === 0 ? (
          <EmptyState
            type={searchQuery ? "search" : "orders"}
            title={searchQuery ? "Нічого не знайдено" : "Історія порожня"}
            description={
              searchQuery
                ? "Спробуйте інший пошуковий запит"
                : "Тут будуть відображатись всі операції з інвентарем"
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {date}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {dateEntries.length}
                  </Badge>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {dateEntries.map((entry) => {
                    const config = OPERATION_TYPE_CONFIG[entry.operationType];
                    const Icon = config.icon;
                    const { time } = formatDateTime(entry.timestamp);

                    return (
                      <Card
                        key={entry.id}
                        className={cn("p-3 transition-all hover:shadow-sm", config.bgColor)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                              config.bgColor
                            )}
                          >
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">
                                {entry.productName}
                              </span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {entry.quantity} {entry.unit}
                              </Badge>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                              {entry.menuItemName && (
                                <span className="flex items-center gap-1">
                                  <UtensilsCrossed className="h-3 w-3" />
                                  {entry.menuItemName}
                                </span>
                              )}
                              {entry.operatorName && (
                                <span className="flex items-center gap-1">
                                  <ChefHat className="h-3 w-3" />
                                  {entry.operatorName}
                                  {entry.operatorRole && (
                                    <span className="text-muted-foreground/70">
                                      ({OPERATOR_ROLE_LABELS[entry.operatorRole] || entry.operatorRole})
                                    </span>
                                  )}
                                </span>
                              )}
                              {entry.orderDocumentId && (
                                <span className="font-mono text-[10px]">
                                  #{entry.orderDocumentId.slice(-8)}
                                </span>
                              )}
                            </div>

                            {/* Yield info */}
                            {entry.yieldApplied && entry.yieldApplied !== 1 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Вихід: {(entry.yieldApplied * 100).toFixed(0)}% (
                                {entry.netRequired?.toFixed(2)} → {entry.grossRequired?.toFixed(2)})
                              </div>
                            )}

                            {/* Notes */}
                            {entry.notes && (
                              <div className="mt-1 text-xs text-muted-foreground italic">
                                {entry.notes}
                              </div>
                            )}
                          </div>

                          {/* Time */}
                          <div className="shrink-0 text-right">
                            <Badge variant="secondary" className={cn("text-xs", config.color)}>
                              {config.label}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">{time}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
