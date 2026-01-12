"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  Users,
  Construction,
  Utensils,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for development
const MOCK_WORKERS = [
  {
    documentId: "1",
    firstName: "Віктор",
    lastName: "Шевченко",
    systemRole: "chef",
    department: "kitchen",
    station: "pass",
    totalTasksCompleted: 47,
    totalTicketsCompleted: 156,
    avgTicketTimeSeconds: 720,
    avgEfficiencyScore: 112,
    daysWorked: 5,
    trend: "up" as const,
  },
  {
    documentId: "2",
    firstName: "Андрій",
    lastName: "Бондаренко",
    systemRole: "cook",
    department: "kitchen",
    station: "grill",
    totalTasksCompleted: 38,
    totalTicketsCompleted: 89,
    avgTicketTimeSeconds: 840,
    avgEfficiencyScore: 98,
    daysWorked: 5,
    trend: "stable" as const,
  },
  {
    documentId: "3",
    firstName: "Олена",
    lastName: "Савченко",
    systemRole: "cook",
    department: "kitchen",
    station: "salad",
    totalTasksCompleted: 52,
    totalTicketsCompleted: 134,
    avgTicketTimeSeconds: 420,
    avgEfficiencyScore: 105,
    daysWorked: 5,
    trend: "up" as const,
  },
  {
    documentId: "4",
    firstName: "Ірина",
    lastName: "Мельник",
    systemRole: "waiter",
    department: "service",
    station: "front",
    totalTasksCompleted: 28,
    totalTicketsCompleted: 0,
    avgOrderTimeSeconds: 180,
    avgEfficiencyScore: 94,
    ordersHandled: 45,
    daysWorked: 4,
    trend: "stable" as const,
  },
  {
    documentId: "5",
    firstName: "Дмитро",
    lastName: "Козак",
    systemRole: "waiter",
    department: "service",
    station: "front",
    totalTasksCompleted: 31,
    totalTicketsCompleted: 0,
    avgOrderTimeSeconds: 210,
    avgEfficiencyScore: 88,
    ordersHandled: 38,
    daysWorked: 5,
    trend: "down" as const,
  },
  {
    documentId: "6",
    firstName: "Максим",
    lastName: "Романенко",
    systemRole: "bartender",
    department: "bar",
    station: "bar",
    totalTasksCompleted: 22,
    totalTicketsCompleted: 67,
    avgTicketTimeSeconds: 180,
    avgEfficiencyScore: 108,
    daysWorked: 4,
    trend: "up" as const,
  },
];

const DEPARTMENTS = [
  { value: "all", label: "Всі відділи" },
  { value: "kitchen", label: "Кухня" },
  { value: "service", label: "Зал" },
  { value: "bar", label: "Бар" },
];

const ROLE_LABELS: Record<string, string> = {
  chef: "Шеф-кухар",
  cook: "Кухар",
  waiter: "Офіціант",
  bartender: "Бармен",
  host: "Хостес",
  cashier: "Касир",
};

const STATION_LABELS: Record<string, string> = {
  pass: "Пас",
  grill: "Гриль",
  salad: "Салати",
  hot: "Гаряче",
  bar: "Бар",
  front: "Зал",
};

function getEfficiencyColor(score: number): string {
  if (score >= 100) return "text-green-600";
  if (score >= 85) return "text-amber-600";
  return "text-red-600";
}

function getEfficiencyBadge(score: number): { color: string; label: string } {
  if (score >= 100) return { color: "bg-green-100 text-green-700", label: "Відмінно" };
  if (score >= 85) return { color: "bg-amber-100 text-amber-700", label: "Добре" };
  return { color: "bg-red-100 text-red-700", label: "Потребує уваги" };
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function WorkerPerformanceTable() {
  const [departmentFilter, setDepartmentFilter] = React.useState("all");

  // Filter by department
  const filteredWorkers = React.useMemo(() => {
    if (departmentFilter === "all") return MOCK_WORKERS;
    return MOCK_WORKERS.filter((w) => w.department === departmentFilter);
  }, [departmentFilter]);

  return (
    <div className="space-y-4">
      {/* "В розробці" Banner */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-full shadow-sm">
          <Construction className="w-4 h-4" />
          <span className="font-medium text-sm">В розробці</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Продуктивність працівників</h3>
          <Badge variant="outline" className="text-xs">{filteredWorkers.length}</Badge>
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Відділ" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Працівник</th>
              <th className="text-center p-3 font-medium text-sm hidden sm:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Задачі</span>
                </div>
              </th>
              <th className="text-center p-3 font-medium text-sm hidden md:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Utensils className="h-4 w-4" />
                  <span>Тікети</span>
                </div>
              </th>
              <th className="text-center p-3 font-medium text-sm hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <Timer className="h-4 w-4" />
                  <span>Сер. час</span>
                </div>
              </th>
              <th className="text-center p-3 font-medium text-sm">Ефективність</th>
              <th className="text-center p-3 font-medium text-sm w-16">Тренд</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredWorkers.map((worker, index) => {
              const badge = getEfficiencyBadge(worker.avgEfficiencyScore);
              return (
                <tr
                  key={worker.documentId}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                            {worker.firstName[0]}{worker.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {worker.firstName} {worker.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABELS[worker.systemRole] || worker.systemRole}
                          {worker.station && ` • ${STATION_LABELS[worker.station] || worker.station}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center hidden sm:table-cell">
                    <span className="font-medium">{worker.totalTasksCompleted}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      / {worker.daysWorked}д
                    </span>
                  </td>
                  <td className="p-3 text-center hidden md:table-cell">
                    <span className="font-medium">
                      {worker.totalTicketsCompleted || worker.ordersHandled || 0}
                    </span>
                  </td>
                  <td className="p-3 text-center hidden lg:table-cell">
                    <span className="font-mono text-sm">
                      {formatDuration(worker.avgTicketTimeSeconds || worker.avgOrderTimeSeconds || 0)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn("text-lg font-bold", getEfficiencyColor(worker.avgEfficiencyScore))}>
                        {worker.avgEfficiencyScore}%
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", badge.color)}>
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {worker.trend === "up" && (
                      <TrendingUp className="h-5 w-5 text-green-600 mx-auto" />
                    )}
                    {worker.trend === "down" && (
                      <TrendingDown className="h-5 w-5 text-red-600 mx-auto" />
                    )}
                    {worker.trend === "stable" && (
                      <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {MOCK_WORKERS.filter(w => w.avgEfficiencyScore >= 100).length}
          </p>
          <p className="text-xs text-muted-foreground">Відмінно</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold text-amber-600">
            {MOCK_WORKERS.filter(w => w.avgEfficiencyScore >= 85 && w.avgEfficiencyScore < 100).length}
          </p>
          <p className="text-xs text-muted-foreground">Добре</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-2xl font-bold text-red-600">
            {MOCK_WORKERS.filter(w => w.avgEfficiencyScore < 85).length}
          </p>
          <p className="text-xs text-muted-foreground">Потребує уваги</p>
        </div>
      </div>
    </div>
  );
}
