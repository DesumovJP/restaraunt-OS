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
  Clock,
  Users,
  Phone,
  CheckCircle2,
  XCircle,
  UserCheck,
  MoreVertical,
  Calendar,
  RefreshCw,
  ShoppingBag,
  Plus,
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
}> = {
  pending: { label: "Очікує", variant: "outline", icon: Clock },
  confirmed: { label: "Підтверджено", variant: "default", icon: CheckCircle2 },
  seated: { label: "За столом", variant: "secondary", icon: UserCheck },
  completed: { label: "Завершено", variant: "secondary", icon: CheckCircle2 },
  cancelled: { label: "Скасовано", variant: "destructive", icon: XCircle },
  no_show: { label: "Не з'явився", variant: "destructive", icon: XCircle },
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

  const isUpcoming = React.useMemo(() => {
    const now = new Date();
    const resDate = new Date(`${reservation.date}T${reservation.startTime}`);
    const diffMs = resDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return diffMins > 0 && diffMins <= 60;
  }, [reservation]);

  const isPast = React.useMemo(() => {
    const now = new Date();
    const resDate = new Date(`${reservation.date}T${reservation.endTime}`);
    return resDate < now;
  }, [reservation]);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-white",
        isUpcoming && "border-amber-300 bg-amber-50",
        isPast && reservation.status === "pending" && "border-red-200 bg-red-50"
      )}
    >
      {/* Time */}
      <div className="text-center min-w-[60px]">
        <div className="text-lg font-bold text-slate-900">
          {reservation.startTime.slice(0, 5)}
        </div>
        <div className="text-xs text-slate-500">
          {reservation.endTime.slice(0, 5)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900">
            Стіл {reservation.tableNumber}
          </span>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {reservation.guestCount}
          </Badge>
          <Badge variant={statusConfig.variant} className="text-xs gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{reservation.contactName}</span>
          {reservation.contactPhone && (
            <a
              href={`tel:${reservation.contactPhone}`}
              className="flex items-center gap-1 text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
              {reservation.contactPhone}
            </a>
          )}
        </div>

        {reservation.occasion && reservation.occasion !== "none" && (
          <div className="text-xs text-slate-500 mt-1">
            {reservation.occasion === "birthday" && "День народження"}
            {reservation.occasion === "anniversary" && "Річниця"}
            {reservation.occasion === "business" && "Бізнес-зустріч"}
            {reservation.occasion === "romantic" && "Романтична вечеря"}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Pre-order button - visible for pending/confirmed reservations */}
        {(reservation.status === "pending" || reservation.status === "confirmed") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddPreOrder}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            Замовлення
          </Button>
        )}

        {onStatusChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isUpdating}>
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Pre-order option in menu too */}
              {(reservation.status === "pending" || reservation.status === "confirmed") && (
                <>
                  <DropdownMenuItem onClick={handleAddPreOrder} className="text-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати попереднє замовлення
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {reservation.status === "pending" && (
                <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "confirmed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Підтвердити
                </DropdownMenuItem>
              )}
              {(reservation.status === "pending" || reservation.status === "confirmed") && (
                <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "seated")}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Гість за столом
                </DropdownMenuItem>
              )}
              {reservation.status === "seated" && (
                <DropdownMenuItem onClick={() => onStatusChange(reservation.documentId, "completed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Завершити
                </DropdownMenuItem>
              )}
              {reservation.status !== "cancelled" && reservation.status !== "completed" && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
      <div className={className}>
        <EmptyState
          type="empty"
          title="Немає бронювань"
          description={variant === "today" ? "На сьогодні бронювань немає" : "Найближчих бронювань немає"}
        />
      </div>
    );
  }

  // Group by date for upcoming view
  const groupedReservations = React.useMemo(() => {
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
