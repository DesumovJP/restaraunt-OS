"use client";

/**
 * History Filters Component
 *
 * Filter controls for the action history page.
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTION_LABELS_UK,
  ENTITY_LABELS_UK,
  MODULE_LABELS_UK,
} from "@/lib/config/i18n-labels";
import type { FilterState } from "../history-config";

interface HistoryFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

export function HistoryFilters({ filters, onFilterChange }: HistoryFiltersProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Від</label>
          <Input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange("fromDate", e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">До</label>
          <Input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange("toDate", e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Модуль</label>
          <Select
            value={filters.module}
            onValueChange={(v) => onFilterChange("module", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі модулі</SelectItem>
              {Object.entries(MODULE_LABELS_UK).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Тип сутності
          </label>
          <Select
            value={filters.entityType}
            onValueChange={(v) => onFilterChange("entityType", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі типи</SelectItem>
              {Object.entries(ENTITY_LABELS_UK).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Дія</label>
          <Select
            value={filters.action}
            onValueChange={(v) => onFilterChange("action", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі дії</SelectItem>
              {Object.entries(ACTION_LABELS_UK).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Важливість
          </label>
          <Select
            value={filters.severity}
            onValueChange={(v) => onFilterChange("severity", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі рівні</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
