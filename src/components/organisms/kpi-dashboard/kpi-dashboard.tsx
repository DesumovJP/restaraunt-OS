"use client";

import * as React from "react";
import { cn, formatPrice, calculateChange } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/molecules/card/card";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

/**
 * Restaurant OS KPI Dashboard
 *
 * Переваги над конкурентами:
 * - One-screen overview (все видно без скролу)
 * - Clickable KPIs для drill-down
 * - Clear trend indicators
 * - Responsive grid layout
 * - Real-time updates support
 */

// =============================================================================
// TYPES
// =============================================================================

export interface KPIData {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  prefix?: string;
  format?: "number" | "currency" | "percent" | "duration";
  trend?: "up" | "down" | "neutral";
  trendIsPositive?: boolean; // Some metrics are better when down
  target?: number;
  sparklineData?: number[];
}

export interface KPIDashboardProps {
  kpis: KPIData[];
  title?: string;
  isLoading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  onKPIClick?: (kpi: KPIData) => void;
  className?: string;
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

function formatKPIValue(value: number, format: KPIData["format"], prefix?: string, unit?: string): string {
  let formatted: string;

  switch (format) {
    case "currency":
      formatted = formatPrice(value);
      break;
    case "percent":
      formatted = `${value.toFixed(1)}%`;
      break;
    case "duration":
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
      break;
    default:
      formatted = value.toLocaleString("uk-UA");
  }

  if (prefix && format !== "currency") {
    formatted = `${prefix}${formatted}`;
  }
  if (unit && format !== "currency") {
    formatted = `${formatted} ${unit}`;
  }

  return formatted;
}

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================

interface KPICardProps {
  kpi: KPIData;
  onClick?: () => void;
}

function KPICard({ kpi, onClick }: KPICardProps) {
  const change = calculateChange(kpi.value, kpi.previousValue);
  const isPositive = kpi.trendIsPositive ?? kpi.trend === "up";

  const trendColor = change === 0
    ? "text-[#666666]"
    : isPositive
      ? (change > 0 ? "text-[#059669]" : "text-[#E11D48]")
      : (change > 0 ? "text-[#E11D48]" : "text-[#059669]");

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  // Target progress
  const targetProgress = kpi.target
    ? Math.min(100, (kpi.value / kpi.target) * 100)
    : null;

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      elevation="raised"
      className="group"
    >
      <CardContent className="p-4">
        {/* Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#666666]">
            {kpi.label}
          </span>
          {onClick && (
            <ArrowRight
              className="h-4 w-4 text-[#B8AEA5] opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-[#111111] tabular-nums">
            {formatKPIValue(kpi.value, kpi.format, kpi.prefix, kpi.unit)}
          </span>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              change === 0
                ? "bg-[#F1EDE9]"
                : isPositive
                  ? (change > 0 ? "bg-[#D1FAE5]" : "bg-[#FFE4E6]")
                  : (change > 0 ? "bg-[#FFE4E6]" : "bg-[#D1FAE5]"),
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            <span>
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          </div>
          <span className="text-xs text-[#B8AEA5]">vs вчора</span>
        </div>

        {/* Target progress bar */}
        {targetProgress !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#666666] mb-1">
              <span>Ціль</span>
              <span>{targetProgress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-[#E8E2DD] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  targetProgress >= 100
                    ? "bg-[#059669]"
                    : targetProgress >= 70
                      ? "bg-[#4A7C4E]"
                      : targetProgress >= 40
                        ? "bg-[#F59E0B]"
                        : "bg-[#E11D48]"
                )}
                style={{ width: `${Math.min(100, targetProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Mini sparkline */}
        {kpi.sparklineData && kpi.sparklineData.length > 0 && (
          <div className="mt-3 h-8">
            <Sparkline data={kpi.sparklineData} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SPARKLINE COMPONENT
// =============================================================================

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#4A7C4E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export function KPIDashboard({
  kpis,
  title = "Ключові показники",
  isLoading,
  lastUpdated,
  onRefresh,
  onKPIClick,
  className,
}: KPIDashboardProps) {
  return (
    <section className={cn("space-y-4", className)} aria-labelledby="kpi-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 id="kpi-title" className="text-lg font-semibold text-[#111111]">
            {title}
          </h2>
          {lastUpdated && (
            <p className="text-xs text-[#B8AEA5]">
              Оновлено: {lastUpdated.toLocaleTimeString("uk-UA")}
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              "p-2 rounded-lg",
              "text-[#666666] hover:text-[#111111]",
              "hover:bg-[#F1EDE9]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C4E]"
            )}
            aria-label="Оновити дані"
          >
            <RefreshCw
              className={cn("h-5 w-5", isLoading && "animate-spin")}
            />
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div
        className={cn(
          "grid gap-4",
          // Responsive grid
          "grid-cols-2",          // Mobile: 2 columns
          "md:grid-cols-3",       // Tablet: 3 columns
          "lg:grid-cols-4",       // Desktop: 4 columns
          "xl:grid-cols-6",       // Large: 6 columns
        )}
      >
        {isLoading
          ? // Skeleton loading
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} elevation="raised">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-[#E8E2DD] rounded" />
                    <div className="h-8 w-32 bg-[#E8E2DD] rounded" />
                    <div className="h-4 w-16 bg-[#E8E2DD] rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          : // KPI cards
            kpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpi={kpi}
                onClick={onKPIClick ? () => onKPIClick(kpi) : undefined}
              />
            ))}
      </div>
    </section>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { KPICard, Sparkline };
