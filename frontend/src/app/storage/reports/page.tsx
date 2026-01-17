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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Trash2,
  ArrowDownToLine,
  Filter,
  Menu,
  RefreshCw,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  ThermometerSnowflake,
  AlertTriangle,
  Bug,
  CircleDollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageLeftSidebar, type StorageView } from "@/features/storage/storage-left-sidebar";
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

const DATE_PRESETS: { value: DatePreset; label: string; description: string }[] = [
  { value: "today", label: "Сьогодні", description: "Операції за сьогодні" },
  { value: "week", label: "Цей тиждень", description: "З понеділка по сьогодні" },
  { value: "month", label: "Цей місяць", description: "З 1-го числа по сьогодні" },
  { value: "custom", label: "Обрати дати", description: "Вибрати діапазон вручну" },
];

const MOVEMENT_TYPES = [
  { value: "all", label: "Всі операції", icon: Package, color: "text-slate-600", bgColor: "bg-slate-100" },
  { value: "receive", label: "Поставки", icon: ArrowDownToLine, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { value: "write_off", label: "Списання", icon: Trash2, color: "text-red-600", bgColor: "bg-red-100" },
  { value: "recipe_use", label: "Використання", icon: Package, color: "text-blue-600", bgColor: "bg-blue-100" },
];

// Waste Analytics Constants
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

type ReportTab = "movements" | "waste";

export default function StorageReportsPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ReportTab>("movements");
  const [datePreset, setDatePreset] = React.useState<DatePreset>("week");
  const [customFromDate, setCustomFromDate] = React.useState("");
  const [customToDate, setCustomToDate] = React.useState("");
  const [movementTypeFilter, setMovementTypeFilter] = React.useState("all");
  const [showAllMovements, setShowAllMovements] = React.useState(false);

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
      limit: 500,
      offset: 0,
    },
  });

  const { data, fetching, error } = result;
  const allMovements: InventoryMovement[] = data?.inventoryMovements || [];

  const filteredMovements = React.useMemo(() => {
    return allMovements.filter((m) => {
      const date = new Date(m.createdAt);
      const inDateRange = date >= dateRange.from && date <= dateRange.to;
      const matchesType =
        movementTypeFilter === "all" || m.movementType === movementTypeFilter;
      return inDateRange && matchesType;
    });
  }, [allMovements, dateRange, movementTypeFilter]);

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

  // Waste Analytics calculations
  const writeOffs = React.useMemo(() => {
    return allMovements.filter((m) => {
      const date = new Date(m.createdAt);
      const inDateRange = date >= dateRange.from && date <= dateRange.to;
      return inDateRange && m.movementType === "write_off";
    });
  }, [allMovements, dateRange]);

  const wasteAnalytics = React.useMemo(() => {
    const totalWasteCost = writeOffs.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    // By reason
    const byReason: Record<string, { count: number; cost: number }> = {};
    for (const m of writeOffs) {
      const reason = m.reasonCode || "other";
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, cost: 0 };
      }
      byReason[reason].count++;
      byReason[reason].cost += m.totalCost || 0;
    }

    // By category
    const byCategory: Record<string, { count: number; cost: number }> = {};
    for (const m of writeOffs) {
      const category = m.ingredient?.mainCategory || "other";
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, cost: 0 };
      }
      byCategory[category].count++;
      byCategory[category].cost += m.totalCost || 0;
    }

    // By ingredient (top 10)
    const byIngredient: Record<string, { name: string; count: number; cost: number; quantity: number; unit: string }> = {};
    for (const m of writeOffs) {
      const ingredientId = m.ingredient?.name || "unknown";
      if (!byIngredient[ingredientId]) {
        byIngredient[ingredientId] = {
          name: m.ingredient?.name || "Невідомо",
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

  const displayedMovements = showAllMovements
    ? filteredMovements
    : filteredMovements.slice(0, 20);

  return (
    <div className="flex h-screen-safe bg-background overflow-hidden">
      {/* Sidebar */}
      <StorageLeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeView="reports"
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
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Журнал руху
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Аналіз руху товарів на складі
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
                <span className="hidden sm:inline">Експорт CSV</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Toolbar - all in one row */}
        <div className="px-3 sm:px-4 py-2.5 border-b bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)} className="flex-shrink-0">
              <TabsList className="h-9">
                <TabsTrigger value="movements" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 h-7">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Журнал</span>
                </TabsTrigger>
                <TabsTrigger value="waste" className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 h-7">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Аналітика втрат</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Date Preset */}
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[130px] sm:w-[150px] h-9 rounded-xl text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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

            {/* Custom Date Range */}
            {datePreset === "custom" && (
              <>
                <Input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-[130px] h-9 rounded-xl text-xs"
                  placeholder="Від"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <Input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-[130px] h-9 rounded-xl text-xs"
                  placeholder="До"
                />
              </>
            )}

            {/* Movement Type Filter - only for movements tab */}
            {activeTab === "movements" && (
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-9 rounded-xl text-xs sm:text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", type.color)} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date range info */}
            <div className="text-[10px] sm:text-xs text-muted-foreground bg-white px-2 sm:px-3 py-1.5 rounded-lg border hidden sm:block">
              {dateRange.from.toLocaleDateString("uk-UA")} — {dateRange.to.toLocaleDateString("uk-UA")}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {activeTab === "movements" && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <TooltipProvider>
                  <SummaryCard
                    title="Поставки"
                    value={formatCurrency(summary.totalPurchases)}
                    count={summary.purchaseCount}
                    icon={ArrowDownToLine}
                    color="emerald"
                    tooltip="Загальна вартість отриманих товарів за період"
                  />
                  <SummaryCard
                    title="Списання"
                    value={formatCurrency(summary.totalWriteOffs)}
                    count={summary.writeOffCount}
                    icon={Trash2}
                    color="red"
                    tooltip="Вартість списаних товарів (втрати)"
                  />
                  <SummaryCard
                    title="Використання"
                    value={formatCurrency(summary.totalUsage)}
                    count={summary.usageCount}
                    icon={Package}
                    color="blue"
                    tooltip="Вартість товарів, використаних для приготування"
                  />
                  <SummaryCard
                    title="Баланс"
                    value={formatCurrency(summary.netChange)}
                    trend={summary.netChange >= 0 ? "up" : "down"}
                    icon={summary.netChange >= 0 ? TrendingUp : TrendingDown}
                    color={summary.netChange >= 0 ? "emerald" : "amber"}
                    tooltip="Поставки мінус (списання + використання)"
                  />
                </TooltipProvider>
              </div>

              {/* Movements Table */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/80 py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      Журнал операцій
                      <Badge variant="secondary" className="font-normal">
                        {filteredMovements.length}
                      </Badge>
                    </CardTitle>
                    {filteredMovements.length > 20 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllMovements(!showAllMovements)}
                        className="gap-1 text-xs"
                      >
                        {showAllMovements ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Згорнути
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Показати всі ({filteredMovements.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {fetching ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                        <Trash2 className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="text-red-600 font-medium">Помилка завантаження</p>
                      <p className="text-sm text-muted-foreground mt-1">Спробуйте оновити сторінку</p>
                    </div>
                  ) : filteredMovements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Package className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium text-foreground mb-1">Немає операцій</p>
                      <p className="text-sm text-muted-foreground">За обраний період операції відсутні</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {displayedMovements.map((movement) => (
                        <MovementRow key={movement.documentId} movement={movement} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "waste" && (
            <>
              {/* Waste Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <TooltipProvider>
                  <SummaryCard
                    title="Загальні втрати"
                    value={formatCurrency(wasteAnalytics.totalWasteCost)}
                    icon={CircleDollarSign}
                    color="red"
                    tooltip="Сумарна вартість всіх списаних товарів за період"
                  />
                  <SummaryCard
                    title="Списань"
                    value={wasteAnalytics.totalCount.toString()}
                    count={wasteAnalytics.totalCount}
                    icon={Trash2}
                    color="amber"
                    tooltip="Кількість операцій списання"
                  />
                  <SummaryCard
                    title="Середнє/день"
                    value={formatCurrency(wasteAnalytics.avgDailyCost)}
                    icon={TrendingDown}
                    color="blue"
                    tooltip="Середня сума втрат за день"
                  />
                  <SummaryCard
                    title="Списань/день"
                    value={wasteAnalytics.avgDailyCount.toFixed(1)}
                    icon={BarChart3}
                    color="emerald"
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {wasteAnalytics.reasonChartData.length > 0 ? (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={wasteAnalytics.reasonChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {wasteAnalytics.reasonChartData.map((entry, index) => (
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
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-0.5">Немає даних</p>
                        <p className="text-xs text-muted-foreground">За обраний період даних немає</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Waste by Category */}
                <Card className="rounded-xl overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-slate-50/80">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                      За категорією товарів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {wasteAnalytics.categoryChartData.length > 0 ? (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={wasteAnalytics.categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {wasteAnalytics.categoryChartData.map((entry, index) => (
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
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-0.5">Немає даних</p>
                        <p className="text-xs text-muted-foreground">За обраний період даних немає</p>
                      </div>
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {wasteAnalytics.trendData.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wasteAnalytics.trendData}>
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                          <RechartsTooltip
                            formatter={(value, name) => {
                              if (name === "cost") return [`${formatCurrency(value as number)} грн`, "Сума"];
                              return [value, "Операцій"];
                            }}
                            labelFormatter={(label) => `Дата: ${String(label)}`}
                          />
                          <Bar dataKey="cost" fill="#ef4444" name="cost" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <BarChart3 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-0.5">Немає даних</p>
                      <p className="text-xs text-muted-foreground">За обраний період даних немає</p>
                    </div>
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
                    <Badge variant="secondary">{wasteAnalytics.topIngredients.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {wasteAnalytics.topIngredients.length > 0 ? (
                    <div className="divide-y">
                      {wasteAnalytics.topIngredients.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
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
                                  style={{ width: `${Math.min(100, wasteAnalytics.totalWasteCost > 0 ? (item.cost / wasteAnalytics.totalWasteCost) * 100 : 0)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {formatPercent(wasteAnalytics.totalWasteCost > 0 ? (item.cost / wasteAnalytics.totalWasteCost) * 100 : 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mb-2 opacity-40" />
                      <p>Немає списань за обраний період</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reason Breakdown Table */}
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50/80">
                  <CardTitle className="text-base font-semibold">Розбивка за причинами</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {Object.entries(wasteAnalytics.byReason)
                      .sort(([, a], [, b]) => b.cost - a.cost)
                      .map(([reason, data]) => {
                        const config = WRITE_OFF_REASONS[reason] || WRITE_OFF_REASONS.other;
                        const Icon = config.icon;
                        const percent = wasteAnalytics.totalWasteCost > 0
                          ? (data.cost / wasteAnalytics.totalWasteCost) * 100
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
                              <p className="text-sm text-muted-foreground">{data.count} списань</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-red-600">{formatCurrency(data.cost)} грн</p>
                              <p className="text-xs text-muted-foreground">{formatPercent(percent)}</p>
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

interface SummaryCardProps {
  title: string;
  value: string;
  count?: number;
  trend?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "red" | "blue" | "amber";
  tooltip: string;
}

function SummaryCard({ title, value, count, trend, icon: Icon, color, tooltip }: SummaryCardProps) {
  const colorConfig = {
    emerald: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: "text-emerald-500",
    },
    red: {
      border: "border-l-red-500",
      bg: "bg-red-50",
      text: "text-red-600",
      icon: "text-red-500",
    },
    blue: {
      border: "border-l-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      icon: "text-blue-500",
    },
    amber: {
      border: "border-l-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
      icon: "text-amber-500",
    },
  };

  const config = colorConfig[color];

  return (
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
              <span className="text-sm font-normal text-muted-foreground ml-1">грн</span>
            </p>
            {count !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">{count} операцій</p>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface MovementRowProps {
  movement: InventoryMovement;
}

function MovementRow({ movement }: MovementRowProps) {
  const typeConfig = MOVEMENT_TYPES.find((t) => t.value === movement.movementType) || MOVEMENT_TYPES[0];
  const Icon = typeConfig.icon;

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
      <div className={cn("p-2.5 rounded-xl shrink-0", typeConfig.bgColor)}>
        <Icon className={cn("h-4 w-4", typeConfig.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{movement.ingredient?.name || "—"}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{movement.quantity} {movement.unit}</span>
          {movement.reason && (
            <>
              <span className="text-slate-300">•</span>
              <span className="truncate">{movement.reason}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("font-semibold", typeConfig.color)}>
          {movement.movementType === "receive" ? "+" : "-"}
          {formatCurrency(movement.totalCost || 0)}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">грн</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(movement.createdAt)}
        </p>
      </div>
    </div>
  );
}
