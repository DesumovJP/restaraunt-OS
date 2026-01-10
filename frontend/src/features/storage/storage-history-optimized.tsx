"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Trash2,
  RefreshCw,
  Package,
  ChevronDown,
  User,
  FileText,
  Clock,
  Hash,
} from "lucide-react";
import {
  storageHistoryApi,
  type StorageHistoryEntry,
} from "@/hooks/use-inventory-deduction";

// ==========================================
// OPERATION CONFIG
// ==========================================

const OPERATION_CONFIG: Record<
  StorageHistoryEntry["operationType"],
  {
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
    label: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  use: {
    icon: ArrowUpCircle,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-600",
    label: "Використано",
    badgeVariant: "secondary",
  },
  receive: {
    icon: ArrowDownCircle,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600",
    label: "Отримано",
    badgeVariant: "default",
  },
  adjust: {
    icon: RefreshCw,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600",
    label: "Коригування",
    badgeVariant: "outline",
  },
  write_off: {
    icon: Trash2,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-600",
    label: "Списано",
    badgeVariant: "destructive",
  },
  transfer: {
    icon: Package,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-600",
    label: "Переміщено",
    badgeVariant: "outline",
  },
};

// ==========================================
// FILTER PILLS
// ==========================================

interface OperationFilterProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
}

function OperationFilter({ value, onChange, counts }: OperationFilterProps) {
  const filters = [
    { value: "all", label: "Всі" },
    { value: "use", label: "Використано" },
    { value: "receive", label: "Отримано" },
    { value: "write_off", label: "Списано" },
    { value: "adjust", label: "Коригування" },
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
          <span
            className={cn(
              value === filter.value ? "opacity-80" : "text-muted-foreground"
            )}
          >
            {counts[filter.value] || 0}
          </span>
        </Button>
      ))}
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

// ==========================================
// ACCORDION ITEM
// ==========================================

interface HistoryAccordionItemProps {
  entry: StorageHistoryEntry;
}

function HistoryAccordionItem({ entry }: HistoryAccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = OPERATION_CONFIG[entry.operationType];
  const Icon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 p-3 text-left transition-colors",
            "hover:bg-muted/50",
            isOpen && "bg-muted/30"
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.textColor)} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {entry.productName}
              </span>
              <Badge variant={config.badgeVariant} className="h-5 text-[10px]">
                {config.label}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {entry.operationType === "use" ? "−" : "+"}
              {entry.quantity} {entry.unit}
              {entry.menuItemName && ` • ${entry.menuItemName}`}
            </div>
          </div>

          {/* Time */}
          <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {formatTime(entry.timestamp)}
          </time>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-3 pb-3 pl-14 space-y-2">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {entry.operatorName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{entry.operatorName}</span>
              </div>
            )}
            {entry.batchNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>Партія: {entry.batchNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(entry.timestamp)}</span>
            </div>
            {entry.orderId && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Замовлення #{entry.orderId}</span>
              </div>
            )}
          </div>

          {/* Before/After stock */}
          {(entry.stockBefore !== undefined || entry.stockAfter !== undefined) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Залишок:</span>
              {entry.stockBefore !== undefined && (
                <span className="tabular-nums">{entry.stockBefore}</span>
              )}
              {entry.stockBefore !== undefined && entry.stockAfter !== undefined && (
                <span className="text-muted-foreground">→</span>
              )}
              {entry.stockAfter !== undefined && (
                <span className="font-medium tabular-nums">{entry.stockAfter}</span>
              )}
              <span className="text-muted-foreground">{entry.unit}</span>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
              {entry.notes}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ==========================================
// DATE GROUP HEADER
// ==========================================

function DateHeader({ date, count }: { date: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-3 py-2 border-b border-t first:border-t-0">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{date}</span>
        <span className="text-muted-foreground">{count} операцій</span>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface StorageHistoryOptimizedProps {
  className?: string;
}

export function StorageHistoryOptimized({
  className,
}: StorageHistoryOptimizedProps) {
  const [entries, setEntries] = React.useState<StorageHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [operationFilter, setOperationFilter] = React.useState("all");

  // Fetch history entries
  React.useEffect(() => {
    const fetchEntries = () => {
      const allEntries = storageHistoryApi.getEntries({ limit: 100 });
      setEntries(allEntries);
    };

    fetchEntries();
    const interval = setInterval(fetchEntries, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter entries
  const filteredEntries = React.useMemo(() => {
    let result = entries;

    if (operationFilter !== "all") {
      result = result.filter((e) => e.operationType === operationFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.productName.toLowerCase().includes(query) ||
          e.menuItemName?.toLowerCase().includes(query) ||
          e.operatorName?.toLowerCase().includes(query) ||
          e.batchNumber?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entries, operationFilter, searchQuery]);

  // Group entries by date
  const groupedEntries = React.useMemo(() => {
    const groups: Record<string, StorageHistoryEntry[]> = {};

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
    const counts: Record<string, number> = { all: entries.length };
    entries.forEach((e) => {
      counts[e.operationType] = (counts[e.operationType] || 0) + 1;
    });
    return counts;
  }, [entries]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="space-y-3 pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук за продуктом, партією, оператором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter pills */}
        <OperationFilter
          value={operationFilter}
          onChange={setOperationFilter}
          counts={operationCounts}
        />
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto -mx-4 border rounded-lg">
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="p-4">
            <EmptyState
              type={searchQuery ? "search" : "orders"}
              title={searchQuery ? "Нічого не знайдено" : "Історія порожня"}
              description={
                searchQuery
                  ? "Спробуйте інший пошуковий запит"
                  : "Операції з товарами будуть відображатись тут"
              }
            />
          </div>
        ) : (
          <div>
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date}>
                <DateHeader date={date} count={dateEntries.length} />
                <div className="divide-y">
                  {dateEntries.map((entry) => (
                    <HistoryAccordionItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
