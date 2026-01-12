/**
 * Station Configuration
 *
 * Centralized configuration for kitchen stations.
 * Used across kitchen display, station queue, and related components.
 */

import { Flame, ChefHat, Check } from "lucide-react";
import type { StationType } from "@/types/station";

/**
 * Station display configuration
 */
export interface StationDisplayConfig {
  type: StationType;
  name: string;
  nameUk: string;
  icon: typeof Flame | typeof ChefHat | typeof Check;
  color: string;
  bgColor: string;
}

/**
 * Station capacity configuration
 */
export interface StationCapacityConfig {
  type: StationType;
  maxCapacity: number;
}

/**
 * Display configurations for each station type
 */
export const STATION_DISPLAY_CONFIGS: Record<StationType, StationDisplayConfig> = {
  hot: {
    type: "hot",
    name: "Hot Kitchen",
    nameUk: "Гарячий цех",
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  cold: {
    type: "cold",
    name: "Cold Kitchen",
    nameUk: "Холодний цех",
    icon: ChefHat,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  pastry: {
    type: "pastry",
    name: "Pastry",
    nameUk: "Кондитерська",
    icon: ChefHat,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  bar: {
    type: "bar",
    name: "Bar",
    nameUk: "Бар",
    icon: ChefHat,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  pass: {
    type: "pass",
    name: "Pass",
    nameUk: "Видача",
    icon: Check,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  grill: {
    type: "grill",
    name: "Grill",
    nameUk: "Гриль",
    icon: Flame,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  fry: {
    type: "fry",
    name: "Fry",
    nameUk: "Фритюр",
    icon: Flame,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  saute: {
    type: "saute",
    name: "Sauté",
    nameUk: "Соте",
    icon: ChefHat,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  plating: {
    type: "plating",
    name: "Plating",
    nameUk: "Сервірування",
    icon: ChefHat,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

/**
 * Default capacity configurations for each station
 */
export const STATION_CAPACITY_CONFIGS: StationCapacityConfig[] = [
  { type: "hot", maxCapacity: 8 },
  { type: "cold", maxCapacity: 6 },
  { type: "pastry", maxCapacity: 4 },
  { type: "bar", maxCapacity: 8 },
  { type: "pass", maxCapacity: 10 },
];

/**
 * Active stations (excluding pass for cooking view)
 */
export const ACTIVE_COOKING_STATIONS: StationType[] = ["hot", "cold", "pastry", "bar"];

/**
 * All station types
 */
export const ALL_STATION_TYPES: StationType[] = ["hot", "cold", "pastry", "bar", "pass"];

/**
 * Get station configuration by type
 */
export function getStationConfig(type: StationType): StationDisplayConfig {
  return STATION_DISPLAY_CONFIGS[type];
}

/**
 * Get station capacity by type
 */
export function getStationCapacity(type: StationType): number {
  const config = STATION_CAPACITY_CONFIGS.find((c) => c.type === type);
  return config?.maxCapacity ?? 6;
}
