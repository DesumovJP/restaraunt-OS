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

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {TIME_SLOTS.map((slot, index) => {
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
                "py-2 px-1 text-sm font-medium transition-all",
                // Selected range styling
                isInRange && "bg-slate-900 text-white",
                isStart && isEnd && "rounded-lg",
                isStart && !isEnd && "rounded-l-lg rounded-r-none",
                isEnd && !isStart && "rounded-r-lg rounded-l-none",
                !isStart && !isEnd && isInRange && "rounded-none",
                // Not in range
                !isInRange && isBooked && "bg-red-100 text-red-400 cursor-not-allowed line-through rounded-lg",
                !isInRange && isPast && "bg-slate-100 text-slate-300 cursor-not-allowed rounded-lg",
                !isInRange && !isBooked && !isPast && "bg-slate-50 hover:bg-slate-200 text-slate-700 rounded-lg",
                // Would include booked
                wouldIncludeBooked && !isInRange && "opacity-50 cursor-not-allowed"
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {/* Duration indicator */}
      {getDurationText() && (
        <div className="mt-2 text-center">
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {TIME_SLOTS[startIndex!]} - {getEndTimeFromSlots(startIndex!, endIndex!)} ({getDurationText()})
          </Badge>
        </div>
      )}
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

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === value.toDateString();
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
      {dates.map((date) => (
        <button
          key={date.toISOString()}
          type="button"
          onClick={() => onChange(date)}
          className={cn(
            "flex flex-col items-center py-2 px-3 rounded-lg transition-all shrink-0",
            isSelected(date)
              ? "bg-slate-900 text-white"
              : "bg-slate-50 hover:bg-slate-100"
          )}
        >
          <span className="text-xs font-medium opacity-70">
            {formatDayName(date)}
          </span>
          <span className="text-lg font-bold">
            {date.getDate()}
          </span>
          {isToday(date) && (
            <span className="text-[10px] font-medium">
              Сьогодні
            </span>
          )}
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Нове бронювання</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date selection */}
          <div>
            <Label className="mb-2 block">Дата</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Table selection */}
          <div>
            <Label className="mb-2 block">Столик *</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger>
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
            <div className="flex items-center justify-between mb-2">
              <Label>Час * <span className="font-normal text-slate-500">(оберіть слоти)</span></Label>
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

          {/* Guest count */}
          <div>
            <Label className="mb-2 block">Кількість гостей *</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setGuestCount((prev) => Math.max(1, parseInt(prev) - 1).toString())}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="50"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-20 text-center text-lg font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setGuestCount((prev) => Math.min(50, parseInt(prev) + 1).toString())}
              >
                +
              </Button>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Ім'я *</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ім'я гостя"
                required
              />
            </div>
            <div>
              <Label className="mb-2 block">Телефон *</Label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+380..."
                required
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Email (необов'язково)</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Occasion */}
          <div>
            <Label className="mb-2 block">Привід</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(OCCASION_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOccasion(key as Occasion)}
                    className={cn(
                      "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm transition-all",
                      occasion === key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special requests */}
          <div>
            <Label className="mb-2 block">Особливі побажання</Label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Алергії, дитячі стільці, торт..."
              rows={2}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={!tableId || !startTime || !contactName || !contactPhone || isCreating}
              className="bg-slate-900 hover:bg-slate-800"
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
