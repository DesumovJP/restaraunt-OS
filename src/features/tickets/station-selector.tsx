"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KitchenStation } from "@/types";

interface StationSelectorProps {
  currentStation: KitchenStation;
  onStationChange: (station: KitchenStation) => void;
  className?: string;
}

const stations: Array<{
  value: KitchenStation;
  label: string;
}> = [
  { value: "all", label: "Всі станції" },
  { value: "grill", label: "Grill" },
  { value: "fry", label: "Fry Station" },
  { value: "salad", label: "Salad Bar" },
  { value: "dessert", label: "Dessert" },
];

export function StationSelector({
  currentStation,
  onStationChange,
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
            {station.label}
          </Button>
        );
      })}
    </div>
  );
}






