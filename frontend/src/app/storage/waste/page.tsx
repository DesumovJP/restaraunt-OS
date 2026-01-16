"use client";

import * as React from "react";
import { useQuery } from "urql";
import { GET_INVENTORY_MOVEMENTS } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
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
  Menu,
  RefreshCw,
  Info,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageLeftSidebar } from "@/features/storage/storage-left-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
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

const DATE_PRESETS: { value: DatePreset; label: string; description: string }[] = [
  { value: "today", label: "Сьогодні", description: "Списання за сьогодні" },
  { value: "week", label: "Тиждень", description: "З понеділка по сьогодні" },
  { value: "month", label: "Місяць", description: "З 1-го числа по сьогодні" },
  { value: "quarter", label: "Квартал", description: "Останні 3 місяці" },
  { value: "custom", label: "Обрати", description: "Вибрати діапазон" },
];

const WRITE_OFF_REASONS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  expired: { label: "Прострочено", icon: Clock, color: "#ef4444", description: "Товар вийшов з терміну придатності" },
  spoiled: { label: "Зіпсовано", icon: ThermometerSnowflake, color: "#f97316", description: "Порушення умов зберігання" },
  damaged: { label: "Пошкоджено", icon: AlertTriangle, color: "#eab308", description: "Механічні пошкодження упаковки" },
  theft: { label: "Крадіжка", icon: Bug, color: "#8b5cf6", description: "Нестача при інвентаризації" },
  cooking_loss: { label: "Втрати готування", icon: Package, color: "#3b82f6", description: "Природні втрати при приготуванні" },
  quality_fail: { label: "Брак якості", icon: Trash2, color: "#ec4899", description: "Не відповідає стандартам якості" },
  inventory_adjust: { label: "Інвентаризація", icon: BarChart3, color: "#6b7280", description: "Коригування після перерахунку" },
  other: { label: "Інше", icon: Trash2, color: "#9ca3af", description: "Інші причини списання" },
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
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

  const [result, refetch] = useQuery({
    query: GET_INVENTORY_MOVEMENTS,
    variables: {
      limit: 1000,
      offset: 0,
    },
  });

  const { data, fetching, error } = result;
  const allMovements: InventoryMovement[] = data?.inventoryMovements || [];

  const writeOffs = React.useMemo(() => {
    return allMovements.filter((m) => {
      const date = new Date(m.createdAt);
      const inDateRange = date >= dateRange.from && date <= dateRange.to;
      return inDateRange && m.movementType === "write_off";
    });
  }, [allMovements, dateRange]);

  const analytics = React.useMemo(() => {
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
      <div className="flex h-screen-safe bg-background overflow-hidden">
        <StorageLeftSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          activeView="waste"
          onViewChange={() => {}}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-red-600 font-semibold text-lg">Помилка завантаження</p>
          <p className="text-muted-foreground mt-1">Спробуйте оновити сторінку</p>
          <Button onClick={() => refetch({ requestPolicy: "network-only" })} className="mt-4">
            Спробувати знову
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen-safe bg-background overflow-hidden">
      {/* Sidebar */}
      <StorageLeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeView="waste"
        onViewChange={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Аналітика втрат
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Моніторинг та аналіз списань
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch({ requestPolicy: "network-only" })}
                className="h-10 w-10 rounded-xl"
                disabled={fetching}
              >
                <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2 h-10 rounded-xl">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Експорт</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="p-3 sm:p-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Період аналізу</label>
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                <SelectTrigger className="w-[130px] h-10 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div>
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {datePreset === "custom" && (
              <div className="flex gap-2 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Від</label>
                  <Input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="w-[130px] h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">До</label>
                  <Input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="w-[130px] h-10 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex-1" />
            <div className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-lg border">
              {dateRange.from.toLocaleDateString("uk-UA")} — {dateRange.to.toLocaleDateString("uk-UA")}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {fetching ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <TooltipProvider>
                  <SummaryCard
                    title="Загальні втрати"
                    value={formatCurrency(analytics.totalWasteCost)}
                    suffix=" грн"
                    icon={CircleDollarSign}
                    color="red"
                    tooltip="Сумарна вартість всіх списаних товарів за період"
                  />
                  <SummaryCard
                    title="Списань"
                    value={analytics.totalCount.toString()}
                    subtitle="операцій"
                    icon={Trash2}
                    color="amber"
                    tooltip="Кількість операцій списання"
                  />
                  <SummaryCard
                    title="Середнє/день"
                    value={formatCurrency(analytics.avgDailyCost)}
                    suffix=" грн"
                    icon={TrendingDown}
                    color="blue"
                    tooltip="Середня сума втрат за день"
                  />
                  <SummaryCard
                    title="Списань/день"
                    value={analytics.avgDailyCount.toFixed(1)}
                    subtitle="в середньому"
                    icon={BarChart3}
                    color="slate"
                    tooltip="Середня кількість списань за день"
                  />
                </TooltipProvider>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Waste by Reason */}
                <Card className="rounded-xl overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-slate-50/80">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                      За причиною списання
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Розподіл втрат за причинами. Найбільша категорія потребує уваги.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {analytics.reasonChartData.length > 0 ? (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.reasonChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {analytics.reasonChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value) => [`${formatCurrency(value as number)} грн`, "Сума"]}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{ fontSize: "12px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyState message="Немає даних за обраний період" />
                    )}
                  </CardContent>
                </Card>

                {/* Waste by Category */}
                <Card className="rounded-xl overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-slate-50/80">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                      За категорією товарів
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Які категорії товарів найчастіше списуються. Допомагає оптимізувати закупки.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {analytics.categoryChartData.length > 0 ? (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {analytics.categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value) => [`${formatCurrency(value as number)} грн`, "Сума"]}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              wrapperStyle={{ fontSize: "12px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyState message="Немає даних за обраний період" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Trend Chart */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50/80">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Динаміка втрат по днях
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Графік показує суму втрат по днях. Піки можуть вказувати на проблемні дні.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {analytics.trendData.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.trendData}>
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                          <RechartsTooltip
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
                </CardContent>
              </Card>

              {/* Top Wasted Ingredients */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Топ-10 втрачених продуктів
                    </CardTitle>
                    <Badge variant="secondary">{analytics.topIngredients.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {analytics.topIngredients.length > 0 ? (
                    <div className="divide-y">
                      {analytics.topIngredients.map((item, index) => (
                        <TopIngredientRow key={index} item={item} index={index} totalCost={analytics.totalWasteCost} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Немає списань за обраний період" />
                  )}
                </CardContent>
              </Card>

              {/* Reason Breakdown Table */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50/80">
                  <CardTitle className="text-base font-semibold">Детальна розбивка за причинами</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                          <div key={reason} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="p-2.5 rounded-xl shrink-0 cursor-help"
                                    style={{ backgroundColor: `${config.color}15` }}
                                  >
                                    <span style={{ color: config.color }}>
                                      <Icon className="h-5 w-5" />
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{config.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{config.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.count} списань
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-red-600">
                                {formatCurrency(data.cost)} грн
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatPercent(percent)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
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
  color: "red" | "amber" | "blue" | "slate";
  tooltip: string;
}

function SummaryCard({ title, value, suffix, subtitle, icon: Icon, color, tooltip }: SummaryCardProps) {
  const colorConfig = {
    red: { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
    amber: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
    blue: { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
    slate: { border: "border-l-slate-400", bg: "bg-slate-100", text: "text-slate-600", icon: "text-slate-500" },
  };

  const config = colorConfig[color];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn("rounded-xl border-l-4 cursor-help transition-shadow hover:shadow-md", config.border)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {title}
                  <Info className="h-3 w-3 opacity-50" />
                </span>
                <div className={cn("p-1.5 rounded-lg", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.icon)} />
                </div>
              </div>
              <p className={cn("text-xl sm:text-2xl font-bold", config.text)}>
                {value}
                {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
        index < 3 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
      )}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.quantity.toFixed(2)} {item.unit} • {item.count} списань
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-red-600">{formatCurrency(item.cost)} грн</p>
        <div className="flex items-center gap-2 justify-end">
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 text-right">
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
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Package className="h-6 w-6 text-slate-400" />
      </div>
      <p>{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
