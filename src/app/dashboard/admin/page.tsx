"use client";

import * as React from "react";
import { KPIGrid } from "@/features/kpi/kpi-card";
import { AlertsList } from "@/features/alerts/alerts-list";
import { ActionLogView } from "@/features/kpi/action-log";
import { Button } from "@/components/ui/button";
import { SkeletonKPI } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api";
import { mockActionLogs } from "@/mocks/data";
import { RefreshCw, Calendar } from "lucide-react";
import type { KPI, Alert } from "@/types";

export default function AdminDashboardPage() {
  const [kpis, setKPIs] = React.useState<KPI[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Handle KPI click (navigate to detailed view)
  const handleKPIClick = (kpi: KPI) => {
    // TODO: Navigate to detailed view or show modal
    console.log("KPI clicked:", kpi);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Панель адміністратора</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString("uk-UA", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Оновлено: {lastUpdated.toLocaleTimeString("uk-UA")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={isLoading}
              aria-label="Оновити дані"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-6">
        {/* KPI Section */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="text-lg font-semibold mb-3">
            Ключові показники
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonKPI key={i} />
              ))}
            </div>
          ) : (
            <KPIGrid kpis={kpis} onKPIClick={handleKPIClick} />
          )}
        </section>

        {/* Alerts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <section aria-labelledby="alerts-heading">
            <AlertsList
              alerts={alerts}
              onMarkRead={handleMarkAlertRead}
              onAlertClick={(alert) => {
                if (alert.actionUrl) {
                  // Would navigate in real app
                  console.log("Navigate to:", alert.actionUrl);
                }
              }}
            />
          </section>

          {/* Activity Log */}
          <section aria-labelledby="activity-heading">
            <ActionLogView logs={mockActionLogs} />
          </section>
        </div>

        {/* Quick Stats Grid */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-lg font-semibold mb-3">
            Статистика за сьогодні
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStatCard
              title="Середній час готування"
              value="12.5 хв"
              subtext="Норма: 15 хв"
              status="good"
            />
            <QuickStatCard
              title="Завантаженість кухні"
              value="67%"
              subtext="8 активних тікетів"
              status="normal"
            />
            <QuickStatCard
              title="Відхилень у замовленнях"
              value="2"
              subtext="0.4% від загальної кількості"
              status="good"
            />
            <QuickStatCard
              title="Товарів потребують поповнення"
              value="3"
              subtext="Потребують уваги"
              status="warning"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

// Quick stat card component
interface QuickStatCardProps {
  title: string;
  value: string;
  subtext: string;
  status: "good" | "normal" | "warning" | "danger";
}

function QuickStatCard({ title, value, subtext, status }: QuickStatCardProps) {
  const statusColors = {
    good: "border-l-success",
    normal: "border-l-info",
    warning: "border-l-warning",
    danger: "border-l-danger",
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
