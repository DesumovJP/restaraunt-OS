/**
 * Employees Domain Types
 *
 * Types for employee profiles, shifts, and KPI tracking.
 */

// ==========================================
// EMPLOYEE PROFILES
// ==========================================

export type ExtendedUserRole =
  | "admin"
  | "manager"
  | "chef"
  | "waiter"
  | "host"
  | "bartender";

export type Department =
  | "kitchen"
  | "service"
  | "bar"
  | "management"
  | "host";

export type EmployeeStatus =
  | "active"
  | "break"
  | "offline"
  | "vacation"
  | "terminated";

export type ShiftStatus =
  | "scheduled"
  | "started"
  | "completed"
  | "absent"
  | "cancelled";

export interface ContactInfo {
  phone?: string;
  email?: string;
  emergencyContact?: string;
}

export interface ShiftAssignment {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  department: Department;
  station?: string;
  status: ShiftStatus;
}

export type KPIMetric =
  | "orders_served"
  | "average_ticket_time"
  | "upsell_rate"
  | "customer_rating"
  | "dishes_prepared"
  | "waste_rate";

export interface KPITarget {
  metric: KPIMetric;
  period: "daily" | "weekly" | "monthly";
  target: number;
  unit: string;
}

export interface KPIActual {
  metric: KPIMetric;
  period: string;
  value: number;
  updatedAt: string;
}

export interface EmployeeProfile {
  documentId: string;
  slug: string;
  userId: string;
  name: string;
  avatar?: string;
  role: ExtendedUserRole;
  department: Department;
  status: EmployeeStatus;
  contactInfo: ContactInfo;

  // Work info
  shifts: ShiftAssignment[];
  currentShift?: ShiftAssignment;
  hoursThisWeek: number;
  hoursThisMonth: number;

  // KPI
  kpiTargets: KPITarget[];
  kpiActuals: KPIActual[];

  // Communication
  chatThreadId?: string;
  lastActiveAt: string;
}

// ==========================================
// KPI DASHBOARD
// ==========================================

export interface KPIDashboardSummary {
  totalOrders: number;
  averageTicketTime: number;
  totalRevenue: number;
  wasteRate: number;
}

export interface DepartmentStats {
  dishesCompleted?: number;
  ordersServed?: number;
  averageTime: number;
  averageRating?: number;
  staff: number;
}

export interface TopPerformer {
  profileId: string;
  name: string;
  metric: KPIMetric;
  value: number;
}

export interface KPIDashboard {
  period: "today" | "week" | "month";
  summary: KPIDashboardSummary;
  byDepartment: Record<Department, DepartmentStats>;
  topPerformers: TopPerformer[];
  alerts: Array<{
    type: string;
    department: Department;
    message: string;
  }>;
}
