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
import { getUserDisplayName, SYSTEM_ROLE_LABELS } from "@/types/auth";
import { TaskList, TaskForm } from "@/features/dailies/components";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LogOut,
  User,
  BarChart3,
  Loader2,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

export default function DailiesPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button - navigate based on user role */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (user?.systemRole === 'chef' || user?.systemRole === 'cook') {
                  window.location.href = '/kitchen';
                } else {
                  window.location.href = '/pos/waiter';
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Завдання</h1>

            {/* Date navigation */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
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
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loadingMyTasks || loadingTeamTasks}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingMyTasks || loadingTeamTasks ? "animate-spin" : ""
                }`}
              />
            </Button>

            {/* New task */}
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Нове завдання
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback>
                      {user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="w-fit mt-1">
                      {SYSTEM_ROLE_LABELS[user?.systemRole || "viewer"]?.uk}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Профіль
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Статистика
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-error">
                  <LogOut className="mr-2 h-4 w-4" />
                  Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b bg-muted/30">
        <div className="container py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Всього:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Виконано:</span>
              <span className="font-medium text-success">{stats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">В очікуванні:</span>
              <span className="font-medium">{stats.pending}</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Прострочено:</span>
                <span className="font-medium text-error">{stats.overdue}</span>
              </div>
            )}
            {stats.completionRate > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-muted-foreground">Виконання:</span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="my" className="relative">
              Мої завдання
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[20px] px-1.5"
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
                    className="ml-2 h-5 min-w-[20px] px-1.5"
                  >
                    {teamTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my">
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
                emptySubMessage="Натисніть кнопку нижче, щоб створити своє перше завдання"
              />
            )}
          </TabsContent>

          {canViewTeam && (
            <TabsContent value="team">
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
      </main>

      {/* Floating Action Button - Mobile Only */}
      <Button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

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
