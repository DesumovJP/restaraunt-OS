"use client";

import * as React from "react";
import { useQuery } from "urql";
import { GET_TEAM_SCHEDULE, GET_ALL_WORKERS } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_UK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const SHIFT_TYPE_COLORS: Record<string, string> = {
  morning: "bg-yellow-100 text-yellow-800",
  afternoon: "bg-orange-100 text-orange-800",
  evening: "bg-purple-100 text-purple-800",
  night: "bg-blue-100 text-blue-800",
  split: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-blue-400",
  started: "border-amber-400",
  completed: "border-emerald-400",
  missed: "border-red-400",
  cancelled: "border-slate-300",
};

const DEPARTMENTS = [
  { value: "all", label: "Всі відділи" },
  { value: "management", label: "Менеджмент" },
  { value: "kitchen", label: "Кухня" },
  { value: "service", label: "Обслуговування" },
  { value: "bar", label: "Бар" },
  { value: "cleaning", label: "Клінінг" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Адмін",
  manager: "Менеджер",
  chef: "Шеф-кухар",
  cook: "Кухар",
  waiter: "Офіціант",
  host: "Хостес",
  bartender: "Бармен",
  cashier: "Касир",
  viewer: "Гість",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  chef: "bg-orange-100 text-orange-700",
  cook: "bg-yellow-100 text-yellow-700",
  waiter: "bg-blue-100 text-blue-700",
  host: "bg-pink-100 text-pink-700",
  bartender: "bg-cyan-100 text-cyan-700",
  cashier: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-700",
};

const SHIFT_TYPES = [
  { value: "morning", label: "Ранкова" },
  { value: "afternoon", label: "Денна" },
  { value: "evening", label: "Вечірня" },
  { value: "night", label: "Нічна" },
  { value: "split", label: "Розділена" },
];

interface Worker {
  documentId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  department?: string;
  station?: string;
  systemRole?: string;
  isActive?: boolean;
}

interface WorkerShift {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  department?: string;
  station?: string;
  scheduledMinutes?: number;
  actualMinutes?: number;
  worker?: Worker;
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  return week;
}

interface ShiftScheduleViewProps {
  className?: string;
  compact?: boolean;
}

export function ShiftScheduleView({ className, compact = false }: ShiftScheduleViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [department, setDepartment] = React.useState("all");
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convert to Mon=0, Sun=6
  });

  const weekDates = React.useMemo(() => getWeekDates(currentDate), [currentDate]);

  const fromDate = weekDates[0].toISOString().split("T")[0];
  const toDate = weekDates[6].toISOString().split("T")[0];

  const [{ data: scheduleData, fetching: scheduleFetching }, refetchSchedule] = useQuery({
    query: GET_TEAM_SCHEDULE,
    variables: {
      fromDate,
      toDate,
      department: department === "all" ? undefined : department,
    },
  });

  const [{ data: workersData }] = useQuery({
    query: GET_ALL_WORKERS,
  });

  const shifts: WorkerShift[] = scheduleData?.workerShifts || [];
  const workers: Worker[] = workersData?.usersPermissionsUsers || [];

  // Group shifts by date and worker
  const scheduleByDateWorker = React.useMemo(() => {
    const map: Record<string, Record<string, WorkerShift[]>> = {};

    for (const date of weekDates) {
      const dateStr = date.toISOString().split("T")[0];
      map[dateStr] = {};
    }

    for (const shift of shifts) {
      if (!map[shift.date]) continue;
      const workerId = shift.worker?.documentId || "unknown";
      if (!map[shift.date][workerId]) {
        map[shift.date][workerId] = [];
      }
      map[shift.date][workerId].push(shift);
    }

    return map;
  }, [shifts, weekDates]);

  // Filter workers by department and sort by role/name
  const filteredWorkers = React.useMemo(() => {
    let filtered = workers.filter(w => w.isActive !== false);

    if (department !== "all") {
      filtered = filtered.filter(w => w.department === department);
    }

    const roleOrder = ["chef", "cook", "bartender", "waiter", "host", "cashier", "manager", "admin", "viewer"];
    return filtered.sort((a, b) => {
      if (a.department !== b.department) {
        return (a.department || "").localeCompare(b.department || "");
      }
      const roleA = roleOrder.indexOf(a.systemRole || "viewer");
      const roleB = roleOrder.indexOf(b.systemRole || "viewer");
      if (roleA !== roleB) return roleA - roleB;
      return (a.firstName || a.username || "").localeCompare(b.firstName || b.username || "");
    });
  }, [workers, department]);

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const formatTime = (time: string) => time?.slice(0, 5) || "";

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-50", className)}>
      {/* Toolbar - compact single row */}
      <div className={cn(
        "flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b bg-white shadow-sm",
        compact && "py-1.5"
      )}>
        {/* Left: Shift Types Legend */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Типи змін:</span>
          {SHIFT_TYPES.map((type) => (
            <div
              key={type.value}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-lg font-medium",
                SHIFT_TYPE_COLORS[type.value]
              )}
            >
              {type.label}
            </div>
          ))}
        </div>

        {/* Center: Week Navigation */}
        <div className="flex items-center gap-0.5 rounded-xl border bg-slate-50 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={navigatePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-blue-500 hidden sm:block" />
            <span className="hidden sm:inline font-semibold text-xs">
              {weekDates[0].toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
              {" — "}
              {weekDates[6].toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
            </span>
            <span className="sm:hidden font-semibold text-xs">
              {weekDates[0].getDate()}-{weekDates[6].getDate()}.{weekDates[0].getMonth() + 1}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Department Filter + Refresh */}
        <div className="flex items-center gap-1.5">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs sm:text-sm rounded-xl">
              <Users className="h-3.5 w-3.5 text-slate-400 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => refetchSchedule({ requestPolicy: "network-only" })}
            disabled={scheduleFetching}
            title="Оновити"
          >
            <RefreshCw className={cn("h-4 w-4", scheduleFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {scheduleFetching && !scheduleData ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Немає працівників
            </h3>
            <p className="text-slate-500 text-sm max-w-sm">
              У вибраному відділі немає активних працівників
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: Day selector + cards */}
            <div className="md:hidden">
              {/* Day tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
                {weekDates.map((date, i) => {
                  const today = isToday(date);
                  const isSelected = selectedDayIndex === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDayIndex(i)}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all",
                        isSelected
                          ? "bg-blue-500 text-white shadow-md"
                          : today
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white border text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-[10px] font-medium uppercase">{DAYS_UK[i]}</span>
                      <span className="text-lg font-bold">{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected day header */}
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  {weekDates[selectedDayIndex].toLocaleDateString("uk-UA", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>

              {/* Worker cards for selected day */}
              <div className="space-y-2">
                {filteredWorkers.map((worker) => {
                  const dateStr = weekDates[selectedDayIndex].toISOString().split("T")[0];
                  const workerShifts = scheduleByDateWorker[dateStr]?.[worker.documentId] || [];

                  return (
                    <div
                      key={worker.documentId}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {worker.firstName?.[0] || worker.username?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {worker.firstName} {worker.lastName?.[0] ? `${worker.lastName[0]}.` : ""}
                        </p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          ROLE_COLORS[worker.systemRole || "viewer"]
                        )}>
                          {ROLE_LABELS[worker.systemRole || "viewer"]}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {workerShifts.length > 0 ? (
                          <div className="space-y-1">
                            {workerShifts.map((shift) => (
                              <div
                                key={shift.documentId}
                                className={cn(
                                  "text-xs px-2 py-1 rounded-lg border-l-2",
                                  SHIFT_TYPE_COLORS[shift.shiftType],
                                  STATUS_COLORS[shift.status]
                                )}
                              >
                                <span className="font-mono font-medium">
                                  {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Вихідний</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Week table */}
            <Card className="overflow-hidden hidden md:block">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-3 text-left font-medium text-sm w-[160px]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          Працівник
                        </div>
                      </th>
                      {weekDates.map((date, i) => {
                        const today = isToday(date);
                        return (
                          <th
                            key={i}
                            className={cn(
                              "p-2 text-center font-medium text-sm",
                              today && "bg-blue-50"
                            )}
                          >
                            <div className={cn(
                              "text-xs",
                              today ? "text-blue-600 font-bold" : "text-slate-500"
                            )}>
                              {DAYS_UK[i]}
                            </div>
                            <div className={cn(
                              "text-sm",
                              today ? "text-blue-700 font-bold" : "text-slate-700"
                            )}>
                              {date.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => (
                      <tr key={worker.documentId} className="border-b hover:bg-slate-50/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                              {worker.firstName?.[0] || worker.username?.[0] || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-slate-900">
                                {worker.firstName || worker.username}
                              </p>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                ROLE_COLORS[worker.systemRole || "viewer"]
                              )}>
                                {ROLE_LABELS[worker.systemRole || "viewer"]}
                              </span>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date, i) => {
                          const dateStr = date.toISOString().split("T")[0];
                          const workerShifts = scheduleByDateWorker[dateStr]?.[worker.documentId] || [];
                          const today = isToday(date);

                          return (
                            <td
                              key={i}
                              className={cn(
                                "p-1.5 text-center",
                                today && "bg-blue-50/50"
                              )}
                            >
                              {workerShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {workerShifts.map((shift) => (
                                    <div
                                      key={shift.documentId}
                                      className={cn(
                                        "text-xs p-1.5 rounded-lg border-l-2",
                                        SHIFT_TYPE_COLORS[shift.shiftType],
                                        STATUS_COLORS[shift.status]
                                      )}
                                    >
                                      <div className="font-mono font-medium text-[10px]">
                                        {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}

export default ShiftScheduleView;
