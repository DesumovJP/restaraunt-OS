"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "urql";
import { GET_WORKER_SHIFTS } from "@/graphql/queries";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Timer,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";

// Shift type colors
const SHIFT_TYPE_COLORS: Record<string, string> = {
  morning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  afternoon: "bg-orange-100 text-orange-800 border-orange-300",
  evening: "bg-purple-100 text-purple-800 border-purple-300",
  night: "bg-blue-100 text-blue-800 border-blue-300",
  split: "bg-gray-100 text-gray-800 border-gray-300",
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-info/10 text-info",
  started: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  missed: "bg-error/10 text-error",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Заплановано",
  started: "В роботі",
  completed: "Завершено",
  missed: "Пропущено",
  cancelled: "Скасовано",
};

const SHIFT_TYPE_LABELS: Record<string, string> = {
  morning: "Ранкова",
  afternoon: "Денна",
  evening: "Вечірня",
  night: "Нічна",
  split: "Розділена",
};

const DAYS_UK = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_UK = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

interface WorkerShift {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  actualStartTime?: string;
  actualEndTime?: string;
  scheduledMinutes: number;
  actualMinutes?: number;
  overtimeMinutes?: number;
  breakMinutes?: number;
  department?: string;
  station?: string;
  notes?: string;
  isHoliday?: boolean;
  hourlyRate?: number;
  totalPay?: number;
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  return week;
}

function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add days from previous month to fill first week
  const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    dates.push(d);
  }

  // Add all days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }

  // Add days from next month to fill last week
  const endPadding = (7 - (dates.length % 7)) % 7;
  for (let i = 1; i <= endPadding; i++) {
    dates.push(new Date(year, month + 1, i));
  }

  return dates;
}

export default function WorkerProfilePage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"week" | "month">("week");

  // Calculate date range
  const fromDate = React.useMemo(() => {
    if (viewMode === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1);
      return start.toISOString().split("T")[0];
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString().split("T")[0];
    }
  }, [currentDate, viewMode]);

  const toDate = React.useMemo(() => {
    if (viewMode === "week") {
      const end = new Date(currentDate);
      end.setDate(end.getDate() - end.getDay() + 7);
      return end.toISOString().split("T")[0];
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString().split("T")[0];
    }
  }, [currentDate, viewMode]);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: GET_WORKER_SHIFTS,
    variables: {
      workerId: user?.documentId || "",
      fromDate,
      toDate,
    },
    pause: !user?.documentId,
  });

  const shifts: WorkerShift[] = data?.workerShifts || [];

  // Group shifts by date
  const shiftsByDate = React.useMemo(() => {
    const map: Record<string, WorkerShift[]> = {};
    for (const shift of shifts) {
      if (!map[shift.date]) {
        map[shift.date] = [];
      }
      map[shift.date].push(shift);
    }
    return map;
  }, [shifts]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    let totalScheduled = 0;
    let totalActual = 0;
    let totalOvertime = 0;
    let completedShifts = 0;
    let totalPay = 0;

    for (const shift of shifts) {
      totalScheduled += shift.scheduledMinutes || 0;
      totalActual += shift.actualMinutes || 0;
      totalOvertime += shift.overtimeMinutes || 0;
      totalPay += shift.totalPay || 0;
      if (shift.status === "completed") {
        completedShifts++;
      }
    }

    return {
      totalScheduledHours: (totalScheduled / 60).toFixed(1),
      totalActualHours: (totalActual / 60).toFixed(1),
      totalOvertimeHours: (totalOvertime / 60).toFixed(1),
      completedShifts,
      totalShifts: shifts.length,
      totalPay: totalPay.toFixed(2),
    };
  }, [shifts]);

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (time: string) => time?.slice(0, 5) || "—";

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}г ${mins}хв`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dates = viewMode === "week"
    ? getWeekDates(currentDate)
    : getMonthDates(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/kitchen">
              <Button variant="ghost" size="icon" aria-label="Назад">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Мій профіль</h1>
              <p className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName || user?.username}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch({ requestPolicy: "network-only" })}
            disabled={fetching}
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalScheduledHours}г</p>
              <p className="text-xs text-muted-foreground">Заплановано</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalActualHours}г</p>
              <p className="text-xs text-muted-foreground">Відпрацьовано</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalOvertimeHours}г</p>
              <p className="text-xs text-muted-foreground">Овертайм</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.completedShifts}/{stats.totalShifts}</p>
              <p className="text-xs text-muted-foreground">Змін</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Controls */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Календар змін
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Тиждень
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Місяць
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {viewMode === "week"
                    ? `${dates[0]?.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })} - ${dates[6]?.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
                    : MONTHS_UK[currentDate.getMonth()] + " " + currentDate.getFullYear()
                  }
                </span>
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  Сьогодні
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            {viewMode === "week" ? (
              // Week View
              <div className="space-y-2">
                {dates.map((date) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const dayShifts = shiftsByDate[dateStr] || [];
                  const today = isToday(date);

                  return (
                    <div
                      key={dateStr}
                      className={`p-3 rounded-lg border ${
                        today ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${today ? "text-primary" : ""}`}>
                          {DAYS_UK[date.getDay()]}, {date.getDate()}.{date.getMonth() + 1}
                        </span>
                        {today && (
                          <Badge variant="outline" className="text-primary">
                            Сьогодні
                          </Badge>
                        )}
                      </div>
                      {dayShifts.length > 0 ? (
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.documentId}
                              className={`p-2 rounded border ${SHIFT_TYPE_COLORS[shift.shiftType] || "bg-muted"}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={STATUS_COLORS[shift.status]}
                                >
                                  {STATUS_LABELS[shift.status] || shift.status}
                                </Badge>
                              </div>
                              {shift.actualStartTime && (
                                <p className="text-xs mt-1 text-muted-foreground">
                                  Факт: {formatTime(shift.actualStartTime)}
                                  {shift.actualEndTime && ` - ${formatTime(shift.actualEndTime)}`}
                                </p>
                              )}
                              {shift.actualMinutes && (
                                <p className="text-xs text-muted-foreground">
                                  Відпрацьовано: {formatMinutes(shift.actualMinutes)}
                                  {shift.overtimeMinutes ? ` (+${formatMinutes(shift.overtimeMinutes)} овертайм)` : ""}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Вихідний</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Month View
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_UK.slice(1).concat(DAYS_UK[0]).map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {dates.map((date) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const dayShifts = shiftsByDate[dateStr] || [];
                    const today = isToday(date);
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-[60px] p-1 rounded border text-center ${
                          today
                            ? "border-primary bg-primary/10"
                            : isCurrentMonth
                            ? "border-border"
                            : "border-transparent bg-muted/30"
                        }`}
                      >
                        <span className={`text-xs ${!isCurrentMonth ? "text-muted-foreground" : ""}`}>
                          {date.getDate()}
                        </span>
                        {dayShifts.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayShifts.slice(0, 2).map((shift) => (
                              <div
                                key={shift.documentId}
                                className={`text-xs px-1 py-0.5 rounded ${SHIFT_TYPE_COLORS[shift.shiftType] || "bg-muted"}`}
                              >
                                {formatTime(shift.startTime)}
                              </div>
                            ))}
                            {dayShifts.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{dayShifts.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Легенда типів змін:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SHIFT_TYPE_LABELS).map(([key, label]) => (
                <Badge key={key} className={SHIFT_TYPE_COLORS[key]}>
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
