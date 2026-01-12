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
  variant?: "default" | "kitchen" | "waiter";
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

// Task Card Component - Pinned note style
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

  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const cardBg = isCompleted
    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-200"
    : isOverdue
    ? "bg-gradient-to-br from-red-50 to-red-100/30 border-red-300 ring-1 ring-red-200"
    : isInProgress
    ? "bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-300 ring-2 ring-blue-200"
    : PRIORITY_BG[task.priority] || PRIORITY_BG.medium;

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-4 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        "animate-fade-in-up",
        cardBg,
        isCompleted && "opacity-70"
      )}
      onClick={onEdit}
    >
      {/* Priority Pin */}
      <div
        className={cn(
          "absolute -top-2 left-4 w-4 h-4 rounded-full shadow-md",
          priorityColor
        )}
      />

      {/* Overdue indicator */}
      {isOverdue && !isCompleted && (
        <div className="absolute -top-2 right-4 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          <AlertTriangle className="w-3 h-3" />
          Прострочено
        </div>
      )}

      {/* In Progress indicator */}
      {isInProgress && (
        <div className="absolute -top-2 right-4 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
          <Play className="w-3 h-3 fill-current" />
          В роботі
        </div>
      )}

      {/* Content */}
      <div className="pt-2">
        <h3 className={cn(
          "font-semibold text-slate-900 leading-snug mb-2",
          isCompleted && "line-through text-slate-500"
        )}>
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {task.dueTime && (
            <span className={cn(
              "flex items-center gap-1",
              isOverdue && !isCompleted && "text-red-600 font-medium"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {task.dueTime.slice(0, 5)}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {formatTaskTime(task.estimatedMinutes)}
            </span>
          )}
          {showAssignee && task.assignee && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {task.assignee.firstName || task.assignee.username}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : isPending && onStart ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              onClick={onStart}
            >
              <Play className="h-3.5 w-3.5" />
              Почати
            </Button>
          ) : isInProgress && onComplete ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={onComplete}
            >
              <Check className="h-3.5 w-3.5" />
              Виконано
            </Button>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Завершено
            </div>
          ) : null}
        </div>
      </div>
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Всі завдання виконано!
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mb-4">
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <ClipboardList className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ще немає виконаних завдань
                </h3>
                <p className="text-slate-500 text-sm max-w-sm">
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
