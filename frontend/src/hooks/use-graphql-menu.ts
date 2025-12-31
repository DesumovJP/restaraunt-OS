/**
 * Menu GraphQL Hooks
 * Hooks for menu and category operations using urql
 *
 * @description Provides hooks for menu item and category data
 * @module hooks/use-graphql-menu
 */

'use client';

import { useQuery } from 'urql';
import { useMemo } from 'react';
import { GET_ALL_CATEGORIES } from '@/graphql/queries';

// Types
interface MenuItem {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  description?: string;
  price: number;
  weight?: number;
  preparationTime: number;
  available: boolean;
  servingCourse: string;
  primaryStation: string;
  allergens?: string[];
  image?: {
    url: string;
    alternativeText?: string;
  };
}

interface MenuCategory {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

interface UseMenuResult {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  loading: boolean;
  error: string | undefined;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  getItemById: (itemId: string) => MenuItem | undefined;
  refetch: () => void;
}

/**
 * Hook for fetching all menu categories and items
 *
 * @returns Menu data with categories and items
 *
 * @example
 * ```tsx
 * const { categories, menuItems, loading, getItemsByCategory } = useMenu();
 *
 * // Get items for a specific category
 * const grillItems = getItemsByCategory('category-doc-id');
 * ```
 *
 * @example Response structure
 * ```json
 * {
 *   "categories": [
 *     {
 *       "documentId": "abc123",
 *       "name": "Grill",
 *       "slug": "grill",
 *       "menuItems": [
 *         {
 *           "documentId": "item123",
 *           "name": "Ribeye Steak",
 *           "price": 450,
 *           "preparationTime": 15
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 */
export function useMenu(): UseMenuResult {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_ALL_CATEGORIES,
    requestPolicy: 'cache-first',
  });

  // Extract categories from response
  const categories: MenuCategory[] = useMemo(() => {
    if (!data?.menuCategories) return [];
    return data.menuCategories;
  }, [data]);

  // Flatten all menu items
  const menuItems: MenuItem[] = useMemo(() => {
    if (!data?.menuCategories) return [];
    return data.menuCategories.flatMap((cat: MenuCategory) => cat.menuItems);
  }, [data]);

  // Helper: Get items by category
  const getItemsByCategory = useMemo(() => {
    return (categoryId: string): MenuItem[] => {
      const category = categories.find((c) => c.documentId === categoryId);
      return category?.menuItems || [];
    };
  }, [categories]);

  // Helper: Get item by ID
  const getItemById = useMemo(() => {
    return (itemId: string): MenuItem | undefined => {
      return menuItems.find((item) => item.documentId === itemId);
    };
  }, [menuItems]);

  return {
    categories,
    menuItems,
    loading: fetching,
    error: error?.message,
    getItemsByCategory,
    getItemById,
    refetch: reexecuteQuery,
  };
}

/**
 * Hook for getting a single category with its items
 *
 * @param categorySlug - The slug of the category to fetch
 * @returns Category data with items
 */
export function useCategoryItems(categorySlug: string) {
  const { categories, loading, error, refetch } = useMenu();

  const category = useMemo(() => {
    return categories.find((c) => c.slug === categorySlug);
  }, [categories, categorySlug]);

  return {
    category,
    items: category?.menuItems || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for searching menu items
 *
 * @param query - Search query string
 * @returns Filtered menu items
 */
export function useMenuSearch(query: string) {
  const { menuItems, loading, error } = useMenu();

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();

    return menuItems.filter((item) => {
      const name = item.name.toLowerCase();
      const nameUk = item.nameUk?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';

      return (
        name.includes(lowerQuery) ||
        nameUk.includes(lowerQuery) ||
        description.includes(lowerQuery)
      );
    });
  }, [menuItems, query]);

  return {
    results,
    loading,
    error,
    hasResults: results.length > 0,
  };
}
