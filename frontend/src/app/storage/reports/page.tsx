"use client";

import * as React from "react";
import { useQuery } from "urql";
import { GET_INVENTORY_MOVEMENTS } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Trash2,
  ArrowDownToLine,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InventoryMovement {
  documentId: string;
  movementType: string;
  quantity: number;
  unit: string;
  totalCost: number;
  reasonCode?: string;
  reason?: string;
  createdAt: string;
  ingredient?: {
    name: string;
    mainCategory: string;
  };
  stockBatch?: {
    batchNumber: string;
    supplier?: {
      name: string;
    };
  };
}

type DatePreset = "today" | "week" | "month" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Сьогодні" },
  { value: "week", label: "Цей тиждень" },
  { value: "month", label: "Цей місяць" },
  { value: "custom", label: "Обрати дати" },
];

const MOVEMENT_TYPES = [
  { value: "all", label: "Всі операції" },
  { value: "receive", label: "Поставки", icon: ArrowDownToLine, color: "text-success" },
  { value: "write_off", label: "Списання", icon: Trash2, color: "text-destructive" },
  { value: "recipe_use", label: "Використання", icon: Package, color: "text-info" },
];

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: now };
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      return { from: weekStart, to: now };
    }
    case "month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    default:
      return { from: today, to: now };
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function StorageReportsPage() {
  const [datePreset, setDatePreset] = React.useState<DatePreset>("week");
  const [customFromDate, setCustomFromDate] = React.useState("");
  const [customToDate, setCustomToDate] = React.useState("");
  const [movementTypeFilter, setMovementTypeFilter] = React.useState("all");

  // Calculate date range
  const dateRange = React.useMemo(() => {
    if (datePreset === "custom" && customFromDate && customToDate) {
      return {
        from: new Date(customFromDate),
        to: new Date(customToDate + "T23:59:59"),
      };
    }
    return getDateRange(datePreset);
  }, [datePreset, customFromDate, customToDate]);

  // Fetch movements
  const [result] = useQuery({
    query: GET_INVENTORY_MOVEMENTS,
    variables: {
      limit: 500,
      offset: 0,
    },
  });

  const { data, fetching, error } = result;
  const allMovements: InventoryMovement[] = data?.inventoryMovements || [];

  // Filter movements
  const filteredMovements = React.useMemo(() => {
    return allMovements.filter((m) => {
      const date = new Date(m.createdAt);
      const inDateRange = date >= dateRange.from && date <= dateRange.to;
      const matchesType =
        movementTypeFilter === "all" || m.movementType === movementTypeFilter;
      return inDateRange && matchesType;
    });
  }, [allMovements, dateRange, movementTypeFilter]);

  // Calculate summary stats
  const summary = React.useMemo(() => {
    const stats = {
      totalPurchases: 0,
      totalWriteOffs: 0,
      totalUsage: 0,
      netChange: 0,
      purchaseCount: 0,
      writeOffCount: 0,
      usageCount: 0,
    };

    for (const m of filteredMovements) {
      const cost = m.totalCost || 0;
      switch (m.movementType) {
        case "receive":
          stats.totalPurchases += cost;
          stats.purchaseCount++;
          break;
        case "write_off":
          stats.totalWriteOffs += cost;
          stats.writeOffCount++;
          break;
        case "recipe_use":
          stats.totalUsage += cost;
          stats.usageCount++;
          break;
      }
    }

    stats.netChange = stats.totalPurchases - stats.totalWriteOffs - stats.totalUsage;

    return stats;
  }, [filteredMovements]);

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ["Дата", "Тип", "Продукт", "Кількість", "Одиниця", "Вартість", "Причина", "Постачальник"].join(","),
      ...filteredMovements.map((m) =>
        [
          new Date(m.createdAt).toLocaleDateString("uk-UA"),
          m.movementType,
          m.ingredient?.name || "",
          m.quantity,
          m.unit,
          m.totalCost || 0,
          m.reason || "",
          m.stockBatch?.supplier?.name || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `звіт-витрати_${new Date().toLocaleDateString("uk-UA").replace(/\./g, "-")}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/storage">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Звіти витрат</h1>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Date Preset */}
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          {datePreset === "custom" && (
            <>
              <Input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="w-[140px]"
              />
              <Input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="w-[140px]"
              />
            </>
          )}

          {/* Movement Type Filter */}
          <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Поставки"
            value={formatCurrency(summary.totalPurchases)}
            count={summary.purchaseCount}
            icon={ArrowDownToLine}
            color="success"
          />
          <SummaryCard
            title="Списання"
            value={formatCurrency(summary.totalWriteOffs)}
            count={summary.writeOffCount}
            icon={Trash2}
            color="destructive"
          />
          <SummaryCard
            title="Використання"
            value={formatCurrency(summary.totalUsage)}
            count={summary.usageCount}
            icon={Package}
            color="info"
          />
          <SummaryCard
            title="Баланс"
            value={formatCurrency(summary.netChange)}
            trend={summary.netChange >= 0 ? "up" : "down"}
            icon={summary.netChange >= 0 ? TrendingUp : TrendingDown}
            color={summary.netChange >= 0 ? "success" : "warning"}
          />
        </div>

        {/* Movements Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold">Операції</h2>
            <Badge variant="outline">{filteredMovements.length}</Badge>
          </div>

          {fetching ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Помилка завантаження даних
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Немає операцій за обраний період</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMovements.slice(0, 50).map((movement) => (
                <MovementRow key={movement.documentId} movement={movement} />
              ))}
              {filteredMovements.length > 50 && (
                <div className="p-4 text-center text-muted-foreground">
                  Показано 50 з {filteredMovements.length} операцій
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  count?: number;
  trend?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  color: "success" | "destructive" | "info" | "warning";
}

function SummaryCard({ title, value, count, trend, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    success: "border-l-success text-success",
    destructive: "border-l-destructive text-destructive",
    info: "border-l-info text-info",
    warning: "border-l-warning text-warning",
  };

  return (
    <div className={cn("p-4 bg-card rounded-lg border border-l-4", colorClasses[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="text-xl font-bold">{value} грн</p>
      {count !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">{count} операцій</p>
      )}
    </div>
  );
}

interface MovementRowProps {
  movement: InventoryMovement;
}

function MovementRow({ movement }: MovementRowProps) {
  const typeConfig = MOVEMENT_TYPES.find((t) => t.value === movement.movementType);
  const Icon = typeConfig?.icon || Package;
  const colorClass = typeConfig?.color || "text-muted-foreground";

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className={cn("p-2 rounded-lg bg-muted", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{movement.ingredient?.name || "—"}</p>
        <p className="text-sm text-muted-foreground">
          {movement.quantity} {movement.unit}
          {movement.reason && ` • ${movement.reason}`}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("font-medium", colorClass)}>
          {movement.movementType === "receive" ? "+" : "-"}
          {formatCurrency(movement.totalCost || 0)} грн
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(movement.createdAt).toLocaleDateString("uk-UA")}
        </p>
      </div>
    </div>
  );
}
