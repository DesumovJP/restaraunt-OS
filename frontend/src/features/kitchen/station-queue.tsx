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
  Calendar,
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
  tableOccupiedAt?: string; // When the table was first occupied (for table session time)
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
  // Scheduled order fields
  isScheduled?: boolean;
  scheduledOrderId?: string;
  // Timer tracking timestamps
  startedAt?: string;   // When cooking started
  readyAt?: string;     // When marked as ready (for pickup timer)
  servedAt?: string;    // When served to guest
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
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
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
  onTaskReturn,
  onTaskServed,
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

// Grouped tasks by table
interface TableTaskGroup {
  tableNumber: number;
  tableOccupiedAt?: string;
  tasks: StationTask[];
}

function groupTasksByTable(tasks: StationTask[]): TableTaskGroup[] {
  const groups: Record<number, TableTaskGroup> = {};

  tasks.forEach((task) => {
    if (!groups[task.tableNumber]) {
      groups[task.tableNumber] = {
        tableNumber: task.tableNumber,
        tableOccupiedAt: task.tableOccupiedAt,
        tasks: [],
      };
    }
    groups[task.tableNumber].tasks.push(task);
  });

  // Sort groups by oldest task (priority)
  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map(t => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map(t => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

// Individual task card
interface TaskCardProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
  onServed?: () => void;
}

// Grouped table card props
interface TableGroupCardProps {
  group: TableTaskGroup;
  isActive?: boolean;
  isCompleted?: boolean;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskReturn?: (taskId: string) => void;
  onTaskServed?: (taskId: string) => void;
}

// Format table session time
function formatTableTime(occupiedAt: string): string {
  const start = new Date(occupiedAt).getTime();
  const now = Date.now();
  const diff = now - start;

  if (isNaN(diff) || diff < 0) return "";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}г ${minutes}хв`;
  }
  return `${minutes}хв`;
}

// Table session timer component
function TableSessionTimer({ occupiedAt }: { occupiedAt?: string }) {
  const [tableTime, setTableTime] = React.useState("");

  React.useEffect(() => {
    if (!occupiedAt) return;

    const updateTime = () => {
      setTableTime(formatTableTime(occupiedAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt || !tableTime) return null;

  // Check if table session is long (over 45 minutes)
  const startMs = new Date(occupiedAt).getTime();
  const elapsedMs = Date.now() - startMs;
  const isLong = elapsedMs >= 45 * 60 * 1000;
  const isCritical = elapsedMs >= 60 * 60 * 1000;

  return (
    <span className={cn(
      "text-[10px] font-mono",
      isCritical ? "text-danger" : isLong ? "text-warning" : "text-muted-foreground"
    )}>
      {tableTime}
    </span>
  );
}

// Grouped table card - shows all tasks for one table
function TableGroupCard({
  group,
  isActive = false,
  isCompleted = false,
  onTaskStart,
  onTaskComplete,
  onTaskReturn,
  onTaskServed,
}: TableGroupCardProps) {
  const [pickupWait, setPickupWait] = React.useState(0);

  // Track pickup wait time for completed groups
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    // Get the oldest ready time (longest waiting)
    const readyTimes = group.tasks
      .map((t) => t.readyAt ? new Date(t.readyAt).getTime() : Date.now())
      .filter((t) => !isNaN(t));

    const oldestReadyTime = readyTimes.length > 0 ? Math.min(...readyTimes) : Date.now();
    setPickupWait(Date.now() - oldestReadyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - oldestReadyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, group.tasks]);

  // Check if any task has allergen
  const hasAllergen = group.tasks.some((task) =>
    task.comment?.presets.some((preset) =>
      ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
    )
  );

  // Check if any task is rush/vip
  const hasRush = group.tasks.some((t) => t.priority === "rush");
  const hasVip = group.tasks.some((t) => t.priority === "vip");
  const hasScheduled = group.tasks.some((t) => t.isScheduled);

  // Get max elapsed time for the group header (show longest cooking item)
  const maxElapsedMs = Math.max(...group.tasks.map((t) => t.elapsedMs));
  const maxTargetMs = Math.max(...group.tasks.map((t) => t.targetCompletionMs));
  const isOverdue = maxElapsedMs > maxTargetMs;
  const isWarning = !isOverdue && maxElapsedMs > maxTargetMs * 0.8;
  const timerColor = isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-foreground";

  // Pickup wait thresholds for completed groups
  const pickupWarningMs = 60 * 1000;  // 1 minute
  const pickupOverdueMs = 2 * 60 * 1000; // 2 minutes
  const isPickupOverdue = pickupWait > pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  return (
    <div
      className={cn(
        "rounded-lg border transition-all overflow-hidden",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/5 border-danger"
            : "bg-success/5 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && hasRush && "ring-2 ring-danger",
        !isCompleted && hasVip && !hasRush && "ring-2 ring-warning",
        !isCompleted && isOverdue && !hasRush && !hasVip && "ring-2 ring-danger/50 bg-danger/5",
        isCompleted && isPickupOverdue && "ring-2 ring-danger"
      )}
    >
      {/* Table Header */}
      <div className={cn(
        "px-3 py-2 border-b flex items-center justify-between",
        isCompleted
          ? isPickupOverdue ? "bg-danger/10" : "bg-success/10"
          : isActive ? "bg-primary/10" : "bg-muted/50",
        isOverdue && !isCompleted && "bg-danger/10"
      )}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
            Стіл {group.tableNumber}
          </Badge>
          {group.tableOccupiedAt && (
            <TableSessionTimer occupiedAt={group.tableOccupiedAt} />
          )}
          {hasRush && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Терміново
            </Badge>
          )}
          {hasVip && !hasRush && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              VIP
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {hasScheduled && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-purple-300 text-purple-700 bg-purple-50">
              <Calendar className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {group.tasks.length} {group.tasks.length === 1 ? "страва" : group.tasks.length < 5 ? "страви" : "страв"}
          </Badge>
          {isCompleted ? (
            <div className={cn("font-mono text-xs flex items-center gap-1", pickupTimerColor)}>
              <Clock className="h-3 w-3" />
              {formatDurationMs(pickupWait)}
            </div>
          ) : (
            <div className={cn("font-mono text-xs flex items-center gap-1", timerColor)}>
              <Timer className="h-3 w-3" />
              {formatDurationMs(maxElapsedMs)}
            </div>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div className="divide-y">
        {group.tasks.map((task) => (
          <TaskItemRow
            key={task.documentId}
            task={task}
            isActive={isActive}
            isCompleted={isCompleted}
            onStart={onTaskStart ? () => onTaskStart(task.documentId) : undefined}
            onComplete={onTaskComplete ? () => onTaskComplete(task.documentId) : undefined}
            onReturn={onTaskReturn ? () => onTaskReturn(task.documentId) : undefined}
            onServed={onTaskServed ? () => onTaskServed(task.documentId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// Single task row within a table group
interface TaskItemRowProps {
  task: StationTask;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onReturn?: () => void;
  onServed?: () => void;
}

function TaskItemRow({
  task,
  isActive = false,
  isCompleted = false,
  onStart,
  onComplete,
  onReturn,
  onServed,
}: TaskItemRowProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(task.elapsedMs);
  const [pickupWait, setPickupWait] = React.useState(0);
  const [queueWait, setQueueWait] = React.useState(0);
  const isPending = !isActive && !isCompleted;

  // Update timer for pending tasks (queue wait time)
  React.useEffect(() => {
    if (!isPending) {
      setQueueWait(0);
      return;
    }

    const createdTime = new Date(task.createdAt).getTime();
    setQueueWait(Date.now() - createdTime);

    const interval = setInterval(() => {
      setQueueWait(Date.now() - createdTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPending, task.createdAt]);

  // Update timer for active tasks (calculate from backend startedAt timestamp)
  React.useEffect(() => {
    if (!isActive) return;

    // Use backend startedAt timestamp for accurate time across all clients
    const startedTime = task.startedAt ? new Date(task.startedAt).getTime() : Date.now();
    setCurrentElapsed(Date.now() - startedTime);

    const interval = setInterval(() => {
      setCurrentElapsed(Date.now() - startedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, task.startedAt]);

  // Update pickup wait timer for completed tasks (count UP from 0 when ready)
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTime = task.readyAt ? new Date(task.readyAt).getTime() : Date.now();
    setPickupWait(Date.now() - readyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - readyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, task.readyAt]);

  // Queue wait thresholds (5 min warning, 10 min overdue)
  const queueWarningMs = 5 * 60 * 1000;
  const queueOverdueMs = 10 * 60 * 1000;
  const isQueueOverdue = queueWait > queueOverdueMs;
  const isQueueWarning = !isQueueOverdue && queueWait > queueWarningMs;
  const queueTimerColor = isQueueOverdue
    ? "text-danger font-bold"
    : isQueueWarning
      ? "text-warning"
      : "text-muted-foreground";

  // Cooking time thresholds
  const isOverdue = currentElapsed > task.targetCompletionMs;
  const isWarning = !isOverdue && currentElapsed > task.targetCompletionMs * 0.8;
  const timerColor = isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-primary";

  // Pickup wait thresholds
  const pickupWarningMs = 60 * 1000;  // 1 minute
  const pickupOverdueMs = 2 * 60 * 1000; // 2 minutes
  const isPickupOverdue = pickupWait > pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  const hasAllergen = task.comment?.presets.some((preset) =>
    ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
  );

  return (
    <div className={cn(
      "px-3 py-2 flex items-center gap-3",
      task.priority === "rush" && "bg-danger/5",
      task.priority === "vip" && "bg-warning/5",
      isQueueOverdue && isPending && "bg-warning/10",
      isOverdue && isActive && "bg-danger/10",
      isPickupOverdue && isCompleted && "bg-danger/10"
    )}>
      {/* Quantity & Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-sm">{task.quantity}x</span>
          <span className="font-medium text-sm truncate">{task.menuItemName}</span>
          <CourseBadge course={task.courseType} size="sm" />
          {hasAllergen && (
            <AlertTriangle className="h-3 w-3 text-danger shrink-0" />
          )}
        </div>
        {(task.modifiers.length > 0 || task.comment) && (
          <div className="mt-0.5 flex items-center gap-2">
            {task.modifiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {task.modifiers.join(", ")}
              </p>
            )}
            {task.comment && (
              <CommentDisplay comment={task.comment} size="sm" />
            )}
          </div>
        )}
        {task.assignedChefName && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {task.assignedChefName}
          </div>
        )}
      </div>

      {/* Phase-specific timer with label */}
      <div className={cn(
        "shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
        isPending && "bg-muted/50",
        isActive && (isOverdue ? "bg-danger/10" : "bg-primary/10"),
        isCompleted && (isPickupOverdue ? "bg-danger/10" : "bg-success/10")
      )}>
        {isPending && (
          <>
            <Clock className={cn("h-3.5 w-3.5", queueTimerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">в черзі</span>
              <span className={cn("font-mono font-medium leading-none", queueTimerColor)}>
                {formatDurationMs(queueWait)}
              </span>
            </div>
          </>
        )}
        {isActive && (
          <>
            <Flame className={cn("h-3.5 w-3.5", timerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">готується</span>
              <span className={cn("font-mono font-medium leading-none", timerColor)}>
                {formatDurationMs(currentElapsed)}
              </span>
            </div>
          </>
        )}
        {isCompleted && (
          <>
            <Timer className={cn("h-3.5 w-3.5", pickupTimerColor)} />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground leading-none">очікує</span>
              <span className={cn("font-mono font-medium leading-none", pickupTimerColor)}>
                {formatDurationMs(pickupWait)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isActive && !isCompleted && onStart && (
          <Button size="sm" className="h-7 text-xs" onClick={onStart}>
            <Play className="h-3 w-3 mr-1" />
            Почати
          </Button>
        )}
        {isActive && onComplete && (
          <Button size="sm" variant="default" className="h-7 text-xs" onClick={onComplete}>
            <Check className="h-3 w-3 mr-1" />
            Готово
          </Button>
        )}
        {isCompleted && (
          <>
            {onReturn && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onReturn}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Повернути
              </Button>
            )}
            {onServed && (
              <Button size="sm" variant="default" className="h-7 text-xs bg-success hover:bg-success/90" onClick={onServed}>
                <Check className="h-3 w-3 mr-1" />
                Видано
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isActive = false,
  isCompleted = false,
  onStart,
  onComplete,
  onReturn,
  onServed,
}: TaskCardProps) {
  const [currentElapsed, setCurrentElapsed] = React.useState(task.elapsedMs);
  const [pickupWait, setPickupWait] = React.useState(0);
  const [queueWait, setQueueWait] = React.useState(0);
  const isPending = !isActive && !isCompleted;

  // Update timer for pending tasks (queue wait time)
  React.useEffect(() => {
    if (!isPending) {
      setQueueWait(0);
      return;
    }

    const createdTime = new Date(task.createdAt).getTime();
    setQueueWait(Date.now() - createdTime);

    const interval = setInterval(() => {
      setQueueWait(Date.now() - createdTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPending, task.createdAt]);

  // Update timer for active tasks (calculate from backend startedAt timestamp)
  React.useEffect(() => {
    if (!isActive) return;

    // Use backend startedAt timestamp for accurate time across all clients
    const startedTime = task.startedAt ? new Date(task.startedAt).getTime() : Date.now();
    setCurrentElapsed(Date.now() - startedTime);

    const interval = setInterval(() => {
      setCurrentElapsed(Date.now() - startedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, task.startedAt]);

  // Update pickup wait timer for completed tasks
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTime = task.readyAt ? new Date(task.readyAt).getTime() : Date.now();
    setPickupWait(Date.now() - readyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - readyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, task.readyAt]);

  // Queue wait thresholds
  const queueWarningMs = 5 * 60 * 1000;
  const queueOverdueMs = 10 * 60 * 1000;
  const isQueueOverdue = queueWait > queueOverdueMs;
  const isQueueWarning = !isQueueOverdue && queueWait > queueWarningMs;
  const queueTimerColor = isQueueOverdue
    ? "text-danger font-bold"
    : isQueueWarning
      ? "text-warning"
      : "text-muted-foreground";

  // Cooking time thresholds
  const isOverdue = currentElapsed > task.targetCompletionMs;
  const isWarning = !isOverdue && currentElapsed > task.targetCompletionMs * 0.8;
  const timerColor = isOverdue
    ? "text-danger font-bold"
    : isWarning
      ? "text-warning"
      : "text-primary";

  // Pickup wait thresholds
  const pickupWarningMs = 60 * 1000;
  const pickupOverdueMs = 2 * 60 * 1000;
  const isPickupOverdue = pickupWait > pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  const hasAllergen = task.comment?.presets.some((preset) =>
    ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
  );

  return (
    <div
      className={cn(
        "p-2.5 rounded-lg border transition-all",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/10 border-danger"
            : "bg-success/10 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && task.priority === "rush" && "ring-2 ring-danger",
        !isCompleted && task.priority === "vip" && "ring-2 ring-warning",
        isOverdue && isActive && "bg-danger/10 border-danger",
        isPickupOverdue && isCompleted && "ring-2 ring-danger"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
            <span>Стіл {task.tableNumber}</span>
            {task.tableOccupiedAt && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <TableSessionTimer occupiedAt={task.tableOccupiedAt} />
              </>
            )}
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
          {task.isScheduled && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-purple-300 text-purple-700 bg-purple-50">
              <Calendar className="h-2.5 w-2.5" />
              Заплановане
            </Badge>
          )}
        </div>
        {/* Phase-specific timer with label */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
          isPending && "bg-muted/50",
          isActive && (isOverdue ? "bg-danger/10" : "bg-primary/10"),
          isCompleted && (isPickupOverdue ? "bg-danger/10" : "bg-success/10")
        )}>
          {isPending && (
            <>
              <Clock className={cn("h-3.5 w-3.5", queueTimerColor)} />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground leading-none">в черзі</span>
                <span className={cn("font-mono font-medium leading-none", queueTimerColor)}>
                  {formatDurationMs(queueWait)}
                </span>
              </div>
            </>
          )}
          {isActive && (
            <>
              <Flame className={cn("h-3.5 w-3.5", timerColor)} />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground leading-none">готується</span>
                <span className={cn("font-mono font-medium leading-none", timerColor)}>
                  {formatDurationMs(currentElapsed)}
                </span>
              </div>
            </>
          )}
          {isCompleted && (
            <>
              <Timer className={cn("h-3.5 w-3.5", pickupTimerColor)} />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground leading-none">очікує</span>
                <span className={cn("font-mono font-medium leading-none", pickupTimerColor)}>
                  {formatDurationMs(pickupWait)}
                </span>
              </div>
            </>
          )}
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
              <CommentDisplay comment={task.comment} size="sm" />
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
        {isCompleted && (
          <>
            {onReturn && (
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
            {onServed && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-success hover:bg-success/90"
                onClick={onServed}
              >
                <Check className="h-3 w-3 mr-1" />
                Видано
              </Button>
            )}
          </>
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
  onSelectStation: (stationType: StationType | "all") => void;
  selectedStation?: StationType | "all";
  className?: string;
}

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
          const config = STATION_CONFIGS[station.type];
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

// All Kitchen View - shows tasks from all stations grouped by station
interface AllKitchenViewProps {
  tasksByStation: Record<StationType, StationTask[]>;
  onTaskStart: (taskDocumentId: string) => void;
  onTaskComplete: (taskDocumentId: string) => void;
  onTaskPass: (taskDocumentId: string) => void;
  onTaskReturn?: (taskDocumentId: string) => void;
  onTaskServed?: (taskDocumentId: string) => void;
  className?: string;
}

export function AllKitchenView({
  tasksByStation,
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
                    onTaskStart={onTaskStart}
                  />
                ))}
              {tableGroups.filter((g) => g.tasks.some((t) => t.status === "pending")).length === 0 && (
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
                    onTaskComplete={onTaskComplete}
                  />
                ))}
              {tableGroups.filter((g) => g.tasks.some((t) => t.status === "in_progress")).length === 0 && (
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

// Extended table group with station info
interface TableTaskGroupWithStation extends TableTaskGroup {
  stationTypes: Set<StationType>;
}

function groupTasksByTableWithStation(tasks: (StationTask & { stationType?: StationType })[]): TableTaskGroupWithStation[] {
  const groups: Record<number, TableTaskGroupWithStation> = {};

  tasks.forEach((task) => {
    if (!groups[task.tableNumber]) {
      groups[task.tableNumber] = {
        tableNumber: task.tableNumber,
        tableOccupiedAt: task.tableOccupiedAt,
        tasks: [],
        stationTypes: new Set(),
      };
    }
    groups[task.tableNumber].tasks.push(task);
    if ((task as any).stationType) {
      groups[task.tableNumber].stationTypes.add((task as any).stationType);
    }
  });

  return Object.values(groups).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map((t) => t.priorityScore));
    const bMaxPriority = Math.max(...b.tasks.map((t) => t.priorityScore));
    return bMaxPriority - aMaxPriority;
  });
}

// All Kitchen Table Card - shows station badges
interface AllKitchenTableCardProps {
  group: TableTaskGroupWithStation;
  isActive?: boolean;
  isCompleted?: boolean;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskReturn?: (taskId: string) => void;
  onTaskServed?: (taskId: string) => void;
}

function AllKitchenTableCard({
  group,
  isActive = false,
  isCompleted = false,
  onTaskStart,
  onTaskComplete,
  onTaskReturn,
  onTaskServed,
}: AllKitchenTableCardProps) {
  const [pickupWait, setPickupWait] = React.useState(0);

  // Track pickup wait time for completed groups
  React.useEffect(() => {
    if (!isCompleted) {
      setPickupWait(0);
      return;
    }

    const readyTimes = group.tasks
      .map((t) => t.readyAt ? new Date(t.readyAt).getTime() : Date.now())
      .filter((t) => !isNaN(t));

    const oldestReadyTime = readyTimes.length > 0 ? Math.min(...readyTimes) : Date.now();
    setPickupWait(Date.now() - oldestReadyTime);

    const interval = setInterval(() => {
      setPickupWait(Date.now() - oldestReadyTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, group.tasks]);

  const hasAllergen = group.tasks.some((task) =>
    task.comment?.presets.some((preset) =>
      ["gluten_free", "dairy_free", "nut_free", "shellfish_free"].includes(preset)
    )
  );

  const hasRush = group.tasks.some((t) => t.priority === "rush");
  const hasVip = group.tasks.some((t) => t.priority === "vip");
  const hasScheduled = group.tasks.some((t) => t.isScheduled);

  // Get unique stations for this group
  const taskStations = new Set(group.tasks.map((t) => (t as any).stationType).filter(Boolean));

  // Check if any task is overdue (for card highlighting)
  const hasOverdue = group.tasks.some((t) => t.elapsedMs > t.targetCompletionMs);

  // Pickup wait thresholds
  const pickupWarningMs = 60 * 1000;  // 1 minute
  const pickupOverdueMs = 2 * 60 * 1000; // 2 minutes
  const isPickupOverdue = pickupWait > pickupOverdueMs;
  const isPickupWarning = !isPickupOverdue && pickupWait > pickupWarningMs;
  const pickupTimerColor = isPickupOverdue
    ? "text-danger font-bold"
    : isPickupWarning
      ? "text-warning"
      : "text-success";

  return (
    <div
      className={cn(
        "rounded-lg border transition-all overflow-hidden",
        isCompleted
          ? isPickupOverdue
            ? "bg-danger/5 border-danger"
            : "bg-success/5 border-success/50"
          : isActive
            ? "bg-primary/5 border-primary"
            : "bg-background hover:border-primary/50",
        !isCompleted && hasRush && "ring-2 ring-danger",
        !isCompleted && hasVip && !hasRush && "ring-2 ring-warning",
        !isCompleted && hasOverdue && !hasRush && !hasVip && "ring-2 ring-danger/50 bg-danger/5",
        isCompleted && isPickupOverdue && "ring-2 ring-danger"
      )}
    >
      {/* Table Header */}
      <div className={cn(
        "px-3 py-2 border-b flex items-center justify-between",
        isCompleted
          ? isPickupOverdue ? "bg-danger/10" : "bg-success/10"
          : isActive ? "bg-primary/10" : "bg-muted/50",
        hasOverdue && !isCompleted && "bg-danger/10"
      )}>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
            Стіл {group.tableNumber}
          </Badge>
          {/* Table session time */}
          {group.tableOccupiedAt && (
            <TableSessionTimer occupiedAt={group.tableOccupiedAt} />
          )}
          {/* Station badges */}
          {Array.from(taskStations).map((station) => {
            const config = STATION_CONFIGS[station as StationType];
            if (!config) return null;
            return (
              <Badge
                key={station}
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", config.color)}
              >
                {config.nameUk}
              </Badge>
            );
          })}
          {hasRush && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Терміново
            </Badge>
          )}
          {hasAllergen && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
            </Badge>
          )}
          {hasScheduled && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-purple-300 text-purple-700 bg-purple-50">
              <Calendar className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {group.tasks.length} страв
          </Badge>
          {isCompleted && (
            <div className={cn("font-mono text-xs flex items-center gap-1", pickupTimerColor)}>
              <Clock className="h-3 w-3" />
              {formatDurationMs(pickupWait)}
            </div>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div className="divide-y">
        {group.tasks.map((task) => (
          <TaskItemRow
            key={task.documentId}
            task={task}
            isActive={isActive}
            isCompleted={isCompleted}
            onStart={onTaskStart ? () => onTaskStart(task.documentId) : undefined}
            onComplete={onTaskComplete ? () => onTaskComplete(task.documentId) : undefined}
            onReturn={onTaskReturn ? () => onTaskReturn(task.documentId) : undefined}
            onServed={onTaskServed ? () => onTaskServed(task.documentId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
