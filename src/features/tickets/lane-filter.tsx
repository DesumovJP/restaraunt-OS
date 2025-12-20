"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types";

interface LaneFilterProps {
  currentFilter: TicketStatus | "all";
  onFilterChange: (filter: TicketStatus | "all") => void;
  counts: {
    all: number;
    new: number;
    in_progress: number;
    ready: number;
  };
  className?: string;
}

const filterOptions: Array<{
  value: TicketStatus | "all";
  label: string;
  activeColor: string;
}> = [
  { value: "all", label: "Всі", activeColor: "bg-primary text-primary-foreground" },
  { value: "new", label: "Нові", activeColor: "bg-info text-white" },
  { value: "in_progress", label: "В роботі", activeColor: "bg-warning text-white" },
  { value: "ready", label: "Готові", activeColor: "bg-success text-white" },
];

export function LaneFilter({
  currentFilter,
  onFilterChange,
  counts,
  className,
}: LaneFilterProps) {
  return (
    <div
      className={cn("flex gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-1", className)}
      role="tablist"
      aria-label="Фільтр тікетів"
    >
      {filterOptions.map((option) => {
        const isActive = currentFilter === option.value;
        const count = counts[option.value];

        return (
          <Button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tickets-${option.value}`}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5 sm:gap-2 min-w-[80px] sm:min-w-[100px] shrink-0 h-8 sm:h-9 text-xs sm:text-sm",
              isActive && option.activeColor
            )}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className={cn(
                "min-w-[20px] sm:min-w-[24px] justify-center text-[10px] sm:text-xs px-1 sm:px-1.5",
                isActive && "bg-white/20 text-current border-0"
              )}
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
