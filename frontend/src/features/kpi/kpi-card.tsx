"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, calculateChange } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import type { KPI } from "@/types";

interface KPICardProps {
  kpi: KPI;
  onClick?: () => void;
  className?: string;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success-light",
    label: "зростання",
  },
  down: {
    icon: TrendingDown,
    color: "text-danger",
    bgColor: "bg-danger-light",
    label: "зниження",
  },
  stable: {
    icon: Minus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "без змін",
  },
};

export function KPICard({ kpi, onClick, className }: KPICardProps) {
  const trend = trendConfig[kpi.trend];
  const TrendIcon = trend.icon;
  const change = calculateChange(kpi.value, kpi.previousValue);

  // Determine if the trend is positive (depends on KPI type)
  // For some KPIs like "write-offs", down is positive
  const isPositiveTrend =
    kpi.category === "inventory"
      ? kpi.trend === "down" // Less write-offs is good
      : kpi.trend === "up";

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-card-hover active:scale-[0.98]",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${kpi.name}: ${kpi.value}${kpi.unit}`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          {kpi.name}
          {onClick && (
            <ArrowRight
              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {typeof kpi.value === "number"
              ? kpi.value.toLocaleString("uk-UA")
              : kpi.value}
          </span>
          {kpi.unit && (
            <span className="text-lg text-muted-foreground">{kpi.unit}</span>
          )}
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              isPositiveTrend ? "bg-success-light text-success" : "bg-danger-light text-danger",
              kpi.trend === "stable" && "bg-muted text-muted-foreground"
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            <span>
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground">vs вчора</span>
        </div>
      </CardContent>
    </Card>
  );
}

// KPI Grid for displaying multiple KPIs
interface KPIGridProps {
  kpis: KPI[];
  onKPIClick?: (kpi: KPI) => void;
  className?: string;
}

export function KPIGrid({ kpis, onKPIClick, className }: KPIGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4",
        className
      )}
    >
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          onClick={onKPIClick ? () => onKPIClick(kpi) : undefined}
        />
      ))}
    </div>
  );
}
