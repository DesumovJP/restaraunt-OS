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
    <div className="p-4 w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => goMonth(-1)}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-semibold text-base capitalize text-slate-900">{monthName}</span>
        <button
          onClick={() => goMonth(1)}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "h-9 flex items-center justify-center text-xs font-semibold uppercase tracking-wide",
              idx >= 5 ? "text-amber-600" : "text-slate-400"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="h-9" />;
          }

          const isSelected = isSameDay(day, selected);
          const isDayToday = isSameDay(day, today);
          const isPast = day < today && !isDayToday;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onSelect(day);
                onClose();
              }}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-all",
                isSelected
                  ? "bg-slate-900 text-white shadow-md"
                  : isDayToday
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : isPast
                  ? "text-slate-300 cursor-default"
                  : isWeekend
                  ? "text-amber-600 hover:bg-amber-50"
                  : "text-slate-700 hover:bg-slate-100"
              )}
              disabled={isPast}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => {
            onSelect(new Date());
            onClose();
          }}
          className="w-full py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
        >
          Перейти на сьогодні
        </button>
      </div>
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

  // Quick jump to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex h-screen bg-slate-100">
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Офіціант"
        userRole="Зміна 1"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b shadow-sm px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Бронювання</h1>
              <p className="text-sm text-slate-500 hidden sm:block">Керування резерваціями столиків</p>
            </div>
          </div>

          <Button
            onClick={() => setIsReservationDialogOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 h-10 sm:h-11 px-3 sm:px-5 flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Нове бронювання</span>
          </Button>
        </header>

        {/* Date navigation */}
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => goToDay(-1)}
              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-slate-50 min-w-[200px] justify-center border border-slate-200 transition-colors"
              >
                <CalendarDays className="w-5 h-5 text-slate-500" />
                <span className="text-lg font-bold text-slate-900">
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
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-xl border">
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
              className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            {/* Today button - show only if not today */}
            {!isToday && (
              <button
                onClick={goToToday}
                className="ml-2 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
              >
                Сьогодні
              </button>
            )}
          </div>
        </div>

        {/* Content - Reservations list */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
            <ReservationsList date={dateStr} variant="today" className="flex-1" />
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <ReservationDialog
        open={isReservationDialogOpen}
        onOpenChange={setIsReservationDialogOpen}
        selectedDate={selectedDate}
      />
    </div>
  );
}
