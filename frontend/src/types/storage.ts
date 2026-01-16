/**
 * Storage Domain Types
 *
 * Types for smart storage, product categories, batches, and yield calculations.
 */

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

/**
 * Головні категорії продуктів для Smart Storage
 * Ієрархія: MainCategory -> SubCategory -> Product
 */

export type StorageMainCategory =
  | "raw" // Сировина - необроблені продукти
  | "prep" // Заготовки/напівфабрикати
  | "dry-goods" // Бакалія - сухі продукти
  | "seasonings" // Приправи та спеції
  | "oils-fats" // Олії та жири
  | "dairy" // Молочні продукти
  | "beverages" // Напої
  | "frozen" // Заморожені продукти
  | "ready-made"; // Готові продукти

export type RawSubCategory =
  | "meat" // М'ясо (яловичина, свинина)
  | "poultry" // Птиця (курка, качка, індичка)
  | "seafood" // Риба та морепродукти
  | "vegetables" // Овочі
  | "fruits" // Фрукти
  | "eggs" // Яйця
  | "mushrooms"; // Гриби

export type PrepSubCategory =
  | "meat-prep" // М'ясні заготовки (нарізка, маринад)
  | "poultry-prep" // Заготовки птиці (філе, крильця)
  | "seafood-prep" // Рибні заготовки (філе, очищені)
  | "veg-prep" // Овочеві заготовки (очищені, нарізані)
  | "sauces" // Соуси (домашні заготовки)
  | "stocks" // Бульйони
  | "dough" // Тісто
  | "marinades"; // Маринади

export type DryGoodsSubCategory =
  | "grains" // Крупи та зернові (рис, гречка, булгур)
  | "flour" // Борошно (пшеничне, кукурудзяне)
  | "pasta" // Макаронні вироби
  | "legumes" // Бобові (квасоля, нут, сочевиця)
  | "canned" // Консерви
  | "sugar" // Цукор та підсолоджувачі
  | "nuts-seeds"; // Горіхи та насіння

export type SeasoningsSubCategory =
  | "spices" // Спеції (перець, кориця, куркума)
  | "herbs-dried" // Сушені трави (орегано, базилік)
  | "herbs-fresh" // Свіжі трави (петрушка, кінза)
  | "salt-pepper" // Сіль та перець
  | "blends"; // Суміші приправ

export type OilsFatsSubCategory =
  | "vegetable-oil" // Рослинні олії (соняшникова, оливкова)
  | "butter" // Вершкове масло
  | "animal-fat" // Тваринні жири (смалець, гусячий жир)
  | "specialty-oil"; // Спеціальні олії (кунжутна, трюфельна)

export type DairySubCategory =
  | "milk" // Молоко та вершки
  | "cheese" // Сири
  | "yogurt" // Йогурти та кисломолочні
  | "cream"; // Вершки та сметана

export type BeveragesSubCategory =
  | "wine" // Вино
  | "spirits" // Міцний алкоголь
  | "beer" // Пиво та сидр
  | "juice" // Соки
  | "soft-drinks" // Безалкогольні напої
  | "water" // Вода
  | "coffee-tea"; // Кава та чай

export type FrozenSubCategory =
  | "frozen-veg" // Заморожені овочі
  | "frozen-fruit" // Заморожені фрукти та ягоди
  | "frozen-meat" // Заморожене м'ясо
  | "frozen-seafood" // Заморожені морепродукти
  | "ice-cream"; // Морозиво

export type ReadyMadeSubCategory =
  | "bread" // Хліб та хлібобулочні
  | "pastry" // Випічка
  | "desserts" // Десерти
  | "prepared-meals"; // Готові страви

export type StorageSubCategory =
  | RawSubCategory
  | PrepSubCategory
  | DryGoodsSubCategory
  | SeasoningsSubCategory
  | OilsFatsSubCategory
  | DairySubCategory
  | BeveragesSubCategory
  | FrozenSubCategory
  | ReadyMadeSubCategory;

// ==========================================
// CATEGORY LABELS
// ==========================================

export const STORAGE_MAIN_CATEGORY_LABELS: Record<
  StorageMainCategory,
  { uk: string; en: string; icon: string }
> = {
  raw: { uk: "Сировина", en: "Raw Ingredients", icon: "beef" },
  prep: { uk: "Заготовки", en: "Prep/Semi-finished", icon: "chef-hat" },
  "dry-goods": { uk: "Бакалія", en: "Dry Goods", icon: "wheat" },
  seasonings: { uk: "Приправи", en: "Seasonings", icon: "flame" },
  "oils-fats": { uk: "Олії та жири", en: "Oils & Fats", icon: "droplet" },
  dairy: { uk: "Молочні", en: "Dairy", icon: "milk" },
  beverages: { uk: "Напої", en: "Beverages", icon: "wine" },
  frozen: { uk: "Заморожені", en: "Frozen", icon: "snowflake" },
  "ready-made": { uk: "Готові", en: "Ready-made", icon: "cake" },
};

export const STORAGE_SUB_CATEGORY_LABELS: Record<
  StorageSubCategory,
  { uk: string; en: string; parent: StorageMainCategory }
> = {
  // Raw
  meat: { uk: "М'ясо", en: "Meat", parent: "raw" },
  poultry: { uk: "Птиця", en: "Poultry", parent: "raw" },
  seafood: { uk: "Риба та морепродукти", en: "Seafood", parent: "raw" },
  vegetables: { uk: "Овочі", en: "Vegetables", parent: "raw" },
  fruits: { uk: "Фрукти", en: "Fruits", parent: "raw" },
  eggs: { uk: "Яйця", en: "Eggs", parent: "raw" },
  mushrooms: { uk: "Гриби", en: "Mushrooms", parent: "raw" },
  // Prep
  "meat-prep": { uk: "М'ясні заготовки", en: "Meat Prep", parent: "prep" },
  "poultry-prep": {
    uk: "Заготовки птиці",
    en: "Poultry Prep",
    parent: "prep",
  },
  "seafood-prep": { uk: "Рибні заготовки", en: "Seafood Prep", parent: "prep" },
  "veg-prep": { uk: "Овочеві заготовки", en: "Vegetable Prep", parent: "prep" },
  sauces: { uk: "Соуси", en: "Sauces", parent: "prep" },
  stocks: { uk: "Бульйони", en: "Stocks", parent: "prep" },
  dough: { uk: "Тісто", en: "Dough", parent: "prep" },
  marinades: { uk: "Маринади", en: "Marinades", parent: "prep" },
  // Dry Goods
  grains: { uk: "Крупи", en: "Grains", parent: "dry-goods" },
  flour: { uk: "Борошно", en: "Flour", parent: "dry-goods" },
  pasta: { uk: "Макарони", en: "Pasta", parent: "dry-goods" },
  legumes: { uk: "Бобові", en: "Legumes", parent: "dry-goods" },
  canned: { uk: "Консерви", en: "Canned", parent: "dry-goods" },
  sugar: { uk: "Цукор", en: "Sugar", parent: "dry-goods" },
  "nuts-seeds": { uk: "Горіхи та насіння", en: "Nuts & Seeds", parent: "dry-goods" },
  // Seasonings
  spices: { uk: "Спеції", en: "Spices", parent: "seasonings" },
  "herbs-dried": { uk: "Сушені трави", en: "Dried Herbs", parent: "seasonings" },
  "herbs-fresh": { uk: "Свіжі трави", en: "Fresh Herbs", parent: "seasonings" },
  "salt-pepper": { uk: "Сіль та перець", en: "Salt & Pepper", parent: "seasonings" },
  blends: { uk: "Суміші приправ", en: "Spice Blends", parent: "seasonings" },
  // Oils & Fats
  "vegetable-oil": { uk: "Рослинні олії", en: "Vegetable Oils", parent: "oils-fats" },
  butter: { uk: "Вершкове масло", en: "Butter", parent: "oils-fats" },
  "animal-fat": { uk: "Тваринні жири", en: "Animal Fats", parent: "oils-fats" },
  "specialty-oil": { uk: "Спеціальні олії", en: "Specialty Oils", parent: "oils-fats" },
  // Dairy
  milk: { uk: "Молоко", en: "Milk", parent: "dairy" },
  cheese: { uk: "Сири", en: "Cheese", parent: "dairy" },
  yogurt: { uk: "Йогурти", en: "Yogurt", parent: "dairy" },
  cream: { uk: "Вершки/сметана", en: "Cream", parent: "dairy" },
  // Beverages
  wine: { uk: "Вино", en: "Wine", parent: "beverages" },
  spirits: { uk: "Міцний алкоголь", en: "Spirits", parent: "beverages" },
  beer: { uk: "Пиво", en: "Beer", parent: "beverages" },
  juice: { uk: "Соки", en: "Juice", parent: "beverages" },
  "soft-drinks": { uk: "Безалкогольні", en: "Soft Drinks", parent: "beverages" },
  water: { uk: "Вода", en: "Water", parent: "beverages" },
  "coffee-tea": { uk: "Кава та чай", en: "Coffee & Tea", parent: "beverages" },
  // Frozen
  "frozen-veg": { uk: "Заморожені овочі", en: "Frozen Vegetables", parent: "frozen" },
  "frozen-fruit": { uk: "Заморожені фрукти", en: "Frozen Fruits", parent: "frozen" },
  "frozen-meat": { uk: "Заморожене м'ясо", en: "Frozen Meat", parent: "frozen" },
  "frozen-seafood": { uk: "Заморожені морепродукти", en: "Frozen Seafood", parent: "frozen" },
  "ice-cream": { uk: "Морозиво", en: "Ice Cream", parent: "frozen" },
  // Ready-made
  bread: { uk: "Хліб", en: "Bread", parent: "ready-made" },
  pastry: { uk: "Випічка", en: "Pastry", parent: "ready-made" },
  desserts: { uk: "Десерти", en: "Desserts", parent: "ready-made" },
  "prepared-meals": { uk: "Готові страви", en: "Prepared Meals", parent: "ready-made" },
};

// ==========================================
// STORAGE CONDITIONS
// ==========================================

export type StorageCondition = "ambient" | "refrigerated" | "frozen" | "dry-cool";

export const STORAGE_CONDITION_LABELS: Record<
  StorageCondition,
  { uk: string; en: string; tempRange: string }
> = {
  ambient: { uk: "Кімнатна", en: "Ambient", tempRange: "15-25°C" },
  refrigerated: { uk: "Холодильник", en: "Refrigerated", tempRange: "0-5°C" },
  frozen: { uk: "Морозильник", en: "Frozen", tempRange: "-18°C" },
  "dry-cool": { uk: "Сухе прохолодне", en: "Dry & Cool", tempRange: "10-15°C" },
};

// ==========================================
// CATEGORY TREE
// ==========================================

export interface StorageCategoryNode {
  id: StorageMainCategory;
  label: { uk: string; en: string };
  icon: string;
  children: {
    id: StorageSubCategory;
    label: { uk: string; en: string };
  }[];
  count?: number;
}

export function buildCategoryTree(): StorageCategoryNode[] {
  const mainCategories = Object.keys(
    STORAGE_MAIN_CATEGORY_LABELS
  ) as StorageMainCategory[];

  return mainCategories.map((mainCat) => {
    const mainLabel = STORAGE_MAIN_CATEGORY_LABELS[mainCat];
    const subCategories = Object.entries(STORAGE_SUB_CATEGORY_LABELS)
      .filter(([, value]) => value.parent === mainCat)
      .map(([key, value]) => ({
        id: key as StorageSubCategory,
        label: { uk: value.uk, en: value.en },
      }));

    return {
      id: mainCat,
      label: { uk: mainLabel.uk, en: mainLabel.en },
      icon: mainLabel.icon,
      children: subCategories,
    };
  });
}

// ==========================================
// UNITS AND PROCESSES
// ==========================================

export type ProductUnit = "kg" | "g" | "l" | "ml" | "pcs" | "portion";

export type ProcessType =
  | "cleaning"
  | "boiling"
  | "frying"
  | "rendering"
  | "baking"
  | "grilling"
  | "portioning";

export const PROCESS_LABELS: Record<ProcessType, { uk: string; en: string }> = {
  cleaning: { uk: "Очистка", en: "Cleaning" },
  boiling: { uk: "Варка", en: "Boiling" },
  frying: { uk: "Вижарка", en: "Frying" },
  rendering: { uk: "Виварка", en: "Rendering" },
  baking: { uk: "Випікання", en: "Baking" },
  grilling: { uk: "Гриль", en: "Grilling" },
  portioning: { uk: "Порціонування", en: "Portioning" },
};

// ==========================================
// YIELD PROFILES
// ==========================================

export interface ProcessYield {
  processType: ProcessType;
  yieldRatio: number;
  moistureLoss?: number;
  oilAbsorption?: number;
  temperatureRange?: [number, number];
  timeRange?: [number, number]; // minutes
  notes?: string;
}

export interface WasteComponent {
  name: string;
  percentage: number;
  disposalType: "trash" | "compost" | "recyclable" | "stock";
}

export interface YieldProfile {
  documentId: string;
  slug: string;
  name: string;
  productId: string;
  baseYieldRatio: number;
  processYields: ProcessYield[];
  wasteBreakdown: WasteComponent[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PRODUCTS
// ==========================================

export interface ExtendedProduct {
  documentId: string;
  slug: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  imageUrl?: string;
  expiryDate?: string;
  lastUpdated: string;

  // Category fields (нова система)
  mainCategory: StorageMainCategory;
  subCategory: StorageSubCategory;
  categoryPath: string[]; // ['raw', 'vegetables'] - для breadcrumb та фільтрації

  // Storage conditions
  storageCondition: StorageCondition;
  shelfLifeDays: number; // Термін придатності в днях

  // Extended fields
  barcode?: string;
  grossWeight?: number;
  netWeight?: number;
  yieldProfileId?: string;
  yieldProfile?: YieldProfile;
  defaultProcessType?: ProcessType;
  costPerUnit: number;
  suppliers: string[];

  // Додаткові метадані
  allergens?: string[];
  origin?: string; // Країна походження
  isOrganic?: boolean;
  isLocal?: boolean;
}

// ==========================================
// BATCHES
// ==========================================

export type BatchStatus =
  | "received"
  | "inspecting"
  | "processing"
  | "processed"
  | "available"
  | "reserved"
  | "in_use"
  | "depleted"
  | "expired"
  | "quarantine"
  | "written_off";

export interface BatchProcess {
  documentId: string;
  processType: ProcessType;
  processedAt: string;
  operatorId: string;
  operatorName: string;

  // Quantities
  grossInput: number;
  netOutput: number;
  wasteOutput: number;

  // Process-specific
  moistureLoss?: number;
  oilAbsorption?: number;
  processTemp?: number;
  processTime?: number;

  // Yield validation
  expectedYield: number;
  actualYield: number;
  variancePercent: number;

  notes?: string;
}

export interface StorageBatch {
  documentId: string;
  slug: string;
  productId: string;
  product?: ExtendedProduct;
  productName?: string; // For display purposes
  yieldProfileId: string;

  // Input
  grossIn: number;
  unitCost: number;
  totalCost: number;
  supplierId: string;
  invoiceNumber?: string;
  receivedAt: string;
  expiryDate?: string;
  batchNumber?: string;
  barcode?: string;

  // Processing
  processes: BatchProcess[];

  // Current state
  netAvailable: number;
  usedAmount: number;
  wastedAmount: number;
  status: BatchStatus;
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
}

// ==========================================
// STORAGE OPERATIONS
// ==========================================

export type StorageOperationType =
  | "receive"
  | "clean"
  | "process"
  | "use"
  | "write_off"
  | "transfer"
  | "adjust"
  | "return";

export type ExtendedWriteOffReason =
  | "expired"
  | "damaged"
  | "spoiled"
  | "theft"
  | "cooking_loss"
  | "quality_fail"
  | "customer_return"
  | "inventory_adjust"
  | "other";

export interface StorageHistory {
  documentId: string;
  productId: string;
  productName?: string;
  batchId?: string;

  operationType: StorageOperationType;
  quantity: number;
  unit: ProductUnit;

  // Context
  orderId?: string;
  recipeId?: string;
  writeOffReason?: ExtendedWriteOffReason;

  // Audit
  timestamp: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
}

// ==========================================
// YIELD CALCULATIONS
// ==========================================

export interface YieldVariance {
  expectedYield: number;
  actualYield: number;
  varianceKg: number;
  variancePercent: number;
  withinTolerance: boolean;
}

export interface CostImpact {
  originalCostPerPortion: number;
  adjustedCostPerPortion: number;
  impactPercent: number;
  totalImpactPerBatch: number;
}
