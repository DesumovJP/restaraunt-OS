"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Receipt,
  Users,
  Banknote,
  TrendingUp,
  Clock,
  Utensils,
  Coins,
  Target,
} from "lucide-react";
import { useWaiterStats } from "@/hooks/use-waiter-stats";

interface WaiterShiftStatsProps {
  waiterId: string | null;
  shiftStartTime?: Date;
  className?: string;
  variant?: "full" | "compact";
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate shift duration
function getShiftDuration(startTime: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}г ${minutes}хв`;
  }
  return `${minutes}хв`;
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  highlight,
  className,
}: {
  icon: typeof Receipt;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-xl transition-all",
        highlight
          ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200"
          : "bg-slate-50 hover:bg-slate-100",
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center",
            highlight ? "bg-emerald-500 text-white" : "bg-white shadow-sm text-slate-600"
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        {trend && trend !== "neutral" && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5",
              trend === "up"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {trend === "up" ? "↑" : "↓"}
          </Badge>
        )}
      </div>
      <div className="space-y-0.5">
        <p
          className={cn(
            "text-xl sm:text-2xl font-bold tabular-nums",
            highlight ? "text-emerald-700" : "text-slate-900"
          )}
        >
          {value}
          {unit && (
            <span className="text-sm sm:text-base font-medium text-slate-400 ml-0.5">
              {unit}
            </span>
          )}
        </p>
        <p className={cn("text-xs", highlight ? "text-emerald-600" : "text-slate-500")}>
          {label}
        </p>
      </div>
    </div>
  );
}

// Loading skeleton
function StatsSkeleton({ variant }: { variant: "full" | "compact" }) {
  const count = variant === "full" ? 6 : 4;
  return (
    <div className={cn("grid gap-3", variant === "full" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WaiterShiftStats({
  waiterId,
  shiftStartTime,
  className,
  variant = "full",
}: WaiterShiftStatsProps) {
  const { stats, isLoading, error } = useWaiterStats(waiterId);
  const [shiftDuration, setShiftDuration] = React.useState("");

  // Update shift duration every minute
  React.useEffect(() => {
    if (!shiftStartTime) return;

    const updateDuration = () => {
      setShiftDuration(getShiftDuration(shiftStartTime));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);
    return () => clearInterval(interval);
  }, [shiftStartTime]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            Статистика зміни
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsSkeleton variant={variant} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-500">Не вдалося завантажити статистику</p>
        </CardContent>
      </Card>
    );
  }

  const isCompact = variant === "compact";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Статистика зміни
          </CardTitle>
          {shiftStartTime && shiftDuration && (
            <Badge variant="outline" className="text-xs bg-slate-50">
              <Clock className="h-3 w-3 mr-1" />
              {shiftDuration}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div
          className={cn(
            "grid gap-3",
            isCompact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {/* Orders count */}
          <StatCard
            icon={Receipt}
            label="Замовлень"
            value={stats.ordersCount}
          />

          {/* Tables served */}
          <StatCard
            icon={Utensils}
            label="Столів"
            value={stats.tablesCount}
          />

          {/* Average check */}
          <StatCard
            icon={Target}
            label="Середній чек"
            value={formatCurrency(stats.averageCheck)}
            unit="₴"
          />

          {/* Tips - highlighted */}
          <StatCard
            icon={Coins}
            label="Чайові"
            value={formatCurrency(stats.totalTips)}
            unit="₴"
            highlight={stats.totalTips > 0}
          />

          {/* Only show these in full variant */}
          {!isCompact && (
            <>
              {/* Guests served */}
              <StatCard
                icon={Users}
                label="Гостей"
                value={stats.guestsServed}
              />

              {/* Total revenue */}
              <StatCard
                icon={Banknote}
                label="Загальна сума"
                value={formatCurrency(stats.totalRevenue)}
                unit="₴"
              />
            </>
          )}
        </div>

        {/* Summary row for compact variant */}
        {isCompact && stats.ordersCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Загальна сума</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(stats.totalRevenue)} ₴
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.ordersCount === 0 && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl text-center">
            <p className="text-sm text-slate-500">
              Сьогодні ще немає закритих замовлень
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Статистика оновиться після оплати першого замовлення
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WaiterShiftStats;
