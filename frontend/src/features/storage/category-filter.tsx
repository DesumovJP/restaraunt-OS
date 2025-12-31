"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  ChevronRight,
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
  'chef-hat': ChefHat,
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

interface CategoryFilterProps {
  selectedMainCategory: StorageMainCategory | null;
  selectedSubCategory: StorageSubCategory | null;
  onMainCategoryChange: (category: StorageMainCategory | null) => void;
  onSubCategoryChange: (category: StorageSubCategory | null) => void;
  categoryCounts?: Record<string, number>;
  className?: string;
  variant?: "horizontal" | "vertical";
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function CategoryFilter({
  selectedMainCategory,
  selectedSubCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  categoryCounts = {},
  className,
  variant = "horizontal",
}: CategoryFilterProps) {
  const categoryTree = React.useMemo(() => buildCategoryTree(), []);
  const [expandedCategory, setExpandedCategory] = React.useState<StorageMainCategory | null>(
    selectedMainCategory
  );

  // Get current main category's subcategories
  const currentSubCategories = React.useMemo(() => {
    if (!selectedMainCategory) return [];
    const mainCat = categoryTree.find((c) => c.id === selectedMainCategory);
    return mainCat?.children || [];
  }, [selectedMainCategory, categoryTree]);

  // Handle main category click
  const handleMainCategoryClick = (category: StorageMainCategory) => {
    if (selectedMainCategory === category) {
      // Deselect if already selected
      onMainCategoryChange(null);
      onSubCategoryChange(null);
      setExpandedCategory(null);
    } else {
      onMainCategoryChange(category);
      onSubCategoryChange(null);
      setExpandedCategory(category);
    }
  };

  // Handle subcategory click
  const handleSubCategoryClick = (subCategory: StorageSubCategory) => {
    if (selectedSubCategory === subCategory) {
      onSubCategoryChange(null);
    } else {
      onSubCategoryChange(subCategory);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onMainCategoryChange(null);
    onSubCategoryChange(null);
    setExpandedCategory(null);
  };

  const hasActiveFilter = selectedMainCategory !== null;

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Категорії
          </div>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Скинути
            </Button>
          )}
        </div>

        {/* Categories list */}
        <div className="space-y-1">
          {categoryTree.map((mainCat) => {
            const IconComponent = CATEGORY_ICONS[mainCat.icon] || Beef;
            const isSelected = selectedMainCategory === mainCat.id;
            const isExpanded = expandedCategory === mainCat.id;
            const count = categoryCounts[mainCat.id] || 0;

            return (
              <div key={mainCat.id}>
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2",
                    isSelected && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handleMainCategoryClick(mainCat.id)}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="flex-1 text-left">{mainCat.label.uk}</span>
                  {count > 0 && (
                    <Badge variant="outline" className="h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="pl-6 pt-1 space-y-1">
                    {mainCat.children.map((subCat) => {
                      const subCount = categoryCounts[`${mainCat.id}:${subCat.id}`] || 0;
                      const isSubSelected = selectedSubCategory === subCat.id;

                      return (
                        <Button
                          key={subCat.id}
                          variant={isSubSelected ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-sm",
                            isSubSelected && "bg-primary/10 text-primary"
                          )}
                          onClick={() => handleSubCategoryClick(subCat.id)}
                        >
                          <span className="flex-1 text-left">{subCat.label.uk}</span>
                          {subCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {subCount}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      {/* Main categories - horizontal scroll */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {/* All button */}
          <Button
            variant={!selectedMainCategory ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={clearFilters}
          >
            Всі
            {Object.keys(categoryCounts).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {Object.entries(categoryCounts)
                  .filter(([key]) => !key.includes(':'))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </Badge>
            )}
          </Button>

          {/* Category buttons */}
          {categoryTree.map((mainCat) => {
            const IconComponent = CATEGORY_ICONS[mainCat.icon] || Beef;
            const isSelected = selectedMainCategory === mainCat.id;
            const count = categoryCounts[mainCat.id] || 0;

            return (
              <Button
                key={mainCat.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "shrink-0 gap-2",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handleMainCategoryClick(mainCat.id)}
              >
                <IconComponent className="h-4 w-4" />
                {mainCat.label.uk}
                {count > 0 && (
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className="h-5 px-1.5"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Subcategories - show only when main category is selected */}
      {selectedMainCategory && currentSubCategories.length > 0 && (
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {/* All in category */}
            <Button
              variant={!selectedSubCategory ? "secondary" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => onSubCategoryChange(null)}
            >
              Всі {STORAGE_MAIN_CATEGORY_LABELS[selectedMainCategory].uk.toLowerCase()}
            </Button>

            {/* Subcategory chips */}
            {currentSubCategories.map((subCat) => {
              const isSelected = selectedSubCategory === subCat.id;
              const count = categoryCounts[`${selectedMainCategory}:${subCat.id}`] || 0;

              return (
                <Button
                  key={subCat.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "shrink-0",
                    isSelected && "bg-primary/10 text-primary border-primary"
                  )}
                  onClick={() => handleSubCategoryClick(subCat.id)}
                >
                  {subCat.label.uk}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({count})
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filter indicator */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Фільтр:</span>
          <Badge variant="secondary" className="gap-1">
            {STORAGE_MAIN_CATEGORY_LABELS[selectedMainCategory].uk}
            {selectedSubCategory && (
              <>
                {" / "}
                {STORAGE_SUB_CATEGORY_LABELS[selectedSubCategory].uk}
              </>
            )}
            <button
              onClick={clearFilters}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
              aria-label="Скинути фільтр"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPACT CATEGORY TABS (for mobile)
// ==========================================

interface CategoryTabsProps {
  selectedMainCategory: StorageMainCategory | null;
  onMainCategoryChange: (category: StorageMainCategory | null) => void;
  categoryCounts?: Record<string, number>;
  className?: string;
}

export function CategoryTabs({
  selectedMainCategory,
  onMainCategoryChange,
  categoryCounts = {},
  className,
}: CategoryTabsProps) {
  const categoryTree = React.useMemo(() => buildCategoryTree(), []);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-1 p-1 bg-muted rounded-lg min-w-max">
        <button
          onClick={() => onMainCategoryChange(null)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            !selectedMainCategory
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Всі
        </button>
        {categoryTree.map((cat) => {
          const IconComponent = CATEGORY_ICONS[cat.icon] || Beef;
          const isSelected = selectedMainCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onMainCategoryChange(isSelected ? null : cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                isSelected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:inline">{cat.label.uk}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
