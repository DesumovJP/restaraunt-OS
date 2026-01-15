/**
 * Seed script for recipes with ingredients and steps
 * IDs are loaded dynamically from the database
 */

// These will be populated dynamically from the database
let INGREDIENT_IDS: Record<string, string> = {};
let MENU_ITEM_IDS: Record<string, string> = {};

// Helper function to load ingredient IDs from database
async function loadIngredientIds(strapi: any): Promise<void> {
  const ingredients = await strapi.db.query('api::ingredient.ingredient').findMany({
    select: ['documentId', 'slug'],
  });

  INGREDIENT_IDS = {};
  for (const ing of ingredients) {
    if (ing.slug && ing.documentId) {
      INGREDIENT_IDS[ing.slug] = ing.documentId;
    }
  }
  console.log(`  📋 Loaded ${Object.keys(INGREDIENT_IDS).length} ingredient IDs`);
}

// Helper function to load menu item IDs from database
async function loadMenuItemIds(strapi: any): Promise<void> {
  const items = await strapi.db.query('api::menu-item.menu-item').findMany({
    select: ['documentId', 'slug'],
  });

  MENU_ITEM_IDS = {};
  for (const item of items) {
    if (item.slug && item.documentId) {
      MENU_ITEM_IDS[item.slug] = item.documentId;
    }
  }
  console.log(`  📋 Loaded ${Object.keys(MENU_ITEM_IDS).length} menu item IDs`);
}

interface RecipeIngredient {
  ingredient: string; // key from INGREDIENT_IDS
  quantity: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'portion';
  processChain?: string[];
  isOptional?: boolean;
  wasteAllowancePercent?: number;
}

interface RecipeStep {
  stepNumber: number;
  description: string;
  station?: 'grill' | 'fry' | 'salad' | 'hot' | 'dessert' | 'bar' | 'pass' | 'prep';
  estimatedTimeMinutes?: number;
  processType?: 'cleaning' | 'boiling' | 'frying' | 'rendering' | 'baking' | 'grilling' | 'portioning';
}

interface Recipe {
  name: string;
  nameUk: string;
  slug: string;
  menuItem: string; // key from MENU_ITEM_IDS
  portionYield: number;
  costPerPortion: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  outputType: 'kitchen' | 'bar' | 'pastry' | 'cold';
  instructions: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

const RECIPES: Recipe[] = [
  // === ЗАКУСКИ ===
  {
    name: 'Bruschetta',
    nameUk: 'Брускета з томатами',
    slug: 'bruschetta',
    menuItem: 'bruschetta',
    portionYield: 1,
    costPerPortion: 45,
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    outputType: 'cold',
    instructions: 'Класична італійська брускета з свіжими томатами та базиліком на підсмаженому хлібі.',
    ingredients: [
      { ingredient: 'tomatoes', quantity: 150, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'garlic', quantity: 5, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'basil', quantity: 10, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'olive-oil', quantity: 20, unit: 'ml' },
      { ingredient: 'salt', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати помідори дрібними кубиками', station: 'salad', estimatedTimeMinutes: 3, processType: 'cleaning' },
      { stepNumber: 2, description: 'Подрібнити часник та базилік', station: 'salad', estimatedTimeMinutes: 2, processType: 'cleaning' },
      { stepNumber: 3, description: 'Підсмажити хліб на грилі', station: 'grill', estimatedTimeMinutes: 2, processType: 'grilling' },
      { stepNumber: 4, description: 'Змішати томати з часником, базиліком та оливковою олією', station: 'salad', estimatedTimeMinutes: 2 },
      { stepNumber: 5, description: 'Викласти суміш на хліб та подати', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },
  {
    name: 'Carpaccio',
    nameUk: 'Карпачо з яловичини',
    slug: 'carpaccio',
    menuItem: 'carpaccio',
    portionYield: 1,
    costPerPortion: 120,
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    outputType: 'cold',
    instructions: 'Тонко нарізана сира яловича вирізка з рукколою, каперсами та пармезаном.',
    ingredients: [
      { ingredient: 'beef-tenderloin', quantity: 120, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'lettuce', quantity: 30, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'parmesan', quantity: 20, unit: 'g' },
      { ingredient: 'olive-oil', quantity: 15, unit: 'ml' },
      { ingredient: 'salt', quantity: 2, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Заморозити яловичину на 30 хвилин для легкого нарізання', station: 'prep', estimatedTimeMinutes: 5 },
      { stepNumber: 2, description: 'Нарізати м\'ясо дуже тонкими скибочками', station: 'salad', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 3, description: 'Викласти м\'ясо на тарілку, додати рукколу', station: 'salad', estimatedTimeMinutes: 2 },
      { stepNumber: 4, description: 'Настругати пармезан, полити оливковою олією', station: 'salad', estimatedTimeMinutes: 2, processType: 'portioning' },
      { stepNumber: 5, description: 'Приправити сіллю та перцем', station: 'pass', estimatedTimeMinutes: 1 },
    ],
  },
  {
    name: 'Cheese Plate',
    nameUk: 'Сирна тарілка',
    slug: 'cheese-plate',
    menuItem: 'cheese-plate',
    portionYield: 1,
    costPerPortion: 150,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    outputType: 'cold',
    instructions: 'Асорті з різних сирів з горіхами та медом.',
    ingredients: [
      { ingredient: 'parmesan', quantity: 50, unit: 'g' },
      { ingredient: 'mozzarella', quantity: 50, unit: 'g' },
      { ingredient: 'feta', quantity: 50, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати сири порційними шматочками', station: 'salad', estimatedTimeMinutes: 5, processType: 'portioning' },
      { stepNumber: 2, description: 'Викласти сири на тарілку з горіхами', station: 'salad', estimatedTimeMinutes: 3 },
      { stepNumber: 3, description: 'Додати мед та декор', station: 'pass', estimatedTimeMinutes: 2 },
    ],
  },

  // === СУПИ ===
  {
    name: 'Borscht',
    nameUk: 'Борщ український',
    slug: 'borscht',
    menuItem: 'borscht',
    portionYield: 1,
    costPerPortion: 40,
    prepTimeMinutes: 30,
    cookTimeMinutes: 60,
    outputType: 'kitchen',
    instructions: 'Традиційний український борщ з буряком, капустою та сметаною.',
    ingredients: [
      { ingredient: 'beetroot', quantity: 80, unit: 'g', processChain: ['cleaning', 'boiling'], wasteAllowancePercent: 15 },
      { ingredient: 'cabbage', quantity: 60, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'potatoes', quantity: 80, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 15 },
      { ingredient: 'carrots', quantity: 40, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'onions', quantity: 40, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'tomatoes', quantity: 50, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'sour-cream', quantity: 30, unit: 'g' },
      { ingredient: 'garlic', quantity: 5, unit: 'g' },
      { ingredient: 'sunflower-oil', quantity: 20, unit: 'ml' },
      { ingredient: 'salt', quantity: 5, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати м\'ясний бульйон', station: 'hot', estimatedTimeMinutes: 30, processType: 'boiling' },
      { stepNumber: 2, description: 'Нарізати овочі: буряк, картоплю, капусту, моркву', station: 'prep', estimatedTimeMinutes: 10, processType: 'cleaning' },
      { stepNumber: 3, description: 'Обсмажити цибулю та моркву', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 4, description: 'Додати буряк та томати, тушкувати', station: 'hot', estimatedTimeMinutes: 10 },
      { stepNumber: 5, description: 'Додати картоплю та капусту в бульйон', station: 'hot', estimatedTimeMinutes: 15, processType: 'boiling' },
      { stepNumber: 6, description: 'Заправити часником, подати зі сметаною', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Mushroom Cream Soup',
    nameUk: 'Крем-суп грибний',
    slug: 'mushroom-cream-soup',
    menuItem: 'mushroom-cream-soup',
    portionYield: 1,
    costPerPortion: 50,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    outputType: 'kitchen',
    instructions: 'Ніжний крем-суп з печериць з вершками.',
    ingredients: [
      { ingredient: 'onions', quantity: 40, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'potatoes', quantity: 60, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 15 },
      { ingredient: 'cream', quantity: 100, unit: 'ml' },
      { ingredient: 'butter', quantity: 20, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Обсмажити гриби з цибулею на маслі', station: 'hot', estimatedTimeMinutes: 8, processType: 'frying' },
      { stepNumber: 2, description: 'Додати картоплю та воду, варити', station: 'hot', estimatedTimeMinutes: 15, processType: 'boiling' },
      { stepNumber: 3, description: 'Пюрувати блендером', station: 'hot', estimatedTimeMinutes: 3 },
      { stepNumber: 4, description: 'Додати вершки, прогріти', station: 'hot', estimatedTimeMinutes: 3 },
      { stepNumber: 5, description: 'Подати з грінками', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Tom Yum',
    nameUk: 'Том Ям з креветками',
    slug: 'tom-yum',
    menuItem: 'tom-yum',
    portionYield: 1,
    costPerPortion: 85,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Гострий тайський суп з креветками та кокосовим молоком.',
    ingredients: [
      { ingredient: 'shrimp', quantity: 100, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 20 },
      { ingredient: 'cream', quantity: 100, unit: 'ml' },
      { ingredient: 'garlic', quantity: 10, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати бульйон з пастою Том Ям', station: 'hot', estimatedTimeMinutes: 5, processType: 'boiling' },
      { stepNumber: 2, description: 'Додати креветки та гриби', station: 'hot', estimatedTimeMinutes: 5 },
      { stepNumber: 3, description: 'Влити кокосове молоко', station: 'hot', estimatedTimeMinutes: 3 },
      { stepNumber: 4, description: 'Подати з лаймом та коріандром', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },

  // === САЛАТИ ===
  {
    name: 'Caesar Salad',
    nameUk: 'Салат Цезар',
    slug: 'caesar-salad',
    menuItem: 'caesar-salad',
    portionYield: 1,
    costPerPortion: 65,
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    outputType: 'cold',
    instructions: 'Класичний салат Цезар з курячим філе, пармезаном та соусом.',
    ingredients: [
      { ingredient: 'chicken-breast', quantity: 100, unit: 'g', processChain: ['cleaning', 'grilling'], wasteAllowancePercent: 5 },
      { ingredient: 'lettuce', quantity: 100, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'parmesan', quantity: 30, unit: 'g' },
      { ingredient: 'eggs', quantity: 1, unit: 'pcs' },
      { ingredient: 'olive-oil', quantity: 30, unit: 'ml' },
      { ingredient: 'garlic', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Обсмажити куряче філе на грилі', station: 'grill', estimatedTimeMinutes: 8, processType: 'grilling' },
      { stepNumber: 2, description: 'Приготувати грінки з часником', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 3, description: 'Приготувати соус Цезар', station: 'salad', estimatedTimeMinutes: 3 },
      { stepNumber: 4, description: 'Зібрати салат: салат, курка, грінки, пармезан', station: 'salad', estimatedTimeMinutes: 3 },
      { stepNumber: 5, description: 'Полити соусом та подати', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },
  {
    name: 'Greek Salad',
    nameUk: 'Грецький салат',
    slug: 'greek-salad',
    menuItem: 'greek-salad',
    portionYield: 1,
    costPerPortion: 55,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    outputType: 'cold',
    instructions: 'Свіжий салат з огірків, томатів, фети та оливок.',
    ingredients: [
      { ingredient: 'tomatoes', quantity: 80, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'cucumber', quantity: 80, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'bell-pepper', quantity: 50, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'onions', quantity: 30, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'feta', quantity: 60, unit: 'g' },
      { ingredient: 'olive-oil', quantity: 30, unit: 'ml' },
      { ingredient: 'salt', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати овочі великими кубиками', station: 'salad', estimatedTimeMinutes: 5, processType: 'cleaning' },
      { stepNumber: 2, description: 'Додати оливки та фету', station: 'salad', estimatedTimeMinutes: 2 },
      { stepNumber: 3, description: 'Заправити оливковою олією та орегано', station: 'salad', estimatedTimeMinutes: 2 },
      { stepNumber: 4, description: 'Подати', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },
  {
    name: 'Warm Salad with Beef',
    nameUk: 'Теплий салат з телятиною',
    slug: 'warm-salad-with-beef',
    menuItem: 'warm-salad-with-beef',
    portionYield: 1,
    costPerPortion: 95,
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    outputType: 'kitchen',
    instructions: 'Теплий салат зі смаженою телятиною та свіжими овочами.',
    ingredients: [
      { ingredient: 'beef-tenderloin', quantity: 120, unit: 'g', processChain: ['cleaning', 'frying'], wasteAllowancePercent: 10 },
      { ingredient: 'lettuce', quantity: 60, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'tomatoes', quantity: 60, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'bell-pepper', quantity: 40, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'olive-oil', quantity: 25, unit: 'ml' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати телятину смужками', station: 'prep', estimatedTimeMinutes: 3, processType: 'cleaning' },
      { stepNumber: 2, description: 'Обсмажити м\'ясо на сильному вогні', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 3, description: 'Підготувати овочі та салат', station: 'salad', estimatedTimeMinutes: 4 },
      { stepNumber: 4, description: 'Зібрати салат, викласти гаряче м\'ясо зверху', station: 'salad', estimatedTimeMinutes: 2 },
      { stepNumber: 5, description: 'Заправити та подати', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },

  // === ОСНОВНІ СТРАВИ ===
  {
    name: 'Chicken Kyiv',
    nameUk: 'Котлета по-київськи',
    slug: 'chicken-kyiv',
    menuItem: 'chicken-kyiv',
    portionYield: 1,
    costPerPortion: 85,
    prepTimeMinutes: 30,
    cookTimeMinutes: 20,
    outputType: 'kitchen',
    instructions: 'Класична котлета по-київськи з вершковим маслом всередині.',
    ingredients: [
      { ingredient: 'chicken-breast', quantity: 200, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'butter', quantity: 50, unit: 'g' },
      { ingredient: 'eggs', quantity: 2, unit: 'pcs' },
      { ingredient: 'flour', quantity: 30, unit: 'g' },
      { ingredient: 'sunflower-oil', quantity: 100, unit: 'ml' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Відбити куряче філе', station: 'prep', estimatedTimeMinutes: 5, processType: 'cleaning' },
      { stepNumber: 2, description: 'Загорнути масло з зеленню в філе', station: 'prep', estimatedTimeMinutes: 10 },
      { stepNumber: 3, description: 'Паніровка: борошно, яйце, сухарі', station: 'prep', estimatedTimeMinutes: 5 },
      { stepNumber: 4, description: 'Обсмажити у фритюрі до золотистої скоринки', station: 'fry', estimatedTimeMinutes: 8, processType: 'frying' },
      { stepNumber: 5, description: 'Довести до готовності в духовці', station: 'hot', estimatedTimeMinutes: 7, processType: 'baking' },
      { stepNumber: 6, description: 'Подати з гарніром', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Pork Medallions',
    nameUk: 'Медальйони зі свинини',
    slug: 'pork-medallions',
    menuItem: 'pork-medallions',
    portionYield: 1,
    costPerPortion: 95,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Ніжні медальйони зі свинячої вирізки з соусом.',
    ingredients: [
      { ingredient: 'pork-loin', quantity: 200, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'butter', quantity: 30, unit: 'g' },
      { ingredient: 'cream', quantity: 50, unit: 'ml' },
      { ingredient: 'rosemary', quantity: 5, unit: 'g' },
      { ingredient: 'garlic', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати вирізку на медальйони', station: 'prep', estimatedTimeMinutes: 3, processType: 'portioning' },
      { stepNumber: 2, description: 'Обсмажити медальйони з обох сторін', station: 'grill', estimatedTimeMinutes: 8, processType: 'grilling' },
      { stepNumber: 3, description: 'Приготувати вершковий соус з травами', station: 'hot', estimatedTimeMinutes: 5 },
      { stepNumber: 4, description: 'Подати з соусом та гарніром', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Salmon Fillet',
    nameUk: 'Філе лосося',
    slug: 'salmon-fillet-recipe',
    menuItem: 'salmon-fillet',
    portionYield: 1,
    costPerPortion: 180,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Ніжне філе лосося, приготоване на грилі з лимоном та травами.',
    ingredients: [
      { ingredient: 'salmon-fillet', quantity: 200, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'olive-oil', quantity: 20, unit: 'ml' },
      { ingredient: 'rosemary', quantity: 5, unit: 'g' },
      { ingredient: 'garlic', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Замаринувати лосось з травами та олією', station: 'prep', estimatedTimeMinutes: 5 },
      { stepNumber: 2, description: 'Обсмажити на грилі шкіркою донизу', station: 'grill', estimatedTimeMinutes: 6, processType: 'grilling' },
      { stepNumber: 3, description: 'Перевернути та довести до готовності', station: 'grill', estimatedTimeMinutes: 4, processType: 'grilling' },
      { stepNumber: 4, description: 'Подати з овочами та лимоном', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Duck Breast',
    nameUk: 'Качина грудка',
    slug: 'duck-breast-recipe',
    menuItem: 'duck-breast',
    portionYield: 1,
    costPerPortion: 200,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    outputType: 'kitchen',
    instructions: 'Качина грудка з хрусткою шкірочкою та ягідним соусом.',
    ingredients: [
      { ingredient: 'duck-breast', quantity: 250, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 15 },
      { ingredient: 'butter', quantity: 20, unit: 'g' },
      { ingredient: 'rosemary', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 4, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Зробити надрізи на шкірці качки', station: 'prep', estimatedTimeMinutes: 3, processType: 'cleaning' },
      { stepNumber: 2, description: 'Обсмажити шкіркою донизу на середньому вогні', station: 'hot', estimatedTimeMinutes: 10, processType: 'rendering' },
      { stepNumber: 3, description: 'Перевернути та довести до готовності', station: 'hot', estimatedTimeMinutes: 8 },
      { stepNumber: 4, description: 'Дати відпочити м\'ясу 5 хвилин', station: 'pass', estimatedTimeMinutes: 5 },
      { stepNumber: 5, description: 'Нарізати та подати з соусом', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },

  // === ГРИЛЬ ===
  {
    name: 'Ribeye Steak',
    nameUk: 'Стейк Рібай',
    slug: 'ribeye-steak-recipe',
    menuItem: 'ribeye-steak',
    portionYield: 1,
    costPerPortion: 280,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Преміум стейк Рібай на грилі з травами та вершковим маслом.',
    ingredients: [
      { ingredient: 'ribeye-steak', quantity: 350, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'butter', quantity: 30, unit: 'g' },
      { ingredient: 'rosemary', quantity: 5, unit: 'g' },
      { ingredient: 'garlic', quantity: 10, unit: 'g' },
      { ingredient: 'salt', quantity: 5, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Дістати м\'ясо з холодильника за 30 хв до готування', station: 'prep', estimatedTimeMinutes: 5 },
      { stepNumber: 2, description: 'Посолити та поперчити стейк', station: 'prep', estimatedTimeMinutes: 2 },
      { stepNumber: 3, description: 'Обсмажити на розпеченому грилі з кожного боку', station: 'grill', estimatedTimeMinutes: 8, processType: 'grilling' },
      { stepNumber: 4, description: 'Додати масло з часником та розмарином', station: 'grill', estimatedTimeMinutes: 2 },
      { stepNumber: 5, description: 'Дати відпочити 5 хвилин', station: 'pass', estimatedTimeMinutes: 5 },
      { stepNumber: 6, description: 'Подати з гарніром', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Pork Ribs',
    nameUk: 'Свинячі ребра BBQ',
    slug: 'pork-ribs-recipe',
    menuItem: 'pork-ribs',
    portionYield: 1,
    costPerPortion: 150,
    prepTimeMinutes: 20,
    cookTimeMinutes: 90,
    outputType: 'kitchen',
    instructions: 'Соковиті свинячі ребра в BBQ соусі, готовані на низькій температурі.',
    ingredients: [
      { ingredient: 'pork-ribs', quantity: 450, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 20 },
      { ingredient: 'tomatoes', quantity: 100, unit: 'g' },
      { ingredient: 'garlic', quantity: 10, unit: 'g' },
      { ingredient: 'sugar', quantity: 20, unit: 'g' },
      { ingredient: 'salt', quantity: 5, unit: 'g' },
      { ingredient: 'black-pepper', quantity: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати BBQ соус', station: 'hot', estimatedTimeMinutes: 10 },
      { stepNumber: 2, description: 'Замаринувати ребра в соусі', station: 'prep', estimatedTimeMinutes: 10 },
      { stepNumber: 3, description: 'Запікати при низькій температурі', station: 'hot', estimatedTimeMinutes: 70, processType: 'baking' },
      { stepNumber: 4, description: 'Обсмажити на грилі для скоринки', station: 'grill', estimatedTimeMinutes: 10, processType: 'grilling' },
      { stepNumber: 5, description: 'Полити соусом та подати', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Grilled Vegetables',
    nameUk: 'Овочі гриль',
    slug: 'grilled-vegetables',
    menuItem: 'grilled-vegetables',
    portionYield: 1,
    costPerPortion: 45,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Асорті овочів, приготованих на грилі з травами.',
    ingredients: [
      { ingredient: 'bell-pepper', quantity: 80, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 10 },
      { ingredient: 'tomatoes', quantity: 60, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'onions', quantity: 50, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'olive-oil', quantity: 30, unit: 'ml' },
      { ingredient: 'rosemary', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Нарізати овочі великими шматками', station: 'prep', estimatedTimeMinutes: 5, processType: 'cleaning' },
      { stepNumber: 2, description: 'Замаринувати в олії з травами', station: 'prep', estimatedTimeMinutes: 3 },
      { stepNumber: 3, description: 'Обсмажити на грилі до готовності', station: 'grill', estimatedTimeMinutes: 10, processType: 'grilling' },
      { stepNumber: 4, description: 'Подати з бальзамічним кремом', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },

  // === ПАСТА ===
  {
    name: 'Carbonara',
    nameUk: 'Карбонара',
    slug: 'carbonara',
    menuItem: 'carbonara',
    portionYield: 1,
    costPerPortion: 65,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    outputType: 'kitchen',
    instructions: 'Класична італійська паста Карбонара з беконом, яйцем та пармезаном.',
    ingredients: [
      { ingredient: 'pasta', quantity: 150, unit: 'g' },
      { ingredient: 'eggs', quantity: 2, unit: 'pcs' },
      { ingredient: 'parmesan', quantity: 40, unit: 'g' },
      { ingredient: 'cream', quantity: 30, unit: 'ml' },
      { ingredient: 'black-pepper', quantity: 2, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Зварити пасту аль денте', station: 'hot', estimatedTimeMinutes: 8, processType: 'boiling' },
      { stepNumber: 2, description: 'Обсмажити бекон до хрустка', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 3, description: 'Змішати яйця з пармезаном та перцем', station: 'prep', estimatedTimeMinutes: 2 },
      { stepNumber: 4, description: 'З\'єднати пасту з беконом та яєчною сумішшю', station: 'hot', estimatedTimeMinutes: 2 },
      { stepNumber: 5, description: 'Подати з пармезаном', station: 'pass', estimatedTimeMinutes: 1, processType: 'portioning' },
    ],
  },
  {
    name: 'Bolognese',
    nameUk: 'Болоньєзе',
    slug: 'bolognese',
    menuItem: 'bolognese',
    portionYield: 1,
    costPerPortion: 60,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    outputType: 'kitchen',
    instructions: 'Паста з класичним м\'ясним соусом Болоньєзе.',
    ingredients: [
      { ingredient: 'pasta', quantity: 150, unit: 'g' },
      { ingredient: 'beef-tenderloin', quantity: 100, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 5 },
      { ingredient: 'tomatoes', quantity: 100, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'onions', quantity: 40, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'carrots', quantity: 30, unit: 'g', processChain: ['cleaning'] },
      { ingredient: 'garlic', quantity: 5, unit: 'g' },
      { ingredient: 'olive-oil', quantity: 20, unit: 'ml' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Обсмажити овочі на олії', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 2, description: 'Додати фарш та обсмажити', station: 'hot', estimatedTimeMinutes: 8, processType: 'frying' },
      { stepNumber: 3, description: 'Додати томати та тушкувати', station: 'hot', estimatedTimeMinutes: 30 },
      { stepNumber: 4, description: 'Зварити пасту', station: 'hot', estimatedTimeMinutes: 8, processType: 'boiling' },
      { stepNumber: 5, description: 'Подати з пармезаном', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Seafood Pasta',
    nameUk: 'Паста з морепродуктами',
    slug: 'seafood-pasta',
    menuItem: 'seafood-pasta',
    portionYield: 1,
    costPerPortion: 130,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    outputType: 'kitchen',
    instructions: 'Паста з креветками, мідіями та кальмарами у вершковому соусі.',
    ingredients: [
      { ingredient: 'pasta', quantity: 150, unit: 'g' },
      { ingredient: 'shrimp', quantity: 80, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 20 },
      { ingredient: 'mussels', quantity: 80, unit: 'g', processChain: ['cleaning'], wasteAllowancePercent: 30 },
      { ingredient: 'cream', quantity: 100, unit: 'ml' },
      { ingredient: 'garlic', quantity: 10, unit: 'g' },
      { ingredient: 'olive-oil', quantity: 20, unit: 'ml' },
      { ingredient: 'basil', quantity: 5, unit: 'g' },
      { ingredient: 'salt', quantity: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Зварити пасту аль денте', station: 'hot', estimatedTimeMinutes: 8, processType: 'boiling' },
      { stepNumber: 2, description: 'Обсмажити часник на олії', station: 'hot', estimatedTimeMinutes: 2, processType: 'frying' },
      { stepNumber: 3, description: 'Додати морепродукти та обсмажити', station: 'hot', estimatedTimeMinutes: 5, processType: 'frying' },
      { stepNumber: 4, description: 'Влити вершки та довести до готовності', station: 'hot', estimatedTimeMinutes: 3 },
      { stepNumber: 5, description: 'З\'єднати з пастою та подати', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },

  // === ДЕСЕРТИ ===
  {
    name: 'Tiramisu',
    nameUk: 'Тірамісу',
    slug: 'tiramisu',
    menuItem: 'tiramisu',
    portionYield: 1,
    costPerPortion: 55,
    prepTimeMinutes: 30,
    cookTimeMinutes: 0,
    outputType: 'pastry',
    instructions: 'Класичний італійський десерт з маскарпоне та кавою.',
    ingredients: [
      { ingredient: 'eggs', quantity: 2, unit: 'pcs' },
      { ingredient: 'sugar', quantity: 40, unit: 'g' },
      { ingredient: 'coffee', quantity: 10, unit: 'g' },
      { ingredient: 'cream', quantity: 50, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати міцну каву та охолодити', station: 'bar', estimatedTimeMinutes: 5 },
      { stepNumber: 2, description: 'Збити яйця з цукром до пишної маси', station: 'dessert', estimatedTimeMinutes: 8 },
      { stepNumber: 3, description: 'Додати маскарпоне та перемішати', station: 'dessert', estimatedTimeMinutes: 5 },
      { stepNumber: 4, description: 'Зібрати десерт шарами: савоярді, крем', station: 'dessert', estimatedTimeMinutes: 10 },
      { stepNumber: 5, description: 'Охолодити та посипати какао', station: 'dessert', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },
  {
    name: 'Cheesecake',
    nameUk: 'Чізкейк',
    slug: 'cheesecake',
    menuItem: 'cheesecake',
    portionYield: 1,
    costPerPortion: 50,
    prepTimeMinutes: 20,
    cookTimeMinutes: 60,
    outputType: 'pastry',
    instructions: 'Ніжний чізкейк з ягідним соусом.',
    ingredients: [
      { ingredient: 'eggs', quantity: 3, unit: 'pcs' },
      { ingredient: 'sugar', quantity: 60, unit: 'g' },
      { ingredient: 'cream', quantity: 100, unit: 'ml' },
      { ingredient: 'butter', quantity: 50, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати основу з печива', station: 'dessert', estimatedTimeMinutes: 10 },
      { stepNumber: 2, description: 'Змішати сирну масу', station: 'dessert', estimatedTimeMinutes: 10 },
      { stepNumber: 3, description: 'Випікати при низькій температурі', station: 'dessert', estimatedTimeMinutes: 50, processType: 'baking' },
      { stepNumber: 4, description: 'Охолодити та подати з соусом', station: 'pass', estimatedTimeMinutes: 5, processType: 'portioning' },
    ],
  },
  {
    name: 'Chocolate Fondant',
    nameUk: 'Шоколадний фондан',
    slug: 'chocolate-fondant',
    menuItem: 'chocolate-fondant',
    portionYield: 1,
    costPerPortion: 60,
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    outputType: 'pastry',
    instructions: 'Шоколадний кекс з рідкою серединкою.',
    ingredients: [
      { ingredient: 'eggs', quantity: 2, unit: 'pcs' },
      { ingredient: 'sugar', quantity: 40, unit: 'g' },
      { ingredient: 'butter', quantity: 60, unit: 'g' },
      { ingredient: 'flour', quantity: 30, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, description: 'Розтопити шоколад з маслом', station: 'dessert', estimatedTimeMinutes: 5 },
      { stepNumber: 2, description: 'Збити яйця з цукром', station: 'dessert', estimatedTimeMinutes: 5 },
      { stepNumber: 3, description: 'Змішати з борошном та шоколадом', station: 'dessert', estimatedTimeMinutes: 3 },
      { stepNumber: 4, description: 'Випікати 10-12 хвилин', station: 'dessert', estimatedTimeMinutes: 12, processType: 'baking' },
      { stepNumber: 5, description: 'Подати негайно з морозивом', station: 'pass', estimatedTimeMinutes: 2, processType: 'portioning' },
    ],
  },

  // === НАПОЇ ===
  {
    name: 'Espresso',
    nameUk: 'Еспресо',
    slug: 'espresso',
    menuItem: 'espresso',
    portionYield: 1,
    costPerPortion: 15,
    prepTimeMinutes: 1,
    cookTimeMinutes: 1,
    outputType: 'bar',
    instructions: 'Класичний італійський еспресо.',
    ingredients: [
      { ingredient: 'coffee', quantity: 8, unit: 'g' },
      { ingredient: 'mineral-water', quantity: 30, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, description: 'Змолоти каву', station: 'bar', estimatedTimeMinutes: 1 },
      { stepNumber: 2, description: 'Приготувати еспресо в кавомашині', station: 'bar', estimatedTimeMinutes: 1 },
    ],
  },
  {
    name: 'Cappuccino',
    nameUk: 'Капучіно',
    slug: 'cappuccino',
    menuItem: 'cappuccino',
    portionYield: 1,
    costPerPortion: 25,
    prepTimeMinutes: 2,
    cookTimeMinutes: 2,
    outputType: 'bar',
    instructions: 'Еспресо з молочною пінкою.',
    ingredients: [
      { ingredient: 'coffee', quantity: 8, unit: 'g' },
      { ingredient: 'cream', quantity: 150, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати еспресо', station: 'bar', estimatedTimeMinutes: 1 },
      { stepNumber: 2, description: 'Спінити молоко', station: 'bar', estimatedTimeMinutes: 1 },
      { stepNumber: 3, description: 'З\'єднати та подати', station: 'bar', estimatedTimeMinutes: 1 },
    ],
  },
  {
    name: 'Fresh Orange Juice',
    nameUk: 'Фреш апельсиновий',
    slug: 'fresh-orange-juice',
    menuItem: 'fresh-orange-juice',
    portionYield: 1,
    costPerPortion: 35,
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    outputType: 'bar',
    instructions: 'Свіжовичавлений апельсиновий сік.',
    ingredients: [
      { ingredient: 'orange-juice', quantity: 300, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, description: 'Вичавити апельсини', station: 'bar', estimatedTimeMinutes: 3 },
      { stepNumber: 2, description: 'Подати з льодом', station: 'bar', estimatedTimeMinutes: 1 },
    ],
  },
  {
    name: 'Lemonade',
    nameUk: 'Лимонад домашній',
    slug: 'lemonade',
    menuItem: 'lemonade',
    portionYield: 1,
    costPerPortion: 30,
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    outputType: 'bar',
    instructions: 'Домашній лимонад з м\'ятою.',
    ingredients: [
      { ingredient: 'sugar', quantity: 30, unit: 'g' },
      { ingredient: 'mineral-water', quantity: 350, unit: 'ml' },
      { ingredient: 'basil', quantity: 5, unit: 'g', isOptional: true },
    ],
    steps: [
      { stepNumber: 1, description: 'Приготувати лимонний сироп', station: 'bar', estimatedTimeMinutes: 3 },
      { stepNumber: 2, description: 'Змішати з водою та м\'ятою', station: 'bar', estimatedTimeMinutes: 2 },
      { stepNumber: 3, description: 'Подати з льодом', station: 'bar', estimatedTimeMinutes: 1 },
    ],
  },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedRecipes(strapi: any) {
  console.log('📖 Seeding recipes...');

  // Load IDs dynamically from database
  await loadIngredientIds(strapi);
  await loadMenuItemIds(strapi);

  if (Object.keys(INGREDIENT_IDS).length === 0) {
    console.log('  ⚠️  No ingredients found in database. Run restaurant seed first.');
    return;
  }

  for (const recipe of RECIPES) {
    try {
      // Check if recipe exists
      const existing = await strapi.db.query('api::recipe.recipe').findOne({
        where: { slug: recipe.slug }
      });

      if (existing) {
        console.log(`  ⏭️  Recipe ${recipe.nameUk} exists`);
        continue;
      }

      // Map ingredients with their document IDs
      const mappedIngredients = recipe.ingredients.map(ing => ({
        ingredient: INGREDIENT_IDS[ing.ingredient] ? { connect: [INGREDIENT_IDS[ing.ingredient]] } : undefined,
        quantity: ing.quantity,
        unit: ing.unit,
        processChain: ing.processChain || ['cleaning'],
        isOptional: ing.isOptional || false,
        wasteAllowancePercent: ing.wasteAllowancePercent || 5,
      })).filter(ing => ing.ingredient);

      // Create recipe
      const created = await strapi.documents('api::recipe.recipe').create({
        data: {
          name: recipe.name,
          nameUk: recipe.nameUk,
          slug: recipe.slug,
          portionYield: recipe.portionYield,
          costPerPortion: recipe.costPerPortion,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          outputType: recipe.outputType,
          instructions: recipe.instructions,
          isActive: true,
          ingredients: mappedIngredients,
          steps: recipe.steps,
        },
        status: 'published',
      });

      // Link recipe to menu item
      const menuItemId = MENU_ITEM_IDS[recipe.menuItem];
      if (menuItemId && created.documentId) {
        try {
          await strapi.documents('api::menu-item.menu-item').update({
            documentId: menuItemId,
            data: {
              recipe: created.documentId,
            },
            status: 'published',
          });
          console.log(`  ✅ ${recipe.nameUk} (linked to menu item)`);
        } catch (linkError: any) {
          console.log(`  ✅ ${recipe.nameUk} (created, link failed: ${linkError.message})`);
        }
      } else {
        console.log(`  ✅ ${recipe.nameUk}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Failed: ${recipe.nameUk}`, error.message);
    }
  }

  console.log('\n✨ Recipes seed completed!');
}

export default seedRecipes;
