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
  ChevronRight,
  Flame,
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
  const [activeTab, setActiveTab] = React.useState<"pending" | "active" | "completed">("pending");

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

  // Tab data for mobile switcher
  const tabs = [
    { id: "pending" as const, label: "Очікує", count: pendingTasks.length, icon: Clock },
    { id: "active" as const, label: "Готується", count: activeTasks.length, icon: Flame },
    { id: "completed" as const, label: "Готово", count: completedTasks.length, icon: Check },
  ];

  return (
    <Card className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header - Compact on mobile */}
      <CardHeader className={cn("pb-2 sm:pb-3 px-3 sm:px-4", config.bgColor)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
            <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-colors", config.color)} />
            <span className="truncate">{config.nameUk}</span>
            <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs sm:text-sm h-5 sm:h-6 px-1.5 sm:px-2">
              {tasks.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isPaused && (
              <Badge variant="destructive" className="gap-0.5 sm:gap-1 text-xs px-1.5 sm:px-2 h-5 sm:h-6">
                <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Пауза</span>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 touch-feedback rounded-xl"
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

        {/* Load indicator - Compact */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
            <span className="text-muted-foreground">Завантаження</span>
            <span
              className={cn(
                "font-medium tabular-nums",
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
              "h-1.5 sm:h-2 transition-all",
              loadStatus === "critical"
                ? "[&>div]:bg-danger"
                : loadStatus === "warning"
                  ? "[&>div]:bg-warning"
                  : ""
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 sm:p-4">
        {/* Special layout for "pass" station - single column */}
        {stationType === "pass" ? (
          <div className="h-full p-3 sm:px-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b shrink-0">
              <Check className="h-4 w-4 text-success" />
              <h4 className="font-medium text-sm">Готово до видачі</h4>
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success text-xs">
                {tasks.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 scroll-smooth flex flex-col">
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
                <div className="flex flex-col items-center justify-center flex-1 min-h-[140px] text-muted-foreground">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                    <Check className="h-6 w-6 sm:h-7 sm:w-7 text-success/50" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium">Немає страв до видачі</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Tab switcher - touch-friendly with 48px minimum height */}
            <div className="flex lg:hidden border-b bg-muted/30">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3.5 min-h-[48px] text-sm font-medium transition-all relative touch-feedback",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <TabIcon className={cn(
                      "h-4 w-4",
                      tab.id === "active" && isActive && "animate-pulse text-warning"
                    )} />
                    <span>{tab.label}</span>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={cn(
                        "h-5 px-1.5 text-[11px] min-w-[22px]",
                        isActive && tab.id === "active" && "bg-warning text-warning-foreground"
                      )}
                    >
                      {tab.count}
                    </Badge>
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile: Single column view based on active tab */}
            <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth flex flex-col">
              {activeTab === "pending" && (
                pendingGroups.length > 0 ? (
                  pendingGroups.map((group) => (
                    <TableGroupCard
                      key={`pending-table-${group.tableNumber}`}
                      group={group}
                      loadingTaskId={loadingTaskId}
                      onTaskStart={onTaskStart}
                    />
                  ))
                ) : (
                  <EmptyColumn icon={Clock} message="Немає завдань в черзі" />
                )
              )}
              {activeTab === "active" && (
                activeGroups.length > 0 ? (
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
                  <EmptyColumn icon={Flame} message="Немає активних завдань" />
                )
              )}
              {activeTab === "completed" && (
                completedGroups.length > 0 ? (
                  completedGroups.map((group) => (
                    <TableGroupCard
                      key={`completed-table-${group.tableNumber}`}
                      group={group}
                      isCompleted
                      loadingTaskId={loadingTaskId}
                      onTaskReturn={onTaskReturn}
                      onTaskServed={onTaskServed}
                    />
                  ))
                ) : (
                  <EmptyColumn icon={Check} message="Немає готових страв" variant="success" />
                )
              )}
            </div>

            {/* Desktop: Two-column layout */}
            <div className="hidden lg:grid grid-cols-2 gap-4 sm:gap-6 h-full p-4">
              {/* Column 1: Pending tasks */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Очікує</h4>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {pendingTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
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
                    <EmptyColumn icon={Clock} message="Немає завдань" size="sm" />
                  )}
                </div>
              </div>

              {/* Column 2: In Progress tasks */}
              <div className="flex flex-col min-h-0 border-l pl-4 sm:pl-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <RefreshCw className="h-4 w-4 text-warning animate-spin" />
                  <h4 className="font-medium text-sm">В процесі</h4>
                  <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning-foreground text-xs">
                    {activeTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
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
                    <EmptyColumn icon={RefreshCw} message="Немає активних" size="sm" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state component - centers both horizontally and vertically
function EmptyColumn({
  icon: Icon,
  message,
  size = "md",
  variant = "default"
}: {
  icon: React.ElementType;
  message: string;
  size?: "sm" | "md";
  variant?: "default" | "success";
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-muted-foreground flex-1 min-h-[120px]",
      size === "sm" ? "min-h-[80px]" : "min-h-[120px]"
    )}>
      <div className={cn(
        "rounded-xl flex items-center justify-center mb-2",
        size === "sm" ? "w-10 h-10" : "w-12 h-12",
        variant === "success" ? "bg-success/10" : "bg-muted"
      )}>
        <Icon className={cn(
          "opacity-50",
          size === "sm" ? "h-5 w-5" : "h-6 w-6",
          variant === "success" && "text-success"
        )} />
      </div>
      <p className={cn("font-medium", size === "sm" ? "text-[11px]" : "text-xs")}>{message}</p>
    </div>
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
    <div className={cn("space-y-2 sm:space-y-3", className)}>
      {/* "All Kitchen" button - Premium design */}
      <button
        onClick={() => onSelectStation("all")}
        className={cn(
          "w-full p-3 sm:p-4 rounded-xl border text-left transition-all touch-feedback",
          "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
          "hover:shadow-md active:scale-[0.99]",
          isAllSelected && "ring-2 ring-orange-500 shadow-md"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm sm:text-base text-slate-900">Вся кухня</span>
              <p className="text-[10px] sm:text-xs text-slate-500">Всі станції</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {totalOverdue > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 animate-pulse">
                {totalOverdue}!
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6 bg-white/60">
              {totalTasks}
            </Badge>
            <ChevronRight className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              isAllSelected && "rotate-90"
            )} />
          </div>
        </div>
        <Progress value={totalLoadPercent} className="h-1.5" />
      </button>

      {/* Individual stations - Horizontal scroll on mobile, grid on desktop */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 scrollbar-hide">
        <div className="flex sm:grid sm:grid-cols-3 gap-2 min-w-max sm:min-w-0">
          {stations.map((station) => {
            const config = STATION_DISPLAY_CONFIGS[station.type];
            const Icon = config.icon;
            const loadPercent = (station.currentLoad / station.maxCapacity) * 100;
            const isSelected = selectedStation === station.type;
            const hasOverdue = station.overdueCount > 0;

            return (
              <button
                key={station.type}
                onClick={() => onSelectStation(station.type)}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl border text-center transition-all touch-feedback",
                  "min-w-[90px] sm:min-w-0 flex flex-col",
                  "hover:shadow-sm active:scale-[0.98]",
                  config.bgColor,
                  isSelected && "ring-2 ring-primary shadow-md",
                  station.isPaused && "opacity-50 grayscale",
                  hasOverdue && !station.isPaused && "ring-2 ring-danger/50"
                )}
              >
                {/* Icon + badges row */}
                <div className="flex items-center justify-center gap-1 mb-1.5 sm:mb-2">
                  <div className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-white shadow-sm" : "bg-white/60"
                  )}>
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-colors", config.color)} />
                  </div>
                </div>

                {/* Station name */}
                <h4 className="font-medium text-[11px] sm:text-xs leading-tight mb-1 line-clamp-1">
                  {config.nameUk}
                </h4>

                {/* Badges row */}
                <div className="flex items-center justify-center gap-1 mt-auto">
                  {hasOverdue && (
                    <Badge variant="destructive" className="text-[9px] sm:text-[10px] px-1 py-0 h-4 min-w-[16px] animate-pulse">
                      {station.overdueCount}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4">
                    {station.taskCount}
                  </Badge>
                </div>

                {/* Progress bar */}
                <Progress
                  value={loadPercent}
                  className={cn(
                    "h-1 mt-2",
                    loadPercent >= 90 && "[&>div]:bg-danger",
                    loadPercent >= 70 && loadPercent < 90 && "[&>div]:bg-warning"
                  )}
                />
              </button>
            );
          })}
        </div>
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
  const [activeTab, setActiveTab] = React.useState<"pending" | "active" | "completed">("pending");

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

  // Count by status
  const pendingCount = allActiveTasks.filter((t) => t.status === "pending").length;
  const activeCount = allActiveTasks.filter((t) => t.status === "in_progress").length;
  const completedCount = completedTasks.length;

  // Tab data
  const tabs = [
    { id: "pending" as const, label: "Очікує", count: pendingCount, icon: Clock },
    { id: "active" as const, label: "Готується", count: activeCount, icon: Flame },
    { id: "completed" as const, label: "Готово", count: completedCount, icon: Check },
  ];

  // Filter groups by status
  const pendingGroups = tableGroups.filter((g) => g.tasks.some((t) => t.status === "pending"));
  const activeGroups = tableGroups.filter((g) => g.tasks.some((t) => t.status === "in_progress"));

  return (
    <Card className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span>Вся кухня</span>
            <Badge variant="secondary" className="ml-0.5 text-xs sm:text-sm h-5 sm:h-6 px-1.5 sm:px-2 bg-white/60">
              {allActiveTasks.length + completedTasks.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>

      {/* Mobile: Tab switcher */}
      <div className="flex lg:hidden border-b bg-muted/30">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all relative",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <TabIcon className={cn(
                "h-3.5 w-3.5",
                tab.id === "active" && isActive && "animate-pulse text-warning"
              )} />
              <span>{tab.label}</span>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "h-4 px-1 text-[10px] min-w-[18px]",
                  isActive && tab.id === "active" && "bg-warning text-warning-foreground",
                  isActive && tab.id === "completed" && "bg-success text-white"
                )}
              >
                {tab.count}
              </Badge>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      <CardContent className="flex-1 overflow-hidden p-0">
        {/* Mobile: Single column view */}
        <div className="lg:hidden h-full overflow-y-auto p-3 space-y-2 scroll-smooth flex flex-col">
          {activeTab === "pending" && (
            pendingGroups.length > 0 ? (
              pendingGroups.map((group) => (
                <AllKitchenTableCard
                  key={`pending-${group.tableNumber}`}
                  group={{
                    ...group,
                    tasks: group.tasks.filter((t) => t.status === "pending"),
                  }}
                  loadingTaskId={loadingTaskId}
                  onTaskStart={onTaskStart}
                />
              ))
            ) : (
              <EmptyColumn icon={Clock} message="Немає завдань в черзі" />
            )
          )}
          {activeTab === "active" && (
            activeGroups.length > 0 ? (
              activeGroups.map((group) => (
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
              ))
            ) : (
              <EmptyColumn icon={Flame} message="Немає активних завдань" />
            )
          )}
          {activeTab === "completed" && (
            completedGroups.length > 0 ? (
              completedGroups.map((group) => (
                <AllKitchenTableCard
                  key={`completed-${group.tableNumber}`}
                  group={group}
                  isCompleted
                  loadingTaskId={loadingTaskId}
                  onTaskReturn={onTaskReturn}
                  onTaskServed={onTaskServed}
                />
              ))
            ) : (
              <EmptyColumn icon={Check} message="Немає готових страв" variant="success" />
            )
          )}
        </div>

        {/* Desktop: Three-column layout */}
        <div className="hidden lg:grid grid-cols-3 gap-4 h-full p-4">
          {/* Column 1: Pending */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Очікує</h4>
              <Badge variant="secondary" className="ml-auto text-xs">
                {pendingCount}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
              {pendingGroups.map((group) => (
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
              {pendingGroups.length === 0 && (
                <EmptyColumn icon={Clock} message="Немає завдань" size="sm" />
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col min-h-0 border-l pl-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <RefreshCw className="h-4 w-4 text-warning animate-spin" />
              <h4 className="font-medium text-sm">В процесі</h4>
              <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning-foreground text-xs">
                {activeCount}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
              {activeGroups.map((group) => (
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
              {activeGroups.length === 0 && (
                <EmptyColumn icon={RefreshCw} message="Немає активних" size="sm" />
              )}
            </div>
          </div>

          {/* Column 3: Ready (Pass) */}
          <div className="flex flex-col min-h-0 border-l pl-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Check className="h-4 w-4 text-success" />
              <h4 className="font-medium text-sm">Готово</h4>
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success text-xs">
                {completedCount}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
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
                <EmptyColumn icon={Check} message="Немає готових" size="sm" variant="success" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
