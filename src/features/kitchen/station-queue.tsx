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
  AlertTriangle,
  Pause,
  ChefHat,
  Flame,
  Users,
  Timer,
  RefreshCw,
} from "lucide-react";
import type { StationType, StationSubTaskStatus } from "@/types/station";
import { CourseBadge } from "@/features/orders/course-selector";
import { CommentDisplay } from "@/features/orders/comment-editor";
import type { CourseType, ItemComment } from "@/types/extended";

// Station configurations
interface StationConfig {
  type: StationType;
  name: string;
  nameUk: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const STATION_CONFIGS: Record<StationType, StationConfig> = {
  hot: {
    type: "hot",
    name: "Hot Kitchen",
    nameUk: "Гарячий цех",
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  cold: {
    type: "cold",
    name: "Cold Kitchen",
    nameUk: "Холодний цех",
    icon: ChefHat,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  pastry: {
    type: "pastry",
    name: "Pastry",
    nameUk: "Кондитерська",
    icon: ChefHat,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  bar: {
    type: "bar",
    name: "Bar",
    nameUk: "Бар",
    icon: ChefHat,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  pass: {
    type: "pass",
    name: "Pass",
    nameUk: "Видача",
    icon: Check,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

// Format duration
function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Task interface
interface StationTask {
  documentId: string;
  orderItemDocumentId: string;
  orderDocumentId: string;
  menuItemName: string;
  quantity: number;
  tableNumber: number;
  courseType: CourseType;
  status: StationSubTaskStatus;
  priority: "normal" | "rush" | "vip";
  priorityScore: number;
  elapsedMs: number;
  targetCompletionMs: number;
  isOverdue: boolean;
  assignedChefName?: string;
  modifiers: string[];
  comment: ItemComment | null;
  createdAt: string;
}

// Station queue panel
interface StationQueueProps {
  stationType: StationType;
  tasks: StationTask[];
  currentLoad: number;
  maxCapacity: number;
  isPaused?: boolean;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onPauseToggle: () => void;
  className?: string;
}

export function StationQueue({
  stationType,
  tasks,
  currentLoad,
  maxCapacity,
  isPaused = false,
  onTaskStart,
  onTaskComplete,
  onTaskPass,
  onPauseToggle,
  className,
}: StationQueueProps) {
  const config = STATION_CONFIGS[stationType];
  const Icon = config.icon;

  const loadPercent = (currentLoad / maxCapacity) * 100;
  const loadStatus =
    loadPercent >= 90 ? "critical" : loadPercent >= 70 ? "warning" : "normal";

  // Group tasks by status
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Sort by priority
  const sortedPending = [...pendingTasks].sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

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
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard
                    key={task.documentId}
                    task={task}
                    isCompleted
                    onReturn={() => onTaskPass(task.documentId)}
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
                  {sortedPending.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {sortedPending.length > 0 ? (
                  sortedPending.map((task) => (
                    <TaskCard
                      key={task.documentId}
                      task={task}
                      onStart={() => onTaskStart(task.documentId)}
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
                {activeTasks.length > 0 ? (
                  activeTasks.map((task) => (
                    <TaskCard
                      key={task.documentId}
                      task={task}
                      onComplete={() => onTaskComplete(task.documentId)}
                      isActive
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

// Individual task card
interface TaskCardProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
}

function TaskCard({
  task,
  isActive = false,
  isCompleted = false,
  onStart,
  onComplete,
  onReturn,
}: TaskCardProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(task.elapsedMs);

  // Update timer for active tasks
  React.useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentElapsed((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const remainingMs = task.targetCompletionMs - currentElapsed;
  const isOverdue = remainingMs < 0;

  const timerColor = isOverdue
    ? "text-danger"
    : remainingMs < 60000
      ? "text-warning"
      : "text-foreground";

  const hasAllergen = task.comment?.presets.some((preset) =>
    ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
  );

  return (
    <div
      className={cn(
        "p-2.5 rounded-lg border transition-all",
        isCompleted
          ? "bg-success/10 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && task.priority === "rush" && "ring-2 ring-danger",
        !isCompleted && task.priority === "vip" && "ring-2 ring-warning"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Стіл {task.tableNumber}
          </Badge>
          <CourseBadge course={task.courseType} size="sm" />
          {task.priority !== "normal" && (
            <Badge
              variant={task.priority === "rush" ? "destructive" : "default"}
              className="text-[10px] px-1.5 py-0"
            >
              {task.priority === "rush" ? "Терміново" : "VIP"}
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
        <div className={cn("font-mono text-xs flex items-center gap-1", timerColor)}>
          <Timer className="h-3 w-3" />
          {isOverdue ? "+" : ""}
          {formatDurationMs(Math.abs(remainingMs))}
        </div>
      </div>

      {/* Item info */}
      <div className="flex items-start gap-2">
        <span className="font-bold text-primary">{task.quantity}x</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{task.menuItemName}</h4>
          {task.modifiers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {task.modifiers.join(", ")}
            </p>
          )}
          {task.comment && (
            <div className="mt-1">
              <CommentDisplay comment={task.comment} size="sm" maxPresets={2} />
            </div>
          )}
        </div>
      </div>

      {/* Assigned chef */}
      {task.assignedChefName && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {task.assignedChefName}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {!isActive && !isCompleted && onStart && (
          <Button size="sm" className="h-7 text-xs" onClick={onStart}>
            <Play className="h-3 w-3 mr-1" />
            Почати
          </Button>
        )}
        {isActive && onComplete && (
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={onComplete}
          >
            <Check className="h-3 w-3 mr-1" />
            Готово
          </Button>
        )}
        {isCompleted && onReturn && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onReturn}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Повернути
          </Button>
        )}
      </div>
    </div>
  );
}

// Station overview grid
interface StationOverviewProps {
  stations: Array<{
    type: StationType;
    taskCount: number;
    currentLoad: number;
    maxCapacity: number;
    isPaused: boolean;
    overdueCount: number;
  }>;
  onSelectStation: (stationType: StationType) => void;
  selectedStation?: StationType;
  className?: string;
}

export function StationOverview({
  stations,
  onSelectStation,
  selectedStation,
  className,
}: StationOverviewProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {stations.map((station) => {
        const config = STATION_CONFIGS[station.type];
        const Icon = config.icon;
        const loadPercent = (station.currentLoad / station.maxCapacity) * 100;
        const isSelected = selectedStation === station.type;

        return (
          <button
            key={station.type}
            onClick={() => onSelectStation(station.type)}
            className={cn(
              "p-3 rounded-lg border text-left transition-all",
              config.bgColor,
              isSelected && "ring-2 ring-primary",
              station.isPaused && "opacity-50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={cn("h-5 w-5", config.color)} />
              {station.overdueCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {station.overdueCount}
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm">{config.nameUk}</h4>
            <p className="text-xs text-muted-foreground">
              {station.taskCount} завдань
            </p>
            <Progress value={loadPercent} className="h-1 mt-2" />
          </button>
        );
      })}
    </div>
  );
}
