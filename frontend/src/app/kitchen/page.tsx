"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Maximize2,
  Volume2,
  VolumeX,
  Bell,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ChefHat,
  Menu,
  Calendar,
  User,
  LogOut,
  ListTodo,
} from "lucide-react";
import { StationQueue, StationOverview, AllKitchenView } from "@/features/kitchen/station-queue";
import { ChefLeftSidebar, type ChefView } from "@/features/kitchen/chef-left-sidebar";
import { ChefRecipesView } from "@/features/kitchen/chef-recipes-view";
import { PlannedOrdersView } from "@/features/orders/planned-orders-view";
import { DailiesView } from "@/features/dailies";
import { WorkersChat } from "@/features/admin/workers-chat";
import { WorkerProfileCard } from "@/features/profile";
import { useStationEvents } from "@/hooks/use-websocket";
import { useKitchenStore, onTaskStarted, type KitchenTask, type BackendKitchenTicket } from "@/stores/kitchen-store";
import { useInventoryDeduction, storageHistoryApi } from "@/hooks/use-inventory-deduction";
import {
  useStartTicket,
  useCompleteTicket,
  useCancelTicket,
  useServeTicket,
  useKitchenQueue,
} from "@/hooks/use-graphql-kitchen";
import type { StationType, StationSubTaskStatus } from "@/types/station";
import { STATION_CAPACITY_CONFIGS } from "@/lib/config/station-config";

export default function KitchenDisplayPage() {
  const [selectedStation, setSelectedStation] = React.useState<StationType | "all">("all");
  const [isSoundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setFullscreen] = React.useState(false);
  const [pausedStations, setPausedStations] = React.useState<Set<StationType>>(new Set());
  const [activeView, setActiveView] = React.useState<ChefView>("stations");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState<string>("");
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Force re-render trigger for updating elapsed times
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Hydration and time updates
  React.useEffect(() => {
    setIsHydrated(true);
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh task display every 30 seconds to update elapsed times
  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to task started events for inventory deduction logging
  React.useEffect(() => {
    const unsubscribe = onTaskStarted((task, chefName) => {
      // Log the deduction to history (actual FIFO would require storage context)
      console.log("[Kitchen] Task started, logging to history:", task.menuItemName);
      storageHistoryApi.addEntry({
        operationType: "use",
        productDocumentId: `menu_${task.documentId}`,
        productName: task.menuItemName,
        quantity: task.quantity,
        unit: "pcs",
        orderDocumentId: task.orderDocumentId,
        menuItemName: task.menuItemName,
        operatorName: chefName || task.assignedChefName,
        operatorRole: "chef",
        notes: `Почато приготування (${task.stationType})`,
      });
    });
    return unsubscribe;
  }, []);

  // Kitchen store - real orders from POS
  const allTasks = useKitchenStore((state) => state.tasks);
  const updateTaskStatus = useKitchenStore((state) => state.updateTaskStatus);
  const removeTask = useKitchenStore((state) => state.removeTask);
  const getTasksByStation = useKitchenStore((state) => state.getTasksByStation);
  const syncFromBackend = useKitchenStore((state) => state.syncFromBackend);
  const lastSyncedAt = useKitchenStore((state) => state.lastSyncedAt);

  // Fetch kitchen tickets from backend
  const { tickets: backendTickets, loading: loadingTickets, refetch: refetchTickets } = useKitchenQueue();

  // Sync backend tickets to store on initial load and when data changes
  React.useEffect(() => {
    if (!loadingTickets && backendTickets && backendTickets.length > 0) {
      syncFromBackend(backendTickets as BackendKitchenTicket[]);
    }
  }, [backendTickets, loadingTickets, syncFromBackend]);

  // Periodic polling every 10 seconds to keep data fresh
  React.useEffect(() => {
    const pollInterval = setInterval(() => {
      refetchTickets({ requestPolicy: "network-only" });
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [refetchTickets]);

  // GraphQL mutations for backend kitchen tickets
  const { startTicket, loading: startingTicket } = useStartTicket();
  const { completeTicket, loading: completingTicket } = useCompleteTicket();
  const { cancelTicket, loading: cancellingTicket } = useCancelTicket();
  const { serveTicket, loading: servingTicket } = useServeTicket();

  // Error state for showing notifications
  const [ticketError, setTicketError] = React.useState<string | null>(null);

  // Loading state - track which specific ticket is being processed
  const [loadingTaskId, setLoadingTaskId] = React.useState<string | null>(null);

  // User info - в реальному додатку це буде з контексту або API
  const currentUser = {
    name: "Олексій Петренко",
    role: "Шеф-кухар",
    avatar: undefined,
  };

  // Build tasks by station from store - only after hydration to prevent mismatch
  const tasksByStation: Record<StationType, KitchenTask[]> = React.useMemo(() => {
    if (!isHydrated) {
      return { hot: [], cold: [], pastry: [], bar: [], pass: [], grill: [], fry: [], saute: [], plating: [] };
    }
    return {
      hot: getTasksByStation("hot"),
      cold: getTasksByStation("cold"),
      pastry: getTasksByStation("pastry"),
      bar: getTasksByStation("bar"),
      pass: allTasks.filter((t) => t.status === "completed"), // Pass shows completed items
      grill: getTasksByStation("grill"),
      fry: getTasksByStation("fry"),
      saute: getTasksByStation("saute"),
      plating: getTasksByStation("plating"),
    };
  }, [allTasks, getTasksByStation, isHydrated]);

  // Build stations data from tasks
  const stations = React.useMemo(() => {
    return STATION_CAPACITY_CONFIGS.map((config) => {
      const stationTasks = tasksByStation[config.type];
      const activeTasks = stationTasks.filter((t) => t.status === "in_progress");
      const overdueTasks = stationTasks.filter((t) => t.isOverdue);

      return {
        type: config.type,
        taskCount: stationTasks.length,
        currentLoad: activeTasks.length,
        maxCapacity: config.maxCapacity,
        isPaused: pausedStations.has(config.type),
        overdueCount: overdueTasks.length,
      };
    });
  }, [tasksByStation, pausedStations]);

  // Real-time updates for selected station
  useStationEvents(selectedStation, {
    onTaskCreated: (event) => {
      console.log("New task:", event);
      if (isSoundEnabled) {
        // Play notification sound
        const audio = new Audio("/sounds/new-order.mp3");
        audio.play().catch(() => {});
      }
    },
    onTaskCompleted: (event) => {
      console.log("Task completed:", event);
    },
    onLoadChanged: (event) => {
      console.log("Load changed:", event);
    },
    onOverloadWarning: (event) => {
      console.log("Overload warning:", event);
    },
  });

  // Handlers
  const handleTaskStart = async (taskDocumentId: string) => {
    // Prevent double-clicks
    if (loadingTaskId) return;

    setTicketError(null);
    setLoadingTaskId(taskDocumentId);
    console.log("[Kitchen] Starting task:", taskDocumentId);

    // Call backend FIRST - backend is source of truth
    try {
      const result = await startTicket(taskDocumentId);
      console.log("[Kitchen] Start result:", JSON.stringify(result, null, 2));

      if (result.success) {
        console.log("[Kitchen] Ticket started via backend:", {
          ticketId: taskDocumentId,
          consumedBatches: result.consumedBatches,
          startedAt: result.ticket?.startedAt,
        });

        // Update local store only after backend confirms success
        const backendTimestamps = result.ticket?.startedAt
          ? { startedAt: result.ticket.startedAt }
          : undefined;
        updateTaskStatus(taskDocumentId, "in_progress", currentUser.name, backendTimestamps);

        // Log consumed batches for analytics
        if (result.consumedBatches && result.consumedBatches.length > 0) {
          console.log("[Inventory] FIFO deduction completed:", {
            batches: result.consumedBatches.length,
            totalCost: result.consumedBatches.reduce((sum, b) => sum + b.cost, 0),
          });
        }
      } else {
        // Backend error - show to user, don't update local
        console.error("[Kitchen] Start failed:", result.error);
        const errorMsg = result.error?.message || "Помилка при запуску";
        setTicketError(errorMsg);
      }
    } catch (err) {
      console.error("[Kitchen] Start error:", err);
      setTicketError(`Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleTaskComplete = async (taskDocumentId: string) => {
    // Prevent double-clicks
    if (loadingTaskId) return;

    setTicketError(null);
    setLoadingTaskId(taskDocumentId);
    console.log("[Kitchen] Completing task:", taskDocumentId);

    // Call backend FIRST - backend is source of truth
    try {
      const result = await completeTicket(taskDocumentId);
      console.log("[Kitchen] Complete result:", JSON.stringify(result, null, 2));

      if (result.success) {
        console.log("[Kitchen] Ticket completed via backend:", {
          ticketId: taskDocumentId,
          completedAt: result.ticket?.completedAt,
        });

        // Update local store only after backend confirms success
        const backendTimestamps = result.ticket?.completedAt
          ? { completedAt: result.ticket.completedAt }
          : undefined;
        updateTaskStatus(taskDocumentId, "completed", undefined, backendTimestamps);
      } else {
        // Backend error - show to user, don't update local
        console.error("[Kitchen] Complete failed:", result.error);
        const errorMsg = result.error?.message || "Помилка при завершенні";
        setTicketError(errorMsg);
      }
    } catch (err) {
      console.error("[Kitchen] Complete error:", err);
      setTicketError(`Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleTaskPass = async (taskDocumentId: string) => {
    // Mark as completed (will appear in pass station)
    await handleTaskComplete(taskDocumentId);
  };

  const handleTaskReturn = async (taskDocumentId: string) => {
    // Return task from pass station back to in_progress (send back to chef)
    console.log("[Kitchen] Returning task to in_progress:", taskDocumentId);

    // Update local store immediately for UI feedback
    updateTaskStatus(taskDocumentId, "in_progress");

    // TODO: Add backend endpoint for "return" action to update Strapi
    // For now, this is UI-only which may cause sync issues between workers
    // The ticket will revert to "ready" on next poll from Strapi
  };

  const handleTaskServed = async (taskDocumentId: string) => {
    // Prevent double-clicks
    if (loadingTaskId) return;

    setLoadingTaskId(taskDocumentId);
    console.log("[Kitchen] Serving task:", taskDocumentId);

    // Call backend FIRST to mark as served - this updates Strapi
    try {
      const result = await serveTicket(taskDocumentId);
      console.log("[Kitchen] Serve result:", JSON.stringify(result, null, 2));

      if (result.success) {
        console.log("[Kitchen] Task served via backend:", {
          ticketId: taskDocumentId,
          pickupWaitSeconds: (result as any).pickupWaitSeconds,
          orderServed: (result as any).orderServed,
        });

        // Only remove from local store after backend confirms success
        removeTask(taskDocumentId);
        console.log("[Kitchen] Task removed from local store:", taskDocumentId);

        // Force refetch after a delay to sync the new state
        setTimeout(() => {
          refetchTickets({ requestPolicy: "network-only" });
        }, 500);
      } else {
        // Log full result for debugging
        console.error("[Kitchen] Backend serve failed - full result:", result);
        const errorMsg = result.error?.message
          || result.error?.details?.error?.message
          || (typeof result.error === 'string' ? result.error : null)
          || 'Невідома помилка. Можливо тікет вже видано або має невірний статус.';
        setTicketError(`Помилка при видачі: ${errorMsg}`);
      }
    } catch (err) {
      console.error("[Kitchen] Backend serve error:", err);
      setTicketError(`Помилка при видачі: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (ticketError) {
      const timer = setTimeout(() => setTicketError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [ticketError]);

  const handlePauseToggle = () => {
    if (selectedStation === "all") return; // Can't pause "all" view
    setPausedStations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(selectedStation)) {
        newSet.delete(selectedStation);
      } else {
        newSet.add(selectedStation);
      }
      return newSet;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Statistics - only calculate after hydration
  const totalTasks = isHydrated ? allTasks.filter((t) => t.status !== "completed").length : 0;
  const activeTasks = isHydrated ? allTasks.filter((t) => t.status === "in_progress").length : 0;
  const overdueTasks = isHydrated ? allTasks.filter((t) => t.isOverdue).length : 0;

  const currentStation = selectedStation === "all" ? null : stations.find((s) => s.type === selectedStation);

  // Navigation items for kitchen page (chat and schedule are added by sidebar's additionalViewItems)
  const kitchenNavigationItems = [
    { id: 'stations' as ChefView, icon: Flame, label: 'Станції' },
    { id: 'calendar' as ChefView, icon: Calendar, label: 'Заплановані' },
    { id: 'recipes' as ChefView, icon: ChefHat, label: 'Рецепти' },
    { id: 'dailies' as ChefView, icon: ListTodo, label: 'Завдання' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar Navigation */}
      <ChefLeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Шеф-кухар"
        userRole="Кухня"
        activeView={activeView}
        onViewChange={setActiveView}
        navigationItems={kitchenNavigationItems}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* View Switcher */}
        {activeView === "recipes" ? (
          <ChefRecipesView />
        ) : activeView === "calendar" ? (
          <PlannedOrdersView variant="kitchen" />
        ) : activeView === "dailies" ? (
          <DailiesView compact className="h-full" />
        ) : activeView === "chat" ? (
          <div className="flex-1 overflow-hidden p-4">
            <WorkersChat />
          </div>
        ) : activeView === "schedule" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-full shadow-sm mb-4">
              <span className="font-medium text-sm">В розробці</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Графік змін</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Тут ви зможете переглядати графік змін команди. Функція редагування доступна лише адміністраторам.
            </p>
          </div>
        ) : activeView === "profile" ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-md mx-auto w-full">
              <WorkerProfileCard
                worker={{
                  documentId: 'chef-1',
                  name: 'Олександр Петренко',
                  role: 'chef',
                  department: 'kitchen',
                  status: 'active',
                  phone: '+380 67 987 6543',
                  email: 'chef@restaurant.com',
                  hoursThisWeek: 40,
                  hoursThisMonth: 160,
                  shiftsThisWeek: 5,
                  shiftsThisMonth: 20,
                  rating: 4.9,
                  avgTicketTime: 8,
                }}
                variant="full"
                onViewSchedule={() => setActiveView('schedule')}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Stations View - Header */}
            <header className="sticky top-0 z-40 bg-background border-b safe-top">
              <div className="px-3 sm:px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Mobile menu button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden h-9 w-9"
                      onClick={() => setIsSidebarOpen(true)}
                      aria-label="Меню"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                      <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
                        Кухня
                      </h1>
                      {isHydrated && currentTime && (
                        <Badge variant="outline" className="text-sm">
                          {currentTime}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{totalTasks} в черзі</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="h-4 w-4 text-warning animate-spin" />
                        <span className="text-sm font-medium">{activeTasks} активних</span>
                      </div>
                      {overdueTasks > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-danger" />
                          <span className="text-sm font-medium text-danger">
                            {overdueTasks} прострочено
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSoundEnabled(!isSoundEnabled)}
                      title={isSoundEnabled ? "Вимкнути звук" : "Увімкнути звук"}
                    >
                      {isSoundEnabled ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      title="На весь екран"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>

                    {/* User Profile */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-label="Профіль користувача"
                      >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          {currentUser.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          )}
                        </div>
                      </Button>
                      
                      {/* User Menu Dropdown */}
                      {isUserMenuOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsUserMenuOpen(false)}
                          />
                          {/* Menu */}
                          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-lg z-50">
                            <div className="p-4 border-b border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                  {currentUser.avatar ? (
                                    <img
                                      src={currentUser.avatar}
                                      alt={currentUser.name}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {currentUser.name}
                                  </p>
                                  <p className="text-xs text-slate-600 truncate">
                                    {currentUser.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-sm"
                                onClick={() => {
                                  // TODO: Navigate to profile settings
                                  setIsUserMenuOpen(false);
                                }}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Налаштування профілю
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-sm text-danger hover:text-danger hover:bg-danger/10"
                                onClick={() => {
                                  // TODO: Handle logout
                                  setIsUserMenuOpen(false);
                                }}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Вийти
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Error notification banner */}
            {ticketError && (
              <div className="mx-4 mt-2 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{ticketError}</span>
                <button
                  onClick={() => setTicketError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Station overview */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Станції</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StationOverview
                        stations={stations}
                        onSelectStation={setSelectedStation}
                        selectedStation={selectedStation}
                        className="grid-cols-2"
                      />
                    </CardContent>
                  </Card>

                  {/* Alerts */}
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Сповіщення
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {overdueTasks > 0 && (
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-danger/10 text-sm">
                            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-danger">
                                {overdueTasks} прострочених завдань
                              </p>
                              <p className="text-xs text-danger/80">
                                Потрібна увага
                              </p>
                            </div>
                          </div>
                        )}
                        {stations.some((s) => s.isPaused) && (
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 text-sm">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-warning-foreground">
                                Станція на паузі
                              </p>
                              <p className="text-xs text-warning-foreground/80">
                                {stations.filter((s) => s.isPaused).map((s) => s.type).join(", ")}
                              </p>
                            </div>
                          </div>
                        )}
                        {overdueTasks === 0 && !stations.some((s) => s.isPaused) && (
                          <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            Все працює нормально
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Selected station queue or All Kitchen view */}
                <div className="lg:col-span-3">
                  {selectedStation === "all" ? (
                    <AllKitchenView
                      tasksByStation={tasksByStation}
                      loadingTaskId={loadingTaskId}
                      onTaskStart={handleTaskStart}
                      onTaskComplete={handleTaskComplete}
                      onTaskPass={handleTaskPass}
                      onTaskReturn={handleTaskReturn}
                      onTaskServed={handleTaskServed}
                      className="h-[calc(100vh-180px)]"
                    />
                  ) : (
                    <StationQueue
                      stationType={selectedStation}
                      tasks={tasksByStation[selectedStation]}
                      currentLoad={currentStation?.currentLoad || 0}
                      maxCapacity={currentStation?.maxCapacity || 6}
                      isPaused={currentStation?.isPaused || false}
                      loadingTaskId={loadingTaskId}
                      onTaskStart={handleTaskStart}
                      onTaskComplete={handleTaskComplete}
                      onTaskPass={handleTaskPass}
                      onTaskReturn={handleTaskReturn}
                      onTaskServed={handleTaskServed}
                      onPauseToggle={handlePauseToggle}
                      className="h-[calc(100vh-180px)]"
                    />
                  )}
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
