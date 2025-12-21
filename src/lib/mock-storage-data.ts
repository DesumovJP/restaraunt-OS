/**
 * Mock Data for Smart Storage
 * Генератор мокових даних для розробки та тестування.
 */

import type {
  ExtendedProduct,
  YieldProfile,
  StorageBatch,
  StorageMainCategory,
  StorageSubCategory,
  StorageCondition,
  ProductUnit,
} from '@/types/extended';

// ==========================================
// YIELD PROFILES (для сировини)
// ==========================================

export const YIELD_PROFILES: Record<string, YieldProfile> = {
  // М'ясо
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
  // Птиця
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
  // Риба
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
  // Овочі
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

// ==========================================
// БАЗОВІ ШАБЛОНИ ПРОДУКТІВ
// ==========================================

interface ProductTemplate {
  name: string;
  mainCategory: StorageMainCategory;
  subCategory: StorageSubCategory;
  unit: ProductUnit;
  storageCondition: StorageCondition;
  shelfLifeDays: number;
  costRange: [number, number];
  stockRange: [number, number];
  yieldKey?: string; // ключ для YIELD_PROFILES
}

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ========== СИРОВИНА - М'ЯСО ==========
  { name: 'Свинина (лопатка)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [160, 200], stockRange: [10, 25], yieldKey: 'pork' },
  { name: 'Свинина (карбонад)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [220, 280], stockRange: [8, 20], yieldKey: 'pork' },
  { name: 'Свинина (ребра)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [140, 180], stockRange: [5, 15], yieldKey: 'pork' },
  { name: 'Свинина (окіст)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [180, 220], stockRange: [8, 18], yieldKey: 'pork' },
  { name: 'Яловичина (вирізка)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [400, 550], stockRange: [5, 12], yieldKey: 'beef' },
  { name: 'Яловичина (антрекот)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [350, 450], stockRange: [6, 14], yieldKey: 'beef' },
  { name: 'Яловичина (оковалок)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [280, 350], stockRange: [8, 16], yieldKey: 'beef' },
  { name: 'Яловичина (фарш)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [180, 240], stockRange: [10, 20], yieldKey: 'beef' },
  { name: 'Баранина (каре)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [500, 700], stockRange: [3, 8], yieldKey: 'lamb' },
  { name: 'Баранина (нога)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [380, 480], stockRange: [4, 10], yieldKey: 'lamb' },
  { name: 'Телятина (вирізка)', mainCategory: 'raw', subCategory: 'meat', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [450, 600], stockRange: [4, 10], yieldKey: 'beef' },

  // ========== СИРОВИНА - ПТИЦЯ ==========
  { name: 'Курка (ціла)', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [85, 120], stockRange: [15, 30], yieldKey: 'chicken' },
  { name: 'Курячі стегна', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [95, 130], stockRange: [12, 25], yieldKey: 'chicken' },
  { name: 'Курячі крильця', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [80, 110], stockRange: [10, 20], yieldKey: 'chicken' },
  { name: 'Курячі гомілки', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [75, 100], stockRange: [15, 30], yieldKey: 'chicken' },
  { name: 'Качка (ціла)', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [250, 350], stockRange: [4, 10], yieldKey: 'duck' },
  { name: 'Качина грудка', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [380, 480], stockRange: [3, 8], yieldKey: 'duck' },
  { name: 'Індичка (філе)', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [180, 240], stockRange: [8, 16], yieldKey: 'turkey' },
  { name: 'Індичі стегна', mainCategory: 'raw', subCategory: 'poultry', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 4, costRange: [140, 180], stockRange: [6, 12], yieldKey: 'turkey' },
  { name: 'Перепілки', mainCategory: 'raw', subCategory: 'poultry', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [45, 65], stockRange: [20, 50], yieldKey: 'chicken' },

  // ========== СИРОВИНА - РИБА ==========
  { name: 'Лосось (ціла)', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [580, 750], stockRange: [5, 12], yieldKey: 'salmon' },
  { name: 'Лосось (філе)', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [750, 950], stockRange: [4, 10], yieldKey: 'salmon' },
  { name: 'Сібас', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [420, 550], stockRange: [4, 10], yieldKey: 'seabass' },
  { name: 'Дорадо', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [380, 480], stockRange: [5, 12], yieldKey: 'dorado' },
  { name: 'Тунець (філе)', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [850, 1200], stockRange: [2, 6], yieldKey: 'salmon' },
  { name: 'Форель', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [350, 450], stockRange: [5, 12], yieldKey: 'salmon' },
  { name: 'Судак', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [280, 380], stockRange: [4, 10], yieldKey: 'seabass' },
  { name: 'Креветки тигрові', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [480, 650], stockRange: [3, 8], yieldKey: 'shrimp' },
  { name: 'Креветки королевські', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [550, 750], stockRange: [2, 6], yieldKey: 'shrimp' },
  { name: 'Мідії', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [180, 280], stockRange: [5, 15], yieldKey: 'shrimp' },
  { name: 'Кальмари', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [220, 320], stockRange: [4, 10], yieldKey: 'shrimp' },
  { name: 'Восьминіг', mainCategory: 'raw', subCategory: 'seafood', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [450, 600], stockRange: [2, 6], yieldKey: 'shrimp' },

  // ========== СИРОВИНА - ОВОЧІ ==========
  { name: 'Картопля', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'dry-cool', shelfLifeDays: 30, costRange: [15, 25], stockRange: [40, 100], yieldKey: 'potato' },
  { name: 'Картопля молода', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [35, 55], stockRange: [20, 50], yieldKey: 'potato' },
  { name: 'Морква', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [20, 35], stockRange: [25, 60], yieldKey: 'carrot' },
  { name: 'Цибуля ріпчаста', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'dry-cool', shelfLifeDays: 45, costRange: [18, 30], stockRange: [30, 70], yieldKey: 'onion' },
  { name: 'Цибуля червона', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'dry-cool', shelfLifeDays: 30, costRange: [35, 55], stockRange: [15, 35], yieldKey: 'onion' },
  { name: 'Цибуля-порей', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [65, 95], stockRange: [8, 20], yieldKey: 'onion' },
  { name: 'Часник', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'dry-cool', shelfLifeDays: 60, costRange: [120, 180], stockRange: [5, 15], yieldKey: 'onion' },
  { name: 'Буряк', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [18, 30], stockRange: [15, 35], yieldKey: 'beetroot' },
  { name: 'Капуста білокачанна', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [15, 25], stockRange: [20, 50], yieldKey: 'cabbage' },
  { name: 'Капуста пекінська', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 10, costRange: [45, 70], stockRange: [10, 25], yieldKey: 'cabbage' },
  { name: 'Капуста цвітна', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [55, 85], stockRange: [8, 20], yieldKey: 'cabbage' },
  { name: 'Броколі', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [75, 120], stockRange: [6, 15], yieldKey: 'cabbage' },
  { name: 'Помідори', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [65, 120], stockRange: [15, 35], yieldKey: 'potato' },
  { name: 'Помідори черрі', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [120, 200], stockRange: [5, 15], yieldKey: 'potato' },
  { name: 'Огірки', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [45, 80], stockRange: [15, 35], yieldKey: 'potato' },
  { name: 'Перець болгарський', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 10, costRange: [85, 150], stockRange: [10, 25], yieldKey: 'potato' },
  { name: 'Баклажани', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [55, 90], stockRange: [8, 20], yieldKey: 'potato' },
  { name: 'Кабачки', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 10, costRange: [35, 60], stockRange: [12, 30], yieldKey: 'potato' },
  { name: 'Селера (корінь)', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [45, 75], stockRange: [8, 20], yieldKey: 'carrot' },
  { name: 'Селера (стебла)', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [85, 130], stockRange: [5, 12], yieldKey: 'cabbage' },
  { name: 'Шпинат', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [150, 250], stockRange: [3, 10], yieldKey: 'cabbage' },
  { name: 'Руккола', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [200, 350], stockRange: [2, 8], yieldKey: 'cabbage' },
  { name: 'Салат Айсберг', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [65, 100], stockRange: [8, 20], yieldKey: 'cabbage' },
  { name: 'Салат Романо', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [95, 150], stockRange: [5, 15], yieldKey: 'cabbage' },
  { name: 'Авокадо', mainCategory: 'raw', subCategory: 'vegetables', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [35, 60], stockRange: [20, 50], yieldKey: 'potato' },
  { name: 'Спаржа', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [280, 450], stockRange: [3, 10], yieldKey: 'cabbage' },
  { name: 'Артишоки', mainCategory: 'raw', subCategory: 'vegetables', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [350, 500], stockRange: [2, 8], yieldKey: 'cabbage' },

  // ========== СИРОВИНА - ГРИБИ ==========
  { name: 'Шампіньйони', mainCategory: 'raw', subCategory: 'mushrooms', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [85, 130], stockRange: [10, 25], yieldKey: 'potato' },
  { name: 'Гливи', mainCategory: 'raw', subCategory: 'mushrooms', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [95, 150], stockRange: [6, 15], yieldKey: 'potato' },
  { name: 'Печериці', mainCategory: 'raw', subCategory: 'mushrooms', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [120, 180], stockRange: [5, 12], yieldKey: 'potato' },
  { name: 'Білі гриби', mainCategory: 'raw', subCategory: 'mushrooms', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [450, 700], stockRange: [2, 6], yieldKey: 'potato' },
  { name: 'Лисички', mainCategory: 'raw', subCategory: 'mushrooms', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [380, 550], stockRange: [2, 8], yieldKey: 'potato' },

  // ========== СИРОВИНА - ФРУКТИ ==========
  { name: 'Лимони', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [65, 100], stockRange: [10, 25] },
  { name: 'Лайм', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [120, 180], stockRange: [5, 15] },
  { name: 'Апельсини', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [45, 75], stockRange: [15, 35] },
  { name: 'Яблука', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [35, 60], stockRange: [20, 50] },
  { name: 'Груші', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [55, 90], stockRange: [10, 25] },
  { name: 'Банани', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 7, costRange: [45, 70], stockRange: [15, 35] },
  { name: 'Полуниця', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [180, 350], stockRange: [3, 10] },
  { name: 'Малина', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [280, 450], stockRange: [2, 6] },
  { name: 'Чорниця', mainCategory: 'raw', subCategory: 'fruits', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [250, 400], stockRange: [2, 8] },

  // ========== СИРОВИНА - ЯЙЦЯ ==========
  { name: 'Яйця курячі (С1)', mainCategory: 'raw', subCategory: 'eggs', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [4, 6], stockRange: [100, 300] },
  { name: 'Яйця курячі (С0)', mainCategory: 'raw', subCategory: 'eggs', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [5, 8], stockRange: [80, 200] },
  { name: 'Яйця перепелині', mainCategory: 'raw', subCategory: 'eggs', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 21, costRange: [2, 4], stockRange: [100, 250] },

  // ========== ЗАГОТОВКИ - М'ЯСНІ ==========
  { name: 'Свинина порційна', mainCategory: 'prep', subCategory: 'meat-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [200, 260], stockRange: [5, 15] },
  { name: 'Яловичина маринована', mainCategory: 'prep', subCategory: 'meat-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [480, 600], stockRange: [3, 10] },
  { name: 'Фарш свинячий', mainCategory: 'prep', subCategory: 'meat-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [160, 220], stockRange: [8, 20] },
  { name: 'Фарш яловичий', mainCategory: 'prep', subCategory: 'meat-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [200, 280], stockRange: [6, 15] },
  { name: 'Котлети напівфабрикат', mainCategory: 'prep', subCategory: 'meat-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [180, 250], stockRange: [5, 15] },

  // ========== ЗАГОТОВКИ - ПТИЦЯ ==========
  { name: 'Курина грудка (філе)', mainCategory: 'prep', subCategory: 'poultry-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [140, 180], stockRange: [8, 20] },
  { name: 'Курячі крильця мариновані', mainCategory: 'prep', subCategory: 'poultry-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [120, 160], stockRange: [6, 15] },
  { name: 'Качине конфі', mainCategory: 'prep', subCategory: 'poultry-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [450, 600], stockRange: [2, 8] },

  // ========== ЗАГОТОВКИ - ОВОЧЕВІ ==========
  { name: 'Картопля очищена', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [25, 40], stockRange: [15, 40] },
  { name: 'Картопля нарізана (фрі)', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 1, costRange: [35, 55], stockRange: [10, 25] },
  { name: 'Цибуля нарізана', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 1, costRange: [30, 50], stockRange: [5, 15] },
  { name: 'Морква жульєн', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [35, 55], stockRange: [5, 12] },
  { name: 'Овочевий мікс для смаження', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [65, 100], stockRange: [8, 20] },
  { name: 'Салатний мікс', mainCategory: 'prep', subCategory: 'veg-prep', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [120, 180], stockRange: [4, 12] },

  // ========== ЗАГОТОВКИ - СОУСИ ==========
  { name: 'Томатний соус (домашній)', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [75, 120], stockRange: [5, 15] },
  { name: 'Соус Болоньєзе', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [120, 180], stockRange: [4, 12] },
  { name: 'Соус Бешамель', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [85, 130], stockRange: [3, 10] },
  { name: 'Песто (домашній)', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [250, 380], stockRange: [2, 6] },
  { name: 'Майонез (домашній)', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [95, 150], stockRange: [3, 10] },
  { name: 'Часниковий соус', mainCategory: 'prep', subCategory: 'sauces', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [80, 120], stockRange: [3, 10] },

  // ========== ЗАГОТОВКИ - БУЛЬЙОНИ ==========
  { name: 'Курячий бульйон', mainCategory: 'prep', subCategory: 'stocks', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [40, 65], stockRange: [10, 30] },
  { name: 'Яловичий бульйон', mainCategory: 'prep', subCategory: 'stocks', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [55, 85], stockRange: [8, 25] },
  { name: 'Рибний бульйон', mainCategory: 'prep', subCategory: 'stocks', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [65, 100], stockRange: [5, 15] },
  { name: 'Овочевий бульйон', mainCategory: 'prep', subCategory: 'stocks', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [30, 50], stockRange: [8, 20] },

  // ========== ЗАГОТОВКИ - ТІСТО ==========
  { name: 'Тісто для піци', mainCategory: 'prep', subCategory: 'dough', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [45, 70], stockRange: [10, 30] },
  { name: 'Листкове тісто', mainCategory: 'prep', subCategory: 'dough', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [85, 130], stockRange: [5, 15] },
  { name: 'Тісто для пасти', mainCategory: 'prep', subCategory: 'dough', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 2, costRange: [55, 85], stockRange: [5, 15] },

  // ========== БАКАЛІЯ - КРУПИ ==========
  { name: 'Рис Арборіо', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [75, 120], stockRange: [10, 30] },
  { name: 'Рис Басматі', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [65, 100], stockRange: [15, 40] },
  { name: 'Рис Жасмин', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [55, 85], stockRange: [15, 40] },
  { name: 'Булгур', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [45, 70], stockRange: [10, 25] },
  { name: 'Кус-кус', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [55, 85], stockRange: [8, 20] },
  { name: 'Кіноа', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [180, 280], stockRange: [5, 15] },
  { name: 'Гречка', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [45, 70], stockRange: [15, 40] },
  { name: 'Перлова крупа', mainCategory: 'dry-goods', subCategory: 'grains', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [25, 40], stockRange: [10, 25] },

  // ========== БАКАЛІЯ - БОРОШНО ==========
  { name: 'Борошно пшеничне в/г', mainCategory: 'dry-goods', subCategory: 'flour', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 180, costRange: [25, 40], stockRange: [30, 80] },
  { name: 'Борошно 00 (італійське)', mainCategory: 'dry-goods', subCategory: 'flour', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 180, costRange: [45, 75], stockRange: [20, 50] },
  { name: 'Борошно цільнозернове', mainCategory: 'dry-goods', subCategory: 'flour', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 120, costRange: [35, 55], stockRange: [10, 25] },
  { name: 'Кукурудзяне борошно', mainCategory: 'dry-goods', subCategory: 'flour', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 180, costRange: [35, 55], stockRange: [8, 20] },
  { name: 'Крохмаль кукурудзяний', mainCategory: 'dry-goods', subCategory: 'flour', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [45, 70], stockRange: [5, 15] },

  // ========== БАКАЛІЯ - МАКАРОНИ ==========
  { name: 'Спагетті', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [45, 75], stockRange: [20, 50] },
  { name: 'Пенне', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [45, 75], stockRange: [15, 40] },
  { name: 'Феттучіні', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [55, 85], stockRange: [10, 30] },
  { name: 'Фарфалле', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [55, 85], stockRange: [10, 25] },
  { name: 'Лазанья (листи)', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [75, 120], stockRange: [8, 20] },
  { name: 'Равіолі (заготовка)', mainCategory: 'dry-goods', subCategory: 'pasta', unit: 'kg', storageCondition: 'frozen', shelfLifeDays: 90, costRange: [180, 280], stockRange: [5, 15] },

  // ========== БАКАЛІЯ - БОБОВІ ==========
  { name: 'Квасоля біла', mainCategory: 'dry-goods', subCategory: 'legumes', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [55, 85], stockRange: [10, 25] },
  { name: 'Квасоля червона', mainCategory: 'dry-goods', subCategory: 'legumes', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [55, 85], stockRange: [10, 25] },
  { name: 'Нут', mainCategory: 'dry-goods', subCategory: 'legumes', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [65, 100], stockRange: [8, 20] },
  { name: 'Сочевиця', mainCategory: 'dry-goods', subCategory: 'legumes', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [75, 120], stockRange: [8, 20] },
  { name: 'Горох', mainCategory: 'dry-goods', subCategory: 'legumes', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [35, 55], stockRange: [10, 25] },

  // ========== БАКАЛІЯ - КОНСЕРВИ ==========
  { name: 'Томати консервовані (цілі)', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [65, 100], stockRange: [20, 50] },
  { name: 'Томати подрібнені', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [55, 85], stockRange: [20, 50] },
  { name: 'Томатна паста', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [85, 130], stockRange: [10, 25] },
  { name: 'Оливки (зелені)', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [150, 250], stockRange: [5, 15] },
  { name: 'Оливки (чорні)', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [180, 280], stockRange: [5, 15] },
  { name: 'Каперси', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [350, 500], stockRange: [2, 6] },
  { name: 'Анчоуси', mainCategory: 'dry-goods', subCategory: 'canned', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [450, 650], stockRange: [2, 5] },

  // ========== ПРИПРАВИ - СПЕЦІЇ ==========
  { name: 'Перець чорний (мелений)', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [250, 400], stockRange: [1, 3] },
  { name: 'Перець чорний (горошок)', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [280, 450], stockRange: [1, 3] },
  { name: 'Паприка солодка', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [200, 350], stockRange: [1, 3] },
  { name: 'Паприка копчена', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [300, 480], stockRange: [0.5, 2] },
  { name: 'Куркума', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [180, 300], stockRange: [0.5, 2] },
  { name: 'Кориця (мелена)', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [220, 380], stockRange: [0.5, 1.5] },
  { name: 'Мускатний горіх', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [450, 700], stockRange: [0.3, 1] },
  { name: 'Кмин', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [180, 300], stockRange: [0.5, 2] },
  { name: 'Коріандр', mainCategory: 'seasonings', subCategory: 'spices', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [150, 250], stockRange: [0.5, 2] },

  // ========== ПРИПРАВИ - СІЛЬ ==========
  { name: 'Сіль морська', mainCategory: 'seasonings', subCategory: 'salt-pepper', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 1825, costRange: [35, 60], stockRange: [5, 15] },
  { name: 'Сіль кошерна', mainCategory: 'seasonings', subCategory: 'salt-pepper', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 1825, costRange: [45, 75], stockRange: [3, 10] },
  { name: 'Сіль рожева гімалайська', mainCategory: 'seasonings', subCategory: 'salt-pepper', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 1825, costRange: [120, 200], stockRange: [2, 5] },
  { name: 'Флер де Сель', mainCategory: 'seasonings', subCategory: 'salt-pepper', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 1825, costRange: [350, 550], stockRange: [0.5, 2] },

  // ========== ПРИПРАВИ - ТРАВИ СУШЕНІ ==========
  { name: 'Орегано', mainCategory: 'seasonings', subCategory: 'herbs-dried', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [350, 550], stockRange: [0.3, 1] },
  { name: 'Базилік сушений', mainCategory: 'seasonings', subCategory: 'herbs-dried', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [380, 600], stockRange: [0.3, 1] },
  { name: 'Тим\'ян', mainCategory: 'seasonings', subCategory: 'herbs-dried', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [400, 650], stockRange: [0.2, 0.8] },
  { name: 'Розмарин', mainCategory: 'seasonings', subCategory: 'herbs-dried', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [420, 680], stockRange: [0.2, 0.8] },
  { name: 'Лавровий лист', mainCategory: 'seasonings', subCategory: 'herbs-dried', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [250, 400], stockRange: [0.3, 1] },

  // ========== ПРИПРАВИ - ТРАВИ СВІЖІ ==========
  { name: 'Петрушка', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [100, 160], stockRange: [2, 6] },
  { name: 'Кінза', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [120, 180], stockRange: [1, 4] },
  { name: 'Кріп', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [100, 160], stockRange: [1, 4] },
  { name: 'Базилік свіжий', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [180, 300], stockRange: [1, 3] },
  { name: 'М\'ята', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 5, costRange: [150, 250], stockRange: [0.5, 2] },
  { name: 'Розмарин свіжий', mainCategory: 'seasonings', subCategory: 'herbs-fresh', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [200, 350], stockRange: [0.5, 2] },

  // ========== ОЛІЇ ==========
  { name: 'Оливкова олія Extra Virgin', mainCategory: 'oils-fats', subCategory: 'vegetable-oil', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [320, 500], stockRange: [10, 25] },
  { name: 'Оливкова олія (для смаження)', mainCategory: 'oils-fats', subCategory: 'vegetable-oil', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [180, 280], stockRange: [15, 40] },
  { name: 'Соняшникова олія', mainCategory: 'oils-fats', subCategory: 'vegetable-oil', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 365, costRange: [55, 85], stockRange: [20, 50] },
  { name: 'Кунжутна олія', mainCategory: 'oils-fats', subCategory: 'specialty-oil', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 180, costRange: [280, 450], stockRange: [2, 6] },
  { name: 'Трюфельна олія', mainCategory: 'oils-fats', subCategory: 'specialty-oil', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 180, costRange: [850, 1500], stockRange: [0.5, 2] },
  { name: 'Масло вершкове 82%', mainCategory: 'oils-fats', subCategory: 'butter', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [280, 400], stockRange: [8, 20] },
  { name: 'Масло топлене (Гхі)', mainCategory: 'oils-fats', subCategory: 'butter', unit: 'kg', storageCondition: 'ambient', shelfLifeDays: 90, costRange: [450, 700], stockRange: [3, 10] },

  // ========== МОЛОЧНІ ==========
  { name: 'Молоко 3.2%', mainCategory: 'dairy', subCategory: 'milk', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [35, 55], stockRange: [20, 50] },
  { name: 'Вершки 33%', mainCategory: 'dairy', subCategory: 'cream', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 10, costRange: [130, 200], stockRange: [8, 20] },
  { name: 'Вершки 20%', mainCategory: 'dairy', subCategory: 'cream', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 10, costRange: [85, 130], stockRange: [10, 25] },
  { name: 'Сметана 20%', mainCategory: 'dairy', subCategory: 'cream', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [75, 120], stockRange: [5, 15] },
  { name: 'Пармезан', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 90, costRange: [750, 1200], stockRange: [3, 8] },
  { name: 'Моцарела', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [380, 550], stockRange: [5, 15] },
  { name: 'Моцарела Буфало', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [650, 950], stockRange: [2, 6] },
  { name: 'Горгонзола', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [550, 850], stockRange: [2, 5] },
  { name: 'Фета', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 30, costRange: [280, 420], stockRange: [4, 10] },
  { name: 'Маскарпоне', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 14, costRange: [320, 480], stockRange: [3, 8] },
  { name: 'Рікота', mainCategory: 'dairy', subCategory: 'cheese', unit: 'kg', storageCondition: 'refrigerated', shelfLifeDays: 7, costRange: [220, 350], stockRange: [3, 8] },

  // ========== НАПОЇ ==========
  { name: 'Вино червоне (хаус)', mainCategory: 'beverages', subCategory: 'wine', unit: 'l', storageCondition: 'dry-cool', shelfLifeDays: 730, costRange: [150, 280], stockRange: [20, 50] },
  { name: 'Вино біле (хаус)', mainCategory: 'beverages', subCategory: 'wine', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 365, costRange: [150, 280], stockRange: [15, 40] },
  { name: 'Просекко', mainCategory: 'beverages', subCategory: 'wine', unit: 'l', storageCondition: 'refrigerated', shelfLifeDays: 365, costRange: [220, 380], stockRange: [10, 25] },
  { name: 'Коньяк (для кухні)', mainCategory: 'beverages', subCategory: 'spirits', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 1825, costRange: [350, 600], stockRange: [3, 8] },
  { name: 'Марсала', mainCategory: 'beverages', subCategory: 'wine', unit: 'l', storageCondition: 'ambient', shelfLifeDays: 730, costRange: [280, 450], stockRange: [2, 6] },

  // ========== ЗАМОРОЖЕНІ ==========
  { name: 'Горошок заморожений', mainCategory: 'frozen', subCategory: 'frozen-veg', unit: 'kg', storageCondition: 'frozen', shelfLifeDays: 365, costRange: [75, 120], stockRange: [10, 25] },
  { name: 'Кукурудза заморожена', mainCategory: 'frozen', subCategory: 'frozen-veg', unit: 'kg', storageCondition: 'frozen', shelfLifeDays: 365, costRange: [65, 100], stockRange: [10, 25] },
  { name: 'Ягоди (мікс) заморожені', mainCategory: 'frozen', subCategory: 'frozen-fruit', unit: 'kg', storageCondition: 'frozen', shelfLifeDays: 365, costRange: [120, 200], stockRange: [5, 15] },
  { name: 'Полуниця заморожена', mainCategory: 'frozen', subCategory: 'frozen-fruit', unit: 'kg', storageCondition: 'frozen', shelfLifeDays: 365, costRange: [150, 250], stockRange: [5, 12] },
  { name: 'Морозиво ванільне', mainCategory: 'frozen', subCategory: 'ice-cream', unit: 'l', storageCondition: 'frozen', shelfLifeDays: 180, costRange: [180, 300], stockRange: [5, 15] },

  // ========== ГОТОВІ ==========
  { name: 'Хліб Чіабатта', mainCategory: 'ready-made', subCategory: 'bread', unit: 'pcs', storageCondition: 'ambient', shelfLifeDays: 3, costRange: [25, 45], stockRange: [20, 50] },
  { name: 'Хліб Фокача', mainCategory: 'ready-made', subCategory: 'bread', unit: 'pcs', storageCondition: 'ambient', shelfLifeDays: 2, costRange: [35, 60], stockRange: [15, 35] },
  { name: 'Круасани', mainCategory: 'ready-made', subCategory: 'pastry', unit: 'pcs', storageCondition: 'ambient', shelfLifeDays: 2, costRange: [18, 35], stockRange: [20, 50] },
  { name: 'Тірамісу (порція)', mainCategory: 'ready-made', subCategory: 'desserts', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [85, 140], stockRange: [10, 30] },
  { name: 'Панна Котта', mainCategory: 'ready-made', subCategory: 'desserts', unit: 'pcs', storageCondition: 'refrigerated', shelfLifeDays: 3, costRange: [55, 90], stockRange: [10, 25] },
];

// ==========================================
// ГЕНЕРАТОР ПРОДУКТІВ
// ==========================================

let productIdCounter = 1;

function generateProduct(template: ProductTemplate): ExtendedProduct {
  const id = productIdCounter++;
  const costPerUnit = Math.round(template.costRange[0] + Math.random() * (template.costRange[1] - template.costRange[0]));
  const minStock = Math.round(template.stockRange[0]);
  const maxStock = Math.round(template.stockRange[1]);
  const currentStock = Math.round(minStock + Math.random() * (maxStock - minStock));

  const yieldProfile = template.yieldKey ? YIELD_PROFILES[template.yieldKey] : undefined;

  return {
    documentId: `prod_${String(id).padStart(3, '0')}`,
    slug: template.name.toLowerCase().replace(/[^a-zа-яіїє0-9]+/gi, '-'),
    name: template.name,
    sku: `${template.mainCategory.toUpperCase().slice(0, 3)}-${String(id).padStart(4, '0')}`,
    unit: template.unit,
    currentStock,
    minStock,
    maxStock,
    category: template.subCategory,
    mainCategory: template.mainCategory,
    subCategory: template.subCategory,
    categoryPath: [template.mainCategory, template.subCategory],
    storageCondition: template.storageCondition,
    shelfLifeDays: template.shelfLifeDays,
    costPerUnit,
    suppliers: [`supplier_${Math.floor(Math.random() * 10) + 1}`],
    lastUpdated: new Date().toISOString(),
    yieldProfile,
  };
}

// Генеруємо всі продукти
export const MOCK_PRODUCTS: ExtendedProduct[] = PRODUCT_TEMPLATES.map(generateProduct);

// ==========================================
// HELPERS
// ==========================================

export function getCategoryCounts(products: ExtendedProduct[]): Record<string, number> {
  const counts: Record<string, number> = {};
  products.forEach((product) => {
    counts[product.mainCategory] = (counts[product.mainCategory] || 0) + 1;
    counts[`${product.mainCategory}:${product.subCategory}`] = (counts[`${product.mainCategory}:${product.subCategory}`] || 0) + 1;
  });
  return counts;
}

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

// Export yield profiles array
export const MOCK_YIELD_PROFILES = Object.values(YIELD_PROFILES);
