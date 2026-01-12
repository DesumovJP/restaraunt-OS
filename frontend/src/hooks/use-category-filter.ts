/**
 * useCategoryFilter Hook
 *
 * Unified hook for category filtering logic in storage.
 * Handles main/sub category selection and filter state.
 */

import * as React from "react";
import type { StorageMainCategory, StorageSubCategory } from "@/types/extended";
import { buildCategoryTree } from "@/types/extended";

/**
 * Category filter state
 */
export interface CategoryFilterState {
  mainCategory: StorageMainCategory | null;
  subCategory: StorageSubCategory | null;
  expandedCategory: StorageMainCategory | null;
}

/**
 * Category counts by main and sub categories
 */
export type CategoryCounts = Record<string, number>;

/**
 * Hook options
 */
export interface UseCategoryFilterOptions {
  initialMainCategory?: StorageMainCategory | null;
  initialSubCategory?: StorageSubCategory | null;
}

/**
 * Hook return type
 */
export interface UseCategoryFilterReturn {
  // State
  mainCategory: StorageMainCategory | null;
  subCategory: StorageSubCategory | null;
  expandedCategory: StorageMainCategory | null;
  hasActiveFilter: boolean;

  // Data
  categoryTree: ReturnType<typeof buildCategoryTree>;
  currentSubCategories: Array<{ id: StorageSubCategory; label: { uk: string; en: string } }>;

  // Actions
  setMainCategory: (category: StorageMainCategory | null) => void;
  setSubCategory: (category: StorageSubCategory | null) => void;
  setExpandedCategory: (category: StorageMainCategory | null) => void;
  handleMainCategoryClick: (category: StorageMainCategory) => void;
  handleSubCategoryClick: (subCategory: StorageSubCategory) => void;
  clearFilters: () => void;

  // Helpers
  getTotalCount: (counts: CategoryCounts) => number;
  getMainCategoryCount: (counts: CategoryCounts, mainCat: StorageMainCategory) => number;
  getSubCategoryCount: (
    counts: CategoryCounts,
    mainCat: StorageMainCategory,
    subCat: StorageSubCategory
  ) => number;
}

/**
 * Unified hook for category filtering
 */
export function useCategoryFilter(
  options: UseCategoryFilterOptions = {}
): UseCategoryFilterReturn {
  const [mainCategory, setMainCategory] = React.useState<StorageMainCategory | null>(
    options.initialMainCategory ?? null
  );
  const [subCategory, setSubCategory] = React.useState<StorageSubCategory | null>(
    options.initialSubCategory ?? null
  );
  const [expandedCategory, setExpandedCategory] = React.useState<StorageMainCategory | null>(
    options.initialMainCategory ?? null
  );

  // Build category tree once
  const categoryTree = React.useMemo(() => buildCategoryTree(), []);

  // Get subcategories for selected main category
  const currentSubCategories = React.useMemo(() => {
    if (!mainCategory) return [];
    const mainCat = categoryTree.find((c) => c.id === mainCategory);
    return mainCat?.children || [];
  }, [mainCategory, categoryTree]);

  // Check if any filter is active
  const hasActiveFilter = mainCategory !== null;

  // Handle main category click (toggle selection)
  const handleMainCategoryClick = React.useCallback(
    (category: StorageMainCategory) => {
      if (mainCategory === category) {
        // Deselect if already selected
        setMainCategory(null);
        setSubCategory(null);
        setExpandedCategory(null);
      } else {
        setMainCategory(category);
        setSubCategory(null);
        setExpandedCategory(category);
      }
    },
    [mainCategory]
  );

  // Handle subcategory click (toggle selection)
  const handleSubCategoryClick = React.useCallback(
    (subCat: StorageSubCategory) => {
      if (subCategory === subCat) {
        setSubCategory(null);
      } else {
        setSubCategory(subCat);
      }
    },
    [subCategory]
  );

  // Clear all filters
  const clearFilters = React.useCallback(() => {
    setMainCategory(null);
    setSubCategory(null);
    setExpandedCategory(null);
  }, []);

  // Helper: get total count from counts object
  const getTotalCount = React.useCallback((counts: CategoryCounts): number => {
    return Object.entries(counts)
      .filter(([key]) => !key.includes(":"))
      .reduce((sum, [, count]) => sum + count, 0);
  }, []);

  // Helper: get main category count
  const getMainCategoryCount = React.useCallback(
    (counts: CategoryCounts, mainCat: StorageMainCategory): number => {
      return counts[mainCat] || 0;
    },
    []
  );

  // Helper: get subcategory count
  const getSubCategoryCount = React.useCallback(
    (
      counts: CategoryCounts,
      mainCat: StorageMainCategory,
      subCat: StorageSubCategory
    ): number => {
      return counts[`${mainCat}:${subCat}`] || 0;
    },
    []
  );

  return {
    // State
    mainCategory,
    subCategory,
    expandedCategory,
    hasActiveFilter,

    // Data
    categoryTree,
    currentSubCategories,

    // Actions
    setMainCategory,
    setSubCategory,
    setExpandedCategory,
    handleMainCategoryClick,
    handleSubCategoryClick,
    clearFilters,

    // Helpers
    getTotalCount,
    getMainCategoryCount,
    getSubCategoryCount,
  };
}
