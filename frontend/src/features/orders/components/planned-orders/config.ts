/**
 * Planned Orders Configuration
 *
 * Configuration objects for event types, seating areas, etc.
 */

import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Cake,
  Briefcase,
  Heart,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import type {
  EventType,
  SeatingArea,
  MenuPreset,
  PaymentStatus,
} from "@/stores/scheduled-orders-store";

// ==========================================
// EVENT TYPES
// ==========================================

export const EVENT_TYPES: Record<EventType, { label: string; icon: LucideIcon; color: string }> = {
  regular: { label: "Бронювання", icon: Calendar, color: "text-gray-600" },
  birthday: { label: "День народження", icon: Cake, color: "text-pink-600" },
  corporate: { label: "Корпоратив", icon: Briefcase, color: "text-blue-600" },
  wedding: { label: "Весілля", icon: Heart, color: "text-red-600" },
  anniversary: { label: "Річниця", icon: PartyPopper, color: "text-purple-600" },
  funeral: { label: "Поминки", icon: Calendar, color: "text-gray-700" },
  baptism: { label: "Хрестини", icon: Heart, color: "text-cyan-600" },
  graduation: { label: "Випускний", icon: GraduationCap, color: "text-amber-600" },
  business: { label: "Бізнес-зустріч", icon: Briefcase, color: "text-slate-600" },
  romantic: { label: "Романтична вечеря", icon: Heart, color: "text-rose-600" },
  other: { label: "Інше", icon: Calendar, color: "text-gray-500" },
};

// ==========================================
// SEATING AREAS
// ==========================================

export const SEATING_AREAS: Record<SeatingArea, string> = {
  main_hall: "Основний зал",
  vip_room: "VIP-кімната",
  terrace: "Тераса",
  private: "Приватна кімната",
  bar_area: "Зона бару",
  outdoor: "На вулиці",
};

// ==========================================
// MENU PRESETS
// ==========================================

export const MENU_PRESETS: Record<MenuPreset, string> = {
  a_la_carte: "По меню",
  set_menu: "Сет-меню",
  buffet: "Фуршет",
  banquet: "Банкет",
  custom: "Індивідуальне",
};

// ==========================================
// PAYMENT STATUSES
// ==========================================

export const PAYMENT_STATUSES: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Очікує оплати", color: "text-yellow-600 bg-yellow-50" },
  deposit_paid: { label: "Завдаток сплачено", color: "text-blue-600 bg-blue-50" },
  fully_paid: { label: "Сплачено", color: "text-green-600 bg-green-50" },
  refunded: { label: "Повернено", color: "text-gray-600 bg-gray-50" },
};

// ==========================================
// TIME SLOTS
// ==========================================

export const TIME_SLOTS = [
  { start: 9, end: 12, label: "Ранок (9:00 - 12:00)" },
  { start: 12, end: 15, label: "Обід (12:00 - 15:00)" },
  { start: 15, end: 18, label: "Полудень (15:00 - 18:00)" },
  { start: 18, end: 22, label: "Вечір (18:00 - 22:00)" },
] as const;

// ==========================================
// PREP TIME DEFAULTS
// ==========================================

export const PREP_MINUTES_BY_EVENT: Record<EventType, number> = {
  regular: 30,
  birthday: 45,
  corporate: 60,
  wedding: 90,
  anniversary: 45,
  funeral: 60,
  baptism: 45,
  graduation: 60,
  business: 30,
  romantic: 30,
  other: 30,
};
