"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Beef,
  ChefHat,
  Wheat,
  Flame,
  Droplet,
  Milk,
  Wine,
  Snowflake,
  Cake,
  X,
  Filter,
} from "lucide-react";
import type {
  StorageMainCategory,
  StorageSubCategory,
} from "@/types/extended";
import {
  STORAGE_MAIN_CATEGORY_LABELS,
  STORAGE_SUB_CATEGORY_LABELS,
  buildCategoryTree,
} from "@/types/extended";

// ==========================================
// ICONS MAPPING
// ==========================================

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  beef: Beef,
  "chef-hat": ChefHat,
  wheat: Wheat,
  flame: Flame,
  droplet: Droplet,
  milk: Milk,
  wine: Wine,
  snowflake: Snowflake,
  cake: Cake,
};

// ==========================================
// COMPONENT PROPS
// ==========================================

interface CategoryFilterMinimalProps {
  selectedMainCategory: StorageMainCategory | null;
  selectedSubCategory: StorageSubCategory | null;
  onMainCategoryChange: (category: StorageMainCategory | null) => void;
  onSubCategoryChange: (category: StorageSubCategory | null) => void;
  categoryCounts?: Record<string, number>;
  className?: string;
}

// ==========================================
// MINIMAL CATEGORY FILTER
// ==========================================

/**
 * Simplified category filter using dropdowns
 * Saves ~80px of vertical space compared to the original
 */
export function CategoryFilterMinimal({
  selectedMainCategory,
  selectedSubCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  categoryCounts = {},
  className,
}: CategoryFilterMinimalProps) {
  const categoryTree = React.useMemo(() => buildCategoryTree(), []);

  // Get subcategories for selected main category
  const currentSubCategories = React.useMemo(() => {
    if (!selectedMainCategory) return [];
    const mainCat = categoryTree.find((c) => c.id === selectedMainCategory);
    return mainCat?.children || [];
  }, [selectedMainCategory, categoryTree]);

  // Calculate total count
  const totalCount = React.useMemo(() => {
    return Object.entries(categoryCounts)
      .filter(([key]) => !key.includes(":"))
      .reduce((sum, [, count]) => sum + count, 0);
  }, [categoryCounts]);

  // Handle main category change
  const handleMainChange = (value: string) => {
    if (value === "all") {
      onMainCategoryChange(null);
      onSubCategoryChange(null);
    } else {
      onMainCategoryChange(value as StorageMainCategory);
      onSubCategoryChange(null);
    }
  };

  // Handle sub category change
  const handleSubChange = (value: string) => {
    if (value === "all") {
      onSubCategoryChange(null);
    } else {
      onSubCategoryChange(value as StorageSubCategory);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onMainCategoryChange(null);
    onSubCategoryChange(null);
  };

  const hasActiveFilter = selectedMainCategory !== null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Main category dropdown */}
      <Select
        value={selectedMainCategory || "all"}
        onValueChange={handleMainChange}
      >
        <SelectTrigger className="w-[180px] h-11 sm:h-10 rounded-xl">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Всі категорії" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full">
              <span>Всі категорії</span>
              {totalCount > 0 && (
                <span className="text-muted-foreground ml-2">{totalCount}</span>
              )}
            </div>
          </SelectItem>
          {categoryTree.map((cat) => {
            const IconComponent = CATEGORY_ICONS[cat.icon] || Beef;
            const count = categoryCounts[cat.id] || 0;

            return (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span>{cat.label.uk}</span>
                  {count > 0 && (
                    <span className="text-muted-foreground ml-auto">
                      {count}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Sub category dropdown (visible when main is selected) */}
      {selectedMainCategory && currentSubCategories.length > 0 && (
        <Select
          value={selectedSubCategory || "all"}
          onValueChange={handleSubChange}
        >
          <SelectTrigger className="w-[160px] h-11 sm:h-10 rounded-xl">
            <SelectValue placeholder="Підкатегорія" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Всі{" "}
              {STORAGE_MAIN_CATEGORY_LABELS[
                selectedMainCategory
              ].uk.toLowerCase()}
            </SelectItem>
            {currentSubCategories.map((subCat) => {
              const count =
                categoryCounts[`${selectedMainCategory}:${subCat.id}`] || 0;

              return (
                <SelectItem key={subCat.id} value={subCat.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{subCat.label.uk}</span>
                    {count > 0 && (
                      <span className="text-muted-foreground ml-2">
                        {count}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      {/* Active filter badge with clear button */}
      {hasActiveFilter && (
        <Badge variant="secondary" className="gap-1 pl-2">
          {STORAGE_MAIN_CATEGORY_LABELS[selectedMainCategory].uk}
          {selectedSubCategory && (
            <> / {STORAGE_SUB_CATEGORY_LABELS[selectedSubCategory].uk}</>
          )}
          <button
            onClick={clearFilters}
            className="ml-1 p-0.5 hover:bg-muted rounded-full transition-colors"
            aria-label="Скинути фільтр"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}

// ==========================================
// COMPACT PILLS VARIANT
// ==========================================

interface CategoryPillsProps {
  selectedMainCategory: StorageMainCategory | null;
  onMainCategoryChange: (category: StorageMainCategory | null) => void;
  categoryCounts?: Record<string, number>;
  className?: string;
}

/**
 * Horizontal scrollable pills for quick category selection
 * Use when space permits but dropdowns feel too heavy
 */
export function CategoryPills({
  selectedMainCategory,
  onMainCategoryChange,
  categoryCounts = {},
  className,
}: CategoryPillsProps) {
  const categoryTree = React.useMemo(() => buildCategoryTree(), []);

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {/* All pill */}
      <Button
        variant={!selectedMainCategory ? "default" : "outline"}
        size="sm"
        className="shrink-0 h-10 sm:h-9 px-4 rounded-xl touch-feedback"
        onClick={() => onMainCategoryChange(null)}
      >
        Всі
      </Button>

      {/* Category pills */}
      {categoryTree.map((cat) => {
        const IconComponent = CATEGORY_ICONS[cat.icon] || Beef;
        const isSelected = selectedMainCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;

        return (
          <Button
            key={cat.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn("shrink-0 h-10 sm:h-9 gap-2 px-3 sm:px-4 rounded-xl touch-feedback")}
            onClick={() =>
              onMainCategoryChange(isSelected ? null : (cat.id as StorageMainCategory))
            }
          >
            <IconComponent className="h-4 w-4" />
            <span className="hidden sm:inline">{cat.label.uk}</span>
            {count > 0 && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected ? "opacity-80" : "text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
