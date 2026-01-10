"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
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
  Phone,
  Mail,
  Building2,
  CreditCard,
  Cake,
  Heart,
  Briefcase,
  GraduationCap,
  PartyPopper,
  Wine,
  Utensils,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Send,
  Bell,
  CheckSquare,
  Square,
  User,
  Baby,
  Leaf,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableStore } from "@/stores/table-store";
import {
  useScheduledOrdersStore,
  type ScheduledOrder,
  type EventType,
  type SeatingArea,
  type MenuPreset,
  type PaymentStatus,
  type ChecklistItem,
} from "@/stores/scheduled-orders-store";
import { useScheduledOrderMonitor } from "@/hooks/use-scheduled-order-monitor";
import {
  useScheduledOrders,
  useOrdersReadyToActivate,
  useUpdateScheduledOrderStatus,
} from "@/hooks/use-graphql-scheduled-orders";

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
  // HoReCa extensions
  eventType?: EventType;
  eventName?: string;
  seatingArea?: SeatingArea;
  contact?: { name: string; phone: string; email?: string; company?: string };
  paymentStatus?: PaymentStatus;
  depositAmount?: number;
  totalAmount?: number;
  adultsCount?: number;
  childrenCount?: number;
  menuPreset?: MenuPreset;
  assignedCoordinator?: string;
  checklist?: ChecklistItem[];
  decorations?: string;
  cakeDetails?: string;
}

// Event type configurations
const EVENT_TYPES: Record<EventType, { label: string; icon: React.ElementType; color: string }> = {
  regular: { label: "Бронювання", icon: Calendar, color: "text-gray-600" },
  birthday: { label: "День народження", icon: Cake, color: "text-pink-600" },
  corporate: { label: "Корпоратив", icon: Briefcase, color: "text-blue-600" },
  wedding: { label: "Весілля", icon: Heart, color: "text-red-600" },
  anniversary: { label: "Річниця", icon: PartyPopper, color: "text-purple-600" },
  funeral: { label: "Поминки", icon: Calendar, color: "text-gray-700" },
  baptism: { label: "Хрестини", icon: Heart, color: "text-cyan-600" },
  graduation: { label: "Випускний", icon: GraduationCap, color: "text-amber-600" },
  business: { label: "Бізнес-зустріч", icon: Briefcase, color: "text-slate-600" },
  romantic: { label: "Романтична вечеря", icon: Heart, color: "text-rose-600" },
  other: { label: "Інше", icon: Calendar, color: "text-gray-500" },
};

// Seating area configurations
const SEATING_AREAS: Record<SeatingArea, string> = {
  main_hall: "Основний зал",
  vip_room: "VIP-кімната",
  terrace: "Тераса",
  private: "Приватна кімната",
  bar_area: "Зона бару",
  outdoor: "На вулиці",
};

// Menu preset configurations
const MENU_PRESETS: Record<MenuPreset, string> = {
  a_la_carte: "По меню",
  set_menu: "Сет-меню",
  buffet: "Фуршет",
  banquet: "Банкет",
  custom: "Індивідуальне",
};

// Payment status configurations
const PAYMENT_STATUSES: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Очікує оплати", color: "text-yellow-600 bg-yellow-50" },
  deposit_paid: { label: "Завдаток сплачено", color: "text-blue-600 bg-blue-50" },
  fully_paid: { label: "Сплачено", color: "text-green-600 bg-green-50" },
  refunded: { label: "Повернено", color: "text-gray-600 bg-gray-50" },
};

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
    // HoReCa extensions
    eventType: order.eventType,
    eventName: order.eventName,
    seatingArea: order.seatingArea,
    contact: order.contact,
    paymentStatus: order.paymentStatus,
    depositAmount: order.depositAmount,
    totalAmount: order.totalAmount,
    adultsCount: order.adultsCount,
    childrenCount: order.childrenCount,
    menuPreset: order.menuPreset,
    assignedCoordinator: order.assignedCoordinator,
    checklist: order.checklist,
    decorations: order.decorations,
    cakeDetails: order.cakeDetails,
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
  const [createDialogTab, setCreateDialogTab] = React.useState("basic");

  // Form state
  const [formData, setFormData] = React.useState({
    tableNumber: "",
    date: "",
    time: "",
    prepTime: "",
    notes: "",
    guestCount: "2",
    adultsCount: "2",
    childrenCount: "0",
    eventType: "regular" as EventType,
    eventName: "",
    seatingArea: "main_hall" as SeatingArea,
    menuPreset: "a_la_carte" as MenuPreset,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactCompany: "",
    depositAmount: "",
    decorations: "",
    cakeDetails: "",
    assignedCoordinator: "",
  });

  // View details dialog
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);

  // Local store (fallback)
  const localOrders = useScheduledOrdersStore((state) => state.orders);
  const getOrdersByDate = useScheduledOrdersStore((state) => state.getOrdersByDate);
  const updateLocalStatus = useScheduledOrdersStore((state) => state.updateOrderStatus);
  const updateOrder = useScheduledOrdersStore((state) => state.updateOrder);
  const addScheduledOrder = useScheduledOrdersStore((state) => state.addOrder);
  const removeOrder = useScheduledOrdersStore((state) => state.removeOrder);

  // GraphQL hooks
  const dateStr = selectedDate.toISOString().split("T")[0];
  const { orders: graphqlOrders, isLoading, refetch } = useScheduledOrders({
    fromDate: `${dateStr}T00:00:00.000Z`,
    toDate: `${dateStr}T23:59:59.999Z`,
  });
  const { updateStatus: updateGraphQLStatus } = useUpdateScheduledOrderStatus();

  // Merge GraphQL with local store
  const scheduledOrders = React.useMemo(() => {
    return graphqlOrders.length > 0 ? graphqlOrders : localOrders;
  }, [graphqlOrders, localOrders]);

  // Combined status update
  const updateOrderStatus = React.useCallback(async (orderId: string, status: any) => {
    try {
      await updateGraphQLStatus(orderId, status);
      refetch();
    } catch (err) {
      updateLocalStatus(orderId, status);
    }
  }, [updateGraphQLStatus, updateLocalStatus, refetch]);

  // Tables store
  const tables = useTableStore((state) => state.tables);

  // Scheduler hook for activating orders
  const { activateNow } = useScheduledOrderMonitor({
    enabled: variant === "kitchen",
    onOrderActivated: (order) => {
      console.log("Order activated:", order.id);
    },
  });

  // Generate dates for quick selection (today + next 30 days for events)
  const availableDates = React.useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Load orders for selected date from store
  const orders = React.useMemo(() => {
    const currentDateStr = selectedDate.toISOString().split("T")[0];
    // Filter by date from the combined orders
    const filteredByDate = scheduledOrders.filter(o =>
      o.scheduledFor.startsWith(currentDateStr)
    );
    return filteredByDate.map(convertToPlannedOrder);
  }, [selectedDate, scheduledOrders]);

  // Order being viewed
  const viewingOrder = React.useMemo(() => {
    if (!viewOrderId) return null;
    return orders.find((o) => o.id === viewOrderId);
  }, [viewOrderId, orders]);

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
          o.createdBy.toLowerCase().includes(query) ||
          o.eventName?.toLowerCase().includes(query) ||
          o.contact?.name.toLowerCase().includes(query) ||
          o.contact?.phone.includes(query)
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
      relative: diffMinutes < 60 ? `через ${diffMinutes} хв` : `через ${Math.floor(diffMinutes / 60)}г`,
      isOverdue: false,
    };
  };

  const accentColor = variant === "kitchen" ? "orange" : "blue";
  const isToday = isSameDay(selectedDate, new Date());

  // Reset form data
  const resetFormData = () => {
    setFormData({
      tableNumber: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      prepTime: "",
      notes: "",
      guestCount: "2",
      adultsCount: "2",
      childrenCount: "0",
      eventType: "regular",
      eventName: "",
      seatingArea: "main_hall",
      menuPreset: "a_la_carte",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      contactCompany: "",
      depositAmount: "",
      decorations: "",
      cakeDetails: "",
      assignedCoordinator: "",
    });
    setCreateDialogTab("basic");
  };

  // Handle create new scheduled order
  const handleCreateOrder = () => {
    if (!formData.tableNumber || !formData.date || !formData.time || !formData.prepTime) {
      return;
    }

    const scheduledFor = new Date(`${formData.date}T${formData.time}`).toISOString();
    const prepStartAt = new Date(`${formData.date}T${formData.prepTime}`).toISOString();

    // Find table by number to get documentId
    const tableNumber = parseInt(formData.tableNumber, 10);
    const selectedTable = tables.find((t) => t.number === tableNumber);
    const tableId = selectedTable?.documentId || selectedTable?.id || `table_${tableNumber}`;

    addScheduledOrder({
      tableNumber,
      tableId,
      items: [],
      totalAmount: 0,
      scheduledFor,
      prepStartAt,
      notes: formData.notes,
      guestCount: parseInt(formData.guestCount, 10) || 2,
      // HoReCa fields
      eventType: formData.eventType,
      eventName: formData.eventName || undefined,
      seatingArea: formData.seatingArea,
      adultsCount: parseInt(formData.adultsCount, 10) || undefined,
      childrenCount: parseInt(formData.childrenCount, 10) || undefined,
      menuPreset: formData.menuPreset,
      contact: formData.contactPhone ? {
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail || undefined,
        company: formData.contactCompany || undefined,
      } : undefined,
      depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
      paymentStatus: formData.depositAmount ? "deposit_paid" : "pending",
      decorations: formData.decorations || undefined,
      cakeDetails: formData.cakeDetails || undefined,
      assignedCoordinator: formData.assignedCoordinator || undefined,
    });

    resetFormData();
    setIsCreateDialogOpen(false);
    setSelectedDate(new Date(formData.date));
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetFormData();
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
    setIsCreateDialogOpen(true);
  };

  // Stats for the day
  const dayStats = React.useMemo(() => {
    const total = orders.length;
    const scheduled = orders.filter((o) => o.status === "scheduled").length;
    const activated = orders.filter((o) => o.status === "activated").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const totalGuests = orders.reduce((sum, o) => sum + o.guestCount, 0);
    const events = orders.filter((o) => o.eventType && o.eventType !== "regular").length;
    return { total, scheduled, activated, completed, totalGuests, events };
  }, [orders]);

  // Calculate prep time automatically based on event type
  const calculatePrepTime = (eventType: EventType, serviceTime: string): string => {
    if (!serviceTime) return "";
    const [hours, minutes] = serviceTime.split(":").map(Number);
    const serviceDate = new Date();
    serviceDate.setHours(hours, minutes, 0, 0);

    // Different prep times based on event type
    const prepMinutes: Record<EventType, number> = {
      regular: 30,
      birthday: 45,
      corporate: 60,
      wedding: 90,
      anniversary: 45,
      funeral: 60,
      baptism: 45,
      graduation: 60,
      business: 30,
      romantic: 30,
      other: 30,
    };

    serviceDate.setMinutes(serviceDate.getMinutes() - prepMinutes[eventType]);
    return `${serviceDate.getHours().toString().padStart(2, "0")}:${serviceDate.getMinutes().toString().padStart(2, "0")}`;
  };

  // Auto-calculate prep time when service time or event type changes
  React.useEffect(() => {
    if (formData.time && !formData.prepTime) {
      const calculatedPrepTime = calculatePrepTime(formData.eventType, formData.time);
      setFormData((prev) => ({ ...prev, prepTime: calculatedPrepTime }));
    }
  }, [formData.time, formData.eventType]);

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
            {dayStats.events > 0 && (
              <Badge variant="secondary" className="hidden sm:flex gap-1">
                <PartyPopper className="h-3 w-3" />
                {dayStats.events} подій
              </Badge>
            )}
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
            {availableDates.slice(0, 14).map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const dateIsToday = isSameDay(date, new Date());
              // Check if date has events
              const dateStr = date.toISOString().split("T")[0];
              const dateOrders = getOrdersByDate(dateStr);
              const hasEvents = dateOrders.some((o) => o.eventType && o.eventType !== "regular");

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
                  {hasEvents && (
                    <div className={cn(
                      "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                      isSelected ? "bg-white" : "bg-pink-500"
                    )} />
                  )}
                  {dateOrders.length > 0 && (
                    <span className={cn(
                      "text-[9px]",
                      isSelected ? "text-white/70" : "text-muted-foreground"
                    )}>
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
                  {group.orders.map((order) => {
                    const timeDisplay = getTimeDisplay(order.scheduledTime);
                    const isExpanded = expandedOrders.has(order.id);
                    const eventConfig = order.eventType ? EVENT_TYPES[order.eventType] : null;
                    const EventIcon = eventConfig?.icon || Calendar;

                    return (
                      <Card
                        key={order.id}
                        className={cn(
                          "overflow-hidden transition-all",
                          timeDisplay.isOverdue &&
                            order.status === "scheduled" &&
                            "border-red-300 bg-red-50/50",
                          order.eventType && order.eventType !== "regular" &&
                            "border-l-4 border-l-purple-400"
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

                            {/* Table/Event icon */}
                            <div
                              className={cn(
                                "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
                                order.eventType && order.eventType !== "regular"
                                  ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                  : variant === "kitchen"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              )}
                            >
                              {order.eventType && order.eventType !== "regular" ? (
                                <EventIcon className="h-5 w-5" />
                              ) : (
                                order.tableNumber
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="font-semibold text-sm">
                                  {order.eventName || `Столик ${order.tableNumber}`}
                                </span>
                                {order.eventType && order.eventType !== "regular" && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs px-1.5", eventConfig?.color)}
                                  >
                                    {eventConfig?.label}
                                  </Badge>
                                )}
                                {order.paymentStatus && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs px-1.5", PAYMENT_STATUSES[order.paymentStatus].color)}
                                  >
                                    {PAYMENT_STATUSES[order.paymentStatus].label}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {order.guestCount}
                                  {order.childrenCount ? ` (${order.childrenCount} діт.)` : ""}
                                </span>
                                {order.seatingArea && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {SEATING_AREAS[order.seatingArea]}
                                  </span>
                                )}
                                {order.contact && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {order.contact.name}
                                  </span>
                                )}
                                {order.items.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <UtensilsCrossed className="h-3 w-3" />
                                    {order.items.length} страв
                                  </span>
                                )}
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
                            {/* Contact info */}
                            {order.contact && (
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{order.contact.name}</span>
                                </div>
                                <a href={`tel:${order.contact.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                  <Phone className="h-4 w-4" />
                                  {order.contact.phone}
                                </a>
                                {order.contact.email && (
                                  <a href={`mailto:${order.contact.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                    <Mail className="h-4 w-4" />
                                    {order.contact.email}
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Special requests */}
                            {order.specialRequests && (
                              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-amber-800">
                                  {order.specialRequests}
                                </span>
                              </div>
                            )}

                            {/* Cake/Decorations */}
                            {(order.cakeDetails || order.decorations) && (
                              <div className="flex gap-3 text-sm">
                                {order.cakeDetails && (
                                  <div className="flex items-center gap-1.5 text-pink-600">
                                    <Cake className="h-4 w-4" />
                                    <span>{order.cakeDetails}</span>
                                  </div>
                                )}
                                {order.decorations && (
                                  <div className="flex items-center gap-1.5 text-purple-600">
                                    <PartyPopper className="h-4 w-4" />
                                    <span>{order.decorations}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Deposit info */}
                            {order.depositAmount && (
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span>Завдаток: <strong>{order.depositAmount} грн</strong></span>
                              </div>
                            )}

                            {/* Items list */}
                            {order.items.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-xs font-medium text-muted-foreground uppercase">Меню</div>
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
                            )}

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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewOrderId(order.id);
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1.5" />
                                    Деталі
                                  </Button>
                                  {order.status === "scheduled" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Edit functionality
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-1.5" />
                                        Редагувати
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm("Видалити це бронювання?")) {
                                            removeOrder(order.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
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

      {/* Create Scheduled Order Dialog - Enhanced HoReCa */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Нове бронювання / подія
            </DialogTitle>
          </DialogHeader>

          <Tabs value={createDialogTab} onValueChange={setCreateDialogTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Основне</TabsTrigger>
              <TabsTrigger value="guests" className="text-xs sm:text-sm">Гості</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm">Контакт</TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm">Деталі</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Event Type */}
              <div>
                <Label className="text-sm font-medium">Тип події</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, eventType: type }))}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                          formData.eventType === type
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-background hover:bg-muted"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="truncate w-full text-center">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Name (for non-regular events) */}
              {formData.eventType !== "regular" && (
                <div>
                  <Label htmlFor="event-name" className="text-sm font-medium">
                    Назва події
                  </Label>
                  <Input
                    id="event-name"
                    placeholder="Напр. День народження Марії"
                    value={formData.eventName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventName: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              )}

              {/* Table & Seating Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="table-select" className="text-sm font-medium">
                    Столик
                  </Label>
                  <select
                    id="table-select"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))}
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
                <div>
                  <Label htmlFor="seating-area" className="text-sm font-medium">
                    Зона
                  </Label>
                  <select
                    id="seating-area"
                    value={formData.seatingArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seatingArea: e.target.value as SeatingArea }))}
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {(Object.entries(SEATING_AREAS) as [SeatingArea, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="order-date" className="text-sm font-medium">
                    Дата
                  </Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="order-time" className="text-sm font-medium">
                    Час прибуття
                  </Label>
                  <Input
                    id="order-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, time: e.target.value }));
                      // Auto-calculate prep time
                      const prepTime = calculatePrepTime(formData.eventType, e.target.value);
                      setFormData((prev) => ({ ...prev, prepTime }));
                    }}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="prep-time" className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Старт кухні
                  </Label>
                  <Input
                    id="prep-time"
                    type="time"
                    value={formData.prepTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prepTime: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Menu Preset */}
              <div>
                <Label className="text-sm font-medium">Тип меню</Label>
                <div className="grid grid-cols-5 gap-2 mt-1.5">
                  {(Object.entries(MENU_PRESETS) as [MenuPreset, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, menuPreset: key }))}
                      className={cn(
                        "p-2 rounded-lg border transition-all text-xs",
                        formData.menuPreset === key
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Guests Tab */}
            <TabsContent value="guests" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="guest-count" className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Всього гостей
                  </Label>
                  <Input
                    id="guest-count"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.guestCount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, guestCount: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="adults-count" className="text-sm font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Дорослих
                  </Label>
                  <Input
                    id="adults-count"
                    type="number"
                    min="0"
                    value={formData.adultsCount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, adultsCount: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="children-count" className="text-sm font-medium flex items-center gap-1">
                    <Baby className="h-3.5 w-3.5" />
                    Дітей
                  </Label>
                  <Input
                    id="children-count"
                    type="number"
                    min="0"
                    value={formData.childrenCount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, childrenCount: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="order-notes" className="text-sm font-medium">
                  Примітки та побажання
                </Label>
                <Textarea
                  id="order-notes"
                  placeholder="Особливі побажання, алергії, дієтичні обмеження..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contact-name" className="text-sm font-medium">
                    Ім'я контактної особи *
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="Марія Петренко"
                    value={formData.contactName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone" className="text-sm font-medium">
                    Телефон *
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+380 XX XXX XX XX"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contact-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-company" className="text-sm font-medium">
                    Компанія (для корпоративів)
                  </Label>
                  <Input
                    id="contact-company"
                    placeholder="Назва компанії"
                    value={formData.contactCompany}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactCompany: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Deposit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deposit" className="text-sm font-medium flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Завдаток (грн)
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, depositAmount: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="coordinator" className="text-sm font-medium">
                    Відповідальний
                  </Label>
                  <Input
                    id="coordinator"
                    placeholder="Ім'я менеджера/офіціанта"
                    value={formData.assignedCoordinator}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assignedCoordinator: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {formData.eventType === "birthday" && (
                <div>
                  <Label htmlFor="cake-details" className="text-sm font-medium flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5 text-pink-600" />
                    Деталі торту
                  </Label>
                  <Input
                    id="cake-details"
                    placeholder="Шоколадний торт з написом 'З Днем народження!'"
                    value={formData.cakeDetails}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cakeDetails: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="decorations" className="text-sm font-medium flex items-center gap-1">
                  <PartyPopper className="h-3.5 w-3.5 text-purple-600" />
                  Декорації
                </Label>
                <Textarea
                  id="decorations"
                  placeholder="Кульки, банер, квіти на стіл..."
                  value={formData.decorations}
                  onChange={(e) => setFormData((prev) => ({ ...prev, decorations: e.target.value }))}
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Підсумок бронювання:</p>
                <ul className="space-y-1">
                  <li>• Тип: {EVENT_TYPES[formData.eventType].label}</li>
                  <li>• Дата: {formData.date || "Не вказано"}</li>
                  <li>• Час: {formData.time || "Не вказано"}</li>
                  <li>• Гостей: {formData.guestCount}</li>
                  <li>• Зона: {SEATING_AREAS[formData.seatingArea]}</li>
                  {formData.depositAmount && <li>• Завдаток: {formData.depositAmount} грн</li>}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!formData.tableNumber || !formData.date || !formData.time || !formData.prepTime}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Створити бронювання
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Details Dialog */}
      <Dialog open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Деталі бронювання
            </DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-4">
              {/* Event info */}
              <div className="flex items-center gap-3">
                {viewingOrder.eventType && EVENT_TYPES[viewingOrder.eventType] && (
                  <>
                    {React.createElement(EVENT_TYPES[viewingOrder.eventType].icon, {
                      className: cn("h-8 w-8", EVENT_TYPES[viewingOrder.eventType].color),
                    })}
                    <div>
                      <h3 className="font-semibold">{viewingOrder.eventName || EVENT_TYPES[viewingOrder.eventType].label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDateFull(viewingOrder.scheduledTime)} о {viewingOrder.scheduledTime.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Столик {viewingOrder.tableNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{viewingOrder.guestCount} гостей</span>
                </div>
                {viewingOrder.seatingArea && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{SEATING_AREAS[viewingOrder.seatingArea]}</span>
                  </div>
                )}
                {viewingOrder.menuPreset && (
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <span>{MENU_PRESETS[viewingOrder.menuPreset]}</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              {viewingOrder.contact && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 text-sm">Контактна особа</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingOrder.contact.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${viewingOrder.contact.phone}`} className="text-blue-600 hover:underline">
                        {viewingOrder.contact.phone}
                      </a>
                    </div>
                    {viewingOrder.contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${viewingOrder.contact.email}`} className="text-blue-600 hover:underline">
                          {viewingOrder.contact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment */}
              {viewingOrder.paymentStatus && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Статус оплати</span>
                  </div>
                  <Badge className={PAYMENT_STATUSES[viewingOrder.paymentStatus].color}>
                    {PAYMENT_STATUSES[viewingOrder.paymentStatus].label}
                  </Badge>
                </div>
              )}

              {/* Notes */}
              {viewingOrder.specialRequests && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{viewingOrder.specialRequests}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrderId(null)}>
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
