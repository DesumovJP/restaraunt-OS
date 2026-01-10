"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LayoutGrid, Table2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ViewMode, ViewToggleProps } from "@/types/storage-ui";
import { VIEW_MODE_LABELS } from "@/types/storage-ui";

// ==========================================
// VIEW CONFIG
// ==========================================

const VIEW_CONFIG: Record<
  ViewMode,
  { icon: React.ElementType; label: string }
> = {
  cards: { icon: LayoutGrid, label: VIEW_MODE_LABELS.cards },
  table: { icon: Table2, label: VIEW_MODE_LABELS.table },
};

// ==========================================
// VIEW TOGGLE COMPONENT
// ==========================================

/**
 * Toggle between view modes (cards, table)
 */
export function ViewToggle({ value, onChange, disabled }: ViewToggleProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center border rounded-lg p-1 gap-0.5 bg-muted/50",
          disabled && "opacity-50 pointer-events-none"
        )}
        role="radiogroup"
        aria-label="Режим перегляду"
      >
        {(Object.keys(VIEW_CONFIG) as ViewMode[]).map((mode) => {
          const { icon: Icon, label } = VIEW_CONFIG[mode];
          const isActive = value === mode;

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onChange(mode)}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isActive
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// ==========================================
// VIEW MODE DROPDOWN (Alternative)
// ==========================================

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ViewModeSelectProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

/**
 * Dropdown variant for smaller screens
 */
export function ViewModeSelect({ value, onChange, disabled }: ViewModeSelectProps) {
  const { icon: CurrentIcon, label } = VIEW_CONFIG[value];

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ViewMode)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[130px]">
        <div className="flex items-center gap-2">
          <CurrentIcon className="h-4 w-4" />
          <SelectValue>{label}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(VIEW_CONFIG) as ViewMode[]).map((mode) => {
          const { icon: Icon, label } = VIEW_CONFIG[mode];
          return (
            <SelectItem key={mode} value={mode}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
