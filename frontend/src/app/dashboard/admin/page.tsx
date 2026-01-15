"use client";

import * as React from "react";
import { useQuery } from "urql";
import { KPIGrid } from "@/features/kpi/kpi-card";
import { AlertsList } from "@/features/alerts/alerts-list";
import { ActionLogView } from "@/features/kpi/action-log";
import { WorkersChat } from "@/features/admin/workers-chat";
import { WorkerProfileCard } from "@/features/profile";
import { useAuthStore } from "@/stores/auth-store";
import { AdminLeftSidebar, type AdminView } from "@/features/admin/admin-left-sidebar";
import { Button } from "@/components/ui/button";
import { SkeletonKPI } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api";
import { GET_RECENT_ACTIONS } from "@/graphql/queries";
import { RefreshCw, Calendar, Menu, TrendingUp, TrendingDown, Minus, Construction, CalendarDays, X, Clock, CheckCircle2, Utensils, Timer, Award, BarChart3 as BarChartIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { gql } from "urql";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KPI, Alert, ActionLog, ActionType, EntityType } from "@/types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [activeView, setActiveView] = React.useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [kpis, setKPIs] = React.useState<KPI[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  // Fetch recent action history
  const [{ data: actionData, fetching: actionsFetching }, refetchActions] = useQuery({
    query: GET_RECENT_ACTIONS,
    variables: { limit: 50 },
  });

  // Transform action history to ActionLog format
  const actionLogs: ActionLog[] = React.useMemo(() => {
    if (!actionData?.actionHistories) return [];
    return actionData.actionHistories.map((item: {
      documentId: string;
      action: string;
      entityType: string;
      entityId: string;
      entityName?: string;
      description: string;
      descriptionUk?: string;
      dataBefore?: Record<string, unknown>;
      dataAfter?: Record<string, unknown>;
      changedFields?: string[];
      metadata?: Record<string, unknown>;
      performedByName?: string;
      performedByRole?: string;
      module: string;
      severity?: string;
      createdAt: string;
    }) => ({
      id: item.documentId,
      userId: 'system',
      userName: item.performedByName || 'Система',
      userRole: item.performedByRole,
      action: item.action,
      actionType: item.action as ActionType,
      entityType: item.entityType as EntityType,
      entityId: item.entityId,
      entityName: item.entityName,
      details: item.description,
      descriptionUk: item.descriptionUk,
      timestamp: new Date(item.createdAt),
      module: item.module as ActionLog['module'],
      severity: item.severity as ActionLog['severity'],
      dataBefore: item.dataBefore,
      dataAfter: item.dataAfter,
      changedFields: item.changedFields,
      metadata: item.metadata,
    }));
  }, [actionData]);

  // Load data
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [kpiRes, alertsRes] = await Promise.all([
        analyticsApi.getKPIs(),
        analyticsApi.getAlerts(),
      ]);
      if (kpiRes.success) setKPIs(kpiRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      setLastUpdated(new Date());
      refetchActions({ requestPolicy: 'network-only' });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [refetchActions]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Mark alert as read
  const handleMarkAlertRead = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
    await analyticsApi.markAlertRead(alertId);
  };

  // Handle KPI click
  const handleKPIClick = (kpi: KPI) => {
    console.log("KPI clicked:", kpi);
  };

  // View titles
  const viewTitles: Record<AdminView, string> = {
    overview: 'Огляд',
    logs: 'Журнал дій',
    analytics: 'Аналітика',
    workers: 'Робітники',
    chat: 'Чат',
    profile: 'Профіль',
  };

  return (
    <div className="flex h-screen-safe bg-background overflow-hidden">
      {/* Sidebar */}
      <AdminLeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm px-3 sm:px-4 py-3 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-xl touch-feedback"
                onClick={() => setSidebarOpen(true)}
                aria-label="Відкрити меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{viewTitles[activeView]}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {new Date().toLocaleDateString("uk-UA", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="sm:hidden">
                    {new Date().toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-muted-foreground hidden md:block">
                Оновлено: {lastUpdated.toLocaleTimeString("uk-UA")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={loadData}
                disabled={isLoading}
                aria-label="Оновити дані"
                className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl touch-feedback"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto scroll-container">
          {activeView === 'overview' && (
            <OverviewView
              kpis={kpis}
              alerts={alerts}
              actionLogs={actionLogs}
              isLoading={isLoading}
              actionsFetching={actionsFetching}
              onKPIClick={handleKPIClick}
              onMarkAlertRead={handleMarkAlertRead}
            />
          )}
          {activeView === 'logs' && (
            <LogsView logs={actionLogs} isLoading={actionsFetching} />
          )}
          {activeView === 'analytics' && (
            <AnalyticsView kpis={kpis} isLoading={isLoading} />
          )}
          {activeView === 'workers' && (
            <WorkersView />
          )}
          {activeView === 'chat' && (
            <WorkersChat />
          )}
          {activeView === 'profile' && (
            <div className="max-w-md mx-auto">
              <WorkerProfileCard
                worker={{
                  documentId: 'admin-1',
                  name: 'Адміністратор',
                  role: 'admin',
                  department: 'management',
                  status: 'active',
                  phone: '+380 67 123 4567',
                  email: 'admin@restaurant.com',
                  hoursThisWeek: 40,
                  hoursThisMonth: 160,
                  shiftsThisWeek: 5,
                  shiftsThisMonth: 20,
                  rating: 5.0,
                }}
                variant="full"
                onLogout={() => {
                  useAuthStore.getState().logout();
                  window.location.href = '/';
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Overview View - KPIs, Alerts, Recent Activity (Production Level UI/UX)
interface OverviewViewProps {
  kpis: KPI[];
  alerts: Alert[];
  actionLogs: ActionLog[];
  isLoading: boolean;
  actionsFetching: boolean;
  onKPIClick: (kpi: KPI) => void;
  onMarkAlertRead: (alertId: string) => void;
}

function OverviewView({
  kpis,
  alerts,
  actionLogs,
  isLoading,
  actionsFetching,
  onKPIClick,
  onMarkAlertRead,
}: OverviewViewProps) {
  // Calculate summary from KPIs
  const todayRevenue = kpis.find(k => k.id === 'revenue')?.value || 0;
  const ordersCount = kpis.find(k => k.id === 'orders')?.value || 0;
  const avgCheck = kpis.find(k => k.id === 'avg-check')?.value || 0;
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-4">
      {/* Compact Metrics Bar */}
      <section className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-muted-foreground">Виручка</span>
          <span className="font-semibold tabular-nums">
            {typeof todayRevenue === 'number' ? todayRevenue.toLocaleString('uk-UA') : todayRevenue} ₴
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-muted-foreground">Замовлень</span>
          <span className="font-semibold tabular-nums">
            {typeof ordersCount === 'number' ? ordersCount.toLocaleString('uk-UA') : ordersCount}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
          <BarChartIcon className="w-4 h-4 text-violet-500" />
          <span className="text-sm text-muted-foreground">Сер. чек</span>
          <span className="font-semibold tabular-nums">
            {typeof avgCheck === 'number' ? avgCheck.toLocaleString('uk-UA') : avgCheck} ₴
          </span>
        </div>
        {unreadAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700 font-medium">{unreadAlerts} сповіщень</span>
          </div>
        )}
      </section>

      {/* Alerts */}
      <section aria-labelledby="alerts-heading">
        <AlertsList
          alerts={alerts}
          onMarkRead={onMarkAlertRead}
          onAlertClick={(alert) => {
            if (alert.actionUrl) {
              console.log("Navigate to:", alert.actionUrl);
            }
          }}
        />
      </section>
    </div>
  );
}

// Enhanced Quick Stat Card with progress
interface QuickStatCardEnhancedProps {
  title: string;
  value: string;
  unit: string;
  target: number;
  current: number;
  status: "good" | "normal" | "warning" | "danger";
  icon: React.ReactNode;
  description: string;
}

function QuickStatCardEnhanced({
  title,
  value,
  unit,
  target,
  current,
  status,
  icon,
  description,
}: QuickStatCardEnhancedProps) {
  const statusConfig = {
    good: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "bg-emerald-100 text-emerald-600",
      progress: "bg-emerald-500",
      text: "text-emerald-700",
    },
    normal: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "bg-blue-100 text-blue-600",
      progress: "bg-blue-500",
      text: "text-blue-700",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "bg-amber-100 text-amber-600",
      progress: "bg-amber-500",
      text: "text-amber-700",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-100",
      icon: "bg-red-100 text-red-600",
      progress: "bg-red-500",
      text: "text-red-700",
    },
  };

  const config = statusConfig[status];
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${config.icon} flex items-center justify-center`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${config.text} px-2 py-0.5 rounded-full ${config.bg} border ${config.border}`}>
          {status === "good" ? "Добре" : status === "normal" ? "Норма" : status === "warning" ? "Увага" : "Критично"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">
        {value}<span className="text-base font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
      {target > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.progress} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

// Logs View - Full action history
interface LogsViewProps {
  logs: ActionLog[];
  isLoading: boolean;
}

function LogsView({ logs, isLoading }: LogsViewProps) {
  return (
    <div className="min-h-[400px] md:h-[calc(100dvh-180px)] flex flex-col">
      <p className="typo-body-sm text-muted-foreground mb-2 sm:mb-3 flex-shrink-0">
        Останні {logs.length} записів журналу дій
      </p>
      <div className="flex-1 min-h-0">
        <ActionLogView logs={logs} isLoading={isLoading} fullHeight />
      </div>
    </div>
  );
}

// Analytics View - Detailed KPIs and charts
interface AnalyticsViewProps {
  kpis: KPI[];
  isLoading: boolean;
}

// Mock data for charts
const REVENUE_DATA = [
  { date: "Пн", revenue: 45200, orders: 89, avgCheck: 508 },
  { date: "Вт", revenue: 38700, orders: 76, avgCheck: 509 },
  { date: "Ср", revenue: 52100, orders: 102, avgCheck: 511 },
  { date: "Чт", revenue: 48900, orders: 95, avgCheck: 515 },
  { date: "Пт", revenue: 67800, orders: 132, avgCheck: 514 },
  { date: "Сб", revenue: 82400, orders: 158, avgCheck: 521 },
  { date: "Нд", revenue: 61595, orders: 127, avgCheck: 485 },
];

const HOURLY_DATA = [
  { hour: "10:00", orders: 8, revenue: 3200 },
  { hour: "11:00", orders: 12, revenue: 5400 },
  { hour: "12:00", orders: 24, revenue: 11800 },
  { hour: "13:00", orders: 31, revenue: 15200 },
  { hour: "14:00", orders: 22, revenue: 10600 },
  { hour: "15:00", orders: 14, revenue: 6800 },
  { hour: "16:00", orders: 11, revenue: 5200 },
  { hour: "17:00", orders: 16, revenue: 7800 },
  { hour: "18:00", orders: 28, revenue: 13600 },
  { hour: "19:00", orders: 35, revenue: 17200 },
  { hour: "20:00", orders: 32, revenue: 15800 },
  { hour: "21:00", orders: 26, revenue: 12400 },
  { hour: "22:00", orders: 18, revenue: 8600 },
];

const TOP_ITEMS = [
  { name: "Стейк Рібай", orders: 45, revenue: 22500 },
  { name: "Цезар з куркою", orders: 38, revenue: 7600 },
  { name: "Паста Карбонара", orders: 32, revenue: 6400 },
  { name: "Борщ український", orders: 28, revenue: 4200 },
  { name: "Сирники", orders: 25, revenue: 3750 },
];

const CATEGORY_DATA = [
  { name: "Основні страви", value: 42, color: "#3b82f6" },
  { name: "Салати", value: 18, color: "#22c55e" },
  { name: "Напої", value: 22, color: "#f59e0b" },
  { name: "Десерти", value: 12, color: "#ec4899" },
  { name: "Закуски", value: 6, color: "#8b5cf6" },
];

const WAITER_PERFORMANCE = [
  { name: "Марія", orders: 34, revenue: 16800, avgTime: 42 },
  { name: "Олексій", orders: 28, revenue: 14200, avgTime: 38 },
  { name: "Анна", orders: 31, revenue: 15400, avgTime: 45 },
  { name: "Іван", orders: 22, revenue: 10800, avgTime: 52 },
  { name: "Катерина", orders: 12, revenue: 4400, avgTime: 35 },
];

const COMPARISON_DATA = [
  { metric: "Виручка", current: 61595, previous: 54200, unit: "₴" },
  { metric: "Замовлень", current: 127, previous: 112, unit: "" },
  { metric: "Середній чек", current: 485, previous: 484, unit: "₴" },
  { metric: "Гостей", current: 298, previous: 267, unit: "" },
  { metric: "Час готування", current: 12.5, previous: 14.2, unit: "хв" },
];

function AnalyticsView({ kpis, isLoading }: AnalyticsViewProps) {
  return (
    <div className="relative space-y-6">
      {/* "В розробці" Banner */}
      <div className="sticky top-0 z-10 flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-full shadow-sm">
          <Construction className="w-4 h-4" />
          <span className="font-medium text-sm">В розробці</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <MetricCard
          title="Виручка сьогодні"
          value="61 595 ₴"
          change={13.6}
          period="vs вчора"
        />
        <MetricCard
          title="Замовлень"
          value="127"
          change={13.4}
          period="vs вчора"
        />
        <MetricCard
          title="Середній чек"
          value="485 ₴"
          change={0.2}
          period="vs вчора"
        />
        <MetricCard
          title="Гостей"
          value="298"
          change={11.6}
          period="vs вчора"
        />
        <MetricCard
          title="Завантаженість"
          value="73%"
          change={-5.2}
          period="vs вчора"
        />
      </div>

      {/* Charts Row 1 - Revenue & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Виручка за тиждень</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[220px] sm:h-[260px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()} ₴`, "Виручка"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Hour */}
        <Card className="card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Замовлення по годинах</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[220px] sm:h-[260px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "orders" ? value : `${Number(value).toLocaleString()} ₴`,
                      name === "orders" ? "Замовлень" : "Виручка"
                    ]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Top Items & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items */}
        <Card className="lg:col-span-2 card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Топ страви за день</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {TOP_ITEMS.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.orders} шт</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.orders / TOP_ITEMS[0].orders) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium w-20 text-right">
                    {item.revenue.toLocaleString()} ₴
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Категорії</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[180px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Частка"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CATEGORY_DATA.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                  <span className="text-muted-foreground ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today vs Yesterday */}
        <Card className="card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Порівняння з вчора</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-4">
              {COMPARISON_DATA.map((item) => {
                const change = ((item.current - item.previous) / item.previous) * 100;
                const isPositive = change > 0;
                const isNeutral = Math.abs(change) < 1;
                return (
                  <div key={item.metric} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {typeof item.current === 'number' && item.current % 1 !== 0
                          ? item.current.toFixed(1)
                          : item.current.toLocaleString()}{item.unit}
                      </span>
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        isNeutral
                          ? "bg-slate-100 text-slate-600"
                          : isPositive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {isNeutral ? (
                          <Minus className="w-3 h-3" />
                        ) : isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="card-interactive">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="typo-h4">Продуктивність офіціантів</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WAITER_PERFORMANCE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={60} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "orders" ? value : `${Number(value).toLocaleString()} ₴`,
                      name === "orders" ? "Замовлень" : "Виручка"
                    ]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="card-interactive">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="typo-h4">Тренд за тиждень: Виручка vs Замовлення</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[220px] sm:h-[280px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? `${Number(value).toLocaleString()} ₴` : value,
                    name === "revenue" ? "Виручка" : "Замовлень"
                  ]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Legend
                  formatter={(value) => value === "revenue" ? "Виручка" : "Замовлень"}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <QuickStatCard
          title="Повернення"
          value="2"
          subtext="0.8% від замовлень"
          status="good"
        />
        <QuickStatCard
          title="Скасування"
          value="3"
          subtext="2.4% від замовлень"
          status="warning"
        />
        <QuickStatCard
          title="Нові гості"
          value="45"
          subtext="15% від загальної кількості"
          status="normal"
        />
        <QuickStatCard
          title="Повторні візити"
          value="253"
          subtext="85% від загальної кількості"
          status="good"
        />
      </div>
    </div>
  );
}

// Metric Card for top row
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  period: string;
}

function MetricCard({ title, value, change, period }: MetricCardProps) {
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 1;

  return (
    <Card className="card-interactive">
      <CardContent className="p-3 sm:p-4">
        <p className="typo-caption mb-0.5 sm:mb-1">{title}</p>
        <p className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 typo-numeric">{value}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-[10px] sm:text-xs font-medium flex items-center gap-0.5 ${
            isNeutral ? "text-slate-500" : isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">{period}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Workers View - Full staff management
// Mock performance data (в розробці - буде з бекенду)
const MOCK_PERFORMANCE: Record<string, {
  tasksCompleted: number;
  ticketsCompleted: number;
  avgTimeSeconds: number;
  efficiency: number;
  trend: "up" | "down" | "stable";
  todayHours: number;
  weekHours: number;
  rating: number;
}> = {
  // Will be matched by username or documentId
};

function WorkersView() {
  const [{ data: workersData, fetching }] = useQuery({
    query: GET_ALL_WORKERS_FULL,
  });
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [selectedWorker, setSelectedWorker] = React.useState<Worker | null>(null);

  const workers = workersData?.usersPermissionsUsers || [];

  // Generate mock performance for each worker
  const getWorkerPerformance = React.useCallback((worker: Worker) => {
    // Seed random based on documentId for consistency
    const seed = worker.documentId?.charCodeAt(0) || 0;
    const isKitchen = worker.department === "kitchen" || worker.systemRole === "chef" || worker.systemRole === "cook";
    const isService = worker.department === "service" || worker.systemRole === "waiter";

    return {
      tasksCompleted: 15 + (seed % 40),
      ticketsCompleted: isKitchen ? 30 + (seed % 100) : (isService ? 20 + (seed % 30) : 0),
      efficiency: 75 + (seed % 35),
      trend: (["up", "stable", "down"] as const)[seed % 3],
      todayHours: seed % 2 === 0 ? 4 + (seed % 5) : 0, // Some on shift, some not
      weekHours: 20 + (seed % 25),
      monthHours: 80 + (seed % 80), // 80-160 hours per month
      rating: 3.5 + ((seed % 15) / 10),
      lastActive: seed % 2 === 0 ? "Зараз на зміні" : `${1 + (seed % 3)} дні тому`,
    };
  }, []);

  // Filter workers
  const filteredWorkers = React.useMemo(() => {
    let filtered = workers.filter((w: Worker) => w.isActive !== false);
    if (departmentFilter !== "all") {
      filtered = filtered.filter((w: Worker) => w.department === departmentFilter);
    }
    // Sort by efficiency (mock)
    return filtered.sort((a: Worker, b: Worker) => {
      const perfA = getWorkerPerformance(a);
      const perfB = getWorkerPerformance(b);
      return perfB.efficiency - perfA.efficiency;
    });
  }, [workers, departmentFilter, getWorkerPerformance]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 100) return "text-green-600";
    if (score >= 85) return "text-amber-600";
    return "text-red-600";
  };

  const getEfficiencyBg = (score: number) => {
    if (score >= 100) return "bg-green-100 text-green-700";
    if (score >= 85) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getTimeInTeam = (joinedAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - joinedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      return remainingMonths > 0
        ? `${diffYears} р. ${remainingMonths} міс.`
        : `${diffYears} р.`;
    }
    if (diffMonths > 0) return `${diffMonths} міс.`;
    return `${diffDays} дн.`;
  };

  const selectedPerformance = selectedWorker ? getWorkerPerformance(selectedWorker) : null;

  if (fetching) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded w-48 animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* "В розробці" Banner */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg">
          <Construction className="w-4 h-4" />
          <span className="font-medium text-sm">Дані продуктивності в розробці</span>
        </div>
      </div>

      {/* Filter & Actions - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[130px] sm:w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі відділи</SelectItem>
              <SelectItem value="kitchen">Кухня</SelectItem>
              <SelectItem value="service">Зал</SelectItem>
              <SelectItem value="bar">Бар</SelectItem>
              <SelectItem value="management">Менеджмент</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {filteredWorkers.length} працівників
          </span>
        </div>
        <a href="/dashboard/admin/schedule">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <CalendarDays className="h-4 w-4" />
            <span>Графік змін</span>
          </Button>
        </a>
      </div>

      {/* Mobile: Card-based Workers List */}
      <div className="sm:hidden space-y-3">
        {filteredWorkers.map((worker: Worker, index: number) => {
          const perf = getWorkerPerformance(worker);
          const isOnShift = perf.todayHours > 0;
          return (
            <Card
              key={worker.documentId}
              onClick={() => setSelectedWorker(worker)}
              className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99] touch-feedback"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Worker info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={`text-sm font-semibold text-white ${
                          WORKER_ROLE_AVATAR_COLORS[worker.systemRole || "viewer"]
                        }`}>
                          {worker.firstName?.[0]}{worker.lastName?.[0] || worker.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {worker.firstName} {worker.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${WORKER_ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                          {WORKER_ROLE_LABELS[worker.systemRole || "viewer"]}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                          isOnShift
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOnShift ? "bg-green-500" : "bg-gray-400"
                          }`} />
                          {isOnShift ? "Зміна" : "Офлайн"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Efficiency score */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-xl font-bold ${getEfficiencyColor(perf.efficiency)}`}>
                        {perf.efficiency}%
                      </span>
                      {perf.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {perf.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{perf.monthHours} год/міс</p>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{perf.tasksCompleted} задач</span>
                  </div>
                  {perf.ticketsCompleted > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Utensils className="h-3 w-3" />
                      <span>{perf.ticketsCompleted} тікетів</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Award className="h-3 w-3" />
                    <span>{perf.rating.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Table-based Workers View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium text-sm">Працівник</th>
                  <th className="p-3 text-center font-medium text-sm">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Години/міс</span>
                    </div>
                  </th>
                  <th className="p-3 text-center font-medium text-sm hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Задачі</span>
                    </div>
                  </th>
                  <th className="p-3 text-center font-medium text-sm hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <Utensils className="h-3.5 w-3.5" />
                      <span>Тікети</span>
                    </div>
                  </th>
                  <th className="p-3 text-center font-medium text-sm">Ефективність</th>
                  <th className="p-3 text-center font-medium text-sm w-20">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker: Worker, index: number) => {
                  const perf = getWorkerPerformance(worker);
                  const isOnShift = perf.todayHours > 0;
                  return (
                    <tr
                      key={worker.documentId}
                      onClick={() => setSelectedWorker(worker)}
                      className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-sm font-semibold text-white ${
                                WORKER_ROLE_AVATAR_COLORS[worker.systemRole || "viewer"]
                              }`}>
                                {worker.firstName?.[0]}{worker.lastName?.[0] || worker.username?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {index < 3 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {worker.firstName} {worker.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${WORKER_ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                                {WORKER_ROLE_LABELS[worker.systemRole || "viewer"]}
                              </span>
                              {worker.department && (
                                <span className="text-[10px] text-muted-foreground">
                                  {WORKER_DEPARTMENT_LABELS[worker.department] || worker.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div>
                          <span className="font-semibold">{perf.monthHours}</span>
                          <span className="text-xs text-muted-foreground ml-1">год</span>
                        </div>
                      </td>
                      <td className="p-3 text-center hidden md:table-cell">
                        <span className="font-semibold">{perf.tasksCompleted}</span>
                      </td>
                      <td className="p-3 text-center hidden lg:table-cell">
                        <span className="font-semibold">
                          {perf.ticketsCompleted || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-lg font-bold ${getEfficiencyColor(perf.efficiency)}`}>
                            {perf.efficiency}%
                          </span>
                          {perf.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {perf.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                          isOnShift
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOnShift ? "bg-green-500" : "bg-gray-400"
                          }`} />
                          {isOnShift ? "На зміні" : "Офлайн"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Worker Detail Modal */}
      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedWorker && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`text-lg font-semibold text-white ${
                      WORKER_ROLE_AVATAR_COLORS[selectedWorker.systemRole || "viewer"]
                    }`}>
                      {selectedWorker.firstName?.[0]}{selectedWorker.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedWorker.firstName} {selectedWorker.lastName}
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {WORKER_ROLE_LABELS[selectedWorker.systemRole || "viewer"]}
                      {selectedWorker.station && ` • ${selectedWorker.station}`}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedWorker && selectedPerformance && (
            <DialogBody className="space-y-6">
              {/* Efficiency Score */}
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Загальна ефективність</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-4xl font-bold ${getEfficiencyColor(selectedPerformance.efficiency)}`}>
                    {selectedPerformance.efficiency}%
                  </span>
                  {selectedPerformance.trend === "up" && <TrendingUp className="h-6 w-6 text-green-600" />}
                  {selectedPerformance.trend === "down" && <TrendingDown className="h-6 w-6 text-red-600" />}
                  {selectedPerformance.trend === "stable" && <Minus className="h-6 w-6 text-muted-foreground" />}
                </div>
                <Badge className={`mt-2 ${getEfficiencyBg(selectedPerformance.efficiency)}`}>
                  {selectedPerformance.efficiency >= 100 ? "Відмінно" : selectedPerformance.efficiency >= 85 ? "Добре" : "Потребує уваги"}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Години за місяць"
                  value={`${selectedPerformance.monthHours}`}
                  suffix="год"
                />
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Години за тиждень"
                  value={`${selectedPerformance.weekHours}`}
                  suffix="год"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Задачі виконано"
                  value={String(selectedPerformance.tasksCompleted)}
                />
                <StatCard
                  icon={<Utensils className="h-4 w-4" />}
                  label="Тікети оброблено"
                  value={String(selectedPerformance.ticketsCompleted || "—")}
                />
                <StatCard
                  icon={<Award className="h-4 w-4" />}
                  label="Рейтинг"
                  value={selectedPerformance.rating.toFixed(1)}
                  suffix="/ 5"
                />
                <StatCard
                  icon={<Timer className="h-4 w-4" />}
                  label="Остання активність"
                  value={selectedPerformance.lastActive}
                  small
                />
              </div>

              {/* Contact Info */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Інформація</p>
                <div className="space-y-1.5">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedWorker.email || "—"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Username:</span>{" "}
                    @{selectedWorker.username}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Відділ:</span>{" "}
                    {WORKER_DEPARTMENT_LABELS[selectedWorker.department || "none"]}
                  </p>
                  {selectedWorker.createdAt && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">В команді з:</span>{" "}
                      {new Date(selectedWorker.createdAt).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      <span className="text-muted-foreground ml-1">
                        ({getTimeInTeam(new Date(selectedWorker.createdAt))})
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat card for modal
function StatCard({ icon, label, value, suffix, small }: { icon: React.ReactNode; label: string; value: string; suffix?: string; small?: boolean }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={small ? "text-sm font-semibold" : "text-xl font-bold"}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

// Worker type for WorkersView
interface Worker {
  documentId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  systemRole?: string;
  department?: string;
  station?: string;
  isActive?: boolean;
  createdAt?: string;
}

// Worker labels
const WORKER_ROLE_LABELS: Record<string, string> = {
  admin: "Адміністратор",
  manager: "Менеджер",
  chef: "Шеф-кухар",
  cook: "Кухар",
  waiter: "Офіціант",
  host: "Хостес",
  bartender: "Бармен",
  cashier: "Касир",
  viewer: "Гість",
};

const WORKER_ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  chef: "bg-orange-100 text-orange-700",
  cook: "bg-yellow-100 text-yellow-700",
  waiter: "bg-blue-100 text-blue-700",
  host: "bg-pink-100 text-pink-700",
  bartender: "bg-cyan-100 text-cyan-700",
  cashier: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-700",
};

const WORKER_ROLE_AVATAR_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  manager: "bg-purple-500",
  chef: "bg-orange-500",
  cook: "bg-yellow-500",
  waiter: "bg-blue-500",
  host: "bg-pink-500",
  bartender: "bg-cyan-500",
  cashier: "bg-green-500",
  viewer: "bg-gray-500",
};

const WORKER_DEPARTMENT_LABELS: Record<string, string> = {
  management: "Менеджмент",
  kitchen: "Кухня",
  service: "Зал",
  bar: "Бар",
  cleaning: "Клінінг",
  none: "—",
};

// GraphQL query for workers
const GET_ALL_WORKERS_FULL = gql`
  query GetAllWorkersFull {
    usersPermissionsUsers(
      filters: { blocked: { eq: false } }
      sort: ["department:asc", "firstName:asc"]
      pagination: { limit: 100 }
    ) {
      documentId
      username
      firstName
      lastName
      email
      systemRole
      department
      station
      isActive
      createdAt
    }
  }
`;

// Quick stat card component
interface QuickStatCardProps {
  title: string;
  value: string;
  subtext: string;
  status: "good" | "normal" | "warning" | "danger";
}

function QuickStatCard({ title, value, subtext, status }: QuickStatCardProps) {
  const statusColors = {
    good: "border-l-green-500",
    normal: "border-l-blue-500",
    warning: "border-l-amber-500",
    danger: "border-l-red-500",
  };

  return (
    <div
      className={`p-4 bg-card rounded-lg border border-l-4 ${statusColors[status]}`}
    >
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}
