"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  Users,
  Search,
  Plus,
  PartyPopper,
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
}: PlannedOrdersViewProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedOrders, setExpandedOrders] = React.useState<Set<string>>(new Set());

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);

  // Local store (fallback)
  const localOrders = useScheduledOrdersStore((state) => state.orders);
  const getOrdersByDate = useScheduledOrdersStore((state) => state.getOrdersByDate);
  const updateLocalStatus = useScheduledOrdersStore((state) => state.updateOrderStatus);
  const removeOrder = useScheduledOrdersStore((state) => state.removeOrder);

  // GraphQL hooks
  const dateStr = selectedDate.toISOString().split("T")[0];
  const { orders: graphqlOrders, refetch } = useScheduledOrders({
    fromDate: `${dateStr}T00:00:00.000Z`,
    toDate: `${dateStr}T23:59:59.999Z`,
  });
  const { updateStatus: updateGraphQLStatus } = useUpdateScheduledOrderStatus();

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

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-3 sm:px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays
              className={cn(
                "h-5 w-5",
                variant === "kitchen" ? "text-orange-600" : "text-blue-600"
              )}
            />
            <h1 className="text-lg sm:text-xl font-bold">Заплановані</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 hidden sm:flex">
              <Users className="h-3 w-3" />
              {dayStats.totalGuests} гостей
            </Badge>
            {dayStats.events > 0 && (
              <Badge variant="secondary" className="hidden sm:flex gap-1">
                <PartyPopper className="h-3 w-3" />
                {dayStats.events} подій
              </Badge>
            )}
            <Badge variant="secondary" className="hidden sm:flex">
              {dayStats.total} замовл.
            </Badge>
            {variant === "waiter" && (
              <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Створити</span>
              </Button>
            )}
          </div>
        </div>

        {/* Date selector */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {formatDateFull(selectedDate)}
            </span>
            {isToday && (
              <Badge variant="success" className="text-xs">
                Сьогодні
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
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
                    "flex flex-col items-center min-w-[52px] px-2 py-1.5 rounded-lg transition-all relative",
                    isSelected
                      ? variant === "kitchen"
                        ? "bg-orange-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-muted hover:bg-muted/80",
                    dateIsToday &&
                      !isSelected &&
                      "ring-2 ring-offset-1 ring-orange-300"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] uppercase font-medium",
                      isSelected ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {date.toLocaleDateString("uk-UA", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                  {hasEvents && (
                    <div
                      className={cn(
                        "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                        isSelected ? "bg-white" : "bg-pink-500"
                      )}
                    />
                  )}
                  {dateOrders.length > 0 && (
                    <span
                      className={cn(
                        "text-[9px]",
                        isSelected ? "text-white/70" : "text-muted-foreground"
                      )}
                    >
                      {dateOrders.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук за столиком, подією, контактом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
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
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                statusFilter === option.value
                  ? variant === "kitchen"
                    ? "bg-orange-600 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {option.label}
              <span
                className={cn(
                  "text-xs px-1.5 rounded-full",
                  statusFilter === option.value ? "bg-white/20" : "bg-background"
                )}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {groupedOrders.length === 0 ? (
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
        ) : (
          <div className="space-y-6">
            {groupedOrders.map((group) => (
              <div key={group.label} className={cn(group.isPast && "opacity-60")}>
                {/* Time group header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      group.label === "Потребує активації"
                        ? "bg-red-500 animate-pulse"
                        : group.isPast
                          ? "bg-gray-400"
                          : "bg-green-500"
                    )}
                  />
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </h2>
                  <Badge variant="outline" className="h-5 text-xs">
                    {group.orders.length}
                  </Badge>
                </div>

                {/* Orders */}
                <div className="space-y-2">
                  {group.orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      variant={variant}
                      isExpanded={expandedOrders.has(order.id)}
                      onToggleExpand={() => toggleExpand(order.id)}
                      onActivate={activateNow}
                      onComplete={(id) => updateOrderStatus(id, "completed")}
                      onViewDetails={setViewOrderId}
                      onDelete={removeOrder}
                    />
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
