"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Flame,
  ChefHat,
  Check,
  Snowflake,
  Cake,
  Wine,
} from "lucide-react";
import type { StationType } from "@/types/station";

// Extended type for station selector that includes "all"
type StationSelectorValue = StationType | "all";

interface StationSelectorProps {
  currentStation: StationSelectorValue;
  onStationChange: (station: StationSelectorValue) => void;
  counts?: Record<StationType, number>;
  className?: string;
}

const stations: Array<{
  value: StationSelectorValue;
  label: string;
  labelUk: string;
  icon?: React.ElementType;
  color?: string;
}> = [
  { value: "all", label: "All Stations", labelUk: "Всі станції" },
  { value: "grill", label: "Grill", labelUk: "Гриль", icon: Flame, color: "text-red-600" },
  { value: "fry", label: "Fry", labelUk: "Фритюр", icon: Flame, color: "text-orange-600" },
  { value: "saute", label: "Sauté", labelUk: "Соте", icon: ChefHat, color: "text-amber-600" },
  { value: "cold", label: "Cold", labelUk: "Холодний цех", icon: Snowflake, color: "text-blue-600" },
  { value: "pastry", label: "Pastry", labelUk: "Кондитерська", icon: Cake, color: "text-pink-600" },
  { value: "plating", label: "Plating", labelUk: "Сервірування", icon: ChefHat, color: "text-purple-600" },
  { value: "bar", label: "Bar", labelUk: "Бар", icon: Wine, color: "text-cyan-600" },
  { value: "pass", label: "Pass", labelUk: "Видача", icon: Check, color: "text-green-600" },
];

export function StationSelector({
  currentStation,
  onStationChange,
  counts,
  className,
}: StationSelectorProps) {
  return (
    <div
      className={cn("flex gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar", className)}
      role="tablist"
      aria-label="Вибір станції"
    >
      {stations.map((station) => {
        const isActive = currentStation === station.value;
        const Icon = station.icon;
        const count = station.value !== "all" && counts ? counts[station.value as StationType] : undefined;

        return (
          <Button
            key={station.value}
            role="tab"
            aria-selected={isActive}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5 shrink-0 h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap",
              isActive && "bg-primary text-primary-foreground"
            )}
            onClick={() => onStationChange(station.value)}
          >
            {Icon && (
              <Icon className={cn("h-3.5 w-3.5", !isActive && station.color)} />
            )}
            {station.labelUk}
            {count !== undefined && count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Export the type for use in parent components
export type { StationSelectorValue };












