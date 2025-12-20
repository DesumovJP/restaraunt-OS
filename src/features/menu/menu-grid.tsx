"use client";

import * as React from "react";
import { MenuItemCard } from "./menu-item-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonMenuItem } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MenuItem, CartItem, Category } from "@/types";

interface MenuGridProps {
  items: MenuItem[];
  categories?: Category[];
  cartItems: CartItem[];
  onAddItem: (item: MenuItem) => void;
  isLoading?: boolean;
  className?: string;
}

export function MenuGrid({
  items,
  categories = [],
  cartItems,
  onAddItem,
  isLoading = false,
  className,
}: MenuGridProps) {
  // Create a map of item quantities in cart
  const quantityMap = React.useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((cartItem) => {
      map.set(cartItem.menuItem.id, cartItem.quantity);
    });
    return map;
  }, [cartItems]);

  // Create a map of categories by id
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((category) => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3", className)}>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonMenuItem key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return <EmptyState type="menu" className={className} />;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3",
        className
      )}
      role="list"
      aria-label="Меню страв"
    >
      {items.map((item) => (
        <div key={item.id} role="listitem" className="flex">
          <MenuItemCard
            item={item}
            category={categoryMap.get(item.categoryId)}
            onAdd={onAddItem}
            quantity={quantityMap.get(item.id) || 0}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
