"use client";

/**
 * Menu Hook
 *
 * Fetches menu categories and items from REST API backend.
 * Uses REST instead of GraphQL for better caching and performance.
 * Implements in-memory caching for faster page transitions.
 *
 * @returns categories, menuItems, isLoading, error
 *
 * @example
 * const { categories, menuItems, isLoading } = useMenu();
 */

import * as React from "react";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type { Category, MenuItem, Recipe } from "@/types";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// ==========================================
// SIMPLE IN-MEMORY CACHE
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const CACHE_TTL_MS = 60000; // 60 seconds cache TTL (server also caches)

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;

  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Menu categories - simple fetch
const CATEGORIES_URL = "/api/menu-categories?pagination[limit]=50&sort=sortOrder:asc";

// Menu items with recipe ingredients for availability check
const MENU_ITEMS_URL = "/api/menu-items?pagination[limit]=200&populate[category][fields][0]=documentId&populate[category][fields][1]=slug&populate[recipe][populate][ingredients][populate][ingredient][fields][0]=currentStock";

// Recipes with full ingredient data (single optimized query with JOINs)
const RECIPES_URL = "/api/recipes?pagination[limit]=100&populate[ingredients][populate][ingredient][fields][0]=documentId&populate[ingredients][populate][ingredient][fields][1]=name&populate[ingredients][populate][ingredient][fields][2]=nameUk&populate[ingredients][populate][ingredient][fields][3]=unit&populate[ingredients][populate][ingredient][fields][4]=currentStock&populate[steps]=*";

// ==========================================
// TYPES
// ==========================================

interface StrapiMenuCategory {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface StrapiMenuItem {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  description?: string;
  descriptionUk?: string;
  price: number;
  available?: boolean;
  preparationTime?: number;
  outputType?: string;
  category?: {
    documentId: string;
    slug: string;
  };
  recipe?: {
    documentId: string;
    ingredients?: Array<{
      ingredient?: {
        currentStock?: number;
      };
      quantity: number;
    }>;
  };
}

interface StrapiRecipe {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  portionYield?: number;
  costPerPortion?: number;
  isActive?: boolean;
  outputType?: "kitchen" | "bar" | "pastry" | "cold";
  ingredients?: Array<{
    ingredient?: {
      documentId: string;
      name: string;
      nameUk?: string;
      unit: string;
      costPerUnit?: number;
      currentStock?: number;
    };
    quantity: number;
    unit?: string;
    isOptional?: boolean;
  }>;
  steps?: Array<{
    stepNumber: number;
    description: string;
    estimatedTimeMinutes?: number;
    station?: string;
  }>;
}

// ==========================================
// TRANSFORM FUNCTIONS
// ==========================================

function transformCategory(cat: StrapiMenuCategory): Category {
  return {
    id: cat.documentId,
    documentId: cat.documentId,
    slug: cat.slug,
    name: cat.nameUk || cat.name,
    sortOrder: cat.sortOrder || 0,
    isActive: cat.isActive !== false,
  };
}

function transformMenuItem(item: StrapiMenuItem): MenuItem {
  // Check if item is manually disabled
  if (item.available === false) {
    return {
      id: item.documentId,
      documentId: item.documentId,
      slug: item.slug,
      name: item.nameUk || item.name,
      description: item.descriptionUk || item.description,
      price: item.price,
      categoryId: item.category?.documentId || "",
      categorySlug: item.category?.slug,
      recipeId: item.recipe?.documentId,
      available: false,
      preparationTime: item.preparationTime || 15,
      outputType: (item.outputType as "kitchen" | "bar" | "pastry" | "cold") || "kitchen",
    };
  }

  // Check ingredient availability if recipe exists
  let hasEnoughStock = true;
  if (item.recipe?.ingredients && item.recipe.ingredients.length > 0) {
    hasEnoughStock = item.recipe.ingredients.every((ing) => {
      const stock = ing.ingredient?.currentStock ?? 0;
      return stock >= ing.quantity;
    });
  }

  return {
    id: item.documentId,
    documentId: item.documentId,
    slug: item.slug,
    name: item.nameUk || item.name,
    description: item.descriptionUk || item.description,
    price: item.price,
    categoryId: item.category?.documentId || "",
    categorySlug: item.category?.slug,
    recipeId: item.recipe?.documentId,
    available: hasEnoughStock,
    preparationTime: item.preparationTime || 15,
    outputType: (item.outputType as "kitchen" | "bar" | "pastry" | "cold") || "kitchen",
  };
}

function transformRecipe(recipe: StrapiRecipe): Recipe {
  const prepTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0) || 15;
  const outputType = recipe.outputType || "kitchen";

  return {
    id: recipe.documentId,
    documentId: recipe.documentId,
    slug: recipe.slug,
    name: recipe.nameUk || recipe.name,
    menuItem: {
      id: recipe.documentId,
      documentId: recipe.documentId,
      slug: recipe.slug,
      name: recipe.nameUk || recipe.name,
      price: 0,
      categoryId: "",
      available: true,
      preparationTime: prepTime,
      outputType,
    },
    outputType,
    prepTime,
    portions: recipe.portionYield || 1,
    costPerPortion: recipe.costPerPortion || 0,
    ingredients:
      recipe.ingredients?.map((ing) => ({
        product: {
          id: ing.ingredient?.documentId || "",
          name: ing.ingredient?.nameUk || ing.ingredient?.name || "Unknown",
          unit: ing.ingredient?.unit || "kg",
          costPerUnit: ing.ingredient?.costPerUnit || 0,
          currentStock: ing.ingredient?.currentStock || 0,
        },
        quantity: ing.quantity,
        unit: ing.unit || ing.ingredient?.unit || "kg",
        isOptional: ing.isOptional || false,
      })) || [],
    steps:
      recipe.steps?.map((step) => ({
        stepNumber: step.stepNumber,
        instruction: step.description,
        duration: step.estimatedTimeMinutes,
        station: step.station,
      })) || [],
    isActive: recipe.isActive !== false,
  };
}

// ==========================================
// REST API FETCH
// ==========================================

async function fetchREST<T>(endpoint: string): Promise<T | null> {
  const response = await fetch(`${STRAPI_URL}${endpoint}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const result = await response.json();
  return result.data as T;
}

// ==========================================
// HOOKS
// ==========================================

interface UseMenuResult {
  categories: Category[];
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMenu(): UseMenuResult {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (skipCache = false) => {
    // Check cache first for instant display
    const cacheKey = "menu_data";
    if (!skipCache) {
      const cached = getCached<{ categories: Category[]; menuItems: MenuItem[] }>(cacheKey);
      if (cached) {
        setCategories(cached.categories);
        setMenuItems(cached.menuItems);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories and menu items in parallel using REST API
      const [categoriesData, menuItemsData] = await Promise.all([
        fetchWithRetry(
          () => fetchREST<StrapiMenuCategory[]>(CATEGORIES_URL),
          { maxRetries: 3 }
        ),
        fetchWithRetry(
          () => fetchREST<StrapiMenuItem[]>(MENU_ITEMS_URL),
          { maxRetries: 3 }
        ),
      ]);

      const transformedCategories = (categoriesData || [])
        .filter((c) => c.isActive !== false)
        .map(transformCategory)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const transformedItems = (menuItemsData || [])
        .filter((i) => i.available !== false)
        .map(transformMenuItem);

      // Cache the transformed data
      setCache(cacheKey, { categories: transformedCategories, menuItems: transformedItems });

      setCategories(transformedCategories);
      setMenuItems(transformedItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load menu";
      setError(message);
      console.error("useMenu error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { categories, menuItems, isLoading, error, refetch: () => fetchData(true) };
}

interface UseRecipesResult {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (skipCache = false) => {
    // Check cache first for instant display
    const cacheKey = "recipes_data";
    if (!skipCache) {
      const cached = getCached<Recipe[]>(cacheKey);
      if (cached) {
        setRecipes(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use REST API - single optimized query with JOINs instead of N+1
      const data = await fetchWithRetry(
        () => fetchREST<StrapiRecipe[]>(RECIPES_URL),
        { maxRetries: 3 }
      );

      if (data) {
        const transformedRecipes = data
          .filter((r) => r.isActive !== false)
          .map(transformRecipe);

        // Cache the transformed data
        setCache(cacheKey, transformedRecipes);

        setRecipes(transformedRecipes);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load recipes";
      setError(message);
      console.error("useRecipes error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { recipes, isLoading, error, refetch: () => fetchData(true) };
}

// ==========================================
// INGREDIENTS HOOK
// ==========================================

// REST endpoint for ingredients
const INGREDIENTS_URL = "/api/ingredients?pagination[limit]=200&fields[0]=documentId&fields[1]=name&fields[2]=nameUk&fields[3]=slug&fields[4]=sku&fields[5]=unit&fields[6]=currentStock&fields[7]=costPerUnit&fields[8]=mainCategory&fields[9]=subCategory";

interface StrapiIngredient {
  documentId: string;
  name: string;
  nameUk?: string;
  slug: string;
  sku?: string;
  unit: string;
  currentStock?: number;
  costPerUnit?: number;
  mainCategory?: string;
  subCategory?: string;
}

export interface Ingredient {
  id: string;
  documentId: string;
  name: string;
  slug: string;
  sku: string;
  unit: string;
  currentStock: number;
  costPerUnit: number;
  mainCategory?: string;
  subCategory?: string;
}

function transformIngredient(ing: StrapiIngredient): Ingredient {
  return {
    id: ing.documentId,
    documentId: ing.documentId,
    name: ing.nameUk || ing.name,
    slug: ing.slug,
    sku: ing.sku || "",
    unit: ing.unit,
    currentStock: ing.currentStock || 0,
    costPerUnit: ing.costPerUnit || 0,
    mainCategory: ing.mainCategory,
    subCategory: ing.subCategory,
  };
}

interface UseIngredientsResult {
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIngredients(): UseIngredientsResult {
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use REST API instead of GraphQL
      const data = await fetchWithRetry(
        () => fetchREST<StrapiIngredient[]>(INGREDIENTS_URL),
        { maxRetries: 3 }
      );

      if (data) {
        setIngredients(data.map(transformIngredient));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load ingredients";
      setError(message);
      console.error("useIngredients error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ingredients, isLoading, error, refetch: fetchData };
}

// ==========================================
// RECIPE MUTATIONS
// ==========================================

interface RecipeInput {
  name: string;
  nameUk?: string;
  slug: string;
  portionYield: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  instructions?: string;
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
}

export async function createRecipe(input: RecipeInput): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const mutation = `
      mutation CreateRecipe($data: RecipeInput!) {
        createRecipe(data: $data) {
          documentId
        }
      }
    `;

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          data: {
            name: input.name,
            nameUk: input.nameUk,
            slug: input.slug,
            portionYield: input.portionYield,
            prepTimeMinutes: input.prepTimeMinutes,
            cookTimeMinutes: input.cookTimeMinutes,
            instructions: input.instructions,
            isActive: true,
            ingredients: input.ingredients.map((ing) => ({
              ingredient: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
            })),
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return { success: false, error: result.errors[0]?.message };
    }

    // Publish the recipe
    const docId = result.data?.createRecipe?.documentId;
    if (docId) {
      await fetch(`${STRAPI_URL}/api/recipes/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
      });
    }

    return { success: true, documentId: docId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ==========================================
// MENU ITEM MUTATIONS
// ==========================================

interface MenuItemInput {
  name: string;
  nameUk?: string;
  slug: string;
  price: number;
  description?: string;
  descriptionUk?: string;
  categoryId: string;
  outputType?: "kitchen" | "bar" | "pastry" | "cold";
  preparationTime?: number;
  available?: boolean;
  recipeId?: string;
}

export async function createMenuItem(
  input: MenuItemInput
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const mutation = `
      mutation CreateMenuItem($data: MenuItemInput!) {
        createMenuItem(data: $data) {
          documentId
        }
      }
    `;

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          data: {
            name: input.name,
            nameUk: input.nameUk || input.name,
            slug: input.slug,
            price: input.price,
            description: input.description,
            descriptionUk: input.descriptionUk || input.description,
            category: input.categoryId,
            outputType: input.outputType || "kitchen",
            preparationTime: input.preparationTime || 15,
            available: input.available !== false,
            recipe: input.recipeId || null,
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return { success: false, error: result.errors[0]?.message };
    }

    // Publish the menu item
    const docId = result.data?.createMenuItem?.documentId;
    if (docId) {
      await fetch(`${STRAPI_URL}/api/menu-items/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
      });
    }

    return { success: true, documentId: docId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ==========================================
// COMBINED RECIPE + MENU ITEM CREATION
// ==========================================

interface RecipeWithMenuItemInput extends RecipeInput {
  price: number;
  categoryId: string;
  description?: string;
  outputType?: "kitchen" | "bar" | "pastry" | "cold";
}

export async function createRecipeWithMenuItem(
  input: RecipeWithMenuItemInput
): Promise<{ success: boolean; recipeId?: string; menuItemId?: string; error?: string }> {
  try {
    // Step 1: Create the recipe
    const recipeResult = await createRecipe(input);
    if (!recipeResult.success || !recipeResult.documentId) {
      return { success: false, error: recipeResult.error || "Failed to create recipe" };
    }

    // Step 2: Create the menu item linked to the recipe
    const menuItemResult = await createMenuItem({
      name: input.name,
      nameUk: input.nameUk,
      slug: input.slug,
      price: input.price,
      description: input.description,
      descriptionUk: input.description,
      categoryId: input.categoryId,
      outputType: input.outputType,
      preparationTime: (input.prepTimeMinutes || 0) + (input.cookTimeMinutes || 0),
      available: true,
      recipeId: recipeResult.documentId,
    });

    if (!menuItemResult.success) {
      return {
        success: false,
        recipeId: recipeResult.documentId,
        error: menuItemResult.error || "Failed to create menu item"
      };
    }

    return {
      success: true,
      recipeId: recipeResult.documentId,
      menuItemId: menuItemResult.documentId
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateRecipe(
  documentId: string,
  input: Partial<RecipeInput>
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const mutation = `
      mutation UpdateRecipe($documentId: ID!, $data: RecipeInput!) {
        updateRecipe(documentId: $documentId, data: $data) {
          documentId
        }
      }
    `;

    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.nameUk) data.nameUk = input.nameUk;
    if (input.portionYield) data.portionYield = input.portionYield;
    if (input.prepTimeMinutes) data.prepTimeMinutes = input.prepTimeMinutes;
    if (input.cookTimeMinutes) data.cookTimeMinutes = input.cookTimeMinutes;
    if (input.instructions !== undefined) data.instructions = input.instructions;
    if (input.ingredients) {
      data.ingredients = input.ingredients.map((ing) => ({
        ingredient: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
      }));
    }

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: { documentId, data },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return { success: false, error: result.errors[0]?.message };
    }

    return { success: true, documentId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
