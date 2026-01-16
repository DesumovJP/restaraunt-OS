import {
  Hash,
  Sun,
  Crown,
  Wine,
  AlertCircle,
  UserX,
  AlertTriangle,
  Settings,
  CheckCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TableZone, CloseReason } from "@/types/table";

// Zone labels and icons
export const ZONE_LABELS: Record<TableZone, string> = {
  main: "Головний зал",
  terrace: "Тераса",
  vip: "VIP зал",
  bar: "Бар",
};

// Short zone labels for mobile
export const ZONE_LABELS_SHORT: Record<TableZone, string> = {
  main: "Зал",
  terrace: "Тераса",
  vip: "VIP",
  bar: "Бар",
};

export const ZONE_ICONS: Record<TableZone, LucideIcon> = {
  main: Hash,
  terrace: Sun,
  vip: Crown,
  bar: Wine,
};

export const ZONE_COLORS: Record<TableZone, string> = {
  main: "bg-slate-100 text-slate-700 border-slate-300",
  terrace: "bg-sky-100 text-sky-700 border-sky-300",
  vip: "bg-purple-100 text-purple-700 border-purple-300",
  bar: "bg-amber-100 text-amber-700 border-amber-300",
};

// Close reason labels and icons
export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  normal: "Звичайне закриття",
  mistaken_open: "Помилково відкрито",
  no_show: "Гість не прийшов",
  walkout: "Пішов без оплати",
  emergency: "Екстрене закриття",
  technical_error: "Технічна помилка",
};

export const CLOSE_REASON_ICONS: Record<CloseReason, LucideIcon> = {
  normal: CheckCircle,
  mistaken_open: AlertCircle,
  no_show: UserX,
  walkout: AlertTriangle,
  emergency: Zap,
  technical_error: Settings,
};

export const CLOSE_REASON_DESCRIPTIONS: Record<CloseReason, string> = {
  normal: "Гість розрахувався та пішов",
  mistaken_open: "Стіл було відкрито по помилці",
  no_show: "Гість зарезервував, але не прийшов",
  walkout: "Гість пішов без оплати рахунку",
  emergency: "Термінове закриття без оплати",
  technical_error: "Помилка системи або обладнання",
};

export const CLOSE_REASON_COLORS: Record<CloseReason, string> = {
  normal: "border-emerald-500 hover:bg-emerald-50",
  mistaken_open: "border-amber-500 hover:bg-amber-50",
  no_show: "border-blue-500 hover:bg-blue-50",
  walkout: "border-red-500 hover:bg-red-50",
  emergency: "border-orange-500 hover:bg-orange-50",
  technical_error: "border-gray-500 hover:bg-gray-50",
};

// Emergency close reasons (subset for emergency dialog)
export const EMERGENCY_CLOSE_REASONS: CloseReason[] = [
  'walkout',
  'emergency',
  'no_show',
  'technical_error',
];
