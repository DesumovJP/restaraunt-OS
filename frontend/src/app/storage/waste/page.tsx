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
  TrendingDown,
  Trash2,
  AlertTriangle,
  Clock,
  ThermometerSnowflake,
  Bug,
  Package,
  CircleDollarSign,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// ==========================================
// TYPES
// ==========================================

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
    documentId: string;
    name: string;
    nameUk?: string;
    mainCategory: string;
  };
  stockBatch?: {
    batchNumber: string;
    supplier?: {
      name: string;
    };
  };
}

type DatePreset = "today" | "week" | "month" | "quarter" | "custom";

// ==========================================
// CONSTANTS
// ==========================================

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Сьогодні" },
  { value: "week", label: "Цей тиждень" },
  { value: "month", label: "Цей місяць" },
  { value: "quarter", label: "Квартал" },
  { value: "custom", label: "Обрати дати" },
];

const WRITE_OFF_REASONS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  expired: { label: "Прострочено", icon: Clock, color: "#ef4444" },
  spoiled: { label: "Зіпсовано", icon: ThermometerSnowflake, color: "#f97316" },
  damaged: { label: "Пошкоджено", icon: AlertTriangle, color: "#eab308" },
  theft: { label: "Крадіжка", icon: Bug, color: "#8b5cf6" },
  cooking_loss: { label: "Втрати при готуванні", icon: Package, color: "#3b82f6" },
  quality_fail: { label: "Невідповідна якість", icon: Trash2, color: "#ec4899" },
  inventory_adjust: { label: "Інвентаризація", icon: BarChart3, color: "#6b7280" },
  other: { label: "Інше", icon: Trash2, color: "#9ca3af" },
};

const CATEGORY_COLORS: Record<string, string> = {
  raw: "#ef4444",
  prep: "#f97316",
  "dry-goods": "#eab308",
  seasonings: "#84cc16",
  "oils-fats": "#22c55e",
  dairy: "#14b8a6",
  beverages: "#06b6d4",
  frozen: "#3b82f6",
  "ready-made": "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  raw: "Сировина",
  prep: "Заготовки",
  "dry-goods": "Бакалія",
  seasonings: "Приправи",
  "oils-fats": "Олії та жири",
  dairy: "Молочні",
  beverages: "Напої",
  frozen: "Заморожені",
  "ready-made": "Готові",
};

// ==========================================
// HELPERS
// ==========================================

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: now };
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      return { from: weekStart, to: now };
    }
    case "month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    case "quarter": {
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      return { from: quarterStart, to: now };
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

function formatPercent(value: number): string {
  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function WasteAnalyticsPage() {
  const [datePreset, setDatePreset] = React.useState<DatePreset>("month");
  const [customFromDate, setCustomFromDate] = React.useState("");
  const [customToDate, setCustomToDate] = React.useState("");

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
      limit: 1000,
      offset: 0,
    },
  });

  const { data, fetching, error } = result;
  const allMovements: InventoryMovement[] = data?.inventoryMovements || [];

  // Filter only write-offs
  const writeOffs = React.useMemo(() => {
    return allMovements.filter((m) => {
      const date = new Date(m.createdAt);
      const inDateRange = date >= dateRange.from && date <= dateRange.to;
      return inDateRange && m.movementType === "write_off";
    });
  }, [allMovements, dateRange]);

  // Analytics calculations
  const analytics = React.useMemo(() => {
    // Total waste cost
    const totalWasteCost = writeOffs.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const totalWasteQuantity = writeOffs.reduce((sum, m) => sum + (m.quantity || 0), 0);

    // By reason
    const byReason: Record<string, { count: number; cost: number; quantity: number }> = {};
    for (const m of writeOffs) {
      const reason = m.reasonCode || "other";
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, cost: 0, quantity: 0 };
      }
      byReason[reason].count++;
      byReason[reason].cost += m.totalCost || 0;
      byReason[reason].quantity += m.quantity || 0;
    }

    // By category
    const byCategory: Record<string, { count: number; cost: number; quantity: number }> = {};
    for (const m of writeOffs) {
      const category = m.ingredient?.mainCategory || "other";
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, cost: 0, quantity: 0 };
      }
      byCategory[category].count++;
      byCategory[category].cost += m.totalCost || 0;
      byCategory[category].quantity += m.quantity || 0;
    }

    // By ingredient (top 10)
    const byIngredient: Record<string, { name: string; count: number; cost: number; quantity: number; unit: string }> = {};
    for (const m of writeOffs) {
      const ingredientId = m.ingredient?.documentId || "unknown";
      if (!byIngredient[ingredientId]) {
        byIngredient[ingredientId] = {
          name: m.ingredient?.nameUk || m.ingredient?.name || "Невідомо",
          count: 0,
          cost: 0,
          quantity: 0,
          unit: m.unit || "kg",
        };
      }
      byIngredient[ingredientId].count++;
      byIngredient[ingredientId].cost += m.totalCost || 0;
      byIngredient[ingredientId].quantity += m.quantity || 0;
    }

    // Daily trend
    const dailyTrend: Record<string, { date: string; cost: number; count: number }> = {};
    for (const m of writeOffs) {
      const date = new Date(m.createdAt).toISOString().split("T")[0];
      if (!dailyTrend[date]) {
        dailyTrend[date] = { date, cost: 0, count: 0 };
      }
      dailyTrend[date].cost += m.totalCost || 0;
      dailyTrend[date].count++;
    }

    // Format for charts
    const reasonChartData = Object.entries(byReason)
      .map(([reason, data]) => ({
        name: WRITE_OFF_REASONS[reason]?.label || reason,
        value: data.cost,
        count: data.count,
        color: WRITE_OFF_REASONS[reason]?.color || "#9ca3af",
      }))
      .sort((a, b) => b.value - a.value);

    const categoryChartData = Object.entries(byCategory)
      .map(([category, data]) => ({
        name: CATEGORY_LABELS[category] || category,
        value: data.cost,
        count: data.count,
        color: CATEGORY_COLORS[category] || "#9ca3af",
      }))
      .sort((a, b) => b.value - a.value);

    const topIngredients = Object.values(byIngredient)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const trendData = Object.values(dailyTrend)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        dateLabel: new Date(d.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }),
      }));

    // Calculate averages
    const dayCount = Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyCost = totalWasteCost / dayCount;
    const avgDailyCount = writeOffs.length / dayCount;

    return {
      totalWasteCost,
      totalWasteQuantity,
      totalCount: writeOffs.length,
      avgDailyCost,
      avgDailyCount,
      reasonChartData,
      categoryChartData,
      topIngredients,
      trendData,
      byReason,
    };
  }, [writeOffs, dateRange]);

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ["Дата", "Продукт", "Кількість", "Одиниця", "Вартість", "Причина", "Категорія"].join(","),
      ...writeOffs.map((m) =>
        [
          new Date(m.createdAt).toLocaleDateString("uk-UA"),
          m.ingredient?.nameUk || m.ingredient?.name || "",
          m.quantity,
          m.unit,
          m.totalCost || 0,
          WRITE_OFF_REASONS[m.reasonCode || "other"]?.label || m.reason || "",
          CATEGORY_LABELS[m.ingredient?.mainCategory || ""] || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `аналітика-втрат_${new Date().toLocaleDateString("uk-UA").replace(/\./g, "-")}.csv`;
    link.click();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive">Помилка завантаження даних</p>
      </div>
    );
  }

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
            <div>
              <h1 className="text-xl font-bold">Аналітика втрат</h1>
              <p className="text-sm text-muted-foreground">Списання та втрати продуктів</p>
            </div>
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
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {fetching ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Загальні втрати"
                value={formatCurrency(analytics.totalWasteCost)}
                suffix=" грн"
                icon={CircleDollarSign}
                color="destructive"
              />
              <SummaryCard
                title="Кількість списань"
                value={analytics.totalCount.toString()}
                subtitle="операцій"
                icon={Trash2}
                color="warning"
              />
              <SummaryCard
                title="Середнє/день"
                value={formatCurrency(analytics.avgDailyCost)}
                suffix=" грн"
                icon={TrendingDown}
                color="info"
              />
              <SummaryCard
                title="Списань/день"
                value={analytics.avgDailyCount.toFixed(1)}
                subtitle="в середньому"
                icon={BarChart3}
                color="muted"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waste by Reason */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">За причиною списання</h2>
                </div>
                {analytics.reasonChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.reasonChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analytics.reasonChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${formatCurrency(value as number)} грн`, "Сума"]}
                          labelFormatter={(label) => String(label)}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          formatter={(value, entry) => (
                            <span className="text-sm">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="Немає даних за обраний період" />
                )}
              </div>

              {/* Waste by Category */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">За категорією</h2>
                </div>
                {analytics.categoryChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analytics.categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${formatCurrency(value as number)} грн`, "Сума"]}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="Немає даних за обраний період" />
                )}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Динаміка втрат</h2>
              </div>
              {analytics.trendData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.trendData}>
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} грн`} />
                      <Tooltip
                        formatter={(value, name) => {
                          const numValue = value as number;
                          if (name === "cost") return [`${formatCurrency(numValue)} грн`, "Сума"];
                          return [numValue, "Операцій"];
                        }}
                        labelFormatter={(label) => `Дата: ${String(label)}`}
                      />
                      <Bar dataKey="cost" fill="#ef4444" name="cost" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Немає даних за обраний період" />
              )}
            </div>

            {/* Top Wasted Ingredients */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <h2 className="font-semibold">Топ-10 втрачених продуктів</h2>
                </div>
                <Badge variant="outline">{analytics.topIngredients.length}</Badge>
              </div>
              {analytics.topIngredients.length > 0 ? (
                <div className="divide-y">
                  {analytics.topIngredients.map((item, index) => (
                    <TopIngredientRow key={index} item={item} index={index} totalCost={analytics.totalWasteCost} />
                  ))}
                </div>
              ) : (
                <EmptyState message="Немає списань за обраний період" />
              )}
            </div>

            {/* Reason Breakdown Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3">
                <h2 className="font-semibold">Детальна розбивка за причинами</h2>
              </div>
              <div className="divide-y">
                {Object.entries(analytics.byReason)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([reason, data]) => {
                    const config = WRITE_OFF_REASONS[reason] || WRITE_OFF_REASONS.other;
                    const Icon = config.icon;
                    const percent = analytics.totalWasteCost > 0
                      ? (data.cost / analytics.totalWasteCost) * 100
                      : 0;

                    return (
                      <div key={reason} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <span style={{ color: config.color }}>
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} списань
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive">
                            {formatCurrency(data.cost)} грн
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPercent(percent)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface SummaryCardProps {
  title: string;
  value: string;
  suffix?: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "success" | "destructive" | "info" | "warning" | "muted";
}

function SummaryCard({ title, value, suffix, subtitle, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    success: "border-l-success text-success",
    destructive: "border-l-destructive text-destructive",
    info: "border-l-info text-info",
    warning: "border-l-warning text-warning",
    muted: "border-l-muted-foreground text-muted-foreground",
  };

  return (
    <div className={cn("p-4 bg-card rounded-lg border border-l-4", colorClasses[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="text-xl font-bold">
        {value}
        {suffix && <span className="text-base font-normal">{suffix}</span>}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

interface TopIngredientRowProps {
  item: {
    name: string;
    count: number;
    cost: number;
    quantity: number;
    unit: string;
  };
  index: number;
  totalCost: number;
}

function TopIngredientRow({ item, index, totalCost }: TopIngredientRowProps) {
  const percent = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
        index < 3 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      )}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.quantity.toFixed(2)} {item.unit} • {item.count} списань
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium text-destructive">{formatCurrency(item.cost)} грн</p>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {formatPercent(percent)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </div>
      <Skeleton className="h-[360px]" />
      <Skeleton className="h-96" />
    </div>
  );
}
