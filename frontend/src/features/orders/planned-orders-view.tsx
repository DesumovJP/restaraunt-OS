"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  ChefHat,
  Search,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  Timer,
  CalendarDays,
  Play,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTableStore } from "@/stores/table-store";
import { useScheduledOrdersStore, type ScheduledOrder } from "@/stores/scheduled-orders-store";
import { useScheduledOrderMonitor } from "@/hooks/use-scheduled-order-monitor";

// Types for planned orders (view model)
export interface PlannedOrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  notes?: string;
  station?: string;
}

export interface PlannedOrder {
  id: string;
  tableNumber: number;
  scheduledTime: Date;
  prepStartTime: Date;
  guestCount: number;
  items: PlannedOrderItem[];
  status: "scheduled" | "activating" | "activated" | "completed";
  specialRequests?: string;
  createdBy: string;
  priority?: "normal" | "vip";
}

// Convert ScheduledOrder from store to PlannedOrder view model
function convertToPlannedOrder(order: ScheduledOrder): PlannedOrder {
  return {
    id: order.id,
    tableNumber: order.tableNumber,
    scheduledTime: new Date(order.scheduledFor),
    prepStartTime: new Date(order.prepStartAt),
    guestCount: order.guestCount || order.items.reduce((sum, i) => sum + i.quantity, 0),
    items: order.items.map((item, index) => ({
      id: `${order.id}_${index}`,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      notes: item.notes,
      station: item.outputType,
    })),
    status: order.scheduleStatus,
    specialRequests: order.notes,
    createdBy: order.createdBy || "Офіціант",
    priority: "normal",
  };
}

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Format date for display
function formatDateShort(date: Date): string {
  return date.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Time slot configuration for the day
const TIME_SLOTS = [
  { start: 9, end: 12, label: "Ранок (9:00 - 12:00)" },
  { start: 12, end: 15, label: "Обід (12:00 - 15:00)" },
  { start: 15, end: 18, label: "Полудень (15:00 - 18:00)" },
  { start: 18, end: 22, label: "Вечір (18:00 - 22:00)" },
];

interface PlannedOrdersViewProps {
  variant?: "kitchen" | "waiter";
  className?: string;
}

export function PlannedOrdersView({
  variant = "kitchen",
  className,
}: PlannedOrdersViewProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedOrders, setExpandedOrders] = React.useState<Set<string>>(new Set());

  // Create order dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newOrderTable, setNewOrderTable] = React.useState("");
  const [newOrderDate, setNewOrderDate] = React.useState("");
  const [newOrderTime, setNewOrderTime] = React.useState("");
  const [newOrderPrepTime, setNewOrderPrepTime] = React.useState("");
  const [newOrderNotes, setNewOrderNotes] = React.useState("");
  const [newOrderGuestCount, setNewOrderGuestCount] = React.useState("2");

  // Scheduled orders store
  const scheduledOrders = useScheduledOrdersStore((state) => state.orders);
  const getOrdersByDate = useScheduledOrdersStore((state) => state.getOrdersByDate);
  const updateOrderStatus = useScheduledOrdersStore((state) => state.updateOrderStatus);
  const addScheduledOrder = useScheduledOrdersStore((state) => state.addOrder);

  // Tables store
  const tables = useTableStore((state) => state.tables);

  // Scheduler hook for activating orders
  const { activateNow } = useScheduledOrderMonitor({
    enabled: variant === "kitchen",
    onOrderActivated: (order) => {
      console.log("Order activated:", order.id);
    },
  });

  // Generate dates for quick selection (today + next 13 days)
  const availableDates = React.useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Load orders for selected date from store
  const orders = React.useMemo(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const storeOrders = getOrdersByDate(dateStr);
    return storeOrders.map(convertToPlannedOrder);
  }, [selectedDate, scheduledOrders, getOrdersByDate]);

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.tableNumber.toString().includes(query) ||
          o.items.some((i) => i.menuItemName.toLowerCase().includes(query)) ||
          o.createdBy.toLowerCase().includes(query)
      );
    }

    // Sort by scheduled time
    return result.sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );
  }, [orders, statusFilter, searchQuery]);

  // Group by time slots throughout the day
  const groupedOrders = React.useMemo(() => {
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    const groups: { label: string; orders: PlannedOrder[]; isPast: boolean }[] = [];

    // Add overdue group for today (scheduled orders past their prep start time)
    if (isToday) {
      const overdueOrders = filteredOrders.filter((order) => {
        const diff = order.prepStartTime.getTime() - now.getTime();
        return diff < 0 && order.status === "scheduled";
      });
      if (overdueOrders.length > 0) {
        groups.push({ label: "Потребує активації", orders: overdueOrders, isPast: true });
      }
    }

    // Group by time slots
    TIME_SLOTS.forEach((slot) => {
      const slotOrders = filteredOrders.filter((order) => {
        const hour = order.scheduledTime.getHours();
        const isInSlot = hour >= slot.start && hour < slot.end;

        // For today, exclude overdue orders from time slots
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

  const getStatusBadge = (status: PlannedOrder["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 bg-purple-50">
            <Clock className="h-3 w-3" />
            Заплановано
          </Badge>
        );
      case "activating":
        return (
          <Badge variant="warning" className="gap-1">
            <Timer className="h-3 w-3 animate-spin" />
            Активується
          </Badge>
        );
      case "activated":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            На кухні
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="gap-1">
            <UtensilsCrossed className="h-3 w-3" />
            Виконано
          </Badge>
        );
    }
  };

  const getTimeDisplay = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diff / (1000 * 60));

    if (diffMinutes < 0) {
      return {
        time: date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
        relative: `${Math.abs(diffMinutes)} хв тому`,
        isOverdue: true,
      };
    }

    return {
      time: date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
      relative: `через ${diffMinutes} хв`,
      isOverdue: false,
    };
  };

  const accentColor = variant === "kitchen" ? "orange" : "blue";
  const isToday = isSameDay(selectedDate, new Date());

  // Handle create new scheduled order
  const handleCreateOrder = () => {
    if (!newOrderTable || !newOrderDate || !newOrderTime || !newOrderPrepTime) {
      return;
    }

    const scheduledFor = new Date(`${newOrderDate}T${newOrderTime}`).toISOString();
    const prepStartAt = new Date(`${newOrderDate}T${newOrderPrepTime}`).toISOString();

    addScheduledOrder({
      tableNumber: parseInt(newOrderTable, 10),
      tableId: `table_${newOrderTable}`,
      items: [], // Empty - items will be added via menu
      totalAmount: 0,
      scheduledFor,
      prepStartAt,
      notes: newOrderNotes,
      guestCount: parseInt(newOrderGuestCount, 10) || 2,
    });

    // Reset form and close
    setNewOrderTable("");
    setNewOrderDate("");
    setNewOrderTime("");
    setNewOrderPrepTime("");
    setNewOrderNotes("");
    setNewOrderGuestCount("2");
    setIsCreateDialogOpen(false);

    // Select the date of the new order
    setSelectedDate(new Date(newOrderDate));
  };

  // Open create dialog with today's date pre-filled
  const openCreateDialog = () => {
    const today = new Date().toISOString().split("T")[0];
    setNewOrderDate(today);
    setIsCreateDialogOpen(true);
  };

  // Stats for the day
  const dayStats = React.useMemo(() => {
    const total = orders.length;
    const scheduled = orders.filter((o) => o.status === "scheduled").length;
    const activated = orders.filter((o) => o.status === "activated").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const totalGuests = orders.reduce((sum, o) => sum + o.guestCount, 0);
    return { total, scheduled, activated, completed, totalGuests };
  }, [orders]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-3 sm:px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className={cn("h-5 w-5", variant === "kitchen" ? "text-orange-600" : "text-blue-600")} />
            <h1 className="text-lg sm:text-xl font-bold">Заплановані</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 hidden sm:flex">
              <Users className="h-3 w-3" />
              {dayStats.totalGuests} гостей
            </Badge>
            <Badge variant="secondary" className="hidden sm:flex">{dayStats.total} замовл.</Badge>
            {variant === "waiter" && (
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Створити</span>
              </Button>
            )}
          </div>
        </div>

        {/* Date selector - horizontal scroll */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {formatDateFull(selectedDate)}
            </span>
            {isToday && (
              <Badge variant="success" className="text-xs">Сьогодні</Badge>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            {availableDates.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const dateIsToday = isSameDay(date, new Date());

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center min-w-[52px] px-2 py-1.5 rounded-lg transition-all",
                    isSelected
                      ? variant === "kitchen"
                        ? "bg-orange-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-muted hover:bg-muted/80",
                    dateIsToday && !isSelected && "ring-2 ring-offset-1 ring-orange-300"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium",
                    isSelected ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {date.toLocaleDateString("uk-UA", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
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
            placeholder="Пошук за столиком, стравою..."
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
              <span className={cn(
                "text-xs px-1.5 rounded-full",
                statusFilter === option.value
                  ? "bg-white/20"
                  : "bg-background"
              )}>
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
            title={searchQuery ? "Нічого не знайдено" : "Немає запланованих замовлень"}
            description={
              searchQuery
                ? "Спробуйте інший пошуковий запит"
                : "Заплановані замовлення з'являться тут"
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
                      group.label === "Прострочено"
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
                  {group.isPast && group.label !== "Прострочено" && (
                    <span className="text-xs text-muted-foreground">(минуло)</span>
                  )}
                </div>

                {/* Orders */}
                <div className="space-y-2">
                  {group.orders.map((order) => {
                    const timeDisplay = getTimeDisplay(order.scheduledTime);
                    const isExpanded = expandedOrders.has(order.id);

                    return (
                      <Card
                        key={order.id}
                        className={cn(
                          "overflow-hidden transition-all",
                          timeDisplay.isOverdue &&
                            order.status === "scheduled" &&
                            "border-red-300 bg-red-50/50"
                        )}
                      >
                        {/* Main row */}
                        <div
                          className="p-3 cursor-pointer hover:bg-muted/30"
                          onClick={() => toggleExpand(order.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Expand indicator */}
                            <div className="shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>

                            {/* Table number */}
                            <div
                              className={cn(
                                "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
                                order.priority === "vip"
                                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                                  : variant === "kitchen"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              )}
                            >
                              {order.tableNumber}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-sm">
                                  Столик {order.tableNumber}
                                </span>
                                {order.priority === "vip" && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-600 border-amber-300 bg-amber-50 text-xs px-1.5"
                                  >
                                    VIP
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {order.guestCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <UtensilsCrossed className="h-3 w-3" />
                                  {order.items.length} страв
                                </span>
                                <span>{order.createdBy}</span>
                              </div>
                            </div>

                            {/* Time */}
                            <div className="shrink-0 text-right">
                              <div
                                className={cn(
                                  "text-sm font-bold tabular-nums",
                                  timeDisplay.isOverdue
                                    ? "text-red-600"
                                    : "text-foreground"
                                )}
                              >
                                {timeDisplay.time}
                              </div>
                              <div
                                className={cn(
                                  "text-xs",
                                  timeDisplay.isOverdue
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                )}
                              >
                                {timeDisplay.relative}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="shrink-0">{getStatusBadge(order.status)}</div>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t bg-muted/30 p-3 space-y-3">
                            {/* Special requests */}
                            {order.specialRequests && (
                              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-amber-800">
                                  {order.specialRequests}
                                </span>
                              </div>
                            )}

                            {/* Items list */}
                            <div className="space-y-1.5">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {item.quantity}x
                                    </span>
                                    <span>{item.menuItemName}</span>
                                  </div>
                                  {variant === "kitchen" && item.station && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.station}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              {variant === "kitchen" ? (
                                <>
                                  {order.status === "scheduled" && (
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        activateNow(order.id);
                                      }}
                                    >
                                      <Play className="h-4 w-4 mr-1.5" />
                                      Активувати зараз
                                    </Button>
                                  )}
                                  {order.status === "activated" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateOrderStatus(order.id, "completed");
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                      Позначити виконаним
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {order.status === "scheduled" && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      Буде активовано о {order.prepStartTime.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Scheduled Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Нове заплановане замовлення
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Table selection */}
            <div>
              <Label htmlFor="table-select" className="text-sm font-medium">
                Столик
              </Label>
              <select
                id="table-select"
                value={newOrderTable}
                onChange={(e) => setNewOrderTable(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Оберіть столик...</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.number}>
                    Столик {table.number} ({table.capacity} місць)
                  </option>
                ))}
              </select>
            </div>

            {/* Guest count */}
            <div>
              <Label htmlFor="guest-count" className="text-sm font-medium">
                Кількість гостей
              </Label>
              <Input
                id="guest-count"
                type="number"
                min="1"
                max="20"
                value={newOrderGuestCount}
                onChange={(e) => setNewOrderGuestCount(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="order-date" className="text-sm font-medium">
                  Дата
                </Label>
                <Input
                  id="order-date"
                  type="date"
                  value={newOrderDate}
                  onChange={(e) => setNewOrderDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="order-time" className="text-sm font-medium">
                  Час подачі
                </Label>
                <Input
                  id="order-time"
                  type="time"
                  value={newOrderTime}
                  onChange={(e) => setNewOrderTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Prep start time */}
            <div>
              <Label htmlFor="prep-time" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Початок приготування
              </Label>
              <Input
                id="prep-time"
                type="time"
                value={newOrderPrepTime}
                onChange={(e) => setNewOrderPrepTime(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Замовлення з'явиться на кухні о цій годині
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="order-notes" className="text-sm font-medium">
                Примітки (опціонально)
              </Label>
              <Input
                id="order-notes"
                placeholder="Особливі побажання, алергії..."
                value={newOrderNotes}
                onChange={(e) => setNewOrderNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!newOrderTable || !newOrderDate || !newOrderTime || !newOrderPrepTime}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
