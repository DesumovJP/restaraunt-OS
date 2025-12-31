/**
 * Restaurant OS Seed Script v3
 * - Rich product catalog with proper categories
 * - Hierarchical subCategories matching frontend types
 * - Beverages including wines and spirits
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
    console.error('GraphQL Error:', result.errors[0].message);
    return null;
  }
  return result.data;
}

const ids = { yieldProfiles: {}, ingredients: {} };

// ========== FETCH EXISTING DATA ==========
async function fetchExisting() {
  console.log('📥 Fetching existing data...');
  const data = await graphql(`{
    yieldProfiles(pagination: { limit: 50 }) { documentId name }
    ingredients(pagination: { limit: 200 }) { documentId slug }
  }`);
  if (!data) return false;

  data.yieldProfiles.forEach(y => ids.yieldProfiles[y.name] = y.documentId);
  data.ingredients.forEach(i => ids.ingredients[i.slug] = i.documentId);
  console.log(`  YieldProfiles: ${data.yieldProfiles.length}, Ingredients: ${data.ingredients.length}`);
  return true;
}

// ========== INGREDIENTS WITH PROPER CATEGORIES ==========
const ingredients = [
  // ===== RAW - MEAT (М'ясо) =====
  { name: 'Chicken Fillet', nameUk: 'Куряче філе', slug: 'chicken-fillet', unit: 'kg', minStock: 5, maxStock: 30, mainCategory: 'raw', subCategory: 'poultry', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 120, yieldProfileName: 'Meat Standard' },
  { name: 'Chicken Wings', nameUk: 'Курячі крильця', slug: 'chicken-wings', unit: 'kg', minStock: 3, maxStock: 20, mainCategory: 'raw', subCategory: 'poultry', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 85, yieldProfileName: 'Meat Standard' },
  { name: 'Duck Breast', nameUk: 'Качина грудка', slug: 'duck-breast', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'poultry', storageCondition: 'refrigerated', shelfLifeDays: 4, costPerUnit: 380, yieldProfileName: 'Meat Standard' },

  { name: 'Pork Neck', nameUk: 'Свинячий ошийок', slug: 'pork-neck', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 180, yieldProfileName: 'Meat Standard' },
  { name: 'Pork Tenderloin', nameUk: 'Свиняча вирізка', slug: 'pork-tenderloin', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 220, yieldProfileName: 'Meat Standard' },
  { name: 'Pork Ribs', nameUk: 'Свинячі ребра', slug: 'pork-ribs', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 160, yieldProfileName: 'Meat Standard' },

  { name: 'Beef Tenderloin', nameUk: 'Яловича вирізка', slug: 'beef-tenderloin', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 650, yieldProfileName: 'Meat Standard' },
  { name: 'Beef Ribeye', nameUk: 'Рібай стейк', slug: 'beef-ribeye', unit: 'kg', minStock: 2, maxStock: 8, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 580, yieldProfileName: 'Meat Standard' },
  { name: 'Beef Brisket', nameUk: 'Яловича грудинка', slug: 'beef-brisket', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 280, yieldProfileName: 'Meat Standard' },

  { name: 'Lamb Rack', nameUk: 'Баранячі ребра', slug: 'lamb-rack', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'raw', subCategory: 'meat', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 720, yieldProfileName: 'Meat Standard' },

  // ===== RAW - SEAFOOD (Риба та морепродукти) =====
  { name: 'Salmon Fillet', nameUk: 'Лосось філе', slug: 'salmon-fillet', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'refrigerated', shelfLifeDays: 3, costPerUnit: 480, yieldProfileName: 'Fish Standard' },
  { name: 'Dorado', nameUk: 'Дорадо', slug: 'dorado', unit: 'kg', minStock: 2, maxStock: 8, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'refrigerated', shelfLifeDays: 3, costPerUnit: 320, yieldProfileName: 'Fish Standard' },
  { name: 'Sea Bass', nameUk: 'Сібас', slug: 'sea-bass', unit: 'kg', minStock: 2, maxStock: 8, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'refrigerated', shelfLifeDays: 3, costPerUnit: 350, yieldProfileName: 'Fish Standard' },
  { name: 'Shrimp Tiger', nameUk: 'Креветки тигрові', slug: 'shrimp-tiger', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'frozen', shelfLifeDays: 90, costPerUnit: 680, yieldProfileName: 'Fish Standard' },
  { name: 'Mussels', nameUk: 'Мідії', slug: 'mussels', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'refrigerated', shelfLifeDays: 2, costPerUnit: 220, yieldProfileName: 'Fish Standard' },
  { name: 'Squid', nameUk: 'Кальмари', slug: 'squid', unit: 'kg', minStock: 2, maxStock: 8, mainCategory: 'raw', subCategory: 'seafood', storageCondition: 'frozen', shelfLifeDays: 90, costPerUnit: 280, yieldProfileName: 'Fish Standard' },

  // ===== RAW - VEGETABLES (Овочі) =====
  { name: 'Potato', nameUk: 'Картопля', slug: 'potato', unit: 'kg', minStock: 20, maxStock: 100, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'dry_cool', shelfLifeDays: 30, costPerUnit: 18, yieldProfileName: 'Vegetables Standard' },
  { name: 'Carrot', nameUk: 'Морква', slug: 'carrot', unit: 'kg', minStock: 10, maxStock: 50, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 14, costPerUnit: 22, yieldProfileName: 'Vegetables Standard' },
  { name: 'Onion', nameUk: 'Цибуля ріпчаста', slug: 'onion', unit: 'kg', minStock: 10, maxStock: 50, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'dry_cool', shelfLifeDays: 30, costPerUnit: 15, yieldProfileName: 'Vegetables Standard' },
  { name: 'Garlic', nameUk: 'Часник', slug: 'garlic', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'dry_cool', shelfLifeDays: 30, costPerUnit: 85, yieldProfileName: 'Vegetables Standard' },
  { name: 'Tomato', nameUk: 'Помідори', slug: 'tomato', unit: 'kg', minStock: 5, maxStock: 30, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 65, yieldProfileName: 'Vegetables Standard' },
  { name: 'Cherry Tomato', nameUk: 'Помідори чері', slug: 'cherry-tomato', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 120, yieldProfileName: 'Vegetables Standard' },
  { name: 'Bell Pepper', nameUk: 'Перець болгарський', slug: 'bell-pepper', unit: 'kg', minStock: 3, maxStock: 20, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 10, costPerUnit: 85, yieldProfileName: 'Vegetables Standard' },
  { name: 'Zucchini', nameUk: 'Кабачок', slug: 'zucchini', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 10, costPerUnit: 35, yieldProfileName: 'Vegetables Standard' },
  { name: 'Eggplant', nameUk: 'Баклажан', slug: 'eggplant', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 55, yieldProfileName: 'Vegetables Standard' },
  { name: 'Cucumber', nameUk: 'Огірок', slug: 'cucumber', unit: 'kg', minStock: 3, maxStock: 20, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 45, yieldProfileName: 'Vegetables Standard' },
  { name: 'Iceberg Lettuce', nameUk: 'Салат Айсберг', slug: 'iceberg-lettuce', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 75, yieldProfileName: 'Greens' },
  { name: 'Arugula', nameUk: 'Руккола', slug: 'arugula', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 4, costPerUnit: 280, yieldProfileName: 'Greens' },
  { name: 'Spinach', nameUk: 'Шпинат', slug: 'spinach', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'raw', subCategory: 'vegetables', storageCondition: 'refrigerated', shelfLifeDays: 4, costPerUnit: 180, yieldProfileName: 'Greens' },

  // ===== RAW - MUSHROOMS (Гриби) =====
  { name: 'Champignon', nameUk: 'Печериці', slug: 'champignon', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'raw', subCategory: 'mushrooms', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 95, yieldProfileName: 'Vegetables Standard' },
  { name: 'Porcini', nameUk: 'Білі гриби', slug: 'porcini', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'raw', subCategory: 'mushrooms', storageCondition: 'frozen', shelfLifeDays: 180, costPerUnit: 450, yieldProfileName: 'Vegetables Standard' },

  // ===== RAW - EGGS (Яйця) =====
  { name: 'Eggs', nameUk: 'Яйця курячі', slug: 'eggs', unit: 'pcs', minStock: 60, maxStock: 300, mainCategory: 'raw', subCategory: 'eggs', storageCondition: 'refrigerated', shelfLifeDays: 21, costPerUnit: 4.5, yieldProfileName: 'No Loss' },
  { name: 'Quail Eggs', nameUk: 'Яйця перепелині', slug: 'quail-eggs', unit: 'pcs', minStock: 30, maxStock: 100, mainCategory: 'raw', subCategory: 'eggs', storageCondition: 'refrigerated', shelfLifeDays: 30, costPerUnit: 3, yieldProfileName: 'No Loss' },

  // ===== DAIRY - CHEESE (Сири) =====
  { name: 'Parmesan', nameUk: 'Пармезан', slug: 'parmesan', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'dairy', subCategory: 'cheese', storageCondition: 'refrigerated', shelfLifeDays: 60, costPerUnit: 850, yieldProfileName: 'No Loss' },
  { name: 'Mozzarella', nameUk: 'Моцарела', slug: 'mozzarella', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'dairy', subCategory: 'cheese', storageCondition: 'refrigerated', shelfLifeDays: 14, costPerUnit: 380, yieldProfileName: 'No Loss' },
  { name: 'Feta', nameUk: 'Фета', slug: 'feta', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'dairy', subCategory: 'cheese', storageCondition: 'refrigerated', shelfLifeDays: 30, costPerUnit: 320, yieldProfileName: 'No Loss' },
  { name: 'Gorgonzola', nameUk: 'Горгонзола', slug: 'gorgonzola', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'dairy', subCategory: 'cheese', storageCondition: 'refrigerated', shelfLifeDays: 30, costPerUnit: 680, yieldProfileName: 'No Loss' },
  { name: 'Brie', nameUk: 'Брі', slug: 'brie', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'dairy', subCategory: 'cheese', storageCondition: 'refrigerated', shelfLifeDays: 21, costPerUnit: 580, yieldProfileName: 'No Loss' },

  // ===== DAIRY - MILK & CREAM (Молоко та вершки) =====
  { name: 'Heavy Cream 33%', nameUk: 'Вершки 33%', slug: 'cream-33', unit: 'l', minStock: 5, maxStock: 20, mainCategory: 'dairy', subCategory: 'cream', storageCondition: 'refrigerated', shelfLifeDays: 10, costPerUnit: 120, yieldProfileName: 'No Loss' },
  { name: 'Sour Cream', nameUk: 'Сметана 20%', slug: 'sour-cream', unit: 'l', minStock: 3, maxStock: 15, mainCategory: 'dairy', subCategory: 'cream', storageCondition: 'refrigerated', shelfLifeDays: 14, costPerUnit: 85, yieldProfileName: 'No Loss' },
  { name: 'Milk', nameUk: 'Молоко 3.2%', slug: 'milk', unit: 'l', minStock: 10, maxStock: 30, mainCategory: 'dairy', subCategory: 'milk', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 38, yieldProfileName: 'No Loss' },

  // ===== OILS & FATS - BUTTER (Масло) =====
  { name: 'Butter', nameUk: 'Масло вершкове 82%', slug: 'butter', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'oils_fats', subCategory: 'butter', storageCondition: 'refrigerated', shelfLifeDays: 30, costPerUnit: 280, yieldProfileName: 'No Loss' },

  // ===== DRY GOODS - GRAINS (Крупи) =====
  { name: 'Rice Arborio', nameUk: 'Рис Арборіо', slug: 'rice-arborio', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'dry_goods', subCategory: 'grains', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 120, yieldProfileName: 'No Loss' },
  { name: 'Rice Basmati', nameUk: 'Рис Басматі', slug: 'rice-basmati', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'dry_goods', subCategory: 'grains', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 95, yieldProfileName: 'No Loss' },
  { name: 'Bulgur', nameUk: 'Булгур', slug: 'bulgur', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'dry_goods', subCategory: 'grains', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 65, yieldProfileName: 'No Loss' },
  { name: 'Quinoa', nameUk: 'Кіноа', slug: 'quinoa', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'dry_goods', subCategory: 'grains', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 220, yieldProfileName: 'No Loss' },

  // ===== DRY GOODS - PASTA (Макарони) =====
  { name: 'Spaghetti', nameUk: 'Спагеті', slug: 'spaghetti', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'dry_goods', subCategory: 'pasta', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 55, yieldProfileName: 'No Loss' },
  { name: 'Penne', nameUk: 'Пенне', slug: 'penne', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'dry_goods', subCategory: 'pasta', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 55, yieldProfileName: 'No Loss' },
  { name: 'Tagliatelle', nameUk: 'Тальятелле', slug: 'tagliatelle', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'dry_goods', subCategory: 'pasta', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 85, yieldProfileName: 'No Loss' },
  { name: 'Lasagna Sheets', nameUk: 'Листи лазаньї', slug: 'lasagna-sheets', unit: 'kg', minStock: 2, maxStock: 10, mainCategory: 'dry_goods', subCategory: 'pasta', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 95, yieldProfileName: 'No Loss' },

  // ===== DRY GOODS - FLOUR (Борошно) =====
  { name: 'Wheat Flour', nameUk: 'Борошно пшеничне в/с', slug: 'wheat-flour', unit: 'kg', minStock: 10, maxStock: 50, mainCategory: 'dry_goods', subCategory: 'flour', storageCondition: 'dry_cool', shelfLifeDays: 180, costPerUnit: 28, yieldProfileName: 'No Loss' },
  { name: 'Semolina', nameUk: 'Манка', slug: 'semolina', unit: 'kg', minStock: 3, maxStock: 15, mainCategory: 'dry_goods', subCategory: 'flour', storageCondition: 'dry_cool', shelfLifeDays: 180, costPerUnit: 35, yieldProfileName: 'No Loss' },

  // ===== SEASONINGS - SALT & PEPPER (Сіль та перець) =====
  { name: 'Sea Salt', nameUk: 'Сіль морська', slug: 'sea-salt', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'seasonings', subCategory: 'salt-pepper', storageCondition: 'dry_cool', shelfLifeDays: 1095, costPerUnit: 45, yieldProfileName: 'No Loss' },
  { name: 'Black Pepper', nameUk: 'Перець чорний мелений', slug: 'black-pepper', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'seasonings', subCategory: 'spices', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 320, yieldProfileName: 'No Loss' },
  { name: 'Paprika', nameUk: 'Паприка', slug: 'paprika', unit: 'kg', minStock: 0.5, maxStock: 3, mainCategory: 'seasonings', subCategory: 'spices', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 280, yieldProfileName: 'No Loss' },

  // ===== SEASONINGS - FRESH HERBS (Свіжі трави) =====
  { name: 'Parsley', nameUk: 'Петрушка', slug: 'parsley', unit: 'kg', minStock: 0.5, maxStock: 3, mainCategory: 'seasonings', subCategory: 'herbs-fresh', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 120, yieldProfileName: 'Greens' },
  { name: 'Dill', nameUk: 'Кріп', slug: 'dill', unit: 'kg', minStock: 0.5, maxStock: 3, mainCategory: 'seasonings', subCategory: 'herbs-fresh', storageCondition: 'refrigerated', shelfLifeDays: 5, costPerUnit: 120, yieldProfileName: 'Greens' },
  { name: 'Basil Fresh', nameUk: 'Базилік свіжий', slug: 'basil-fresh', unit: 'kg', minStock: 0.3, maxStock: 2, mainCategory: 'seasonings', subCategory: 'herbs-fresh', storageCondition: 'refrigerated', shelfLifeDays: 4, costPerUnit: 350, yieldProfileName: 'Greens' },
  { name: 'Rosemary Fresh', nameUk: 'Розмарин свіжий', slug: 'rosemary-fresh', unit: 'kg', minStock: 0.2, maxStock: 1, mainCategory: 'seasonings', subCategory: 'herbs-fresh', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 420, yieldProfileName: 'Greens' },
  { name: 'Thyme Fresh', nameUk: 'Тим\'ян свіжий', slug: 'thyme-fresh', unit: 'kg', minStock: 0.2, maxStock: 1, mainCategory: 'seasonings', subCategory: 'herbs-fresh', storageCondition: 'refrigerated', shelfLifeDays: 7, costPerUnit: 400, yieldProfileName: 'Greens' },

  // ===== OILS & FATS (Олії та жири) =====
  { name: 'Olive Oil Extra Virgin', nameUk: 'Олія оливкова Extra Virgin', slug: 'olive-oil-ev', unit: 'l', minStock: 5, maxStock: 20, mainCategory: 'oils_fats', subCategory: 'vegetable-oil', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 320, yieldProfileName: 'No Loss' },
  { name: 'Sunflower Oil', nameUk: 'Олія соняшникова', slug: 'sunflower-oil', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'oils_fats', subCategory: 'vegetable-oil', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 65, yieldProfileName: 'No Loss' },
  { name: 'Truffle Oil', nameUk: 'Олія трюфельна', slug: 'truffle-oil', unit: 'l', minStock: 0.5, maxStock: 2, mainCategory: 'oils_fats', subCategory: 'specialty-oil', storageCondition: 'refrigerated', shelfLifeDays: 180, costPerUnit: 1200, yieldProfileName: 'No Loss' },
  { name: 'Sesame Oil', nameUk: 'Олія кунжутна', slug: 'sesame-oil', unit: 'l', minStock: 1, maxStock: 5, mainCategory: 'oils_fats', subCategory: 'specialty-oil', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 280, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - WINE (Вино) =====
  { name: 'Red Wine Cabernet 2019', nameUk: 'Каберне Совіньйон 2019', slug: 'wine-cabernet-2019', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'dry_cool', shelfLifeDays: 1825, costPerUnit: 380, yieldProfileName: 'No Loss' },
  { name: 'Red Wine Merlot 2020', nameUk: 'Мерло 2020', slug: 'wine-merlot-2020', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'dry_cool', shelfLifeDays: 1825, costPerUnit: 320, yieldProfileName: 'No Loss' },
  { name: 'White Wine Chardonnay 2021', nameUk: 'Шардоне 2021', slug: 'wine-chardonnay-2021', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'refrigerated', shelfLifeDays: 730, costPerUnit: 350, yieldProfileName: 'No Loss' },
  { name: 'White Wine Sauvignon Blanc', nameUk: 'Совіньйон Блан', slug: 'wine-sauvignon-blanc', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'refrigerated', shelfLifeDays: 730, costPerUnit: 280, yieldProfileName: 'No Loss' },
  { name: 'Rose Wine Provence', nameUk: 'Розе Прованс', slug: 'wine-rose-provence', unit: 'l', minStock: 5, maxStock: 25, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'refrigerated', shelfLifeDays: 365, costPerUnit: 420, yieldProfileName: 'No Loss' },
  { name: 'Prosecco DOC', nameUk: 'Просекко DOC', slug: 'prosecco-doc', unit: 'l', minStock: 10, maxStock: 40, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'refrigerated', shelfLifeDays: 365, costPerUnit: 380, yieldProfileName: 'No Loss' },
  { name: 'Champagne Brut', nameUk: 'Шампанське Брют', slug: 'champagne-brut', unit: 'l', minStock: 5, maxStock: 20, mainCategory: 'beverages', subCategory: 'wine', storageCondition: 'refrigerated', shelfLifeDays: 1095, costPerUnit: 1200, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - SPIRITS (Міцний алкоголь) =====
  { name: 'Vodka Premium', nameUk: 'Горілка преміум', slug: 'vodka-premium', unit: 'l', minStock: 5, maxStock: 20, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 450, yieldProfileName: 'No Loss' },
  { name: 'Whiskey Jack Daniels', nameUk: 'Віскі Jack Daniels', slug: 'whiskey-jd', unit: 'l', minStock: 3, maxStock: 15, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 980, yieldProfileName: 'No Loss' },
  { name: 'Whiskey Jameson', nameUk: 'Віскі Jameson', slug: 'whiskey-jameson', unit: 'l', minStock: 3, maxStock: 15, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 850, yieldProfileName: 'No Loss' },
  { name: 'Cognac Hennessy VS', nameUk: 'Коньяк Hennessy VS', slug: 'cognac-hennessy-vs', unit: 'l', minStock: 2, maxStock: 10, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 1800, yieldProfileName: 'No Loss' },
  { name: 'Rum Bacardi White', nameUk: 'Ром Бакарді білий', slug: 'rum-bacardi-white', unit: 'l', minStock: 3, maxStock: 15, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 650, yieldProfileName: 'No Loss' },
  { name: 'Gin Bombay Sapphire', nameUk: 'Джин Bombay Sapphire', slug: 'gin-bombay', unit: 'l', minStock: 2, maxStock: 10, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 920, yieldProfileName: 'No Loss' },
  { name: 'Tequila Jose Cuervo', nameUk: 'Текіла Jose Cuervo', slug: 'tequila-cuervo', unit: 'l', minStock: 2, maxStock: 10, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 3650, costPerUnit: 780, yieldProfileName: 'No Loss' },
  { name: 'Aperol', nameUk: 'Апероль', slug: 'aperol', unit: 'l', minStock: 3, maxStock: 15, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 1095, costPerUnit: 580, yieldProfileName: 'No Loss' },
  { name: 'Campari', nameUk: 'Кампарі', slug: 'campari', unit: 'l', minStock: 2, maxStock: 10, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'ambient', shelfLifeDays: 1095, costPerUnit: 620, yieldProfileName: 'No Loss' },
  { name: 'Baileys', nameUk: 'Бейліз', slug: 'baileys', unit: 'l', minStock: 2, maxStock: 10, mainCategory: 'beverages', subCategory: 'spirits', storageCondition: 'refrigerated', shelfLifeDays: 730, costPerUnit: 720, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - BEER (Пиво) =====
  { name: 'Beer Lager Draft', nameUk: 'Пиво світле (розлив)', slug: 'beer-lager-draft', unit: 'l', minStock: 30, maxStock: 100, mainCategory: 'beverages', subCategory: 'beer', storageCondition: 'refrigerated', shelfLifeDays: 30, costPerUnit: 65, yieldProfileName: 'No Loss' },
  { name: 'Beer IPA Craft', nameUk: 'Пиво IPA крафт', slug: 'beer-ipa-craft', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'beer', storageCondition: 'refrigerated', shelfLifeDays: 60, costPerUnit: 120, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - SOFT DRINKS (Безалкогольні) =====
  { name: 'Coca Cola', nameUk: 'Кока-Кола', slug: 'coca-cola', unit: 'l', minStock: 20, maxStock: 100, mainCategory: 'beverages', subCategory: 'soft-drinks', storageCondition: 'ambient', shelfLifeDays: 180, costPerUnit: 45, yieldProfileName: 'No Loss' },
  { name: 'Sprite', nameUk: 'Спрайт', slug: 'sprite', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'soft-drinks', storageCondition: 'ambient', shelfLifeDays: 180, costPerUnit: 45, yieldProfileName: 'No Loss' },
  { name: 'Tonic Water', nameUk: 'Тонік', slug: 'tonic-water', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'soft-drinks', storageCondition: 'ambient', shelfLifeDays: 180, costPerUnit: 55, yieldProfileName: 'No Loss' },
  { name: 'Still Water', nameUk: 'Вода негазована', slug: 'still-water', unit: 'l', minStock: 50, maxStock: 200, mainCategory: 'beverages', subCategory: 'water', storageCondition: 'ambient', shelfLifeDays: 365, costPerUnit: 18, yieldProfileName: 'No Loss' },
  { name: 'Sparkling Water', nameUk: 'Вода газована', slug: 'sparkling-water', unit: 'l', minStock: 50, maxStock: 200, mainCategory: 'beverages', subCategory: 'water', storageCondition: 'ambient', shelfLifeDays: 365, costPerUnit: 22, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - JUICE (Соки) =====
  { name: 'Orange Juice Fresh', nameUk: 'Сік апельсиновий свіжий', slug: 'orange-juice-fresh', unit: 'l', minStock: 5, maxStock: 20, mainCategory: 'beverages', subCategory: 'juice', storageCondition: 'refrigerated', shelfLifeDays: 3, costPerUnit: 85, yieldProfileName: 'No Loss' },
  { name: 'Apple Juice', nameUk: 'Сік яблучний', slug: 'apple-juice', unit: 'l', minStock: 10, maxStock: 50, mainCategory: 'beverages', subCategory: 'juice', storageCondition: 'refrigerated', shelfLifeDays: 14, costPerUnit: 55, yieldProfileName: 'No Loss' },

  // ===== BEVERAGES - COFFEE & TEA (Кава та чай) =====
  { name: 'Coffee Beans Arabica', nameUk: 'Кава зерно Арабіка', slug: 'coffee-arabica', unit: 'kg', minStock: 5, maxStock: 25, mainCategory: 'beverages', subCategory: 'coffee-tea', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 580, yieldProfileName: 'No Loss' },
  { name: 'Tea Earl Grey', nameUk: 'Чай Ерл Грей', slug: 'tea-earl-grey', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'beverages', subCategory: 'coffee-tea', storageCondition: 'dry_cool', shelfLifeDays: 730, costPerUnit: 420, yieldProfileName: 'No Loss' },
  { name: 'Green Tea Sencha', nameUk: 'Чай зелений Сенча', slug: 'tea-sencha', unit: 'kg', minStock: 1, maxStock: 5, mainCategory: 'beverages', subCategory: 'coffee-tea', storageCondition: 'dry_cool', shelfLifeDays: 365, costPerUnit: 650, yieldProfileName: 'No Loss' },
];

// ========== SEED FUNCTIONS ==========
async function seedIngredients() {
  console.log('\n🥕 Seeding Ingredients...');
  let created = 0, skipped = 0, failed = 0;

  for (const ing of ingredients) {
    if (ids.ingredients[ing.slug]) {
      console.log(`  ⏭ ${ing.nameUk} exists`);
      skipped++;
      continue;
    }

    const yieldProfileId = ids.yieldProfiles[ing.yieldProfileName] || null;

    const mutation = `
      mutation CreateIngredient($data: IngredientInput!) {
        createIngredient(data: $data) { documentId slug }
      }
    `;

    const data = await graphql(mutation, {
      data: {
        name: ing.name,
        nameUk: ing.nameUk,
        slug: ing.slug,
        unit: ing.unit,
        minStock: ing.minStock,
        maxStock: ing.maxStock,
        mainCategory: ing.mainCategory,
        subCategory: ing.subCategory,
        storageCondition: ing.storageCondition,
        shelfLifeDays: ing.shelfLifeDays,
        costPerUnit: ing.costPerUnit,
        currentStock: 0,
        isActive: true,
        yieldProfile: yieldProfileId,
      },
    });

    if (data?.createIngredient) {
      ids.ingredients[ing.slug] = data.createIngredient.documentId;
      console.log(`  ✓ ${ing.nameUk}`);
      created++;
    } else {
      console.log(`  ✗ ${ing.nameUk}`);
      failed++;
    }
  }

  console.log(`  Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
}

async function seedStockBatches() {
  console.log('\n📦 Seeding Stock Batches...');
  let created = 0;

  const batchData = [
    // Meat batches
    { slug: 'chicken-fillet', qty: 15, cost: 120, days: 5 },
    { slug: 'pork-neck', qty: 8, cost: 180, days: 5 },
    { slug: 'beef-tenderloin', qty: 5, cost: 650, days: 7 },
    { slug: 'lamb-rack', qty: 3, cost: 720, days: 5 },
    // Seafood
    { slug: 'salmon-fillet', qty: 6, cost: 480, days: 3 },
    { slug: 'shrimp-tiger', qty: 5, cost: 680, days: 90 },
    { slug: 'mussels', qty: 4, cost: 220, days: 2 },
    // Vegetables
    { slug: 'potato', qty: 50, cost: 18, days: 30 },
    { slug: 'carrot', qty: 25, cost: 22, days: 14 },
    { slug: 'onion', qty: 30, cost: 15, days: 30 },
    { slug: 'tomato', qty: 15, cost: 65, days: 7 },
    { slug: 'iceberg-lettuce', qty: 10, cost: 75, days: 5 },
    // Dairy
    { slug: 'parmesan', qty: 5, cost: 850, days: 60 },
    { slug: 'mozzarella', qty: 8, cost: 380, days: 14 },
    { slug: 'cream-33', qty: 10, cost: 120, days: 10 },
    { slug: 'butter', qty: 8, cost: 280, days: 30 },
    // Dry goods
    { slug: 'spaghetti', qty: 15, cost: 55, days: 730 },
    { slug: 'rice-arborio', qty: 10, cost: 120, days: 365 },
    { slug: 'wheat-flour', qty: 25, cost: 28, days: 180 },
    // Oils
    { slug: 'olive-oil-ev', qty: 10, cost: 320, days: 365 },
    { slug: 'sunflower-oil', qty: 25, cost: 65, days: 365 },
    // Beverages
    { slug: 'wine-cabernet-2019', qty: 24, cost: 380, days: 1825 },
    { slug: 'wine-merlot-2020', qty: 24, cost: 320, days: 1825 },
    { slug: 'wine-chardonnay-2021', qty: 18, cost: 350, days: 730 },
    { slug: 'prosecco-doc', qty: 18, cost: 380, days: 365 },
    { slug: 'vodka-premium', qty: 12, cost: 450, days: 3650 },
    { slug: 'whiskey-jd', qty: 6, cost: 980, days: 3650 },
    { slug: 'cognac-hennessy-vs', qty: 4, cost: 1800, days: 3650 },
    { slug: 'aperol', qty: 8, cost: 580, days: 1095 },
    { slug: 'beer-lager-draft', qty: 50, cost: 65, days: 30 },
    { slug: 'coca-cola', qty: 48, cost: 45, days: 180 },
    { slug: 'still-water', qty: 100, cost: 18, days: 365 },
    { slug: 'coffee-arabica', qty: 10, cost: 580, days: 365 },
    // Eggs & herbs
    { slug: 'eggs', qty: 120, cost: 4.5, days: 21 },
    { slug: 'basil-fresh', qty: 0.5, cost: 350, days: 4 },
    { slug: 'parsley', qty: 1, cost: 120, days: 5 },
  ];

  const mutation = `
    mutation CreateStockBatch($data: StockBatchInput!) {
      createStockBatch(data: $data) { documentId }
    }
  `;

  for (const batch of batchData) {
    const ingredientId = ids.ingredients[batch.slug];
    if (!ingredientId) {
      console.log(`  ⏭ ${batch.slug} - ingredient not found`);
      continue;
    }

    const receivedAt = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + batch.days);

    const data = await graphql(mutation, {
      data: {
        ingredient: ingredientId,
        grossIn: batch.qty,
        netAvailable: batch.qty,
        unitCost: batch.cost,
        totalCost: batch.qty * batch.cost,
        receivedAt: receivedAt.toISOString(),
        expiryDate: expiryDate.toISOString().split('T')[0],
        status: 'available',
        batchNumber: `B${Date.now().toString(36).toUpperCase()}`,
      },
    });

    if (data?.createStockBatch) {
      console.log(`  ✓ ${batch.slug}: ${batch.qty} од.`);
      created++;
    }
  }

  console.log(`  Created: ${created}`);
}

async function updateIngredientStock() {
  console.log('\n📊 Updating ingredient stock from batches...');

  // Get all batches with ingredients
  const data = await graphql(`{
    stockBatches(pagination: { limit: 200 }) {
      netAvailable
      status
      ingredient { documentId }
    }
  }`);

  if (!data) return;

  // Calculate total stock per ingredient
  const stockByIngredient = {};
  for (const batch of data.stockBatches) {
    if (batch.status !== 'available' || !batch.ingredient) continue;
    const id = batch.ingredient.documentId;
    stockByIngredient[id] = (stockByIngredient[id] || 0) + batch.netAvailable;
  }

  // Update each ingredient
  const updateMutation = `
    mutation UpdateIngredient($documentId: ID!, $data: IngredientInput!) {
      updateIngredient(documentId: $documentId, data: $data) { documentId currentStock }
    }
  `;

  for (const [documentId, stock] of Object.entries(stockByIngredient)) {
    await graphql(updateMutation, {
      documentId,
      data: { currentStock: stock },
    });
  }

  console.log(`  Updated ${Object.keys(stockByIngredient).length} ingredients`);
}

// ========== MAIN ==========
async function main() {
  console.log('🚀 Restaurant OS Seed v3 - Rich Product Catalog\n');

  if (!(await fetchExisting())) {
    console.error('Failed to fetch existing data');
    return;
  }

  await seedIngredients();
  await seedStockBatches();
  await updateIngredientStock();

  console.log('\n✅ Seed completed!');
}

main().catch(console.error);
