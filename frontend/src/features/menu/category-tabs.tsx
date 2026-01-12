"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import {
  Salad,
  Soup,
  UtensilsCrossed,
  Wheat,
  CupSoda,
  Cake,
  Grid3X3,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  salad: Salad,
  soup: Soup,
  utensils: UtensilsCrossed,
  wheat: Wheat,
  "cup-soda": CupSoda,
  cake: Cake,
};

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  className?: string;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      <Tabs
        value={selectedCategory || "all"}
        onValueChange={(value) =>
          onSelectCategory(value === "all" ? null : value)
        }
      >
        <TabsList className="w-full justify-start gap-1 h-auto p-1 bg-transparent overflow-x-auto hide-scrollbar">
          {/* All categories tab */}
          <TabsTrigger
            value="all"
            className="flex flex-col items-center gap-1 px-3 py-2 min-w-[72px] data-[state=active]:bg-primary-light data-[state=active]:text-primary rounded-lg"
          >
            <Grid3X3 className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Все</span>
          </TabsTrigger>

          {/* Category tabs */}
          {categories.map((category) => {
            const Icon = (category.icon && iconMap[category.icon]) || UtensilsCrossed;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex flex-col items-center gap-1 px-3 py-2 min-w-[72px] data-[state=active]:bg-primary-light data-[state=active]:text-primary rounded-lg"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
