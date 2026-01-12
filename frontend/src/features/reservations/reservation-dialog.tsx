"use client";

/**
 * Reservation Dialog Component
 *
 * Full-featured dialog for creating and editing table reservations.
 * Includes time slot selection, guest count, contact info, and special requests.
 *
 * @module features/reservations/reservation-dialog
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Clock,
  Users,
  Calendar,
  PartyPopper,
  Heart,
  Briefcase,
  Cake,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useTableStore } from "@/stores/table-store";
import { useCreateReservation, useReservationsForDate, type Reservation } from "@/hooks/use-graphql-scheduled-orders";

// ==========================================
// TYPES
// ==========================================

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  selectedTableId?: string;
  onSuccess?: (confirmationCode: string) => void;
}

type Occasion = "none" | "birthday" | "anniversary" | "business" | "romantic" | "other";

const OCCASION_CONFIG: Record<Occasion, { label: string; icon: React.ElementType }> = {
  none: { label: "Без приводу", icon: Calendar },
  birthday: { label: "День народження", icon: Cake },
  anniversary: { label: "Річниця", icon: Heart },
  business: { label: "Бізнес-зустріч", icon: Briefcase },
  romantic: { label: "Романтична вечеря", icon: Heart },
  other: { label: "Інше", icon: PartyPopper },
};

// Time slots configuration (30-min intervals)
const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30",
  "22:00",
];

// Helper to format time for GraphQL (HH:mm:ss.SSS)
function formatTimeForGraphQL(time: string): string {
  return `${time}:00.000`;
}

// Helper to calculate end time from slot index
function getEndTimeFromSlots(startIndex: number, endIndex: number): string {
  // End time is the slot AFTER the last selected slot
  const lastSlotIndex = endIndex;
  if (lastSlotIndex + 1 < TIME_SLOTS.length) {
    return TIME_SLOTS[lastSlotIndex + 1];
  }
  // If last slot is 22:00, end at 22:30
  const lastSlot = TIME_SLOTS[lastSlotIndex];
  const [hours, minutes] = lastSlot.split(":").map(Number);
  const endMinutes = minutes + 30;
  const endHours = hours + Math.floor(endMinutes / 60);
  return `${endHours.toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
}

// ==========================================
// TIME SLOT RANGE PICKER
// ==========================================

interface TimeSlotRangePickerProps {
  startIndex: number | null;
  endIndex: number | null;
  onChange: (startIdx: number | null, endIdx: number | null) => void;
  bookedSlots?: string[];
  isToday?: boolean;
}

// Time period groups for better UX
const TIME_PERIODS = [
  { label: "Ранок", start: 0, end: 3 },   // 10:00-11:30
  { label: "День", start: 4, end: 11 },    // 12:00-15:30
  { label: "Вечір", start: 12, end: 24 },  // 16:00-22:00
];

function TimeSlotRangePicker({
  startIndex,
  endIndex,
  onChange,
  bookedSlots = [],
  isToday = false,
}: TimeSlotRangePickerProps) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const handleClick = (index: number) => {
    if (startIndex === null) {
      // First click - set start
      onChange(index, index);
    } else if (endIndex !== null && startIndex === endIndex && index === startIndex) {
      // Click on single selected slot - deselect
      onChange(null, null);
    } else if (index < startIndex) {
      // Click before current range - new start
      onChange(index, index);
    } else if (index >= startIndex) {
      // Click at or after start - extend/shrink to this end
      onChange(startIndex, index);
    }
  };

  // Check if a range of slots has any booked slots
  const hasBookedInRange = (start: number, end: number) => {
    for (let i = start; i <= end; i++) {
      if (bookedSlots.includes(TIME_SLOTS[i])) return true;
    }
    return false;
  };

  // Calculate duration text
  const getDurationText = () => {
    if (startIndex === null || endIndex === null) return null;
    const slots = endIndex - startIndex + 1;
    const minutes = slots * 30;
    if (minutes < 60) return `${minutes} хв`;
    const hours = minutes / 60;
    if (hours === 1) return "1 година";
    if (hours === 1.5) return "1.5 години";
    if (hours === 2) return "2 години";
    return `${hours} год`;
  };

  const renderSlot = (slot: string, index: number) => {
    const isBooked = bookedSlots.includes(slot);
    const isPast = isToday && slot < currentTime;
    const isDisabled = isBooked || isPast;

    const isInRange = startIndex !== null && endIndex !== null &&
      index >= startIndex && index <= endIndex;
    const isStart = index === startIndex;
    const isEnd = index === endIndex;

    // Check if selecting this would include a booked slot
    const wouldIncludeBooked = startIndex !== null && !isDisabled &&
      hasBookedInRange(Math.min(startIndex, index), Math.max(startIndex, index));

    return (
      <button
        key={slot}
        type="button"
        onClick={() => !isDisabled && !wouldIncludeBooked && handleClick(index)}
        disabled={isDisabled}
        className={cn(
          "py-2.5 px-2 text-sm font-medium transition-all",
          // Selected range styling
          isInRange && "bg-slate-900 text-white shadow-sm",
          isStart && isEnd && "rounded-lg",
          isStart && !isEnd && "rounded-l-lg rounded-r-none",
          isEnd && !isStart && "rounded-r-lg rounded-l-none",
          !isStart && !isEnd && isInRange && "rounded-none",
          // Not in range
          !isInRange && isBooked && "bg-red-50 text-red-300 cursor-not-allowed line-through rounded-lg border border-red-100",
          !isInRange && isPast && "bg-slate-50 text-slate-300 cursor-not-allowed rounded-lg",
          !isInRange && !isBooked && !isPast && "bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:border-slate-300",
          // Would include booked
          wouldIncludeBooked && !isInRange && "opacity-40 cursor-not-allowed"
        )}
      >
        {slot}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Time periods */}
      {TIME_PERIODS.map((period) => {
        const periodSlots = TIME_SLOTS.slice(period.start, period.end + 1);
        if (periodSlots.length === 0) return null;

        return (
          <div key={period.label}>
            <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              {period.label}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {periodSlots.map((slot, idx) => renderSlot(slot, period.start + idx))}
            </div>
          </div>
        );
      })}

      {/* Duration indicator */}
      {getDurationText() && (
        <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-lg border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            {TIME_SLOTS[startIndex!]} - {getEndTimeFromSlots(startIndex!, endIndex!)}
          </span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {getDurationText()}
          </Badge>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-900" />
          <span>Обрано</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-100" />
          <span>Зайнято</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DATE PICKER
// ==========================================

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate next 14 days
  const dates = React.useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const formatDayName = (date: Date) => {
    const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    return dayNames[date.getDay()];
  };

  const formatMonth = (date: Date) => {
    const monthNames = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
    return monthNames[date.getMonth()];
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === value.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {dates.map((date) => (
        <button
          key={date.toISOString()}
          type="button"
          onClick={() => onChange(date)}
          className={cn(
            "flex flex-col items-center py-2.5 px-3.5 rounded-xl transition-all shrink-0 min-w-[64px] border",
            isSelected(date)
              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
              : isToday(date)
              ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
              : isWeekend(date)
              ? "bg-amber-50/50 border-slate-200 hover:bg-amber-50"
              : "bg-white border-slate-200 hover:bg-slate-50"
          )}
        >
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            isSelected(date) ? "text-white/70" : "text-slate-400"
          )}>
            {formatDayName(date)}
          </span>
          <span className={cn(
            "text-xl font-bold leading-tight",
            isSelected(date) ? "text-white" : "text-slate-900"
          )}>
            {date.getDate()}
          </span>
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            isSelected(date) ? "text-white/80" : "text-slate-500"
          )}>
            {isToday(date) ? "Сьогодні" : isTomorrow(date) ? "Завтра" : formatMonth(date)}
          </span>
        </button>
      ))}
    </div>
  );
}

// ==========================================
// MAIN DIALOG
// ==========================================

export function ReservationDialog({
  open,
  onOpenChange,
  selectedDate: initialDate,
  selectedTableId: initialTableId,
  onSuccess,
}: ReservationDialogProps) {
  // Form state
  const [date, setDate] = React.useState<Date>(initialDate || new Date());
  const [startSlotIndex, setStartSlotIndex] = React.useState<number | null>(null);
  const [endSlotIndex, setEndSlotIndex] = React.useState<number | null>(null);
  const [tableId, setTableId] = React.useState(initialTableId || "");
  const [guestCount, setGuestCount] = React.useState("2");
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [occasion, setOccasion] = React.useState<Occasion>("none");
  const [specialRequests, setSpecialRequests] = React.useState("");

  // Success state
  const [confirmationCode, setConfirmationCode] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setDate(initialDate || new Date());
      setTableId(initialTableId || "");
      setStartSlotIndex(null);
      setEndSlotIndex(null);
      setConfirmationCode(null);
    }
  }, [open, initialDate, initialTableId]);

  // Tables
  const tables = useTableStore((s) => s.tables);

  // Get existing reservations for selected date
  const dateStr = date.toISOString().split("T")[0];
  const { reservations, isLoading: loadingReservations } = useReservationsForDate(dateStr);

  // Booked slots for selected table (all slots in reservation ranges)
  const bookedSlots = React.useMemo(() => {
    if (!tableId) return [];
    const slots: string[] = [];

    reservations
      .filter((r: Reservation) => r.tableId === tableId)
      .forEach((r: Reservation) => {
        const startTime = r.startTime.slice(0, 5);
        const endTime = r.endTime.slice(0, 5);

        // Find all slots between start and end
        let inRange = false;
        for (const slot of TIME_SLOTS) {
          if (slot === startTime) inRange = true;
          if (inRange && slot < endTime) {
            slots.push(slot);
          }
          if (slot >= endTime) inRange = false;
        }
      });

    return slots;
  }, [reservations, tableId]);

  // Create reservation hook
  const { createReservation, loading: isCreating, error } = useCreateReservation();

  // Get start and end times from slot indices
  const startTime = startSlotIndex !== null ? TIME_SLOTS[startSlotIndex] : null;
  const endTime = startSlotIndex !== null && endSlotIndex !== null
    ? getEndTimeFromSlots(startSlotIndex, endSlotIndex)
    : null;

  // Check if today
  const isToday = date.toDateString() === new Date().toDateString();

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableId || !startTime || !endTime || !contactName || !contactPhone) return;

    try {
      const result = await createReservation({
        tableId,
        date: dateStr,
        startTime: formatTimeForGraphQL(startTime),
        endTime: formatTimeForGraphQL(endTime),
        guestCount: parseInt(guestCount, 10) || 2,
        contactName,
        contactPhone,
        contactEmail: contactEmail || undefined,
        specialRequests: specialRequests || undefined,
        occasion: occasion !== "none" ? occasion : undefined,
      });

      if (result?.confirmationCode) {
        setConfirmationCode(result.confirmationCode);
        onSuccess?.(result.confirmationCode);
      }
    } catch (err) {
      console.error("[Reservation] Failed to create:", err);
    }
  };

  // Success view
  if (confirmationCode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Бронювання створено!
            </h2>
            <p className="text-slate-600 mb-4">
              Код підтвердження:
            </p>
            <div className="bg-slate-100 rounded-lg py-3 px-6 inline-block mb-6">
              <span className="text-2xl font-mono font-bold tracking-wider">
                {confirmationCode}
              </span>
            </div>
            <div className="text-sm text-slate-500 mb-6">
              <p>Стіл {tables.find((t) => t.id === tableId || t.documentId === tableId)?.number}</p>
              <p>{date.toLocaleDateString("uk-UA")} о {startTime} - {endTime}</p>
              <p>{guestCount} гостей</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Готово
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Нове бронювання
          </DialogTitle>
        </DialogHeader>

        <form id="reservation-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section: Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Дата і час
            </h3>

            {/* Date selection */}
            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">Дата</Label>
              <DatePicker value={date} onChange={setDate} />
            </div>

            {/* Table selection */}
            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                Столик <span className="text-red-500">*</span>
              </Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Оберіть столик..." />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem
                      key={table.id || table.documentId}
                      value={table.id || table.documentId || ""}
                    >
                      Стіл {table.number} ({table.capacity} місць)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time slots - select range */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <Label className="text-sm font-medium text-slate-700">
                  Час <span className="text-red-500">*</span>
                  <span className="font-normal text-slate-400 ml-1">(оберіть діапазон)</span>
                </Label>
                {loadingReservations && (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                )}
              </div>
              <TimeSlotRangePicker
                startIndex={startSlotIndex}
                endIndex={endSlotIndex}
                onChange={(start, end) => {
                  setStartSlotIndex(start);
                  setEndSlotIndex(end);
                }}
                bookedSlots={bookedSlots}
                isToday={isToday}
              />
            </div>
          </div>

          <div className="border-t" />

          {/* Section: Guest Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Інформація про гостя
            </h3>

            {/* Guest count */}
            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                Кількість гостей <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={() => setGuestCount((prev) => Math.max(1, parseInt(prev) - 1).toString())}
                >
                  -
                </Button>
                <div className="flex items-center gap-2 flex-1 justify-center bg-slate-50 rounded-lg h-11 px-4">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-lg font-bold text-slate-900">{guestCount}</span>
                  <span className="text-sm text-slate-500">гостей</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={() => setGuestCount((prev) => Math.min(50, parseInt(prev) + 1).toString())}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                  Ім'я <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ім'я гостя"
                  className="h-11"
                  required
                />
              </div>
              <div>
                <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                  Телефон <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+380..."
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                Email <span className="text-slate-400 font-normal">(необов'язково)</span>
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>
          </div>

          <div className="border-t" />

          {/* Section: Additional */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Додатково
            </h3>

            {/* Occasion */}
            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">Привід</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(OCCASION_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOccasion(key as Occasion)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border",
                        occasion === key
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special requests */}
            <div>
              <Label className="mb-2.5 block text-sm font-medium text-slate-700">
                Особливі побажання
              </Label>
              <Textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Алергії, дитячі стільці, торт, особливі вподобання..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </form>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
          <Button
            type="submit"
            form="reservation-form"
            disabled={!tableId || !startTime || !contactName || !contactPhone || isCreating}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base font-medium rounded-xl"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Створення...
              </>
            ) : (
              "Забронювати"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
