"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { StationType, StationSubTaskStatus } from "@/types/station";
import type { CourseType, ItemComment } from "@/types/extended";

// Mock data for demonstration
const MOCK_STATIONS: Array<{
  type: StationType;
  taskCount: number;
  currentLoad: number;
  maxCapacity: number;
  isPaused: boolean;
  overdueCount: number;
}> = [
  { type: "hot", taskCount: 5, currentLoad: 4, maxCapacity: 8, isPaused: false, overdueCount: 1 },
  { type: "cold", taskCount: 3, currentLoad: 2, maxCapacity: 6, isPaused: false, overdueCount: 0 },
  { type: "pastry", taskCount: 2, currentLoad: 1, maxCapacity: 4, isPaused: false, overdueCount: 0 },
  { type: "bar", taskCount: 4, currentLoad: 2, maxCapacity: 8, isPaused: false, overdueCount: 0 },
  { type: "pass", taskCount: 3, currentLoad: 3, maxCapacity: 10, isPaused: false, overdueCount: 0 },
];

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

const MOCK_TASKS: Record<StationType, StationTask[]> = {
  hot: [
    {
      documentId: "task_1",
      orderItemDocumentId: "item_1",
      orderDocumentId: "order_1",
      menuItemName: "Стейк Рібай",
      quantity: 2,
      tableNumber: 5,
      courseType: "main",
      status: "in_progress",
      priority: "normal",
      priorityScore: 50,
      elapsedMs: 420000,
      targetCompletionMs: 600000,
      isOverdue: false,
      assignedChefName: "Олексій",
      modifiers: ["Medium Rare"],
      comment: { text: "", presets: ["no_garlic"], visibility: ["kitchen"], createdAt: "", updatedAt: "", authorId: "", authorName: "" },
      createdAt: new Date(Date.now() - 420000).toISOString(),
    },
    {
      documentId: "task_2",
      orderItemDocumentId: "item_2",
      orderDocumentId: "order_2",
      menuItemName: "Бургер Classic",
      quantity: 1,
      tableNumber: 3,
      courseType: "main",
      status: "pending",
      priority: "rush",
      priorityScore: 90,
      elapsedMs: 180000,
      targetCompletionMs: 480000,
      isOverdue: false,
      modifiers: ["Без цибулі", "Екстра сир"],
      comment: null,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    },
    {
      documentId: "task_3",
      orderItemDocumentId: "item_3",
      orderDocumentId: "order_1",
      menuItemName: "Курячі крильця BBQ",
      quantity: 3,
      tableNumber: 5,
      courseType: "appetizer",
      status: "pending",
      priority: "normal",
      priorityScore: 40,
      elapsedMs: 120000,
      targetCompletionMs: 480000,
      isOverdue: false,
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      documentId: "task_4",
      orderItemDocumentId: "item_4",
      orderDocumentId: "order_3",
      menuItemName: "Картопля фрі",
      quantity: 2,
      tableNumber: 7,
      courseType: "main",
      status: "in_progress",
      priority: "normal",
      priorityScore: 45,
      elapsedMs: 180000,
      targetCompletionMs: 300000,
      isOverdue: false,
      assignedChefName: "Марія",
      modifiers: ["Велика порція"],
      comment: null,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    },
    {
      documentId: "task_10",
      orderItemDocumentId: "item_10",
      orderDocumentId: "order_4",
      menuItemName: "Паста Карбонара",
      quantity: 1,
      tableNumber: 2,
      courseType: "main",
      status: "completed",
      priority: "vip",
      priorityScore: 85,
      elapsedMs: 540000,
      targetCompletionMs: 600000,
      isOverdue: false,
      assignedChefName: "Олексій",
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 540000).toISOString(),
    },
  ],
  cold: [
    {
      documentId: "task_5",
      orderItemDocumentId: "item_5",
      orderDocumentId: "order_2",
      menuItemName: "Салат Цезар",
      quantity: 1,
      tableNumber: 3,
      courseType: "appetizer",
      status: "pending",
      priority: "normal",
      priorityScore: 60,
      elapsedMs: 240000,
      targetCompletionMs: 420000,
      isOverdue: false,
      modifiers: ["Без анчоусів"],
      comment: { text: "", presets: ["gluten_free"], visibility: ["kitchen"], createdAt: "", updatedAt: "", authorId: "", authorName: "" },
      createdAt: new Date(Date.now() - 240000).toISOString(),
    },
    {
      documentId: "task_8",
      orderItemDocumentId: "item_8",
      orderDocumentId: "order_6",
      menuItemName: "Грецький салат",
      quantity: 2,
      tableNumber: 4,
      courseType: "appetizer",
      status: "in_progress",
      priority: "normal",
      priorityScore: 55,
      elapsedMs: 120000,
      targetCompletionMs: 300000,
      isOverdue: false,
      assignedChefName: "Ірина",
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      documentId: "task_11",
      orderItemDocumentId: "item_11",
      orderDocumentId: "order_7",
      menuItemName: "Карпачо з лосося",
      quantity: 1,
      tableNumber: 8,
      courseType: "appetizer",
      status: "completed",
      priority: "normal",
      priorityScore: 50,
      elapsedMs: 180000,
      targetCompletionMs: 240000,
      isOverdue: false,
      assignedChefName: "Ірина",
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    },
  ],
  pastry: [
    {
      documentId: "task_6",
      orderItemDocumentId: "item_6",
      orderDocumentId: "order_4",
      menuItemName: "Тірамісу",
      quantity: 2,
      tableNumber: 2,
      courseType: "dessert",
      status: "pending",
      priority: "normal",
      priorityScore: 40,
      elapsedMs: 60000,
      targetCompletionMs: 300000,
      isOverdue: false,
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      documentId: "task_12",
      orderItemDocumentId: "item_12",
      orderDocumentId: "order_8",
      menuItemName: "Чізкейк",
      quantity: 1,
      tableNumber: 6,
      courseType: "dessert",
      status: "in_progress",
      priority: "normal",
      priorityScore: 45,
      elapsedMs: 90000,
      targetCompletionMs: 180000,
      isOverdue: false,
      assignedChefName: "Аня",
      modifiers: ["Без глютену"],
      comment: null,
      createdAt: new Date(Date.now() - 90000).toISOString(),
    },
  ],
  bar: [
    {
      documentId: "task_9",
      orderItemDocumentId: "item_9",
      orderDocumentId: "order_5",
      menuItemName: "Мохіто",
      quantity: 2,
      tableNumber: 9,
      courseType: "drink",
      status: "pending",
      priority: "normal",
      priorityScore: 50,
      elapsedMs: 60000,
      targetCompletionMs: 180000,
      isOverdue: false,
      modifiers: ["Без цукру"],
      comment: null,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      documentId: "task_13",
      orderItemDocumentId: "item_13",
      orderDocumentId: "order_3",
      menuItemName: "Апероль Шпріц",
      quantity: 3,
      tableNumber: 7,
      courseType: "drink",
      status: "in_progress",
      priority: "rush",
      priorityScore: 70,
      elapsedMs: 90000,
      targetCompletionMs: 120000,
      isOverdue: false,
      assignedChefName: "Денис",
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 90000).toISOString(),
    },
    {
      documentId: "task_14",
      orderItemDocumentId: "item_14",
      orderDocumentId: "order_1",
      menuItemName: "Вино біле",
      quantity: 1,
      tableNumber: 5,
      courseType: "drink",
      status: "completed",
      priority: "normal",
      priorityScore: 45,
      elapsedMs: 60000,
      targetCompletionMs: 120000,
      isOverdue: false,
      assignedChefName: "Денис",
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
  ],
  pass: [
    {
      documentId: "task_7",
      orderItemDocumentId: "item_7",
      orderDocumentId: "order_5",
      menuItemName: "Том Ям",
      quantity: 2,
      tableNumber: 9,
      courseType: "soup",
      status: "completed",
      priority: "normal",
      priorityScore: 55,
      elapsedMs: 660000,
      targetCompletionMs: 600000,
      isOverdue: true,
      modifiers: [],
      comment: null,
      createdAt: new Date(Date.now() - 660000).toISOString(),
    },
    {
      documentId: "task_15",
      orderItemDocumentId: "item_15",
      orderDocumentId: "order_2",
      menuItemName: "Борщ український",
      quantity: 1,
      tableNumber: 3,
      courseType: "soup",
      status: "completed",
      priority: "normal",
      priorityScore: 50,
      elapsedMs: 480000,
      targetCompletionMs: 600000,
      isOverdue: false,
      modifiers: ["З пампушками"],
      comment: null,
      createdAt: new Date(Date.now() - 480000).toISOString(),
    },
    {
      documentId: "task_16",
      orderItemDocumentId: "item_16",
      orderDocumentId: "order_6",
      menuItemName: "Стейк з овочами",
      quantity: 1,
      tableNumber: 4,
      courseType: "main",
      status: "completed",
      priority: "vip",
      priorityScore: 80,
      elapsedMs: 540000,
      targetCompletionMs: 600000,
      isOverdue: false,
      modifiers: ["Well Done"],
      comment: null,
      createdAt: new Date(Date.now() - 540000).toISOString(),
    },
  ],
};

export default function KitchenDisplayPage() {
  const [selectedStation, setSelectedStation] = React.useState<StationType>("hot");
  const [isSoundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setFullscreen] = React.useState(false);
  const [stations, setStations] = React.useState(MOCK_STATIONS);
  const [tasks, setTasks] = React.useState(MOCK_TASKS);
  const [activeView, setActiveView] = React.useState<ChefView>("stations");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  
  // User info - в реальному додатку це буде з контексту або API
  const currentUser = {
    name: "Олексій Петренко",
    role: "Шеф-кухар",
    avatar: undefined, // Можна додати URL аватара
  };

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
    setTasks((prev) => ({
      ...prev,
      [selectedStation]: prev[selectedStation].map((t) =>
        t.documentId === taskDocumentId
          ? { ...t, status: "in_progress" as StationSubTaskStatus, assignedChefName: "Поточний кухар" }
          : t
      ),
    }));
  };

  const handleTaskComplete = (taskDocumentId: string) => {
    setTasks((prev) => ({
      ...prev,
      [selectedStation]: prev[selectedStation].map((t) =>
        t.documentId === taskDocumentId
          ? { ...t, status: "completed" as StationSubTaskStatus }
          : t
      ),
    }));
  };

  const handleTaskPass = (taskDocumentId: string) => {
    // Move to plating station
    const task = tasks[selectedStation].find((t) => t.documentId === taskDocumentId);
    if (!task) return;

    setTasks((prev) => ({
      ...prev,
      [selectedStation]: prev[selectedStation].filter((t) => t.documentId !== taskDocumentId),
      plating: [...prev.plating, { ...task, status: "pending" as StationSubTaskStatus }],
    }));
  };

  const handlePauseToggle = () => {
    setStations((prev) =>
      prev.map((s) =>
        s.type === selectedStation ? { ...s, isPaused: !s.isPaused } : s
      )
    );
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

  // Statistics
  const totalTasks = Object.values(tasks).flat().length;
  const activeTasks = Object.values(tasks)
    .flat()
    .filter((t) => t.status === "in_progress").length;
  const overdueTasks = Object.values(tasks)
    .flat()
    .filter((t) => t.isOverdue).length;

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
                      <Badge variant="outline" className="text-sm">
                        {new Date().toLocaleTimeString("uk-UA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
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
                    tasks={tasks[selectedStation]}
                    currentLoad={currentStation?.currentLoad || 0}
                    maxCapacity={currentStation?.maxCapacity || 6}
                    isPaused={currentStation?.isPaused || false}
                    onTaskStart={handleTaskStart}
                    onTaskComplete={handleTaskComplete}
                    onTaskPass={handleTaskPass}
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
