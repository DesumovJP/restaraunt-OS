/**
 * Storage Reference Data
 *
 * Industry-standard yield coefficients for food processing.
 * These are reference values - actual profiles should be fetched from database.
 *
 * TODO: Move to database and fetch via:
 * - GET /api/storage/yield-profiles
 */

import type {
  YieldProfile,
  StorageMainCategory,
  StorageSubCategory,
} from '@/types/extended';

// ==========================================
// YIELD PROFILES (Reference Coefficients)
// ==========================================

/**
 * Industry-standard yield ratios for common ingredients.
 * Used as defaults when creating new products.
 *
 * baseYieldRatio = net output / gross input after cleaning
 *
 * Sources: Ukrainian culinary standards, industry averages
 */
export const YIELD_PROFILES: Record<string, YieldProfile> = {
  // М'ясо (Meat)
  'pork': {
    documentId: 'yield_pork',
    slug: 'pork-yield',
    name: 'Свинина',
    productId: '',
    baseYieldRatio: 0.75,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'beef': {
    documentId: 'yield_beef',
    slug: 'beef-yield',
    name: 'Яловичина',
    productId: '',
    baseYieldRatio: 0.72,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'lamb': {
    documentId: 'yield_lamb',
    slug: 'lamb-yield',
    name: 'Баранина',
    productId: '',
    baseYieldRatio: 0.68,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Птиця (Poultry)
  'chicken': {
    documentId: 'yield_chicken',
    slug: 'chicken-yield',
    name: 'Курка',
    productId: '',
    baseYieldRatio: 0.72,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'duck': {
    documentId: 'yield_duck',
    slug: 'duck-yield',
    name: 'Качка',
    productId: '',
    baseYieldRatio: 0.65,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'turkey': {
    documentId: 'yield_turkey',
    slug: 'turkey-yield',
    name: 'Індичка',
    productId: '',
    baseYieldRatio: 0.78,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Риба (Fish & Seafood)
  'salmon': {
    documentId: 'yield_salmon',
    slug: 'salmon-yield',
    name: 'Лосось',
    productId: '',
    baseYieldRatio: 0.65,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'seabass': {
    documentId: 'yield_seabass',
    slug: 'seabass-yield',
    name: 'Сібас',
    productId: '',
    baseYieldRatio: 0.55,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'dorado': {
    documentId: 'yield_dorado',
    slug: 'dorado-yield',
    name: 'Дорадо',
    productId: '',
    baseYieldRatio: 0.52,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'shrimp': {
    documentId: 'yield_shrimp',
    slug: 'shrimp-yield',
    name: 'Креветки',
    productId: '',
    baseYieldRatio: 0.45,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Овочі (Vegetables)
  'potato': {
    documentId: 'yield_potato',
    slug: 'potato-yield',
    name: 'Картопля',
    productId: '',
    baseYieldRatio: 0.82,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'carrot': {
    documentId: 'yield_carrot',
    slug: 'carrot-yield',
    name: 'Морква',
    productId: '',
    baseYieldRatio: 0.85,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'onion': {
    documentId: 'yield_onion',
    slug: 'onion-yield',
    name: 'Цибуля',
    productId: '',
    baseYieldRatio: 0.88,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'beetroot': {
    documentId: 'yield_beetroot',
    slug: 'beetroot-yield',
    name: 'Буряк',
    productId: '',
    baseYieldRatio: 0.80,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'cabbage': {
    documentId: 'yield_cabbage',
    slug: 'cabbage-yield',
    name: 'Капуста',
    productId: '',
    baseYieldRatio: 0.75,
    processYields: [],
    wasteBreakdown: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Export yield profiles array for convenience
export const MOCK_YIELD_PROFILES = Object.values(YIELD_PROFILES);

// ==========================================
// PRODUCTS
// ==========================================

// TODO: Products should be fetched from database
// GET /api/storage/products
import type { ExtendedProduct } from '@/types/extended';

export const MOCK_PRODUCTS: ExtendedProduct[] = [];

// ==========================================
// HELPERS
// ==========================================

/**
 * Get category counts from products list
 * Useful for sidebar/filters
 */
export function getCategoryCounts(products: ExtendedProduct[]): Record<string, number> {
  const counts: Record<string, number> = {};
  products.forEach((product) => {
    counts[product.mainCategory] = (counts[product.mainCategory] || 0) + 1;
    counts[`${product.mainCategory}:${product.subCategory}`] = (counts[`${product.mainCategory}:${product.subCategory}`] || 0) + 1;
  });
  return counts;
}

/**
 * Filter products by category
 */
export function filterProductsByCategory(
  products: ExtendedProduct[],
  mainCategory?: StorageMainCategory,
  subCategory?: StorageSubCategory
): ExtendedProduct[] {
  return products.filter((product) => {
    if (mainCategory && product.mainCategory !== mainCategory) return false;
    if (subCategory && product.subCategory !== subCategory) return false;
    return true;
  });
}
