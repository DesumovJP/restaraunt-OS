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
import { groupTasksByStatus, DailyTask, CreateTaskInput, UpdateTaskInput } from "@/types/daily-tasks";
import { TaskList, TaskForm } from "@/features/dailies/components";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
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
}

/**
 * Reusable Dailies View component
 * Can be embedded as a tab in Kitchen, POS, or any other interface
 */
export function DailiesView({
  compact = false,
  className,
  hideDateNav = false,
  hideStats = false,
}: DailiesViewProps) {
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
  const [activeTab, setActiveTab] = useState("my");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // Permissions
  const canViewTeam = user ? canViewTeamTasks(user.systemRole) : false;

  // Grouped tasks
  const groupedMyTasks = useMemo(() => groupTasksByStatus(myTasks), [myTasks]);
  const groupedTeamTasks = useMemo(() => groupTasksByStatus(teamTasks), [teamTasks]);

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
      await startTask(documentId);
    },
    [startTask]
  );

  const handleCompleteTask = useCallback(
    async (documentId: string) => {
      await completeTask(documentId);
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

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/95",
        compact && "py-2"
      )}>
        <div className="flex items-center gap-3">
          {/* Date navigation */}
          {!hideDateNav && (
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <button
                className="flex items-center gap-2 px-2 py-1 text-sm font-medium hover:bg-background rounded"
                onClick={() => setSelectedDate(today)}
              >
                <Calendar className="h-4 w-4" />
                <span>{formatDisplayDate(selectedDate)}</span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Stats (inline for compact mode) */}
          {!hideStats && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span>{stats.total} всього</span>
              <span className="text-success">{stats.completed} виконано</span>
              {stats.overdue > 0 && (
                <span className="text-error">{stats.overdue} прострочено</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={loadingMyTasks || loadingTeamTasks}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (loadingMyTasks || loadingTeamTasks) && "animate-spin"
              )}
            />
          </Button>

          {/* New task */}
          <Button size={compact ? "sm" : "default"} onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Нове завдання</span>
            <span className="sm:hidden">Додати</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("p-4", compact && "p-3")}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="my" className="relative">
                Мої
                {pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              {canViewTeam && (
                <TabsTrigger value="team">
                  Команда
                  {teamTasks.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {teamTasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="my" className="mt-0">
              {loadingMyTasks ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskList
                  tasks={myTasks}
                  grouped
                  groupedTasks={groupedMyTasks}
                  onStartTask={handleStartTask}
                  onCompleteTask={handleCompleteTask}
                  onEditTask={handleEditTask}
                  onAddTask={() => setFormOpen(true)}
                  emptyMessage={
                    isToday
                      ? "Немає завдань на сьогодні"
                      : `Немає завдань на ${formatDisplayDate(selectedDate)}`
                  }
                  emptySubMessage="Натисніть кнопку нижче, щоб створити завдання"
                />
              )}
            </TabsContent>

            {canViewTeam && (
              <TabsContent value="team" className="mt-0">
                {loadingTeamTasks ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <TaskList
                    tasks={teamTasks}
                    grouped
                    groupedTasks={groupedTeamTasks}
                    onStartTask={handleStartTask}
                    onCompleteTask={handleCompleteTask}
                    onEditTask={handleEditTask}
                    onAddTask={() => setFormOpen(true)}
                    showAssignee
                    showCreator
                    emptyMessage="Немає завдань команди"
                    emptySubMessage="Створіть завдання для вашої команди"
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
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
