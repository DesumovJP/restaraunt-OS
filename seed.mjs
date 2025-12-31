/**
 * Seed Script for Restaurant OS
 * Run: node seed.mjs
 */

const STRAPI_URL = 'http://localhost:1337';

async function graphql(query, variables) {
  const response = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// Store documentIds for relationships
const createdIds = {
  menuCategories: {},
  suppliers: {},
  yieldProfiles: {},
  ingredients: {},
  recipes: {},
  menuItems: {},
  tables: {},
};

// ============ SEED DATA ============

const menuCategories = [
  { name: 'Hot Dishes', nameUk: 'Гарячі страви', slug: 'hot-dishes', sortOrder: 1, icon: 'flame', isActive: true },
  { name: 'Cold Appetizers', nameUk: 'Холодні закуски', slug: 'cold-appetizers', sortOrder: 2, icon: 'snowflake', isActive: true },
  { name: 'Salads', nameUk: 'Салати', slug: 'salads', sortOrder: 3, icon: 'leaf', isActive: true },
  { name: 'Soups', nameUk: 'Супи', slug: 'soups', sortOrder: 4, icon: 'bowl', isActive: true },
  { name: 'Desserts', nameUk: 'Десерти', slug: 'desserts', sortOrder: 5, icon: 'cake', isActive: true },
  { name: 'Drinks', nameUk: 'Напої', slug: 'drinks', sortOrder: 6, icon: 'cup', isActive: true },
  { name: 'Side Dishes', nameUk: 'Гарніри', slug: 'sides', sortOrder: 7, icon: 'plate', isActive: true },
];

const suppliers = [
  { name: 'Green Farm', contactName: 'Ivan Petrenko', phone: '+380501234567', email: 'zelenyi.lan@gmail.com', address: 'Zelene village, Kyiv region', isActive: true },
  { name: 'Globino Meat', contactName: 'Maria Kovalenko', phone: '+380671234567', email: 'globino@meat.ua', address: 'Globyne, Poltava region', isActive: true },
  { name: 'Dairy House', contactName: 'Oleksandr Sydorenko', phone: '+380931234567', email: 'milk@dairy.ua', address: 'Bila Tserkva', isActive: true },
  { name: 'Sea Products UA', contactName: 'Natalia Morska', phone: '+380661234567', email: 'seafood@ua.com', address: 'Odesa', isActive: true },
];

const yieldProfiles = [
  { name: 'Vegetables Standard', baseYieldRatio: 0.85, processYields: [{ processType: 'cleaning', yieldRatio: 0.90 }, { processType: 'peeling', yieldRatio: 0.80 }, { processType: 'cutting', yieldRatio: 0.95 }, { processType: 'boiling', yieldRatio: 0.85 }, { processType: 'frying', yieldRatio: 0.75 }], wasteBreakdown: [] },
  { name: 'Meat Standard', baseYieldRatio: 0.80, processYields: [{ processType: 'cleaning', yieldRatio: 0.95 }, { processType: 'trimming', yieldRatio: 0.85 }, { processType: 'cutting', yieldRatio: 0.98 }, { processType: 'grilling', yieldRatio: 0.75 }, { processType: 'frying', yieldRatio: 0.70 }, { processType: 'boiling', yieldRatio: 0.80 }], wasteBreakdown: [] },
  { name: 'Fish Standard', baseYieldRatio: 0.55, processYields: [{ processType: 'cleaning', yieldRatio: 0.60 }, { processType: 'filleting', yieldRatio: 0.50 }, { processType: 'frying', yieldRatio: 0.85 }, { processType: 'grilling', yieldRatio: 0.80 }], wasteBreakdown: [] },
  { name: 'Greens', baseYieldRatio: 0.70, processYields: [{ processType: 'cleaning', yieldRatio: 0.80 }, { processType: 'cutting', yieldRatio: 0.90 }], wasteBreakdown: [] },
  { name: 'No Loss', baseYieldRatio: 1.0, processYields: [], wasteBreakdown: [] },
];

const ingredients = [
  { name: 'Chicken Fillet', nameUk: 'Куряче філе', slug: 'chicken-fillet', unit: 'kg', minStock: 5, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5, yieldProfileName: 'Meat Standard' },
  { name: 'Pork Leg', nameUk: 'Свинина (окіст)', slug: 'pork-leg', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 6, yieldProfileName: 'Meat Standard' },
  { name: 'Beef Tenderloin', nameUk: 'Яловичина (вирізка)', slug: 'beef-tenderloin', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5, yieldProfileName: 'Meat Standard' },
  { name: 'Salmon Fillet', nameUk: 'Лосось філе', slug: 'salmon-fillet', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 3, yieldProfileName: 'Fish Standard' },
  { name: 'Dorado', nameUk: 'Дорадо', slug: 'dorado', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 3, yieldProfileName: 'Fish Standard' },
  { name: 'Potato', nameUk: 'Картопля', slug: 'potato', unit: 'kg', minStock: 20, mainCategory: 'raw', storageCondition: 'dry-cool', shelfLifeDays: 30, yieldProfileName: 'Vegetables Standard' },
  { name: 'Carrot', nameUk: 'Морква', slug: 'carrot', unit: 'kg', minStock: 10, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 21, yieldProfileName: 'Vegetables Standard' },
  { name: 'Onion', nameUk: 'Цибуля', slug: 'onion', unit: 'kg', minStock: 10, mainCategory: 'raw', storageCondition: 'dry-cool', shelfLifeDays: 45, yieldProfileName: 'Vegetables Standard' },
  { name: 'Garlic', nameUk: 'Часник', slug: 'garlic', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'dry-cool', shelfLifeDays: 30, yieldProfileName: 'Vegetables Standard' },
  { name: 'Tomato', nameUk: 'Помідори', slug: 'tomato', unit: 'kg', minStock: 5, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 7, yieldProfileName: 'Vegetables Standard' },
  { name: 'Cucumber', nameUk: 'Огірки', slug: 'cucumber', unit: 'kg', minStock: 5, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 10, yieldProfileName: 'Vegetables Standard' },
  { name: 'Bell Pepper', nameUk: 'Перець болгарський', slug: 'bell-pepper', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 14, yieldProfileName: 'Vegetables Standard' },
  { name: 'Iceberg Lettuce', nameUk: 'Салат Айсберг', slug: 'iceberg-lettuce', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 5, yieldProfileName: 'Greens' },
  { name: 'Arugula', nameUk: 'Руккола', slug: 'arugula', unit: 'kg', minStock: 1, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 4, yieldProfileName: 'Greens' },
  { name: 'Heavy Cream 33%', nameUk: 'Вершки 33%', slug: 'cream-33', unit: 'l', minStock: 5, mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 14, yieldProfileName: 'No Loss' },
  { name: 'Milk', nameUk: 'Молоко', slug: 'milk', unit: 'l', minStock: 10, mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 7, yieldProfileName: 'No Loss' },
  { name: 'Parmesan', nameUk: 'Пармезан', slug: 'parmesan', unit: 'kg', minStock: 2, mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 90, yieldProfileName: 'No Loss' },
  { name: 'Mozzarella', nameUk: 'Моцарела', slug: 'mozzarella', unit: 'kg', minStock: 2, mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 21, yieldProfileName: 'No Loss' },
  { name: 'Butter', nameUk: 'Масло вершкове', slug: 'butter', unit: 'kg', minStock: 3, mainCategory: 'dairy', storageCondition: 'refrigerated', shelfLifeDays: 30, yieldProfileName: 'No Loss' },
  { name: 'Wheat Flour', nameUk: 'Борошно пшеничне', slug: 'wheat-flour', unit: 'kg', minStock: 10, mainCategory: 'dry-goods', storageCondition: 'dry-cool', shelfLifeDays: 180, yieldProfileName: 'No Loss' },
  { name: 'Rice', nameUk: 'Рис', slug: 'rice', unit: 'kg', minStock: 10, mainCategory: 'dry-goods', storageCondition: 'dry-cool', shelfLifeDays: 365, yieldProfileName: 'No Loss' },
  { name: 'Spaghetti', nameUk: 'Паста спагеті', slug: 'spaghetti', unit: 'kg', minStock: 5, mainCategory: 'dry-goods', storageCondition: 'dry-cool', shelfLifeDays: 365, yieldProfileName: 'No Loss' },
  { name: 'Sugar', nameUk: 'Цукор', slug: 'sugar', unit: 'kg', minStock: 5, mainCategory: 'dry-goods', storageCondition: 'dry-cool', shelfLifeDays: 730, yieldProfileName: 'No Loss' },
  { name: 'Salt', nameUk: 'Сіль', slug: 'salt', unit: 'kg', minStock: 5, mainCategory: 'seasonings', storageCondition: 'dry-cool', shelfLifeDays: 1825, yieldProfileName: 'No Loss' },
  { name: 'Olive Oil', nameUk: 'Олія оливкова', slug: 'olive-oil', unit: 'l', minStock: 5, mainCategory: 'oils-fats', storageCondition: 'dry-cool', shelfLifeDays: 365, yieldProfileName: 'No Loss' },
  { name: 'Sunflower Oil', nameUk: 'Олія соняшникова', slug: 'sunflower-oil', unit: 'l', minStock: 10, mainCategory: 'oils-fats', storageCondition: 'dry-cool', shelfLifeDays: 365, yieldProfileName: 'No Loss' },
  { name: 'Soy Sauce', nameUk: 'Соєвий соус', slug: 'soy-sauce', unit: 'l', minStock: 2, mainCategory: 'seasonings', storageCondition: 'dry-cool', shelfLifeDays: 365, yieldProfileName: 'No Loss' },
  { name: 'Chicken Eggs', nameUk: 'Яйця курячі', slug: 'eggs', unit: 'pcs', minStock: 60, mainCategory: 'raw', storageCondition: 'refrigerated', shelfLifeDays: 21, yieldProfileName: 'No Loss' },
];

const tables = [
  { number: 1, capacity: 2, zone: 'main_hall', status: 'free', isActive: true },
  { number: 2, capacity: 2, zone: 'main_hall', status: 'free', isActive: true },
  { number: 3, capacity: 4, zone: 'main_hall', status: 'free', isActive: true },
  { number: 4, capacity: 4, zone: 'main_hall', status: 'free', isActive: true },
  { number: 5, capacity: 6, zone: 'main_hall', status: 'free', isActive: true },
  { number: 6, capacity: 6, zone: 'main_hall', status: 'free', isActive: true },
  { number: 7, capacity: 8, zone: 'main_hall', status: 'free', isActive: true },
  { number: 8, capacity: 4, zone: 'terrace', status: 'free', isActive: true },
  { number: 9, capacity: 4, zone: 'terrace', status: 'free', isActive: true },
  { number: 10, capacity: 6, zone: 'terrace', status: 'free', isActive: true },
  { number: 11, capacity: 2, zone: 'bar', status: 'free', isActive: true },
  { number: 12, capacity: 2, zone: 'bar', status: 'free', isActive: true },
  { number: 100, capacity: 10, zone: 'vip', status: 'free', isActive: true },
  { number: 101, capacity: 12, zone: 'vip', status: 'free', isActive: true },
];

const recipes = [
  {
    name: 'Chicken Kyiv', nameUk: 'Курка по-київськи', slug: 'chicken-kyiv', category: 'hot-dishes',
    price: 285, description: 'Classic chicken Kyiv with butter inside', descriptionUk: 'Класична курка по-київськи з вершковим маслом всередині',
    prepTimeMinutes: 25, cookTimeMinutes: 15, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'fry',
    ingredients: [
      { slug: 'chicken-fillet', quantity: 0.2, unit: 'kg', processChain: ['cleaning', 'trimming'], wasteAllowancePercent: 5 },
      { slug: 'butter', quantity: 0.03, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'wheat-flour', quantity: 0.05, unit: 'kg', processChain: [], wasteAllowancePercent: 2 },
      { slug: 'eggs', quantity: 2, unit: 'pcs', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'sunflower-oil', quantity: 0.1, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
    ],
    steps: [
      { stepNumber: 1, description: 'Flatten the fillet to 5mm thickness', station: 'prep', estimatedTimeMinutes: 5, processType: 'cleaning' },
      { stepNumber: 2, description: 'Wrap butter in the fillet', station: 'prep', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 3, description: 'Bread: flour -> egg -> breadcrumbs', station: 'prep', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 4, description: 'Deep fry at 180C until golden', station: 'fry', estimatedTimeMinutes: 10, processType: 'frying' },
    ],
  },
  {
    name: 'Caesar Salad with Chicken', nameUk: 'Салат Цезар з куркою', slug: 'caesar-salad-chicken', category: 'salads',
    price: 195, description: 'Classic Caesar with grilled chicken and parmesan', descriptionUk: 'Класичний Цезар з грильованою куркою та пармезаном',
    prepTimeMinutes: 15, cookTimeMinutes: 10, outputType: 'cold', servingCourse: 'starter', primaryStation: 'salad',
    ingredients: [
      { slug: 'chicken-fillet', quantity: 0.15, unit: 'kg', processChain: ['cleaning', 'grilling'], wasteAllowancePercent: 5 },
      { slug: 'iceberg-lettuce', quantity: 0.1, unit: 'kg', processChain: ['cleaning', 'cutting'], wasteAllowancePercent: 10 },
      { slug: 'parmesan', quantity: 0.03, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'olive-oil', quantity: 0.02, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'eggs', quantity: 1, unit: 'pcs', processChain: [], wasteAllowancePercent: 0 },
    ],
    steps: [
      { stepNumber: 1, description: 'Grill chicken until done', station: 'grill', estimatedTimeMinutes: 10, processType: 'grilling' },
      { stepNumber: 2, description: 'Cut the lettuce', station: 'salad', estimatedTimeMinutes: 3, processType: 'cleaning' },
      { stepNumber: 3, description: 'Prepare Caesar dressing', station: 'salad', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 4, description: 'Combine ingredients, top with parmesan', station: 'salad', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Pasta Carbonara', nameUk: 'Паста Карбонара', slug: 'pasta-carbonara', category: 'hot-dishes',
    price: 175, description: 'Classic Italian pasta with bacon and egg', descriptionUk: 'Класична італійська паста з беконом та яйцем',
    prepTimeMinutes: 10, cookTimeMinutes: 15, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'hot',
    ingredients: [
      { slug: 'spaghetti', quantity: 0.15, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'pork-leg', quantity: 0.08, unit: 'kg', processChain: ['cutting'], wasteAllowancePercent: 5 },
      { slug: 'cream-33', quantity: 0.1, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'parmesan', quantity: 0.03, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'eggs', quantity: 2, unit: 'pcs', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'garlic', quantity: 0.01, unit: 'kg', processChain: ['peeling', 'cutting'], wasteAllowancePercent: 15 },
    ],
    steps: [
      { stepNumber: 1, description: 'Boil pasta al dente', station: 'hot', estimatedTimeMinutes: 10, processType: 'boiling' },
      { stepNumber: 2, description: 'Fry bacon with garlic', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 3, description: 'Mix yolks with cream and parmesan', station: 'hot', estimatedTimeMinutes: 3, processType: 'portioning' },
      { stepNumber: 4, description: 'Combine pasta with sauce off heat', station: 'hot', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Grilled Salmon', nameUk: 'Лосось на грилі', slug: 'grilled-salmon', category: 'hot-dishes',
    price: 395, description: 'Grilled salmon steak with vegetables', descriptionUk: 'Стейк лосося на грилі з овочами',
    prepTimeMinutes: 10, cookTimeMinutes: 12, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'grill',
    ingredients: [
      { slug: 'salmon-fillet', quantity: 0.2, unit: 'kg', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { slug: 'olive-oil', quantity: 0.02, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'bell-pepper', quantity: 0.1, unit: 'kg', processChain: ['cleaning', 'cutting'], wasteAllowancePercent: 15 },
      { slug: 'arugula', quantity: 0.03, unit: 'kg', processChain: ['cleaning'], wasteAllowancePercent: 10 },
    ],
    steps: [
      { stepNumber: 1, description: 'Marinate salmon with olive oil', station: 'prep', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 2, description: 'Grill at 200C 5-6 min each side', station: 'grill', estimatedTimeMinutes: 12, processType: 'grilling' },
      { stepNumber: 3, description: 'Prepare grilled vegetables', station: 'grill', estimatedTimeMinutes: 8, processType: 'grilling' },
      { stepNumber: 4, description: 'Plate with arugula', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'French Fries', nameUk: 'Картопля фрі', slug: 'french-fries', category: 'sides',
    price: 65, description: 'Crispy french fries', descriptionUk: 'Хрустка картопля фрі',
    prepTimeMinutes: 10, cookTimeMinutes: 8, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'fry',
    ingredients: [
      { slug: 'potato', quantity: 0.25, unit: 'kg', processChain: ['peeling', 'cutting', 'frying'], wasteAllowancePercent: 25 },
      { slug: 'sunflower-oil', quantity: 0.15, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
      { slug: 'salt', quantity: 0.005, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
    ],
    steps: [
      { stepNumber: 1, description: 'Cut potatoes into strips', station: 'prep', estimatedTimeMinutes: 5, processType: 'cleaning' },
      { stepNumber: 2, description: 'Deep fry at 180C', station: 'fry', estimatedTimeMinutes: 8, processType: 'frying' },
      { stepNumber: 3, description: 'Season and serve', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },
];

const batches = [
  { ingredient: 'chicken-fillet', grossIn: 10, unitCost: 120, daysUntilExpiry: 5, daysAgo: 2 },
  { ingredient: 'chicken-fillet', grossIn: 8, unitCost: 125, daysUntilExpiry: 7, daysAgo: 0 },
  { ingredient: 'pork-leg', grossIn: 8, unitCost: 150, daysUntilExpiry: 6, daysAgo: 1 },
  { ingredient: 'beef-tenderloin', grossIn: 5, unitCost: 280, daysUntilExpiry: 5, daysAgo: 2 },
  { ingredient: 'salmon-fillet', grossIn: 4, unitCost: 450, daysUntilExpiry: 3, daysAgo: 1 },
  { ingredient: 'dorado', grossIn: 3, unitCost: 320, daysUntilExpiry: 3, daysAgo: 0 },
  { ingredient: 'potato', grossIn: 50, unitCost: 15, daysUntilExpiry: 30, daysAgo: 5 },
  { ingredient: 'carrot', grossIn: 20, unitCost: 18, daysUntilExpiry: 21, daysAgo: 3 },
  { ingredient: 'onion', grossIn: 25, unitCost: 12, daysUntilExpiry: 45, daysAgo: 7 },
  { ingredient: 'garlic', grossIn: 5, unitCost: 80, daysUntilExpiry: 30, daysAgo: 10 },
  { ingredient: 'tomato', grossIn: 15, unitCost: 45, daysUntilExpiry: 7, daysAgo: 2 },
  { ingredient: 'cucumber', grossIn: 12, unitCost: 35, daysUntilExpiry: 10, daysAgo: 1 },
  { ingredient: 'bell-pepper', grossIn: 8, unitCost: 65, daysUntilExpiry: 14, daysAgo: 3 },
  { ingredient: 'iceberg-lettuce', grossIn: 8, unitCost: 55, daysUntilExpiry: 5, daysAgo: 1 },
  { ingredient: 'arugula', grossIn: 3, unitCost: 120, daysUntilExpiry: 4, daysAgo: 0 },
  { ingredient: 'cream-33', grossIn: 15, unitCost: 95, daysUntilExpiry: 14, daysAgo: 2 },
  { ingredient: 'milk', grossIn: 25, unitCost: 32, daysUntilExpiry: 7, daysAgo: 1 },
  { ingredient: 'parmesan', grossIn: 5, unitCost: 650, daysUntilExpiry: 90, daysAgo: 10 },
  { ingredient: 'mozzarella', grossIn: 6, unitCost: 280, daysUntilExpiry: 21, daysAgo: 3 },
  { ingredient: 'butter', grossIn: 10, unitCost: 180, daysUntilExpiry: 30, daysAgo: 5 },
  { ingredient: 'wheat-flour', grossIn: 25, unitCost: 28, daysUntilExpiry: 180, daysAgo: 30 },
  { ingredient: 'rice', grossIn: 20, unitCost: 42, daysUntilExpiry: 365, daysAgo: 60 },
  { ingredient: 'spaghetti', grossIn: 15, unitCost: 55, daysUntilExpiry: 365, daysAgo: 45 },
  { ingredient: 'sugar', grossIn: 15, unitCost: 35, daysUntilExpiry: 730, daysAgo: 90 },
  { ingredient: 'salt', grossIn: 10, unitCost: 15, daysUntilExpiry: 1825, daysAgo: 180 },
  { ingredient: 'olive-oil', grossIn: 10, unitCost: 220, daysUntilExpiry: 365, daysAgo: 30 },
  { ingredient: 'sunflower-oil', grossIn: 20, unitCost: 65, daysUntilExpiry: 365, daysAgo: 45 },
  { ingredient: 'soy-sauce', grossIn: 5, unitCost: 85, daysUntilExpiry: 365, daysAgo: 60 },
  { ingredient: 'eggs', grossIn: 120, unitCost: 4.5, daysUntilExpiry: 21, daysAgo: 3 },
  { ingredient: 'eggs', grossIn: 60, unitCost: 4.8, daysUntilExpiry: 28, daysAgo: 0 },
];

async function main() {
  console.log('🚀 Starting Restaurant OS Seed...\n');

  try {
    // 1. Menu Categories
    console.log('🍽️  Seeding Menu Categories...');
    for (const cat of menuCategories) {
      try {
        const result = await graphql(`mutation CreateMenuCategory($data: MenuCategoryInput!) { createMenuCategory(data: $data) { documentId name } }`, { data: cat });
        createdIds.menuCategories[cat.slug] = result.createMenuCategory.documentId;
        console.log(`  ✓ ${cat.nameUk}`);
      } catch (e) {
        console.log(`  ⚠ ${cat.nameUk} - вже існує або помилка`);
      }
    }

    // 2. Suppliers
    console.log('\n🏭 Seeding Suppliers...');
    for (const sup of suppliers) {
      try {
        const result = await graphql(`mutation CreateSupplier($data: SupplierInput!) { createSupplier(data: $data) { documentId name } }`, { data: sup });
        createdIds.suppliers[sup.name] = result.createSupplier.documentId;
        console.log(`  ✓ ${sup.name}`);
      } catch (e) {
        console.log(`  ⚠ ${sup.name} - вже існує або помилка`);
      }
    }

    // 3. Yield Profiles
    console.log('\n📊 Seeding Yield Profiles...');
    for (const yp of yieldProfiles) {
      try {
        const result = await graphql(`mutation CreateYieldProfile($data: YieldProfileInput!) { createYieldProfile(data: $data) { documentId name } }`, { data: yp });
        createdIds.yieldProfiles[yp.name] = result.createYieldProfile.documentId;
        console.log(`  ✓ ${yp.name}`);
      } catch (e) {
        console.log(`  ⚠ ${yp.name} - вже існує або помилка`);
      }
    }

    // 4. Ingredients
    console.log('\n🥕 Seeding Ingredients...');
    for (const ing of ingredients) {
      const yieldProfileId = createdIds.yieldProfiles[ing.yieldProfileName];
      const data = { name: ing.name, nameUk: ing.nameUk, slug: ing.slug, unit: ing.unit, minStock: ing.minStock, mainCategory: ing.mainCategory, storageCondition: ing.storageCondition, shelfLifeDays: ing.shelfLifeDays, isActive: true, currentStock: 0, yieldProfile: yieldProfileId };
      try {
        const result = await graphql(`mutation CreateIngredient($data: IngredientInput!) { createIngredient(data: $data) { documentId name } }`, { data });
        createdIds.ingredients[ing.slug] = result.createIngredient.documentId;
        console.log(`  ✓ ${ing.nameUk}`);
      } catch (e) {
        console.log(`  ⚠ ${ing.nameUk} - вже існує або помилка`);
      }
    }

    // 5. Tables
    console.log('\n🪑 Seeding Tables...');
    for (const tbl of tables) {
      try {
        const result = await graphql(`mutation CreateTable($data: TableInput!) { createTable(data: $data) { documentId number } }`, { data: tbl });
        createdIds.tables[`table-${tbl.number}`] = result.createTable.documentId;
        console.log(`  ✓ Стіл #${tbl.number}`);
      } catch (e) {
        console.log(`  ⚠ Стіл #${tbl.number} - вже існує або помилка`);
      }
    }

    // 6. Recipes & Menu Items
    console.log('\n📖 Seeding Recipes and Menu Items...');
    for (const recipe of recipes) {
      const recipeData = {
        name: recipe.name, nameUk: recipe.nameUk, slug: recipe.slug, instructions: recipe.descriptionUk,
        portionYield: 1, prepTimeMinutes: recipe.prepTimeMinutes, cookTimeMinutes: recipe.cookTimeMinutes, isActive: true,
        ingredients: recipe.ingredients.map(ing => ({ ingredient: createdIds.ingredients[ing.slug], quantity: ing.quantity, unit: ing.unit, processChain: ing.processChain, wasteAllowancePercent: ing.wasteAllowancePercent, isOptional: false })),
        steps: recipe.steps,
      };

      try {
        const recipeResult = await graphql(`mutation CreateRecipe($data: RecipeInput!) { createRecipe(data: $data) { documentId name } }`, { data: recipeData });
        createdIds.recipes[recipe.slug] = recipeResult.createRecipe.documentId;
        console.log(`  ✓ Рецепт: ${recipe.nameUk}`);

        const menuItemData = {
          name: recipe.name, nameUk: recipe.nameUk, slug: recipe.slug, description: recipe.description, descriptionUk: recipe.descriptionUk,
          price: recipe.price, available: true, recipe: recipeResult.createRecipe.documentId, category: createdIds.menuCategories[recipe.category],
          outputType: recipe.outputType, servingCourse: recipe.servingCourse, primaryStation: recipe.primaryStation, preparationTime: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
        };
        const menuResult = await graphql(`mutation CreateMenuItem($data: MenuItemInput!) { createMenuItem(data: $data) { documentId name } }`, { data: menuItemData });
        createdIds.menuItems[recipe.slug] = menuResult.createMenuItem.documentId;
        console.log(`  ✓ Меню: ${recipe.nameUk} - ${recipe.price} грн`);
      } catch (e) {
        console.log(`  ⚠ ${recipe.nameUk} - вже існує або помилка: ${e.message}`);
      }
    }

    // 7. Stock Batches
    console.log('\n📦 Seeding Stock Batches...');
    const now = new Date();
    const supplierNames = Object.keys(createdIds.suppliers);
    for (const batch of batches) {
      const ingredientId = createdIds.ingredients[batch.ingredient];
      if (!ingredientId) { console.log(`  ⚠ Ingredient not found: ${batch.ingredient}`); continue; }

      const receivedAt = new Date(now); receivedAt.setDate(receivedAt.getDate() - batch.daysAgo);
      const expiryDate = new Date(now); expiryDate.setDate(expiryDate.getDate() + batch.daysUntilExpiry);
      const supplierName = supplierNames[Math.floor(Math.random() * supplierNames.length)];

      const data = {
        ingredient: ingredientId, supplier: createdIds.suppliers[supplierName],
        batchNumber: `BTH-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        receivedAt: receivedAt.toISOString(), expiryDate: expiryDate.toISOString().split('T')[0],
        grossIn: batch.grossIn, netAvailable: batch.grossIn, usedAmount: 0, wastedAmount: 0,
        unitCost: batch.unitCost, totalCost: batch.grossIn * batch.unitCost, status: 'available', isLocked: false, processes: [],
      };

      try {
        await graphql(`mutation CreateStockBatch($data: StockBatchInput!) { createStockBatch(data: $data) { documentId batchNumber } }`, { data });
        console.log(`  ✓ ${batch.ingredient}: ${batch.grossIn} од.`);
      } catch (e) {
        console.log(`  ⚠ ${batch.ingredient} - помилка: ${e.message}`);
      }
    }

    console.log('\n✅ Seed completed!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
