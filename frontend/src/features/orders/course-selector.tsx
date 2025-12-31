"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Salad,
  Soup,
  UtensilsCrossed,
  IceCream,
  Coffee,
  ChefHat,
} from "lucide-react";
import type { CourseType } from "@/types/extended";

interface CourseSelectorProps {
  value: CourseType;
  onChange: (course: CourseType) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

interface CourseConfig {
  key: CourseType;
  label: string;
  labelUk: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  shortLabel: string;
}

export const COURSE_CONFIGS: CourseConfig[] = [
  {
    key: "appetizer",
    label: "Appetizer",
    labelUk: "Закуска",
    icon: Salad,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
    shortLabel: "Зак",
  },
  {
    key: "starter",
    label: "Starter",
    labelUk: "Перша страва",
    icon: ChefHat,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    shortLabel: "1-ша",
  },
  {
    key: "soup",
    label: "Soup",
    labelUk: "Суп",
    icon: Soup,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    shortLabel: "Суп",
  },
  {
    key: "main",
    label: "Main",
    labelUk: "Основна",
    icon: UtensilsCrossed,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200 hover:bg-red-100",
    shortLabel: "Осн",
  },
  {
    key: "dessert",
    label: "Dessert",
    labelUk: "Десерт",
    icon: IceCream,
    color: "text-pink-600",
    bgColor: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    shortLabel: "Дес",
  },
  {
    key: "drink",
    label: "Drink",
    labelUk: "Напій",
    icon: Coffee,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    shortLabel: "Нап",
  },
];

export function getCourseConfig(course: CourseType): CourseConfig {
  return COURSE_CONFIGS.find((c) => c.key === course) || COURSE_CONFIGS[3]; // default to main
}

export function CourseSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  className,
}: CourseSelectorProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        compact && "gap-1",
        className
      )}
      role="radiogroup"
      aria-label="Виберіть курс"
    >
      {COURSE_CONFIGS.map((course) => {
        const isSelected = value === course.key;
        const Icon = course.icon;

        return (
          <Button
            key={course.key}
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            disabled={disabled}
            onClick={() => onChange(course.key)}
            className={cn(
              "transition-all",
              compact ? "h-7 px-2 text-xs" : "h-9 px-3",
              isSelected && cn("border-2", course.bgColor, course.color),
              !isSelected && "opacity-60 hover:opacity-100"
            )}
            role="radio"
            aria-checked={isSelected}
            aria-label={course.labelUk}
          >
            <Icon
              className={cn(
                compact ? "h-3 w-3" : "h-4 w-4",
                compact ? "mr-1" : "mr-1.5",
                isSelected && course.color
              )}
            />
            {compact ? course.shortLabel : course.labelUk}
          </Button>
        );
      })}
    </div>
  );
}

// Badge version for display only
interface CourseBadgeProps {
  course: CourseType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function CourseBadge({
  course,
  size = "md",
  showIcon = true,
  className,
}: CourseBadgeProps) {
  const config = getCourseConfig(course);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-5 px-1.5 text-[10px] gap-0.5",
    md: "h-6 px-2 text-xs gap-1",
    lg: "h-7 px-2.5 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.labelUk}
    </span>
  );
}

// Course index indicator
interface CourseIndexProps {
  courseIndex: number;
  totalCourses: number;
  className?: string;
}

export function CourseIndex({
  courseIndex,
  totalCourses,
  className,
}: CourseIndexProps) {
  return (
    <span
      className={cn(
        "text-xs text-muted-foreground font-mono",
        className
      )}
      title={`Курс ${courseIndex + 1} з ${totalCourses}`}
    >
      {courseIndex + 1}/{totalCourses}
    </span>
  );
}
