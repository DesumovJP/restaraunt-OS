"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  Star,
  TrendingUp,
  LogOut,
  Settings,
  ChevronRight,
  Award,
  Target,
} from "lucide-react";
import type { ExtendedUserRole, Department, EmployeeStatus } from "@/types/employees";

// ==========================================
// TYPES
// ==========================================

export interface WorkerProfileData {
  documentId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: ExtendedUserRole;
  department: Department;
  status: EmployeeStatus;
  phone?: string;
  email?: string;
  // Work stats
  hoursThisWeek?: number;
  hoursThisMonth?: number;
  shiftsThisWeek?: number;
  shiftsThisMonth?: number;
  // Performance
  rating?: number;
  ordersServed?: number;
  avgTicketTime?: number;
  // Metadata
  hireDate?: string;
  lastActiveAt?: string;
}

interface WorkerProfileCardProps {
  worker: WorkerProfileData | null;
  variant?: "full" | "compact" | "minimal";
  className?: string;
  onViewSchedule?: () => void;
  onViewStats?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

// ==========================================
// CONSTANTS
// ==========================================

const ROLE_LABELS: Record<ExtendedUserRole, string> = {
  admin: "Адміністратор",
  manager: "Менеджер",
  chef: "Шеф-кухар",
  waiter: "Офіціант",
  host: "Хостес",
  bartender: "Бармен",
};

const DEPARTMENT_LABELS: Record<Department, string> = {
  kitchen: "Кухня",
  service: "Обслуговування",
  bar: "Бар",
  management: "Менеджмент",
  host: "Рецепція",
};

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: "На зміні", color: "bg-green-500" },
  break: { label: "Перерва", color: "bg-amber-500" },
  offline: { label: "Офлайн", color: "bg-slate-400" },
  vacation: { label: "Відпустка", color: "bg-blue-500" },
  terminated: { label: "Звільнений", color: "bg-red-500" },
};

const ROLE_COLORS: Record<ExtendedUserRole, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  chef: "bg-orange-100 text-orange-700 border-orange-200",
  waiter: "bg-green-100 text-green-700 border-green-200",
  host: "bg-pink-100 text-pink-700 border-pink-200",
  bartender: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatusDot({ status }: { status: EmployeeStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
      <span className="text-sm text-slate-600">{config.label}</span>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900">
          {value}
          {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: typeof Settings;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-3 rounded-xl transition-colors",
        variant === "danger"
          ? "hover:bg-red-50 text-red-600"
          : "hover:bg-slate-100 text-slate-700"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
}

// ==========================================
// MAIN COMPONENTS
// ==========================================

export function WorkerProfileCard({
  worker,
  variant = "full",
  className,
  onViewSchedule,
  onViewStats,
  onSettings,
  onLogout,
}: WorkerProfileCardProps) {
  if (!worker) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full" />
            <div className="space-y-2">
              <div className="w-32 h-5 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roleLabel = ROLE_LABELS[worker.role] || worker.role;
  const departmentLabel = DEPARTMENT_LABELS[worker.department] || worker.department;
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Minimal variant - just avatar and name
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          {worker.avatar ? (
            <img src={worker.avatar} alt={worker.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">{initials}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{worker.name}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
      </div>
    );
  }

  // Compact variant - card with basic info
  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              {worker.avatar ? (
                <img src={worker.avatar} alt={worker.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-lg font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-lg text-slate-900 truncate">{worker.name}</p>
                <StatusDot status={worker.status} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[worker.role])}>
                  {roleLabel}
                </Badge>
                <span className="text-sm text-slate-500">{departmentLabel}</span>
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-900">{worker.hoursThisWeek || 0}г</p>
              <p className="text-xs text-slate-500">Цей тиждень</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-900">{worker.shiftsThisWeek || 0}</p>
              <p className="text-xs text-slate-500">Змін</p>
            </div>
            {worker.rating && (
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {worker.rating.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500">Рейтинг</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant - complete profile card (clean, professional design)
  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      {/* Clean header without gradient */}
      <CardContent className="p-5 sm:p-6">
        {/* Profile header */}
        <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {worker.avatar ? (
              <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-600 text-xl font-semibold">{initials}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{worker.name}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className={cn("text-xs font-medium", ROLE_COLORS[worker.role])}>
                {roleLabel}
              </Badge>
              <span className="text-sm text-slate-500">{departmentLabel}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[worker.status].color)} />
              <span className="text-sm text-slate-600">{STATUS_CONFIG[worker.status].label}</span>
            </div>
          </div>
        </div>

        {/* Contact info - inline layout */}
        {(worker.phone || worker.email) && (
          <div className="py-4 border-b border-slate-100 space-y-2.5">
            {worker.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-sm text-slate-700">{worker.phone}</span>
              </div>
            )}
            {worker.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-sm text-slate-700 truncate">{worker.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats - clean 2x2 grid */}
        <div className="py-4 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {worker.hoursThisWeek || 0}
                <span className="text-base font-medium text-slate-400 ml-0.5">г</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Годин цього тижня</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {worker.shiftsThisWeek || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Змін цього тижня</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {worker.hoursThisMonth || 0}
                <span className="text-base font-medium text-slate-400 ml-0.5">г</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Годин цього місяця</p>
            </div>
            {worker.rating !== undefined ? (
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600 tabular-nums flex items-center gap-1">
                  {worker.rating.toFixed(1)}
                  <Star className="h-5 w-5 fill-current" />
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Рейтинг</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-slate-900 tabular-nums">
                  {worker.shiftsThisMonth || 0}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Змін цього місяця</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance indicator - only if data available */}
        {worker.avgTicketTime && (
          <div className="py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Середній час виконання</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{worker.avgTicketTime} хв</span>
            </div>
          </div>
        )}

        {/* Actions - simplified */}
        <div className="pt-4 space-y-1">
          {onViewSchedule && (
            <ActionButton icon={Calendar} label="Мій графік" onClick={onViewSchedule} />
          )}
          {onSettings && (
            <ActionButton icon={Settings} label="Налаштування" onClick={onSettings} />
          )}
          {onLogout && (
            <ActionButton icon={LogOut} label="Вийти з системи" onClick={onLogout} variant="danger" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// PROFILE MODAL/DRAWER
// ==========================================

export function WorkerProfileModal({
  worker,
  open,
  onClose,
  onViewSchedule,
  onViewStats,
  onSettings,
  onLogout,
}: {
  worker: WorkerProfileData | null;
  open: boolean;
  onClose: () => void;
  onViewSchedule?: () => void;
  onViewStats?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}) {
  // Using Drawer for mobile-friendly experience
  const { Drawer, DrawerContent } = require("@/components/ui/drawer");

  return (
    <Drawer open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DrawerContent side="right" className="w-full max-w-md p-0">
        <div className="h-full overflow-y-auto">
          <WorkerProfileCard
            worker={worker}
            variant="full"
            className="border-0 shadow-none rounded-none"
            onViewSchedule={onViewSchedule}
            onViewStats={onViewStats}
            onSettings={onSettings}
            onLogout={onLogout}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default WorkerProfileCard;
