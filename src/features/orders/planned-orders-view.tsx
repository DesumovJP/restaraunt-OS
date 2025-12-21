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
  ChevronLeft,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  Timer,
  CalendarDays,
} from "lucide-react";

// Types for planned orders
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
  guestCount: number;
  items: PlannedOrderItem[];
  status: "scheduled" | "preparing" | "ready" | "served";
  specialRequests?: string;
  createdBy: string;
  priority?: "normal" | "vip";
}

// Helper to create date at specific hour
function createDateAtHour(baseDate: Date, hour: number, minute: number = 0): Date {
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Generate mock data for any given date
function generateMockOrdersForDate(date: Date): PlannedOrder[] {
  const isToday = isSameDay(date, new Date());
  const now = new Date();

  const orders: PlannedOrder[] = [
    {
      id: `po-${date.toISOString()}-1`,
      tableNumber: 5,
      scheduledTime: createDateAtHour(date, 10, 30),
      guestCount: 4,
      items: [
        { id: "i1", menuItemName: "Сніданок Англійський", quantity: 2, station: "hot" },
        { id: "i2", menuItemName: "Омлет з овочами", quantity: 2, station: "hot" },
      ],
      status: isToday && now.getHours() >= 11 ? "served" : "scheduled",
      priority: "vip",
      createdBy: "Марія",
    },
    {
      id: `po-${date.toISOString()}-2`,
      tableNumber: 3,
      scheduledTime: createDateAtHour(date, 12, 0),
      guestCount: 2,
      items: [
        { id: "i3", menuItemName: "Бургер Classic", quantity: 2, station: "hot" },
        { id: "i4", menuItemName: "Картопля фрі", quantity: 2, station: "hot" },
      ],
      status: isToday && now.getHours() >= 12 ? "ready" : "scheduled",
      createdBy: "Олексій",
    },
    {
      id: `po-${date.toISOString()}-3`,
      tableNumber: 8,
      scheduledTime: createDateAtHour(date, 13, 30),
      guestCount: 6,
      items: [
        { id: "i5", menuItemName: "Паста Карбонара", quantity: 3, station: "hot" },
        { id: "i6", menuItemName: "Грецький салат", quantity: 2, station: "cold" },
        { id: "i7", menuItemName: "Мохіто", quantity: 4, station: "bar" },
      ],
      status: isToday && now.getHours() >= 13 ? "preparing" : "scheduled",
      specialRequests: "Алергія на горіхи",
      createdBy: "Ірина",
    },
    {
      id: `po-${date.toISOString()}-4`,
      tableNumber: 2,
      scheduledTime: createDateAtHour(date, 14, 0),
      guestCount: 2,
      items: [
        { id: "i8", menuItemName: "Том Ям", quantity: 2, station: "hot" },
        { id: "i9", menuItemName: "Рол Філадельфія", quantity: 1, station: "cold" },
      ],
      status: "scheduled",
      createdBy: "Денис",
    },
    {
      id: `po-${date.toISOString()}-5`,
      tableNumber: 10,
      scheduledTime: createDateAtHour(date, 15, 30),
      guestCount: 4,
      items: [
        { id: "i10", menuItemName: "Курячі крильця BBQ", quantity: 2, station: "hot" },
        { id: "i11", menuItemName: "Апероль Шпріц", quantity: 4, station: "bar" },
      ],
      status: "scheduled",
      createdBy: "Марія",
    },
    {
      id: `po-${date.toISOString()}-6`,
      tableNumber: 7,
      scheduledTime: createDateAtHour(date, 18, 0),
      guestCount: 8,
      items: [
        { id: "i12", menuItemName: "Стейк Рібай", quantity: 4, station: "hot" },
        { id: "i13", menuItemName: "Салат Цезар", quantity: 4, station: "cold" },
        { id: "i14", menuItemName: "Вино біле", quantity: 2, station: "bar" },
      ],
      status: "scheduled",
      priority: "vip",
      specialRequests: "День народження - підготувати торт",
      createdBy: "Олексій",
    },
    {
      id: `po-${date.toISOString()}-7`,
      tableNumber: 12,
      scheduledTime: createDateAtHour(date, 19, 0),
      guestCount: 2,
      items: [
        { id: "i15", menuItemName: "Тірамісу", quantity: 2, station: "pastry" },
        { id: "i16", menuItemName: "Еспресо", quantity: 2, station: "bar" },
      ],
      status: "scheduled",
      createdBy: "Ірина",
    },
    {
      id: `po-${date.toISOString()}-8`,
      tableNumber: 4,
      scheduledTime: createDateAtHour(date, 20, 30),
      guestCount: 4,
      items: [
        { id: "i17", menuItemName: "Піца Маргарита", quantity: 2, station: "hot" },
        { id: "i18", menuItemName: "Піца Пепероні", quantity: 1, station: "hot" },
        { id: "i19", menuItemName: "Кола", quantity: 4, station: "bar" },
      ],
      status: "scheduled",
      createdBy: "Денис",
    },
    {
      id: `po-${date.toISOString()}-9`,
      tableNumber: 1,
      scheduledTime: createDateAtHour(date, 21, 0),
      guestCount: 6,
      items: [
        { id: "i20", menuItemName: "Сет Суші", quantity: 2, station: "cold" },
        { id: "i21", menuItemName: "Саке", quantity: 1, station: "bar" },
      ],
      status: "scheduled",
      priority: "vip",
      createdBy: "Марія",
    },
  ];

  return orders;
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
  const [orders, setOrders] = React.useState<PlannedOrder[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedOrders, setExpandedOrders] = React.useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = React.useState(false);

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

  // Load orders for selected date
  React.useEffect(() => {
    const newOrders = generateMockOrdersForDate(selectedDate);
    setOrders(newOrders);
  }, [selectedDate]);

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

    // Add overdue group for today
    if (isToday) {
      const overdueOrders = filteredOrders.filter((order) => {
        const diff = order.scheduledTime.getTime() - now.getTime();
        return diff < 0 && order.status !== "ready" && order.status !== "served";
      });
      if (overdueOrders.length > 0) {
        groups.push({ label: "Прострочено", orders: overdueOrders, isPast: true });
      }
    }

    // Group by time slots
    TIME_SLOTS.forEach((slot) => {
      const slotOrders = filteredOrders.filter((order) => {
        const hour = order.scheduledTime.getHours();
        const isInSlot = hour >= slot.start && hour < slot.end;

        // For today, exclude overdue orders from time slots
        if (isToday) {
          const diff = order.scheduledTime.getTime() - now.getTime();
          if (diff < 0 && order.status !== "ready" && order.status !== "served") {
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
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Заплановано
          </Badge>
        );
      case "preparing":
        return (
          <Badge variant="warning" className="gap-1">
            <Timer className="h-3 w-3" />
            Готується
          </Badge>
        );
      case "ready":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Готово
          </Badge>
        );
      case "served":
        return (
          <Badge variant="secondary" className="gap-1">
            <UtensilsCrossed className="h-3 w-3" />
            Подано
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

  // Stats for the day
  const dayStats = React.useMemo(() => {
    const total = filteredOrders.length;
    const scheduled = filteredOrders.filter((o) => o.status === "scheduled").length;
    const preparing = filteredOrders.filter((o) => o.status === "preparing").length;
    const ready = filteredOrders.filter((o) => o.status === "ready").length;
    const totalGuests = filteredOrders.reduce((sum, o) => sum + o.guestCount, 0);
    return { total, scheduled, preparing, ready, totalGuests };
  }, [filteredOrders]);

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
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {dayStats.totalGuests} гостей
            </Badge>
            <Badge variant="secondary">{dayStats.total} замовл.</Badge>
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
            { value: "preparing", label: "Готується", count: dayStats.preparing },
            { value: "ready", label: "Готово", count: dayStats.ready },
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
                                      className="flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id
                                              ? { ...o, status: "preparing" }
                                              : o
                                          )
                                        );
                                      }}
                                    >
                                      <ChefHat className="h-4 w-4 mr-1.5" />
                                      Почати готувати
                                    </Button>
                                  )}
                                  {order.status === "preparing" && (
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id
                                              ? { ...o, status: "ready" }
                                              : o
                                          )
                                        );
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                      Готово
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {order.status === "ready" && (
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id
                                              ? { ...o, status: "served" }
                                              : o
                                          )
                                        );
                                      }}
                                    >
                                      <UtensilsCrossed className="h-4 w-4 mr-1.5" />
                                      Подано
                                    </Button>
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
    </div>
  );
}
