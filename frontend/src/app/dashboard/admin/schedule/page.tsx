"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation } from "urql";
import { GET_TEAM_SCHEDULE, GET_ALL_WORKERS } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
  UserPlus,
} from "lucide-react";
import { gql } from "urql";

// Mutation for creating shifts
const CREATE_WORKER_SHIFT = gql`
  mutation CreateWorkerShift($data: WorkerShiftInput!) {
    createWorkerShift(data: $data) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
    }
  }
`;

const DAYS_UK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const SHIFT_TYPE_COLORS: Record<string, string> = {
  morning: "bg-yellow-100 text-yellow-800",
  afternoon: "bg-orange-100 text-orange-800",
  evening: "bg-purple-100 text-purple-800",
  night: "bg-blue-100 text-blue-800",
  split: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-info",
  started: "border-warning",
  completed: "border-success",
  missed: "border-error",
  cancelled: "border-muted",
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

const DEPARTMENT_LABELS: Record<string, string> = {
  management: "Менеджмент",
  kitchen: "Кухня",
  service: "Зал",
  bar: "Бар",
  cleaning: "Клінінг",
  none: "",
};

const SHIFT_TYPES = [
  { value: "morning", label: "Ранкова (06:00-14:00)", start: "06:00", end: "14:00" },
  { value: "afternoon", label: "Денна (10:00-18:00)", start: "10:00", end: "18:00" },
  { value: "evening", label: "Вечірня (16:00-00:00)", start: "16:00", end: "00:00" },
  { value: "night", label: "Нічна (22:00-06:00)", start: "22:00", end: "06:00" },
  { value: "split", label: "Розділена", start: "10:00", end: "14:00" },
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

export default function ScheduleManagementPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [department, setDepartment] = React.useState("all");
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedWorker, setSelectedWorker] = React.useState<string>("");
  const [selectedShiftType, setSelectedShiftType] = React.useState<string>("morning");
  const [customStartTime, setCustomStartTime] = React.useState<string>("");
  const [customEndTime, setCustomEndTime] = React.useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("kitchen");

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

  const [, createShift] = useMutation(CREATE_WORKER_SHIFT);

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

    // Sort: by department, then by role importance, then by name
    const roleOrder = ["chef", "cook", "bartender", "waiter", "host", "cashier", "manager", "admin", "viewer"];
    return filtered.sort((a, b) => {
      // First by department
      if (a.department !== b.department) {
        return (a.department || "").localeCompare(b.department || "");
      }
      // Then by role
      const roleA = roleOrder.indexOf(a.systemRole || "viewer");
      const roleB = roleOrder.indexOf(b.systemRole || "viewer");
      if (roleA !== roleB) return roleA - roleB;
      // Then by name
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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (time: string) => time?.slice(0, 5) || "";

  const openAddDialog = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowAddDialog(true);
  };

  const handleAddShift = async () => {
    if (!selectedWorker || !selectedDate) return;

    const shiftTypeConfig = SHIFT_TYPES.find(t => t.value === selectedShiftType);
    let startTime = customStartTime || shiftTypeConfig?.start || "09:00";
    let endTime = customEndTime || shiftTypeConfig?.end || "17:00";

    // Format time to HH:mm:ss.SSS (Strapi Time format)
    const formatTimeForStrapi = (time: string) => {
      const parts = time.split(":");
      if (parts.length === 2) {
        return `${parts[0]}:${parts[1]}:00.000`;
      }
      return time;
    };

    startTime = formatTimeForStrapi(startTime);
    endTime = formatTimeForStrapi(endTime);

    // Calculate scheduled minutes
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let scheduledMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (scheduledMinutes < 0) scheduledMinutes += 24 * 60;

    const result = await createShift({
      data: {
        worker: selectedWorker,
        date: selectedDate,
        startTime,
        endTime,
        shiftType: selectedShiftType,
        department: selectedDepartment,
        scheduledMinutes,
        status: "scheduled",
      },
    });

    if (result.error) {
      console.error("Failed to create shift:", result.error);
      return;
    }

    setShowAddDialog(false);
    setSelectedWorker("");
    setCustomStartTime("");
    setCustomEndTime("");
    refetchSchedule({ requestPolicy: "network-only" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Графік змін</h1>
              <p className="text-sm text-muted-foreground">
                Управління робочими змінами команди
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[140px]">
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
              variant="outline"
              size="icon"
              onClick={() => refetchSchedule({ requestPolicy: "network-only" })}
              disabled={scheduleFetching}
            >
              <RefreshCw className={`h-4 w-4 ${scheduleFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {/* Week Navigation */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {weekDates[0].toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
                  {" - "}
                  {weekDates[6].toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  Сьогодні
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium w-[150px]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Працівник
                    </div>
                  </th>
                  {weekDates.map((date, i) => {
                    const today = isToday(date);
                    return (
                      <th
                        key={i}
                        className={`p-3 text-center font-medium ${today ? "bg-primary/10" : ""}`}
                      >
                        <div>{DAYS_UK[i]}</div>
                        <div className={`text-sm ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {date.getDate()}.{date.getMonth() + 1}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1"
                          onClick={() => openAddDialog(date.toISOString().split("T")[0])}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Немає працівників
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.documentId} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {worker.firstName?.[0] || worker.username?.[0] || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {worker.firstName} {worker.lastName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                                {ROLE_LABELS[worker.systemRole || "viewer"]}
                              </span>
                              {worker.station && (
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  • {worker.station}
                                </span>
                              )}
                            </div>
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
                            className={`p-2 text-center ${today ? "bg-primary/5" : ""}`}
                          >
                            {workerShifts.length > 0 ? (
                              <div className="space-y-1">
                                {workerShifts.map((shift) => (
                                  <div
                                    key={shift.documentId}
                                    className={`text-xs p-1.5 rounded border-l-2 ${SHIFT_TYPE_COLORS[shift.shiftType]} ${STATUS_COLORS[shift.status]}`}
                                  >
                                    <div className="font-mono font-medium">
                                      {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Легенда:</p>
            <div className="flex flex-wrap gap-3">
              {SHIFT_TYPES.map((type) => (
                <Badge key={type.value} className={SHIFT_TYPE_COLORS[type.value]}>
                  {type.label.split(" ")[0]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати зміну на {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Працівник</label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть працівника" />
                </SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.isActive !== false).map((worker) => (
                    <SelectItem key={worker.documentId} value={worker.documentId}>
                      <div className="flex items-center gap-2">
                        <span>{worker.firstName} {worker.lastName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                          {ROLE_LABELS[worker.systemRole || "viewer"]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Тип зміни</label>
              <Select value={selectedShiftType} onValueChange={setSelectedShiftType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Початок</label>
                <Input
                  type="time"
                  value={customStartTime || SHIFT_TYPES.find(t => t.value === selectedShiftType)?.start}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Кінець</label>
                <Input
                  type="time"
                  value={customEndTime || SHIFT_TYPES.find(t => t.value === selectedShiftType)?.end}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Відділ</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d.value !== "all").map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button
              onClick={handleAddShift}
              disabled={!selectedWorker}
              className="w-full h-11 text-base font-medium rounded-xl"
            >
              Додати зміну
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
