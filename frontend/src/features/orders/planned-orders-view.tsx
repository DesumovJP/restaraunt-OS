"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  Users,
  Search,
  Plus,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Loader2,
  Filter,
  X,
  Menu,
} from "lucide-react";
import { useScheduledOrdersStore } from "@/stores/scheduled-orders-store";
import { useScheduledOrderMonitor } from "@/hooks/use-scheduled-order-monitor";
import {
  useScheduledOrders,
  useUpdateScheduledOrderStatus,
} from "@/hooks/use-graphql-scheduled-orders";

// Extracted components
import {
  type PlannedOrder,
  type PlannedOrdersViewProps,
  type PlannedOrderItem,
  TIME_SLOTS,
  EVENT_TYPES,
  convertToPlannedOrder,
  isSameDay,
  formatDateFull,
  generateAvailableDates,
  calculateDayStats,
  OrderCard,
  CreateDialog,
  ViewDialog,
} from "./components/planned-orders";
import type { ScheduledOrder } from "@/stores/scheduled-orders-store";

// Re-export types for backward compatibility
export type { PlannedOrder, PlannedOrderItem } from "./components/planned-orders";

/**
 * Planned Orders View Component
 *
 * Displays scheduled orders grouped by time slots with filtering and search.
 */
export function PlannedOrdersView({
  variant = "kitchen",
  className,
  onOpenSidebar,
}: PlannedOrdersViewProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedOrders, setExpandedOrders] = React.useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = React.useState(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);

  // Scroll ref for date selector
  const dateScrollRef = React.useRef<HTMLDivElement>(null);

  // Local store (fallback)
  const localOrders = useScheduledOrdersStore((state) => state.orders);
  const getOrdersByDate = useScheduledOrdersStore((state) => state.getOrdersByDate);
  const updateLocalStatus = useScheduledOrdersStore((state) => state.updateOrderStatus);
  const removeOrder = useScheduledOrdersStore((state) => state.removeOrder);

  // GraphQL hooks
  const dateStr = selectedDate.toISOString().split("T")[0];
  const { orders: graphqlOrders, isLoading, refetch } = useScheduledOrders({
    fromDate: `${dateStr}T00:00:00.000Z`,
    toDate: `${dateStr}T23:59:59.999Z`,
  });
  const { updateStatus: updateGraphQLStatus } = useUpdateScheduledOrderStatus();

  // Date navigation helpers
  const goToToday = () => setSelectedDate(new Date());
  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };
  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  // Merge GraphQL with local store
  const scheduledOrders = React.useMemo(() => {
    return graphqlOrders.length > 0 ? graphqlOrders : localOrders;
  }, [graphqlOrders, localOrders]);

  // Combined status update
  const updateOrderStatus = React.useCallback(
    async (orderId: string, status: any) => {
      try {
        await updateGraphQLStatus(orderId, status);
        refetch();
      } catch (err) {
        updateLocalStatus(orderId, status);
      }
    },
    [updateGraphQLStatus, updateLocalStatus, refetch]
  );

  // Scheduler hook for activating orders
  const { activateNow } = useScheduledOrderMonitor({
    enabled: variant === "kitchen",
    onOrderActivated: (order) => {
      console.log("Order activated:", order.id);
    },
  });

  // Available dates for selector
  const availableDates = React.useMemo(() => generateAvailableDates(30), []);

  // Load orders for selected date
  const orders = React.useMemo((): PlannedOrder[] => {
    const currentDateStr = selectedDate.toISOString().split("T")[0];
    const filteredByDate = scheduledOrders.filter((o: ScheduledOrder) =>
      o.scheduledFor.startsWith(currentDateStr)
    );
    return filteredByDate.map(convertToPlannedOrder);
  }, [selectedDate, scheduledOrders]);

  // Order being viewed
  const viewingOrder = React.useMemo((): PlannedOrder | null => {
    if (!viewOrderId) return null;
    return orders.find((o: PlannedOrder) => o.id === viewOrderId) || null;
  }, [viewOrderId, orders]);

  // Filter orders
  const filteredOrders = React.useMemo((): PlannedOrder[] => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o: PlannedOrder) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o: PlannedOrder) =>
          o.tableNumber.toString().includes(query) ||
          o.items.some((i: PlannedOrderItem) => i.menuItemName.toLowerCase().includes(query)) ||
          o.createdBy.toLowerCase().includes(query) ||
          o.eventName?.toLowerCase().includes(query) ||
          o.contact?.name.toLowerCase().includes(query) ||
          o.contact?.phone.includes(query)
      );
    }

    return result.sort(
      (a: PlannedOrder, b: PlannedOrder) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );
  }, [orders, statusFilter, searchQuery]);

  // Group by time slots
  const groupedOrders = React.useMemo(() => {
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    const groups: { label: string; orders: PlannedOrder[]; isPast: boolean }[] = [];

    // Add overdue group for today
    if (isToday) {
      const overdueOrders = filteredOrders.filter((order: PlannedOrder) => {
        const diff = order.prepStartTime.getTime() - now.getTime();
        return diff < 0 && order.status === "scheduled";
      });
      if (overdueOrders.length > 0) {
        groups.push({
          label: "Потребує активації",
          orders: overdueOrders,
          isPast: true,
        });
      }
    }

    // Group by time slots
    TIME_SLOTS.forEach((slot) => {
      const slotOrders = filteredOrders.filter((order: PlannedOrder) => {
        const hour = order.scheduledTime.getHours();
        const isInSlot = hour >= slot.start && hour < slot.end;

        if (isToday) {
          const diff = order.prepStartTime.getTime() - now.getTime();
          if (diff < 0 && order.status === "scheduled") {
            return false;
          }
        }

        return isInSlot;
      });

      if (slotOrders.length > 0) {
        const isPast = isToday && now.getHours() >= slot.end;
        groups.push({ label: slot.label, orders: slotOrders, isPast });
      }
    });

    return groups;
  }, [filteredOrders, selectedDate]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const dayStats = React.useMemo(() => calculateDayStats(orders), [orders]);
  const isToday = isSameDay(selectedDate, new Date());

  // Active filters count
  const activeFiltersCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Header - Compact design */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b safe-top">
        {/* Top bar with title and actions */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Mobile menu button */}
            {onOpenSidebar && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 shrink-0"
                onClick={onOpenSidebar}
                aria-label="Меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              variant === "kitchen"
                ? "bg-gradient-to-br from-orange-500 to-amber-500"
                : "bg-gradient-to-br from-blue-500 to-indigo-500"
            )}>
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">Заплановані</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {dayStats.total} замовлень · {dayStats.totalGuests} гостей
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile stats badge */}
            <Badge variant="secondary" className="sm:hidden text-xs">
              {dayStats.total}
            </Badge>

            {/* Filter toggle button */}
            <Button
              variant={showFilters || activeFiltersCount > 0 ? "outline" : "ghost"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 gap-1.5"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {variant === "waiter" && (
              <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className={cn(
                  "h-9 gap-1.5",
                  "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                )}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Створити</span>
              </Button>
            )}
          </div>
        </div>

        {/* Date navigation - Improved */}
        <div className="px-3 sm:px-4 pb-2.5">
          <div className="flex items-center gap-2 mb-2">
            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevDay}
              className="h-8 w-8 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Current date display */}
            <button
              onClick={goToToday}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                isToday
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "hover:bg-muted"
              )}
            >
              <span className="font-semibold text-sm">
                {formatDateFull(selectedDate)}
              </span>
              {isToday ? (
                <Badge variant="success" className="text-[10px] px-1.5 h-5">
                  Сьогодні
                </Badge>
              ) : (
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              className="h-8 w-8 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Desktop stats */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              {dayStats.events > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <PartyPopper className="h-3 w-3" />
                  {dayStats.events} подій
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {dayStats.totalGuests}
              </Badge>
            </div>
          </div>

          {/* Date carousel */}
          <div
            ref={dateScrollRef}
            className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth"
          >
            {availableDates.slice(0, 14).map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              const dateIsToday = isSameDay(date, new Date());
              const dateStr = date.toISOString().split("T")[0];
              const dateOrders = getOrdersByDate(dateStr);
              const hasEvents = dateOrders.some(
                (o) => o.eventType && o.eventType !== "regular"
              );

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center min-w-[48px] px-1.5 py-1.5 rounded-xl transition-all relative",
                    "touch-manipulation active:scale-95",
                    isSelected
                      ? variant === "kitchen"
                        ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md"
                        : "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md"
                      : "bg-background hover:bg-muted border border-transparent",
                    dateIsToday && !isSelected && "border-orange-300 bg-orange-50 dark:bg-orange-950/30"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium leading-none",
                    isSelected ? "text-white/80" : dateIsToday ? "text-orange-600" : "text-muted-foreground"
                  )}>
                    {date.toLocaleDateString("uk-UA", { weekday: "short" })}
                  </span>
                  <span className={cn(
                    "text-lg font-bold leading-tight",
                    dateIsToday && !isSelected && "text-orange-600"
                  )}>
                    {date.getDate()}
                  </span>
                  {/* Order count / Event indicator */}
                  <div className="flex items-center gap-0.5 h-4">
                    {hasEvents && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-white" : "bg-pink-500"
                      )} />
                    )}
                    {dateOrders.length > 0 && (
                      <span className={cn(
                        "text-[9px] font-medium",
                        isSelected ? "text-white/80" : "text-muted-foreground"
                      )}>
                        {dateOrders.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible filters section */}
        {showFilters && (
          <div className="px-3 sm:px-4 pb-3 space-y-2.5 border-t bg-muted/50 animate-in slide-in-from-top-2 duration-200">
            <div className="pt-2.5" />
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук за столиком, подією, контактом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: "all", label: "Всі", count: dayStats.total },
                { value: "scheduled", label: "Заплановано", count: dayStats.scheduled },
                { value: "activated", label: "На кухні", count: dayStats.activated },
                { value: "completed", label: "Виконано", count: dayStats.completed },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    "touch-manipulation active:scale-95",
                    statusFilter === option.value
                      ? variant === "kitchen"
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-blue-600 text-white shadow-sm"
                      : "bg-background text-muted-foreground hover:text-foreground border"
                  )}
                >
                  {option.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md min-w-[20px] text-center",
                    statusFilter === option.value
                      ? "bg-white/20"
                      : "bg-muted"
                  )}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-y-auto p-3 sm:p-4",
        (isLoading || groupedOrders.length === 0) && "flex flex-col"
      )}>
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : groupedOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              type={searchQuery ? "search" : "orders"}
              title={
                searchQuery ? "Нічого не знайдено" : "Немає запланованих замовлень"
              }
              description={
                searchQuery
                  ? "Спробуйте інший пошуковий запит"
                  : "Заплановані замовлення та події з'являться тут"
              }
            />
          </div>
        ) : (
          <div className="space-y-5">
            {groupedOrders.map((group, groupIndex) => (
              <div
                key={group.label}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 duration-300",
                  group.isPast && "opacity-60"
                )}
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                {/* Time group header - Enhanced */}
                <div className="flex items-center gap-2 mb-2.5 sticky top-0 bg-muted/30 backdrop-blur-sm py-1 -mx-1 px-1 rounded-lg z-10">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-lg",
                    group.label === "Потребує активації"
                      ? "bg-red-100 dark:bg-red-950"
                      : group.isPast
                        ? "bg-gray-100 dark:bg-gray-900"
                        : "bg-green-100 dark:bg-green-950"
                  )}>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      group.label === "Потребує активації"
                        ? "bg-red-500 animate-pulse"
                        : group.isPast
                          ? "bg-gray-400"
                          : "bg-green-500"
                    )} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className={cn(
                      "h-3.5 w-3.5",
                      group.label === "Потребує активації"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )} />
                    <h2 className={cn(
                      "text-sm font-semibold uppercase tracking-wide",
                      group.label === "Потребує активації"
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}>
                      {group.label}
                    </h2>
                  </div>
                  <Badge
                    variant={group.label === "Потребує активації" ? "destructive" : "outline"}
                    className="h-5 text-xs ml-auto"
                  >
                    {group.orders.length}
                  </Badge>
                </div>

                {/* Orders */}
                <div className="space-y-2">
                  {group.orders.map((order, orderIndex) => (
                    <div
                      key={order.id}
                      className="animate-in fade-in slide-in-from-left-2 duration-200"
                      style={{ animationDelay: `${orderIndex * 30}ms` }}
                    >
                      <OrderCard
                        order={order}
                        variant={variant}
                        isExpanded={expandedOrders.has(order.id)}
                        onToggleExpand={() => toggleExpand(order.id)}
                        onActivate={activateNow}
                        onComplete={(id) => updateOrderStatus(id, "completed")}
                        onViewDetails={setViewOrderId}
                        onDelete={removeOrder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedDate={selectedDate}
        onSuccess={() => setSelectedDate(new Date())}
      />

      <ViewDialog
        order={viewingOrder}
        open={!!viewOrderId}
        onOpenChange={() => setViewOrderId(null)}
      />
    </div>
  );
}
