"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Play,
  Check,
  Pause,
  ChefHat,
  RefreshCw,
} from "lucide-react";
import type { StationType } from "@/types/station";
import { STATION_DISPLAY_CONFIGS } from "@/lib/config/station-config";

// Extracted components
import {
  type StationTask,
  type StationQueueProps,
  type StationOverviewProps,
  type AllKitchenViewProps,
  groupTasksByTable,
  groupTasksByTableWithStation,
  TableGroupCard,
  AllKitchenTableCard,
} from "./components/station-queue";

// Re-export types for backward compatibility
export type { StationTask, StationQueueProps };

// ==========================================
// STATION QUEUE COMPONENT
// ==========================================

export function StationQueue({
  stationType,
  tasks,
  currentLoad,
  maxCapacity,
  isPaused = false,
  loadingTaskId,
  onTaskStart,
  onTaskComplete,
  onTaskPass,
  onTaskReturn,
  onTaskServed,
  onPauseToggle,
  className,
}: StationQueueProps) {
  const config = STATION_DISPLAY_CONFIGS[stationType];
  const Icon = config.icon;

  const loadPercent = (currentLoad / maxCapacity) * 100;
  const loadStatus =
    loadPercent >= 90 ? "critical" : loadPercent >= 70 ? "warning" : "normal";

  // Group tasks by status
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Group pending and active tasks by table
  const pendingGroups = groupTasksByTable(pendingTasks);
  const activeGroups = groupTasksByTable(activeTasks);
  const completedGroups = groupTasksByTable(completedTasks);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className={cn("pb-3", config.bgColor)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", config.color)} />
            {config.nameUk}
            <Badge variant="secondary" className="ml-1">
              {tasks.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPaused && (
              <Badge variant="destructive" className="gap-1">
                <Pause className="h-3 w-3" />
                Пауза
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPauseToggle}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Load indicator */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Завантаження</span>
            <span
              className={cn(
                "font-medium",
                loadStatus === "critical"
                  ? "text-danger"
                  : loadStatus === "warning"
                    ? "text-warning"
                    : "text-foreground"
              )}
            >
              {currentLoad}/{maxCapacity}
            </span>
          </div>
          <Progress
            value={loadPercent}
            className={cn(
              "h-2",
              loadStatus === "critical"
                ? "[&>div]:bg-danger"
                : loadStatus === "warning"
                  ? "[&>div]:bg-warning"
                  : ""
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-4">
        {/* Special layout for "pass" station - only one column */}
        {stationType === "pass" ? (
          <div className="h-full px-1">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Check className="h-4 w-4 text-success" />
              <h4 className="font-medium text-sm">Готово до видачі</h4>
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success">
                {tasks.length}
              </Badge>
            </div>
            <div className="overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "calc(100% - 48px)" }}>
              {completedGroups.length > 0 ? (
                completedGroups.map((group) => (
                  <TableGroupCard
                    key={`table-${group.tableNumber}`}
                    group={group}
                    isCompleted
                    loadingTaskId={loadingTaskId}
                    onTaskReturn={onTaskReturn}
                    onTaskServed={onTaskServed}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Check className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Немає страв до видачі</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Two-column layout for other stations */
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Column 1: Pending tasks */}
            <div className="flex flex-col min-h-0 pr-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Очікує</h4>
                <Badge variant="secondary" className="ml-auto">
                  {pendingTasks.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {pendingGroups.length > 0 ? (
                  pendingGroups.map((group) => (
                    <TableGroupCard
                      key={`pending-table-${group.tableNumber}`}
                      group={group}
                      loadingTaskId={loadingTaskId}
                      onTaskStart={onTaskStart}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Clock className="h-6 w-6 mb-1 opacity-40" />
                    <p className="text-xs">Немає завдань</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In Progress tasks */}
            <div className="flex flex-col min-h-0 border-l pl-6">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <RefreshCw className="h-4 w-4 text-warning animate-spin" />
                <h4 className="font-medium text-sm">В процесі</h4>
                <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning-foreground">
                  {activeTasks.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {activeGroups.length > 0 ? (
                  activeGroups.map((group) => (
                    <TableGroupCard
                      key={`active-table-${group.tableNumber}`}
                      group={group}
                      isActive
                      loadingTaskId={loadingTaskId}
                      onTaskComplete={onTaskComplete}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 mb-1 opacity-40" />
                    <p className="text-xs">Немає активних</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// STATION OVERVIEW COMPONENT
// ==========================================

export function StationOverview({
  stations,
  onSelectStation,
  selectedStation,
  className,
}: StationOverviewProps) {
  // Calculate totals for "All Kitchen" view
  const totalTasks = stations.reduce((sum, s) => sum + s.taskCount, 0);
  const totalOverdue = stations.reduce((sum, s) => sum + s.overdueCount, 0);
  const totalLoad = stations.reduce((sum, s) => sum + s.currentLoad, 0);
  const totalCapacity = stations.reduce((sum, s) => sum + s.maxCapacity, 0);
  const totalLoadPercent = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;
  const isAllSelected = selectedStation === "all";

  return (
    <div className={cn("space-y-2", className)}>
      {/* "All Kitchen" button */}
      <button
        onClick={() => onSelectStation("all")}
        className={cn(
          "w-full p-3 rounded-lg border text-left transition-all bg-gradient-to-r from-orange-50 to-amber-50",
          isAllSelected && "ring-2 ring-primary"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-sm">Вся кухня</span>
          </div>
          <div className="flex items-center gap-2">
            {totalOverdue > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {totalOverdue}!
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {totalTasks}
            </Badge>
          </div>
        </div>
        <Progress value={totalLoadPercent} className="h-1" />
      </button>

      {/* Individual stations - 5 columns grid */}
      <div className="grid grid-cols-5 gap-2">
        {stations.map((station) => {
          const config = STATION_DISPLAY_CONFIGS[station.type];
          const Icon = config.icon;
          const loadPercent = (station.currentLoad / station.maxCapacity) * 100;
          const isSelected = selectedStation === station.type;

          return (
            <button
              key={station.type}
              onClick={() => onSelectStation(station.type)}
              className={cn(
                "p-3 rounded-lg border text-center transition-all min-h-[100px] flex flex-col",
                config.bgColor,
                isSelected && "ring-2 ring-primary",
                station.isPaused && "opacity-50"
              )}
            >
              {/* Icon + overdue badge */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <Icon className={cn("h-5 w-5", config.color)} />
                {station.overdueCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 min-w-[18px]">
                    {station.overdueCount}
                  </Badge>
                )}
              </div>

              {/* Station name */}
              <h4 className="font-medium text-xs leading-tight mb-1 line-clamp-2">
                {config.nameUk}
              </h4>

              {/* Task count */}
              <div className="mt-auto">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {station.taskCount}
                </Badge>
              </div>

              {/* Progress */}
              <Progress value={loadPercent} className="h-1 mt-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// ALL KITCHEN VIEW COMPONENT
// ==========================================

export function AllKitchenView({
  tasksByStation,
  loadingTaskId,
  onTaskStart,
  onTaskComplete,
  onTaskPass,
  onTaskReturn,
  onTaskServed,
  className,
}: AllKitchenViewProps) {
  // Get active stations (excluding pass for main view)
  const activeStations: StationType[] = ["hot", "cold", "pastry", "bar"];

  // Group all tasks by table for unified view
  const allActiveTasks = activeStations.flatMap((station) =>
    tasksByStation[station]?.filter((t) => t.status !== "completed") || []
  );

  const completedTasks = tasksByStation.pass || [];

  // Group by table
  const tableGroups = groupTasksByTableWithStation(allActiveTasks);
  const completedGroups = groupTasksByTableWithStation(completedTasks);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            Вся кухня
            <Badge variant="secondary" className="ml-1">
              {allActiveTasks.length + completedTasks.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Column 1: Pending */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Очікує</h4>
              <Badge variant="secondary" className="ml-auto">
                {allActiveTasks.filter((t) => t.status === "pending").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {tableGroups
                .filter((g) => g.tasks.some((t) => t.status === "pending"))
                .map((group) => (
                  <AllKitchenTableCard
                    key={`pending-${group.tableNumber}`}
                    group={{
                      ...group,
                      tasks: group.tasks.filter((t) => t.status === "pending"),
                    }}
                    loadingTaskId={loadingTaskId}
                    onTaskStart={onTaskStart}
                  />
                ))}
              {tableGroups.filter((g) => g.tasks.some((t) => t.status === "pending")).length ===
                0 && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <Clock className="h-6 w-6 mb-1 opacity-40" />
                  <p className="text-xs">Немає завдань</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col min-h-0 border-l pl-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <RefreshCw className="h-4 w-4 text-warning animate-spin" />
              <h4 className="font-medium text-sm">В процесі</h4>
              <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning-foreground">
                {allActiveTasks.filter((t) => t.status === "in_progress").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {tableGroups
                .filter((g) => g.tasks.some((t) => t.status === "in_progress"))
                .map((group) => (
                  <AllKitchenTableCard
                    key={`active-${group.tableNumber}`}
                    group={{
                      ...group,
                      tasks: group.tasks.filter((t) => t.status === "in_progress"),
                    }}
                    isActive
                    loadingTaskId={loadingTaskId}
                    onTaskComplete={onTaskComplete}
                  />
                ))}
              {tableGroups.filter((g) => g.tasks.some((t) => t.status === "in_progress"))
                .length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 mb-1 opacity-40" />
                  <p className="text-xs">Немає активних</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Ready (Pass) */}
          <div className="flex flex-col min-h-0 border-l pl-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Check className="h-4 w-4 text-success" />
              <h4 className="font-medium text-sm">Готово</h4>
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success">
                {completedTasks.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {completedGroups.map((group) => (
                <AllKitchenTableCard
                  key={`completed-${group.tableNumber}`}
                  group={group}
                  isCompleted
                  loadingTaskId={loadingTaskId}
                  onTaskReturn={onTaskReturn}
                  onTaskServed={onTaskServed}
                />
              ))}
              {completedGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <Check className="h-6 w-6 mb-1 opacity-40" />
                  <p className="text-xs">Немає готових</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
