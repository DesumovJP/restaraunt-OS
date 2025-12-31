// ==========================================
// EXTENDED TYPES FOR RESTAURANT OS
// Courses, Comments, Timers, Bill Splitting,
// SmartStorage, Employee Profiles
// ==========================================

// ==========================================
// COURSE SYSTEM
// ==========================================

export type CourseType =
  | 'appetizer'  // Закуска
  | 'starter'    // Стартер
  | 'soup'       // Суп
  | 'main'       // Основне блюдо
  | 'dessert'    // Десерт
  | 'drink';     // Напій

export const COURSE_ORDER: CourseType[] = [
  'appetizer',
  'starter',
  'soup',
  'main',
  'dessert',
  'drink'
];

export const COURSE_LABELS: Record<CourseType, { uk: string; en: string }> = {
  appetizer: { uk: 'Закуска', en: 'Appetizer' },
  starter: { uk: 'Стартер', en: 'Starter' },
  soup: { uk: 'Суп', en: 'Soup' },
  main: { uk: 'Основне блюдо', en: 'Main Course' },
  dessert: { uk: 'Десерт', en: 'Dessert' },
  drink: { uk: 'Напій', en: 'Drink' },
};

// ==========================================
// EXTENDED ORDER ITEM STATUS
// ==========================================

export type OrderItemStatus =
  | 'queued'      // In cart, not yet sent to kitchen
  | 'pending'     // Sent to kitchen, waiting
  | 'in_progress' // Chef started cooking
  | 'ready'       // Ready to serve
  | 'served'      // Delivered to table
  | 'returned';   // Returned (undo from ready/served)

export const STATUS_LABELS: Record<OrderItemStatus, { uk: string; en: string }> = {
  queued: { uk: 'В черзі', en: 'Queued' },
  pending: { uk: 'Очікує', en: 'Pending' },
  in_progress: { uk: 'Готується', en: 'In Progress' },
  ready: { uk: 'Готово', en: 'Ready' },
  served: { uk: 'Подано', en: 'Served' },
  returned: { uk: 'Повернено', en: 'Returned' },
};

// ==========================================
// COMMENTS SYSTEM
// ==========================================

export type CommentVisibility = 'chef' | 'waiter' | 'manager' | 'kitchen';

export interface ItemComment {
  text: string;
  presets: string[];
  visibility: CommentVisibility[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
}

export interface CommentHistoryEntry {
  timestamp: string;
  authorId: string;
  authorName: string;
  value: string;
  presets: string[];
}

export interface CommentPreset {
  documentId?: string;
  slug?: string;
  key: string;
  label: { uk: string; en: string };
  icon?: string;
  category: 'modifier' | 'allergy' | 'dietary' | 'allergen';
  severity?: 'normal' | 'warning' | 'critical';
  isActive?: boolean;
  sortOrder?: number;
}

export const COMMENT_PRESETS: CommentPreset[] = [
  // Modifiers
  { key: 'no_salt', label: { uk: 'Без солі', en: 'No salt' }, icon: 'salt-off', category: 'modifier' },
  { key: 'no_pepper', label: { uk: 'Без перцю', en: 'No pepper' }, icon: 'pepper-off', category: 'modifier' },
  { key: 'no_onion', label: { uk: 'Без цибулі', en: 'No onion' }, icon: 'ban', category: 'modifier' },
  { key: 'no_garlic', label: { uk: 'Без часнику', en: 'No garlic' }, icon: 'ban', category: 'modifier' },
  { key: 'no_lemon', label: { uk: 'Без лимона', en: 'No lemon' }, icon: 'ban', category: 'modifier' },
  { key: 'extra_spicy', label: { uk: 'Гостріше', en: 'Extra spicy' }, icon: 'flame', category: 'modifier' },
  { key: 'less_spicy', label: { uk: 'Менш гостро', en: 'Less spicy' }, icon: 'flame-off', category: 'modifier' },
  { key: 'well_done', label: { uk: 'Добре просмажити', en: 'Well done' }, icon: 'thermometer', category: 'modifier' },
  { key: 'medium', label: { uk: 'Medium', en: 'Medium' }, icon: 'thermometer', category: 'modifier' },
  { key: 'rare', label: { uk: 'Із кров\'ю', en: 'Rare' }, icon: 'thermometer', category: 'modifier' },
  // Allergies
  { key: 'allergy_nuts', label: { uk: 'Алергія: горіхи', en: 'Allergy: nuts' }, icon: 'alert-triangle', category: 'allergy', severity: 'critical' },
  { key: 'allergy_dairy', label: { uk: 'Алергія: молочне', en: 'Allergy: dairy' }, icon: 'alert-triangle', category: 'allergy', severity: 'critical' },
  { key: 'allergy_gluten', label: { uk: 'Алергія: глютен', en: 'Allergy: gluten' }, icon: 'alert-triangle', category: 'allergy', severity: 'critical' },
  { key: 'allergy_seafood', label: { uk: 'Алергія: морепродукти', en: 'Allergy: seafood' }, icon: 'alert-triangle', category: 'allergy', severity: 'critical' },
  { key: 'allergy_eggs', label: { uk: 'Алергія: яйця', en: 'Allergy: eggs' }, icon: 'alert-triangle', category: 'allergy', severity: 'critical' },
  // Dietary
  { key: 'vegetarian', label: { uk: 'Вегетаріанське', en: 'Vegetarian' }, icon: 'leaf', category: 'dietary' },
  { key: 'vegan', label: { uk: 'Веганське', en: 'Vegan' }, icon: 'sprout', category: 'dietary' },
  { key: 'halal', label: { uk: 'Халяль', en: 'Halal' }, icon: 'check', category: 'dietary' },
  { key: 'kosher', label: { uk: 'Кошер', en: 'Kosher' }, icon: 'check', category: 'dietary' },
];

// ==========================================
// UNDO / AUDIT SYSTEM
// ==========================================

export interface UndoEntry {
  timestamp: string;
  operatorId: string;
  operatorName: string;
  previousStatus: OrderItemStatus;
  newStatus: OrderItemStatus;
  reason: string;
  itemDocumentId: string;
}

export const UNDO_REASONS = [
  { key: 'customer_refused', label: { uk: 'Клієнт відмовився', en: 'Customer refused' } },
  { key: 'wrong_preparation', label: { uk: 'Неправильне приготування', en: 'Wrong preparation' } },
  { key: 'allergy_concern', label: { uk: 'Алергія', en: 'Allergy concern' } },
  { key: 'contamination', label: { uk: 'Забруднення', en: 'Contamination' } },
  { key: 'quality_issue', label: { uk: 'Проблема з якістю', en: 'Quality issue' } },
  { key: 'other', label: { uk: 'Інше', en: 'Other' } },
];

// ==========================================
// EXTENDED ORDER ITEM
// ==========================================

import type { MenuItem, OrderStatus } from './index';

export interface ExtendedOrderItem {
  documentId: string;
  slug: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: OrderItemStatus;

  // Course fields
  courseType: CourseType;
  courseIndex: number;

  // Comments
  comment?: ItemComment;
  commentHistory: CommentHistoryEntry[];

  // Timing
  prepStartAt?: string;
  prepElapsedMs: number;
  servedAt?: string;

  // Undo reference
  undoRef?: string;
}

// ==========================================
// TABLE SESSION
// ==========================================

export type TableSessionStatus = 'active' | 'billing' | 'closed';

export interface CourseTimingEntry {
  courseType: CourseType;
  startedAt?: string;
  completedAt?: string;
  elapsedMs: number;
  itemCount: number;
}

export interface TableSession {
  documentId: string;
  slug: string;
  tableNumber: number;
  startedAt: string;
  endedAt?: string;
  status: TableSessionStatus;
  guestCount: number;
  waiterId: string;
  orders: string[];

  // Timing
  elapsedMs: number;
  courseTimings: CourseTimingEntry[];
}

// ==========================================
// EXTENDED ORDER
// ==========================================

export interface ExtendedOrder {
  documentId: string;
  slug: string;
  tableNumber: number;
  items: ExtendedOrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  waiterId: string;

  // New fields
  tableSessionId: string;
  tableStartAt: string;
  tableElapsedMs: number;
  splitConfig?: BillSplit;
  undoHistory: UndoEntry[];

  // Scheduling fields for planned orders
  scheduledFor?: string;      // ISO date - when guests arrive / order should be ready
  prepStartAt?: string;       // ISO date - when kitchen should start preparation
  scheduleStatus?: ScheduleStatus; // Status of scheduled order
  isScheduled?: boolean;      // True if this is a scheduled order
}

export type ScheduleStatus = 'scheduled' | 'activating' | 'activated' | 'completed';

// ==========================================
// BILL SPLITTING
// ==========================================

export type SplitMode = 'even' | 'by_items' | 'mixed';
export type BillStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'paylater';

export interface AssignedItem {
  itemDocumentId: string;
  itemSlug: string;
  portion: number; // 0-1
}

export interface SplitParticipant {
  personId: string;
  name?: string;
  share: number; // 0-100 percentage
  assignedItems: AssignedItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface SplitTotals {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  unassigned: number;
}

export interface BillSplit {
  documentId: string;
  slug: string;
  orderId: string;
  mode: SplitMode;
  participants: SplitParticipant[];
  totals: SplitTotals;
  createdAt: string;
  createdBy: string;
  status: BillStatus;
}

// ==========================================
// EMPLOYEE PROFILES
// ==========================================

export type ExtendedUserRole =
  | 'admin'
  | 'manager'
  | 'chef'
  | 'waiter'
  | 'host'
  | 'bartender';

export type Department =
  | 'kitchen'
  | 'service'
  | 'bar'
  | 'management'
  | 'host';

export type EmployeeStatus =
  | 'active'
  | 'break'
  | 'offline'
  | 'vacation'
  | 'terminated';

export type ShiftStatus =
  | 'scheduled'
  | 'started'
  | 'completed'
  | 'absent'
  | 'cancelled';

export interface ContactInfo {
  phone?: string;
  email?: string;
  emergencyContact?: string;
}

export interface ShiftAssignment {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  department: Department;
  station?: string;
  status: ShiftStatus;
}

export type KPIMetric =
  | 'orders_served'
  | 'average_ticket_time'
  | 'upsell_rate'
  | 'customer_rating'
  | 'dishes_prepared'
  | 'waste_rate';

export interface KPITarget {
  metric: KPIMetric;
  period: 'daily' | 'weekly' | 'monthly';
  target: number;
  unit: string;
}

export interface KPIActual {
  metric: KPIMetric;
  period: string;
  value: number;
  updatedAt: string;
}

export interface EmployeeProfile {
  documentId: string;
  slug: string;
  userId: string;
  name: string;
  avatar?: string;
  role: ExtendedUserRole;
  department: Department;
  status: EmployeeStatus;
  contactInfo: ContactInfo;

  // Work info
  shifts: ShiftAssignment[];
  currentShift?: ShiftAssignment;
  hoursThisWeek: number;
  hoursThisMonth: number;

  // KPI
  kpiTargets: KPITarget[];
  kpiActuals: KPIActual[];

  // Communication
  chatThreadId?: string;
  lastActiveAt: string;
}

// ==========================================
// SMART STORAGE
// ==========================================

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

/**
 * Головні категорії продуктів для Smart Storage
 * Ієрархія: MainCategory -> SubCategory -> Product
 */

export type StorageMainCategory =
  | 'raw'           // Сировина - необроблені продукти
  | 'prep'          // Заготовки/напівфабрикати
  | 'dry-goods'     // Бакалія - сухі продукти
  | 'seasonings'    // Приправи та спеції
  | 'oils-fats'     // Олії та жири
  | 'dairy'         // Молочні продукти
  | 'beverages'     // Напої
  | 'frozen'        // Заморожені продукти
  | 'ready-made';   // Готові продукти

export type RawSubCategory =
  | 'meat'          // М'ясо (яловичина, свинина)
  | 'poultry'       // Птиця (курка, качка, індичка)
  | 'seafood'       // Риба та морепродукти
  | 'vegetables'    // Овочі
  | 'fruits'        // Фрукти
  | 'eggs'          // Яйця
  | 'mushrooms';    // Гриби

export type PrepSubCategory =
  | 'meat-prep'     // М'ясні заготовки (нарізка, маринад)
  | 'poultry-prep'  // Заготовки птиці (філе, крильця)
  | 'seafood-prep'  // Рибні заготовки (філе, очищені)
  | 'veg-prep'      // Овочеві заготовки (очищені, нарізані)
  | 'sauces'        // Соуси (домашні заготовки)
  | 'stocks'        // Бульйони
  | 'dough'         // Тісто
  | 'marinades';    // Маринади

export type DryGoodsSubCategory =
  | 'grains'        // Крупи та зернові (рис, гречка, булгур)
  | 'flour'         // Борошно (пшеничне, кукурудзяне)
  | 'pasta'         // Макаронні вироби
  | 'legumes'       // Бобові (квасоля, нут, сочевиця)
  | 'canned'        // Консерви
  | 'sugar'         // Цукор та підсолоджувачі
  | 'nuts-seeds';   // Горіхи та насіння

export type SeasoningsSubCategory =
  | 'spices'        // Спеції (перець, кориця, куркума)
  | 'herbs-dried'   // Сушені трави (орегано, базилік)
  | 'herbs-fresh'   // Свіжі трави (петрушка, кінза)
  | 'salt-pepper'   // Сіль та перець
  | 'blends';       // Суміші приправ

export type OilsFatsSubCategory =
  | 'vegetable-oil' // Рослинні олії (соняшникова, оливкова)
  | 'butter'        // Вершкове масло
  | 'animal-fat'    // Тваринні жири (смалець, гусячий жир)
  | 'specialty-oil';// Спеціальні олії (кунжутна, трюфельна)

export type DairySubCategory =
  | 'milk'          // Молоко та вершки
  | 'cheese'        // Сири
  | 'yogurt'        // Йогурти та кисломолочні
  | 'cream';        // Вершки та сметана

export type BeveragesSubCategory =
  | 'wine'          // Вино
  | 'spirits'       // Міцний алкоголь
  | 'beer'          // Пиво та сидр
  | 'juice'         // Соки
  | 'soft-drinks'   // Безалкогольні напої
  | 'water'         // Вода
  | 'coffee-tea';   // Кава та чай

export type FrozenSubCategory =
  | 'frozen-veg'    // Заморожені овочі
  | 'frozen-fruit'  // Заморожені фрукти та ягоди
  | 'frozen-meat'   // Заморожене м'ясо
  | 'frozen-seafood'// Заморожені морепродукти
  | 'ice-cream';    // Морозиво

export type ReadyMadeSubCategory =
  | 'bread'         // Хліб та хлібобулочні
  | 'pastry'        // Випічка
  | 'desserts'      // Десерти
  | 'prepared-meals';// Готові страви

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

// Мітки категорій (uk/en)
export const STORAGE_MAIN_CATEGORY_LABELS: Record<StorageMainCategory, { uk: string; en: string; icon: string }> = {
  'raw':        { uk: 'Сировина', en: 'Raw Ingredients', icon: 'beef' },
  'prep':       { uk: 'Заготовки', en: 'Prep/Semi-finished', icon: 'chef-hat' },
  'dry-goods':  { uk: 'Бакалія', en: 'Dry Goods', icon: 'wheat' },
  'seasonings': { uk: 'Приправи', en: 'Seasonings', icon: 'flame' },
  'oils-fats':  { uk: 'Олії та жири', en: 'Oils & Fats', icon: 'droplet' },
  'dairy':      { uk: 'Молочні', en: 'Dairy', icon: 'milk' },
  'beverages':  { uk: 'Напої', en: 'Beverages', icon: 'wine' },
  'frozen':     { uk: 'Заморожені', en: 'Frozen', icon: 'snowflake' },
  'ready-made': { uk: 'Готові', en: 'Ready-made', icon: 'cake' },
};

export const STORAGE_SUB_CATEGORY_LABELS: Record<StorageSubCategory, { uk: string; en: string; parent: StorageMainCategory }> = {
  // Raw
  'meat':         { uk: "М'ясо", en: 'Meat', parent: 'raw' },
  'poultry':      { uk: 'Птиця', en: 'Poultry', parent: 'raw' },
  'seafood':      { uk: 'Риба та морепродукти', en: 'Seafood', parent: 'raw' },
  'vegetables':   { uk: 'Овочі', en: 'Vegetables', parent: 'raw' },
  'fruits':       { uk: 'Фрукти', en: 'Fruits', parent: 'raw' },
  'eggs':         { uk: 'Яйця', en: 'Eggs', parent: 'raw' },
  'mushrooms':    { uk: 'Гриби', en: 'Mushrooms', parent: 'raw' },
  // Prep
  'meat-prep':    { uk: "М'ясні заготовки", en: 'Meat Prep', parent: 'prep' },
  'poultry-prep': { uk: 'Заготовки птиці', en: 'Poultry Prep', parent: 'prep' },
  'seafood-prep': { uk: 'Рибні заготовки', en: 'Seafood Prep', parent: 'prep' },
  'veg-prep':     { uk: 'Овочеві заготовки', en: 'Vegetable Prep', parent: 'prep' },
  'sauces':       { uk: 'Соуси', en: 'Sauces', parent: 'prep' },
  'stocks':       { uk: 'Бульйони', en: 'Stocks', parent: 'prep' },
  'dough':        { uk: 'Тісто', en: 'Dough', parent: 'prep' },
  'marinades':    { uk: 'Маринади', en: 'Marinades', parent: 'prep' },
  // Dry Goods
  'grains':       { uk: 'Крупи', en: 'Grains', parent: 'dry-goods' },
  'flour':        { uk: 'Борошно', en: 'Flour', parent: 'dry-goods' },
  'pasta':        { uk: 'Макарони', en: 'Pasta', parent: 'dry-goods' },
  'legumes':      { uk: 'Бобові', en: 'Legumes', parent: 'dry-goods' },
  'canned':       { uk: 'Консерви', en: 'Canned', parent: 'dry-goods' },
  'sugar':        { uk: 'Цукор', en: 'Sugar', parent: 'dry-goods' },
  'nuts-seeds':   { uk: 'Горіхи та насіння', en: 'Nuts & Seeds', parent: 'dry-goods' },
  // Seasonings
  'spices':       { uk: 'Спеції', en: 'Spices', parent: 'seasonings' },
  'herbs-dried':  { uk: 'Сушені трави', en: 'Dried Herbs', parent: 'seasonings' },
  'herbs-fresh':  { uk: 'Свіжі трави', en: 'Fresh Herbs', parent: 'seasonings' },
  'salt-pepper':  { uk: 'Сіль та перець', en: 'Salt & Pepper', parent: 'seasonings' },
  'blends':       { uk: 'Суміші приправ', en: 'Spice Blends', parent: 'seasonings' },
  // Oils & Fats
  'vegetable-oil':  { uk: 'Рослинні олії', en: 'Vegetable Oils', parent: 'oils-fats' },
  'butter':         { uk: 'Вершкове масло', en: 'Butter', parent: 'oils-fats' },
  'animal-fat':     { uk: 'Тваринні жири', en: 'Animal Fats', parent: 'oils-fats' },
  'specialty-oil':  { uk: 'Спеціальні олії', en: 'Specialty Oils', parent: 'oils-fats' },
  // Dairy
  'milk':           { uk: 'Молоко', en: 'Milk', parent: 'dairy' },
  'cheese':         { uk: 'Сири', en: 'Cheese', parent: 'dairy' },
  'yogurt':         { uk: 'Йогурти', en: 'Yogurt', parent: 'dairy' },
  'cream':          { uk: 'Вершки/сметана', en: 'Cream', parent: 'dairy' },
  // Beverages
  'wine':           { uk: 'Вино', en: 'Wine', parent: 'beverages' },
  'spirits':        { uk: 'Міцний алкоголь', en: 'Spirits', parent: 'beverages' },
  'beer':           { uk: 'Пиво', en: 'Beer', parent: 'beverages' },
  'juice':          { uk: 'Соки', en: 'Juice', parent: 'beverages' },
  'soft-drinks':    { uk: 'Безалкогольні', en: 'Soft Drinks', parent: 'beverages' },
  'water':          { uk: 'Вода', en: 'Water', parent: 'beverages' },
  'coffee-tea':     { uk: 'Кава та чай', en: 'Coffee & Tea', parent: 'beverages' },
  // Frozen
  'frozen-veg':     { uk: 'Заморожені овочі', en: 'Frozen Vegetables', parent: 'frozen' },
  'frozen-fruit':   { uk: 'Заморожені фрукти', en: 'Frozen Fruits', parent: 'frozen' },
  'frozen-meat':    { uk: "Заморожене м'ясо", en: 'Frozen Meat', parent: 'frozen' },
  'frozen-seafood': { uk: 'Заморожені морепродукти', en: 'Frozen Seafood', parent: 'frozen' },
  'ice-cream':      { uk: 'Морозиво', en: 'Ice Cream', parent: 'frozen' },
  // Ready-made
  'bread':          { uk: 'Хліб', en: 'Bread', parent: 'ready-made' },
  'pastry':         { uk: 'Випічка', en: 'Pastry', parent: 'ready-made' },
  'desserts':       { uk: 'Десерти', en: 'Desserts', parent: 'ready-made' },
  'prepared-meals': { uk: 'Готові страви', en: 'Prepared Meals', parent: 'ready-made' },
};

// Тип умов зберігання
export type StorageCondition = 'ambient' | 'refrigerated' | 'frozen' | 'dry-cool';

export const STORAGE_CONDITION_LABELS: Record<StorageCondition, { uk: string; en: string; tempRange: string }> = {
  'ambient':      { uk: 'Кімнатна', en: 'Ambient', tempRange: '15-25°C' },
  'refrigerated': { uk: 'Холодильник', en: 'Refrigerated', tempRange: '0-5°C' },
  'frozen':       { uk: 'Морозильник', en: 'Frozen', tempRange: '-18°C' },
  'dry-cool':     { uk: 'Сухе прохолодне', en: 'Dry & Cool', tempRange: '10-15°C' },
};

// Інтерфейс категорії для UI
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

// Функція побудови дерева категорій
export function buildCategoryTree(): StorageCategoryNode[] {
  const mainCategories = Object.keys(STORAGE_MAIN_CATEGORY_LABELS) as StorageMainCategory[];

  return mainCategories.map(mainCat => {
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

export type ProductUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'portion';

export type ProcessType =
  | 'cleaning'
  | 'boiling'
  | 'frying'
  | 'rendering'
  | 'baking'
  | 'grilling'
  | 'portioning';

export const PROCESS_LABELS: Record<ProcessType, { uk: string; en: string }> = {
  cleaning: { uk: 'Очистка', en: 'Cleaning' },
  boiling: { uk: 'Варка', en: 'Boiling' },
  frying: { uk: 'Вижарка', en: 'Frying' },
  rendering: { uk: 'Виварка', en: 'Rendering' },
  baking: { uk: 'Випікання', en: 'Baking' },
  grilling: { uk: 'Гриль', en: 'Grilling' },
  portioning: { uk: 'Порціонування', en: 'Portioning' },
};

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
  disposalType: 'trash' | 'compost' | 'recyclable' | 'stock';
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

export type BatchStatus =
  | 'received'
  | 'processed'
  | 'in_use'
  | 'processing'
  | 'available'
  | 'depleted'
  | 'expired'
  | 'written_off';

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
  productName?: string; // For display purposes, can be derived from product?.name
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

export type StorageOperationType =
  | 'receive'
  | 'clean'
  | 'process'
  | 'use'
  | 'write_off'
  | 'transfer'
  | 'adjust'
  | 'return';

export type ExtendedWriteOffReason =
  | 'expired'
  | 'damaged'
  | 'spoiled'
  | 'theft'
  | 'cooking_loss'
  | 'quality_fail'
  | 'customer_return'
  | 'inventory_adjust'
  | 'other';

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

// ==========================================
// WEBSOCKET EXTENDED EVENTS
// ==========================================

export type ExtendedWSEventType =
  | 'ticket:new'
  | 'ticket:update'
  | 'order:update'
  | 'inventory:low'
  | 'alert:new'
  | 'table:timer'
  | 'comment:new'
  | 'split:update'
  | 'undo:request'
  | 'course:update'
  | 'batch:process'
  | 'profile:status';

export interface ExtendedWSEvent<T = unknown> {
  type: ExtendedWSEventType;
  payload: T;
  timestamp: string;
}

// ==========================================
// API EXTENDED RESPONSE TYPES
// ==========================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ExtendedApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  error?: ApiError;
}

// ==========================================
// OFFLINE QUEUE
// ==========================================

export type QueuedActionType =
  | 'order'
  | 'status'
  | 'comment'
  | 'split'
  | 'process';

export type QueuedActionStatus =
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'synced';

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: unknown;
  timestamp: number;
  retries: number;
  status: QueuedActionStatus;
}

// ==========================================
// KPI DASHBOARD
// ==========================================

export interface KPIDashboardSummary {
  totalOrders: number;
  averageTicketTime: number;
  totalRevenue: number;
  wasteRate: number;
}

export interface DepartmentStats {
  dishesCompleted?: number;
  ordersServed?: number;
  averageTime: number;
  averageRating?: number;
  staff: number;
}

export interface TopPerformer {
  profileId: string;
  name: string;
  metric: KPIMetric;
  value: number;
}

export interface KPIDashboard {
  period: 'today' | 'week' | 'month';
  summary: KPIDashboardSummary;
  byDepartment: Record<Department, DepartmentStats>;
  topPerformers: TopPerformer[];
  alerts: Array<{
    type: string;
    department: Department;
    message: string;
  }>;
}
