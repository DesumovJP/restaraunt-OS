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
} from "lucide-react";
import { StationQueue, StationOverview } from "@/features/kitchen/station-queue";
import { ChefLeftSidebar, type ChefView } from "@/features/kitchen/chef-left-sidebar";
import { ChefRecipesView } from "@/features/kitchen/chef-recipes-view";
import { PlannedOrdersView } from "@/features/orders/planned-orders-view";
import { useStationEvents } from "@/hooks/use-websocket";
import { useKitchenStore, onTaskStarted, type KitchenTask } from "@/stores/kitchen-store";
import { useInventoryDeduction, storageHistoryApi } from "@/hooks/use-inventory-deduction";
import type { StationType, StationSubTaskStatus } from "@/types/station";

// Station configuration
const STATION_CONFIGS: Array<{
  type: StationType;
  maxCapacity: number;
}> = [
  { type: "hot", maxCapacity: 8 },
  { type: "cold", maxCapacity: 6 },
  { type: "pastry", maxCapacity: 4 },
  { type: "bar", maxCapacity: 8 },
  { type: "pass", maxCapacity: 10 },
];

export default function KitchenDisplayPage() {
  const [selectedStation, setSelectedStation] = React.useState<StationType>("hot");
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

  // User info - в реальному додатку це буде з контексту або API
  const currentUser = {
    name: "Олексій Петренко",
    role: "Шеф-кухар",
    avatar: undefined,
  };

  // Build tasks by station from store - only after hydration to prevent mismatch
  const tasksByStation: Record<StationType, KitchenTask[]> = React.useMemo(() => {
    if (!isHydrated) {
      return { hot: [], cold: [], pastry: [], bar: [], pass: [] };
    }
    return {
      hot: getTasksByStation("hot"),
      cold: getTasksByStation("cold"),
      pastry: getTasksByStation("pastry"),
      bar: getTasksByStation("bar"),
      pass: allTasks.filter((t) => t.status === "completed"), // Pass shows completed items
    };
  }, [allTasks, getTasksByStation, isHydrated]);

  // Build stations data from tasks
  const stations = React.useMemo(() => {
    return STATION_CONFIGS.map((config) => {
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
  const handleTaskStart = (taskDocumentId: string) => {
    updateTaskStatus(taskDocumentId, "in_progress", currentUser.name);
  };

  const handleTaskComplete = (taskDocumentId: string) => {
    updateTaskStatus(taskDocumentId, "completed");
  };

  const handleTaskPass = (taskDocumentId: string) => {
    // Mark as completed (will appear in pass station)
    updateTaskStatus(taskDocumentId, "completed");
  };

  const handleTaskReturn = (taskDocumentId: string) => {
    // Return task from pass station back to in_progress (send back to chef)
    updateTaskStatus(taskDocumentId, "in_progress");
  };

  const handleTaskServed = (taskDocumentId: string) => {
    // Mark as served and remove from queue
    removeTask(taskDocumentId);
    console.log("[Kitchen] Task served and removed:", taskDocumentId);
  };

  const handlePauseToggle = () => {
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

  const currentStation = stations.find((s) => s.type === selectedStation);

  // Navigation items for kitchen page
  const kitchenNavigationItems = [
    { id: 'stations' as ChefView, icon: Flame, label: 'Станції' },
    { id: 'calendar' as ChefView, icon: Calendar, label: 'Заплановані' },
    { id: 'recipes' as ChefView, icon: ChefHat, label: 'Рецепти' },
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
        {/* Recipes View */}
        {activeView === "recipes" ? (
          <ChefRecipesView />
        ) : activeView === "calendar" ? (
          <PlannedOrdersView variant="kitchen" />
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
                    <Button variant="ghost" size="icon" title="Налаштування">
                      <Settings className="h-5 w-5" />
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

                {/* Selected station queue */}
                <div className="lg:col-span-3">
                  <StationQueue
                    stationType={selectedStation}
                    tasks={tasksByStation[selectedStation]}
                    currentLoad={currentStation?.currentLoad || 0}
                    maxCapacity={currentStation?.maxCapacity || 6}
                    isPaused={currentStation?.isPaused || false}
                    onTaskStart={handleTaskStart}
                    onTaskComplete={handleTaskComplete}
                    onTaskPass={handleTaskPass}
                    onTaskReturn={handleTaskReturn}
                    onTaskServed={handleTaskServed}
                    onPauseToggle={handlePauseToggle}
                    className="h-[calc(100vh-180px)]"
                  />
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
