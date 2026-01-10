"use client";

import { cn } from "@/lib/utils";
import { TaskCategory, TASK_CATEGORY_LABELS } from "@/types/daily-tasks";
import {
  ChefHat,
  Sparkles,
  Package,
  Wrench,
  GraduationCap,
  ClipboardList,
  UtensilsCrossed,
  Pin,
} from "lucide-react";

interface CategoryIconProps {
  category: TaskCategory;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  prep: ChefHat,
  cleaning: Sparkles,
  inventory: Package,
  maintenance: Wrench,
  training: GraduationCap,
  admin: ClipboardList,
  service: UtensilsCrossed,
  other: Pin,
};

const categoryColors: Record<TaskCategory, string> = {
  prep: "text-orange-500",
  cleaning: "text-cyan-500",
  inventory: "text-amber-600",
  maintenance: "text-slate-500",
  training: "text-purple-500",
  admin: "text-blue-500",
  service: "text-green-500",
  other: "text-muted-foreground",
};

const sizeConfig = {
  sm: { icon: "h-3 w-3", text: "text-xs", gap: "gap-1" },
  md: { icon: "h-4 w-4", text: "text-sm", gap: "gap-1.5" },
  lg: { icon: "h-5 w-5", text: "text-base", gap: "gap-2" },
};

export function CategoryIcon({
  category,
  size = "md",
  showLabel = false,
  className,
}: CategoryIconProps) {
  const Icon = categoryIcons[category];
  const color = categoryColors[category];
  const sizes = sizeConfig[size];
  const label = TASK_CATEGORY_LABELS[category].uk;

  return (
    <span
      className={cn("inline-flex items-center", sizes.gap, className)}
      title={label}
    >
      <Icon className={cn(sizes.icon, color)} />
      {showLabel && (
        <span className={cn(sizes.text, "text-muted-foreground")}>{label}</span>
      )}
    </span>
  );
}
