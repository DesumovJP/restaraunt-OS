"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  UtensilsCrossed,
  Package,
  AlertCircle,
  Search,
  FileText,
} from "lucide-react";

type EmptyStateType =
  | "cart"
  | "menu"
  | "orders"
  | "inventory"
  | "alerts"
  | "search"
  | "generic"
  | "empty";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const defaultContent: Record<
  EmptyStateType,
  { icon: React.ElementType; title: string; description: string }
> = {
  cart: {
    icon: ShoppingCart,
    title: "Кошик порожній",
    description: "Додайте страви з меню, щоб створити замовлення",
  },
  menu: {
    icon: UtensilsCrossed,
    title: "Меню порожнє",
    description: "Страви в цій категорії відсутні",
  },
  orders: {
    icon: FileText,
    title: "Немає замовлень",
    description: "Нові замовлення з'являться тут",
  },
  inventory: {
    icon: Package,
    title: "Склад порожній",
    description: "Додайте товари для відстеження запасів",
  },
  alerts: {
    icon: AlertCircle,
    title: "Немає сповіщень",
    description: "Всі системи працюють нормально",
  },
  search: {
    icon: Search,
    title: "Нічого не знайдено",
    description: "Спробуйте змінити параметри пошуку",
  },
  generic: {
    icon: FileText,
    title: "Дані відсутні",
    description: "Тут поки нічого немає",
  },
  empty: {
    icon: FileText,
    title: "Порожньо",
    description: "Дані відсутні",
  },
};

export function EmptyState({
  type = "generic",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = content.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-4 text-center",
        className
      )}
      role="status"
      aria-label={title || content.title}
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">
        {title || content.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-3">
        {description || content.description}
      </p>
      {action}
    </div>
  );
}
