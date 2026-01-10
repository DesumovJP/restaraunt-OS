"use client";

import * as React from "react";
import { LeftSidebar } from "@/features/pos/left-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Menu,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { ReservationDialog, ReservationsList } from "@/features/reservations";

// Формат дати
function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return "Сьогодні";
  if (isSameDay(date, tomorrow)) return "Завтра";

  return date.toLocaleDateString("uk-UA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Міні-календар для вибору дати
function MiniCalendar({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = React.useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const today = new Date();

  // Дні тижня
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  // Генеруємо дні місяця
  const days = React.useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    // Перший день місяця
    const firstDay = new Date(year, month, 1);
    // Останній день місяця
    const lastDay = new Date(year, month + 1, 0);

    // День тижня першого дня (0 = неділя, переробимо на понеділок = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const result: (Date | null)[] = [];

    // Пусті клітинки до першого дня
    for (let i = 0; i < startDayOfWeek; i++) {
      result.push(null);
    }

    // Дні місяця
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(year, month, d));
    }

    return result;
  }, [viewMonth]);

  const monthName = viewMonth.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const goMonth = (offset: number) => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1)
    );
  };

  return (
    <div className="p-3 w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => goMonth(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium text-sm capitalize">{monthName}</span>
        <button
          onClick={() => goMonth(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs text-slate-500 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="h-8" />;
          }

          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const isPast = day < today && !isToday;

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onSelect(day);
                onClose();
              }}
              className={cn(
                "h-8 rounded-lg text-sm font-medium transition-colors",
                isSelected
                  ? "bg-slate-900 text-white"
                  : isToday
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : isPast
                  ? "text-slate-300"
                  : "hover:bg-slate-100"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <button
        onClick={() => {
          onSelect(new Date());
          onClose();
        }}
        className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
      >
        Сьогодні
      </button>
    </div>
  );
}

export default function WaiterCalendarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = React.useState(false);

  // Date string for reservations query
  const dateStr = selectedDate.toISOString().split("T")[0];

  // Навігація по днях
  const goToDay = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Офіціант"
        userRole="Зміна 1"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 w-11"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-slate-900">Бронювання</h1>
          </div>

          <Button
            onClick={() => setIsReservationDialogOpen(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-1" />
            Бронювання
          </Button>
        </header>

        {/* Date navigation */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => goToDay(-1)}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 min-w-[160px] justify-center"
              >
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span className="text-lg font-semibold text-slate-900">
                  {formatDate(selectedDate)}
                </span>
              </button>

              {isCalendarOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCalendarOpen(false)}
                  />
                  {/* Calendar dropdown */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-lg border">
                    <MiniCalendar
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => goToDay(1)}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Content - Reservations list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto">
            <ReservationsList date={dateStr} variant="today" />
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <ReservationDialog
        open={isReservationDialogOpen}
        onOpenChange={setIsReservationDialogOpen}
      />
    </div>
  );
}
