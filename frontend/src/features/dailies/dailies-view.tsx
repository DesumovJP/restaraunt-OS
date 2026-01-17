"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useDailyTasksStore } from "@/stores/daily-tasks-store";
import {
  useMyTasks,
  useTeamTasks,
  useStartTask,
  useCompleteTask,
  useCreateTask,
  useUpdateTask,
} from "@/hooks/use-daily-tasks";
import { canViewTeamTasks } from "@/lib/task-permissions";
import { groupTasksByStatus, DailyTask, CreateTaskInput, UpdateTaskInput, isTaskOverdue, formatTaskTime } from "@/types/daily-tasks";
import { TaskForm } from "@/features/dailies/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Play,
  Check,
  Clock,
  Timer,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
  User,
  Menu,
  ChefHat,
  Sparkles,
  Package,
  Wrench,
  GraduationCap,
  UtensilsCrossed,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailiesViewProps {
  /** Compact mode for embedding in tabs */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Hide date navigation */
  hideDateNav?: boolean;
  /** Hide stats bar */
  hideStats?: boolean;
  /** Callback to open sidebar */
  onOpenSidebar?: () => void;
  /** Color variant */
  variant?: "default" | "kitchen" | "waiter" | "storage" | "admin";
}

// Priority colors for card pins
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  normal: "bg-blue-500",
  low: "bg-slate-400",
};

const PRIORITY_BG: Record<string, string> = {
  urgent: "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:border-red-300",
  high: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 hover:border-amber-300",
  medium: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300",
  normal: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300",
  low: "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 hover:border-slate-300",
};

// Category icons and colors mapping
import type { TaskCategory } from "@/types/daily-tasks";

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  prep: ChefHat,
  cleaning: Sparkles,
  inventory: Package,
  maintenance: Wrench,
  training: GraduationCap,
  admin: ClipboardList,
  service: UtensilsCrossed,
  other: Pin,
};

const categoryColors: Record<TaskCategory, { bg: string; text: string; border: string }> = {
  prep: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
  cleaning: { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-200" },
  inventory: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
  maintenance: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  training: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
  admin: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
  service: { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
  other: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

// Task Card Component - Enhanced card design
interface TaskCardBoardProps {
  task: DailyTask;
  onStart?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  loading?: boolean;
  showAssignee?: boolean;
}

function TaskCardBoard({ task, onStart, onComplete, onEdit, loading, showAssignee }: TaskCardBoardProps) {
  const isOverdue = isTaskOverdue(task);
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";

  const CategoryIcon = categoryIcons[task.category] || Pin;
  const catColors = categoryColors[task.category] || categoryColors.other;

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border shadow-sm overflow-hidden",
        "transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:-translate-y-1 hover:border-slate-300",
        isOverdue && !isCompleted && "border-red-300 shadow-red-100",
        isInProgress && "border-blue-300 shadow-blue-100 ring-2 ring-blue-100",
        isCompleted && "opacity-60"
      )}
      onClick={onEdit}
    >
      {/* Top color bar based on priority */}
      <div className={cn(
        "h-1.5 w-full",
        task.priority === "urgent" && "bg-gradient-to-r from-red-500 to-red-400",
        task.priority === "high" && "bg-gradient-to-r from-amber-500 to-amber-400",
        task.priority === "normal" && "bg-gradient-to-r from-blue-500 to-blue-400",
        task.priority === "low" && "bg-gradient-to-r from-slate-400 to-slate-300",
      )} />

      {/* Card content */}
      <div className="p-4">
        {/* Header with category and status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Category badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
            catColors.bg, catColors.text
          )}>
            <CategoryIcon className="h-3.5 w-3.5" />
          </div>

          {/* Status badges */}
          {isOverdue && !isCompleted && (
            <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Прострочено
            </div>
          )}
          {isInProgress && (
            <div className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              <Play className="w-3 h-3 fill-current" />
              В роботі
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          "font-semibold text-slate-900 text-base leading-snug mb-2 line-clamp-2",
          isCompleted && "line-through text-slate-500"
        )}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Meta info row */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {task.dueTime && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              isOverdue && !isCompleted
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-600"
            )}>
              <Clock className="w-3 h-3" />
              {task.dueTime.slice(0, 5)}
            </div>
          )}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
              <Timer className="w-3 h-3" />
              {formatTaskTime(task.estimatedMinutes)}
            </div>
          )}
          {showAssignee && task.assignee && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
              <User className="w-3 h-3" />
              {task.assignee.firstName || task.assignee.username}
            </div>
          )}
        </div>

        {/* Action buttons - full width */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Оновлення...</span>
            </div>
          ) : isPending && onStart ? (
            <Button
              size="sm"
              className="flex-1 h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={onStart}
            >
              <Play className="h-4 w-4" />
              Почати виконання
            </Button>
          ) : isInProgress && onComplete ? (
            <Button
              size="sm"
              className="flex-1 h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={onComplete}
            >
              <Check className="h-4 w-4" />
              Позначити виконаним
            </Button>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Завершено
            </div>
          ) : null}
        </div>
      </div>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

/**
 * Reusable Dailies View component - Board Layout
 * Shows tasks as a pinned card board (Kanban-style)
 */
export function DailiesView({
  compact = false,
  className,
  hideDateNav = false,
  hideStats = false,
  onOpenSidebar,
  variant = "default",
}: DailiesViewProps) {
  // Color scheme based on variant
  const colorScheme = variant === "kitchen"
    ? {
        iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
        activeTabBg: "bg-orange-100 text-orange-700",
        pendingTabBg: "bg-amber-100 text-amber-700",
      }
    : variant === "waiter"
    ? {
        iconBg: "bg-gradient-to-br from-slate-700 to-slate-900",
        activeTabBg: "bg-slate-100 text-slate-700",
        pendingTabBg: "bg-amber-100 text-amber-700",
      }
    : variant === "storage"
    ? {
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
        activeTabBg: "bg-emerald-100 text-emerald-700",
        pendingTabBg: "bg-amber-100 text-amber-700",
      }
    : variant === "admin"
    ? {
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
        activeTabBg: "bg-blue-100 text-blue-700",
        pendingTabBg: "bg-amber-100 text-amber-700",
      }
    : {
        iconBg: "bg-gradient-to-br from-indigo-500 to-purple-500",
        activeTabBg: "bg-blue-100 text-blue-700",
        pendingTabBg: "bg-amber-100 text-amber-700",
      };
  const user = useAuthStore((state) => state.user);
  const { stats, selectedDate, setSelectedDate } = useDailyTasksStore();

  // Queries
  const { tasks: myTasks, loading: loadingMyTasks, refetch: refetchMyTasks } = useMyTasks();
  const { tasks: teamTasks, loading: loadingTeamTasks, refetch: refetchTeamTasks } = useTeamTasks();

  // Mutations
  const { startTask } = useStartTask();
  const { completeTask } = useCompleteTask();
  const { createTask, loading: creating } = useCreateTask();
  const { updateTask, loading: updating } = useUpdateTask();

  // Local state
  const [viewMode, setViewMode] = useState<"my" | "team">("my");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // Permissions
  const canViewTeam = user ? canViewTeamTasks(user.systemRole) : false;

  // Current tasks based on view
  const currentTasks = viewMode === "my" ? myTasks : teamTasks;
  const isLoading = viewMode === "my" ? loadingMyTasks : loadingTeamTasks;

  // Grouped tasks for board columns
  const boardColumns = useMemo(() => {
    const grouped = groupTasksByStatus(currentTasks);
    return {
      inProgress: [...grouped.overdue, ...grouped.inProgress],
      pending: grouped.pending,
      completed: grouped.completed,
    };
  }, [currentTasks]);

  // Pending count for badge
  const pendingCount = useMemo(() => {
    return myTasks.filter(
      (t: DailyTask) => t.status === "pending" || t.status === "in_progress"
    ).length;
  }, [myTasks]);

  // Date navigation
  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  const changeDate = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (dateStr === today) return "Сьогодні";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Вчора";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Завтра";

    return date.toLocaleDateString("uk-UA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Handlers
  const handleStartTask = useCallback(
    async (documentId: string) => {
      setLoadingTaskId(documentId);
      await startTask(documentId);
      setLoadingTaskId(null);
    },
    [startTask]
  );

  const handleCompleteTask = useCallback(
    async (documentId: string) => {
      setLoadingTaskId(documentId);
      await completeTask(documentId);
      setLoadingTaskId(null);
    },
    [completeTask]
  );

  const handleEditTask = useCallback((task: DailyTask) => {
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (editingTask) {
      await updateTask(editingTask.documentId, data as UpdateTaskInput);
    } else {
      await createTask(data as CreateTaskInput);
    }
    setEditingTask(null);
    refetchMyTasks();
    if (canViewTeam) refetchTeamTasks();
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTask(null);
  };

  const handleRefresh = () => {
    refetchMyTasks();
    if (canViewTeam) refetchTeamTasks();
  };

  const hasAnyTasks = boardColumns.inProgress.length > 0 || boardColumns.pending.length > 0 || boardColumns.completed.length > 0;

  return (
    <div className={cn("flex flex-col h-full bg-slate-50", className)}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        {/* Row 1: Logo, Title, Actions */}
        <div className={cn(
          "flex items-center justify-between gap-2 px-3 sm:px-4 py-2",
          compact && "py-1.5"
        )}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {onOpenSidebar && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={onOpenSidebar}
                aria-label="Меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorScheme.iconBg)}>
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold leading-tight">Завдання</h1>
                {!hideDateNav && (
                  <p className="text-xs text-muted-foreground">{formatDisplayDate(selectedDate)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Date navigation */}
            {!hideDateNav && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => changeDate(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => changeDate(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>

            {/* New task */}
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1 h-8 sm:h-9 px-2 sm:px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Нове</span>
            </Button>
          </div>
        </div>

        {/* Row 2: View toggle (only if team view available) */}
        {canViewTeam && (
          <div className="flex items-center gap-2 px-3 sm:px-4 pb-2">
            <div className="flex items-center rounded-lg border bg-slate-100 p-0.5">
              <button
                onClick={() => setViewMode("my")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                  viewMode === "my"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span>Мої</span>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setViewMode("team")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                  viewMode === "team"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Команда</span>
              </button>
            </div>

            {/* Stats - desktop only */}
            {!hideStats && (
              <div className="hidden md:flex items-center gap-3 text-sm ml-auto">
                <span className="text-slate-500">{stats.total} всього</span>
                <span className="text-emerald-600 font-medium">{stats.completed} виконано</span>
                {stats.overdue > 0 && (
                  <span className="text-red-600 font-medium">{stats.overdue} прострочено</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="px-4 pt-3 pb-2 bg-white border-b">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === "active"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Play className="h-4 w-4" />
            Активні
            {(boardColumns.inProgress.length + boardColumns.pending.length) > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 h-5 min-w-[20px] px-1.5 text-xs",
                  activeTab === "active" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                )}
              >
                {boardColumns.inProgress.length + boardColumns.pending.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Виконані
            {boardColumns.completed.length > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 h-5 min-w-[20px] px-1.5 text-xs",
                  activeTab === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                )}
              >
                {boardColumns.completed.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !hasAnyTasks ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
              {isToday ? "Немає завдань на сьогодні" : `Немає завдань на ${formatDisplayDate(selectedDate)}`}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-4">
              Створіть завдання, щоб організувати свій робочий день
            </p>
            <Button onClick={() => setFormOpen(true)} className="gap-2 rounded-xl shadow-sm">
              <Plus className="h-4 w-4" />
              Створити завдання
            </Button>
          </div>
        ) : activeTab === "active" ? (
          /* Active Tasks - Card Grid */
          <div className="space-y-6">
            {/* In Progress Section */}
            {boardColumns.inProgress.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
                    <Play className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-sm">В роботі</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {boardColumns.inProgress.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {boardColumns.inProgress.map((task) => (
                    <TaskCardBoard
                      key={task.documentId}
                      task={task}
                      onStart={() => handleStartTask(task.documentId)}
                      onComplete={() => handleCompleteTask(task.documentId)}
                      onEdit={() => handleEditTask(task)}
                      loading={loadingTaskId === task.documentId}
                      showAssignee={viewMode === "team"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Section */}
            {boardColumns.pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold text-sm">Очікує</span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {boardColumns.pending.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {boardColumns.pending.map((task) => (
                    <TaskCardBoard
                      key={task.documentId}
                      task={task}
                      onStart={() => handleStartTask(task.documentId)}
                      onComplete={() => handleCompleteTask(task.documentId)}
                      onEdit={() => handleEditTask(task)}
                      loading={loadingTaskId === task.documentId}
                      showAssignee={viewMode === "team"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for active */}
            {boardColumns.inProgress.length === 0 && boardColumns.pending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">
                  Всі завдання виконано!
                </p>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Чудова робота! Створіть нові завдання або перегляньте виконані.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("completed")} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Переглянути виконані
                  </Button>
                  <Button onClick={() => setFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Нове завдання
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completed Tasks - Compact List */
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold text-sm">Виконані завдання</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {boardColumns.completed.length}
              </Badge>
            </div>

            {boardColumns.completed.length > 0 ? (
              <div className="bg-white rounded-xl border divide-y">
                {boardColumns.completed.map((task) => (
                  <div
                    key={task.documentId}
                    onClick={() => handleEditTask(task)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {/* Completed icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 line-through truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        {task.dueTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueTime.slice(0, 5)}
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatTaskTime(task.estimatedMinutes)}
                          </span>
                        )}
                        {viewMode === "team" && task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee.firstName || task.assignee.username}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority indicator */}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <ClipboardList className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">
                  Ще немає виконаних завдань
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Виконані завдання з&apos;являться тут
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <TaskForm
        open={formOpen}
        onOpenChange={handleFormClose}
        task={editingTask}
        onSubmit={handleFormSubmit}
        loading={creating || updating}
      />
    </div>
  );
}

export default DailiesView;
