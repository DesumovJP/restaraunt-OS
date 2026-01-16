"use client";

/**
 * Reservations List Component
 *
 * Displays upcoming reservations in a list or card format.
 * Shows time, table, guest count, and contact info.
 *
 * @module features/reservations/reservations-list
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Users,
  Phone,
  CheckCircle2,
  XCircle,
  UserCheck,
  MoreVertical,
  Calendar,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useReservationsForDate,
  useUpcomingReservations,
  useUpdateReservationStatus,
  type Reservation,
} from "@/hooks/use-graphql-scheduled-orders";

// ==========================================
// STATUS CONFIG
// ==========================================

type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

const STATUS_CONFIG: Record<ReservationStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: {
    label: "Очікує",
    variant: "outline",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-l-amber-400",
  },
  confirmed: {
    label: "Підтверджено",
    variant: "default",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
  },
  seated: {
    label: "За столом",
    variant: "secondary",
    icon: UserCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-l-blue-500",
  },
  completed: {
    label: "Завершено",
    variant: "secondary",
    icon: CheckCircle2,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-l-slate-400",
  },
  cancelled: {
    label: "Скасовано",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-l-red-400",
  },
  no_show: {
    label: "Не з'явився",
    variant: "destructive",
    icon: XCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-l-orange-400",
  },
};

const OCCASION_CONFIG: Record<string, { label: string; emoji: string }> = {
  birthday: { label: "День народження", emoji: "🎂" },
  anniversary: { label: "Річниця", emoji: "💕" },
  business: { label: "Бізнес-зустріч", emoji: "💼" },
  romantic: { label: "Романтична вечеря", emoji: "🌹" },
  celebration: { label: "Святкування", emoji: "🎉" },
  other: { label: "Інше", emoji: "✨" },
};

// ==========================================
// RESERVATION CARD
// ==========================================

interface ReservationCardProps {
  reservation: Reservation;
  onStatusChange?: (id: string, status: string) => void;
  isUpdating?: boolean;
}

function ReservationCard({ reservation, onStatusChange, isUpdating }: ReservationCardProps) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[reservation.status as ReservationStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const occasionConfig = reservation.occasion && reservation.occasion !== "none"
    ? OCCASION_CONFIG[reservation.occasion]
    : null;

  // Navigate to POS in scheduled mode
  const handleAddPreOrder = () => {
    const scheduledFor = new Date(`${reservation.date}T${reservation.startTime}`).toISOString();

    const params = new URLSearchParams({
      mode: 'scheduled',
      reservationId: reservation.documentId,
      reservationCode: reservation.confirmationCode || '',
      tableId: reservation.tableId || '',
      tableNumber: String(reservation.tableNumber),
      scheduledFor,
      contactName: reservation.contactName || '',
      contactPhone: reservation.contactPhone || '',
      guestCount: String(reservation.guestCount || 2),
    });

    router.push(`/pos/waiter?${params.toString()}`);
  };

  // Time calculations
  const { isUpcoming, isPast, timeUntil, isNow } = React.useMemo(() => {
    const now = new Date();
    const resStart = new Date(`${reservation.date}T${reservation.startTime}`);
    const resEnd = new Date(`${reservation.date}T${reservation.endTime}`);
    const diffMs = resStart.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    const isNow = now >= resStart && now <= resEnd;
    const isUpcoming = diffMins > 0 && diffMins <= 60;
    const isPast = resEnd < now;

    let timeUntil: string | null = null;
    if (diffMins > 0) {
      if (diffMins < 60) {
        timeUntil = `${diffMins} хв`;
      } else {
        const hours = Math.floor(diffMins / 60);
        if (hours < 24) {
          const mins = diffMins % 60;
          timeUntil = mins > 0 ? `${hours} год ${mins} хв` : `${hours} год`;
        }
      }
    } else if (diffMins < 0 && !isPast) {
      timeUntil = `${Math.abs(diffMins)} хв тому`;
    }

    return { isUpcoming, isPast, timeUntil, isNow };
  }, [reservation]);

  const isActive = reservation.status === "pending" || reservation.status === "confirmed";
  const isSeated = reservation.status === "seated";
  const isFinished = reservation.status === "completed" || reservation.status === "cancelled" || reservation.status === "no_show";

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl border transition-all",
        isNow && "ring-2 ring-blue-500 border-blue-200",
        isUpcoming && !isNow && "border-amber-200",
        !isNow && !isUpcoming && "border-slate-200",
        isFinished && "opacity-50",
        "hover:shadow-md"
      )}
    >
      <div className="p-3 sm:p-4">
        {/* Main row: Time | Info | Status */}
        <div className="flex items-center gap-3">
          {/* Time - primary focus */}
          <div className={cn(
            "text-center px-3 py-2 rounded-lg min-w-[60px]",
            isNow ? "bg-blue-500 text-white" :
            isUpcoming ? "bg-amber-100 text-amber-800" :
            "bg-slate-100 text-slate-700"
          )}>
            <div className="text-lg font-bold tabular-nums leading-tight">
              {reservation.startTime.slice(0, 5)}
            </div>
            {timeUntil && !isNow && (
              <div className={cn(
                "text-[10px] leading-tight mt-0.5",
                isUpcoming ? "text-amber-600" : "text-slate-500"
              )}>
                {timeUntil}
              </div>
            )}
            {isNow && (
              <div className="text-[10px] leading-tight mt-0.5 font-medium">
                зараз
              </div>
            )}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Table */}
              <span className="font-semibold text-slate-900">
                Стіл {reservation.tableNumber}
              </span>
              {/* Guests */}
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {reservation.guestCount}
              </span>
              {/* Occasion */}
              {occasionConfig && (
                <>
                  <span className="text-slate-400">·</span>
                  <span title={occasionConfig.label}>{occasionConfig.emoji}</span>
                </>
              )}
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-slate-600 truncate">
                {reservation.contactName || "Без імені"}
              </span>
              {reservation.contactPhone && (
                <a
                  href={`tel:${reservation.contactPhone}`}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">{reservation.contactPhone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Status + Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status badge - compact */}
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              statusConfig.bgColor,
              statusConfig.color
            )}>
              <StatusIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
            </span>

            {/* Quick actions */}
            {onStatusChange && !isFinished && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreVertical className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isActive && (
                    <DropdownMenuItem onClick={handleAddPreOrder}>
                      <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />
                      Попереднє замовлення
                    </DropdownMenuItem>
                  )}
                  {isActive && <DropdownMenuSeparator />}

                  {reservation.status === "pending" && (
                    <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "confirmed")}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Підтвердити
                    </DropdownMenuItem>
                  )}
                  {isActive && (
                    <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "seated")}>
                      <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                      За столом
                    </DropdownMenuItem>
                  )}
                  {isSeated && (
                    <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "completed")}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Завершити
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onStatusChange(reservation.documentId, "no_show")}
                    className="text-amber-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Не з'явився
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(reservation.documentId, "cancelled")}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Скасувати
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Notes - only if present, compact */}
        {reservation.notes && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 line-clamp-1">
              {reservation.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// RESERVATIONS LIST
// ==========================================

interface ReservationsListProps {
  date?: string;
  variant?: "today" | "upcoming";
  limit?: number;
  className?: string;
}

export function ReservationsList({
  date,
  variant = "today",
  limit = 20,
  className,
}: ReservationsListProps) {
  const today = new Date().toISOString().split("T")[0];
  const displayDate = date || today;

  // Fetch reservations
  const {
    reservations: dateReservations,
    isLoading: loadingDate,
    error: dateError,
    refetch: refetchDate,
  } = useReservationsForDate(variant === "today" ? displayDate : "");

  const {
    reservations: upcomingReservations,
    isLoading: loadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useUpcomingReservations(variant === "upcoming" ? limit : 0);

  const reservations = variant === "today" ? dateReservations : upcomingReservations;
  const isLoading = variant === "today" ? loadingDate : loadingUpcoming;
  const error = variant === "today" ? dateError : upcomingError;
  const refetch = variant === "today" ? refetchDate : refetchUpcoming;

  // Update status hook
  const { updateStatus, loading: isUpdating } = useUpdateReservationStatus();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus(id, status);
      refetch();
    } catch (err) {
      console.error("[Reservations] Failed to update status:", err);
    }
  };

  // Group by date for upcoming view - must be before early returns
  const groupedReservations = React.useMemo(() => {
    if (!reservations || reservations.length === 0) {
      return {};
    }
    if (variant === "today") {
      return { [displayDate]: reservations };
    }

    const groups: Record<string, Reservation[]> = {};
    reservations.forEach((res: Reservation) => {
      if (!groups[res.date]) {
        groups[res.date] = [];
      }
      groups[res.date].push(res);
    });
    return groups;
  }, [reservations, variant, displayDate]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("p-4 bg-red-50 border border-red-200 rounded-lg", className)}>
        <p className="text-sm text-red-600">Помилка завантаження бронювань</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторити
        </Button>
      </div>
    );
  }

  // Empty state
  if (reservations.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <EmptyState
          type="empty"
          title="Немає бронювань"
          description={variant === "today" ? "На сьогодні бронювань немає" : "Найближчих бронювань немає"}
        />
      </div>
    );
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const todayDate = new Date();
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today) return "Сьогодні";
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Завтра";

    return date.toLocaleDateString("uk-UA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedReservations).map(([dateKey, dateReservations]) => (
        <div key={dateKey}>
          {variant === "upcoming" && (
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-700 capitalize">
                {formatDateHeader(dateKey)}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {dateReservations.length}
              </Badge>
            </div>
          )}
          <div className="space-y-3">
            {dateReservations.map((reservation: Reservation) => (
              <ReservationCard
                key={reservation.documentId}
                reservation={reservation}
                onStatusChange={handleStatusChange}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
