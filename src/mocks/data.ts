import type {
  Category,
  MenuItem,
  Product,
  Recipe,
  KitchenTicket,
  Order,
  Supply,
  WriteOff,
  KPI,
  Alert,
  ActionLog,
  OutputType,
  ServingCourse,
} from "@/types";

// ==========================================
// CATEGORIES
// ==========================================

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Салати", icon: "salad", sortOrder: 1 },
  { id: "cat-2", name: "Супи", icon: "soup", sortOrder: 2 },
  { id: "cat-3", name: "Основні страви", icon: "utensils", sortOrder: 3 },
  { id: "cat-4", name: "Гарніри", icon: "wheat", sortOrder: 4 },
  { id: "cat-5", name: "Напої", icon: "cup-soda", sortOrder: 5 },
  { id: "cat-6", name: "Десерти", icon: "cake", sortOrder: 6 },
];

// ==========================================
// MENU ITEMS
// ==========================================

export const mockMenuItems: MenuItem[] = [
  {
    id: "menu-1",
    name: "Салат Цезар",
    description: "Романо, курятина гриль, пармезан, крутони",
    price: 185,
    categoryId: "cat-1",
    available: true,
    preparationTime: 10,
    weight: 250,
  },
  {
    id: "menu-2",
    name: "Грецький салат",
    description: "Томати, огірки, фета, оливки, цибуля",
    price: 145,
    categoryId: "cat-1",
    available: true,
    preparationTime: 8,
    weight: 200,
  },
  {
    id: "menu-3",
    name: "Борщ український",
    description: "Буряк, капуста, картопля, яловичина, сметана",
    price: 125,
    categoryId: "cat-2",
    available: true,
    preparationTime: 5,
    weight: 350,
  },
  {
    id: "menu-4",
    name: "Солянка",
    description: "М'ясне асорті, оливки, лимон, сметана",
    price: 155,
    categoryId: "cat-2",
    available: true,
    preparationTime: 5,
    weight: 300,
  },
  {
    id: "menu-5",
    name: "Стейк Рібай",
    description: "Мармурова яловичина, соус перечний",
    price: 485,
    categoryId: "cat-3",
    available: true,
    preparationTime: 25,
    weight: 300,
  },
  {
    id: "menu-6",
    name: "Лосось на грилі",
    description: "Філе лосося, лимон, зелень",
    price: 385,
    categoryId: "cat-3",
    available: true,
    preparationTime: 20,
    weight: 200,
  },
  {
    id: "menu-7",
    name: "Курка Київська",
    description: "Котлета по-київськи з маслом та зеленню",
    price: 225,
    categoryId: "cat-3",
    available: true,
    preparationTime: 18,
    weight: 250,
  },
  {
    id: "menu-8",
    name: "Картопля фрі",
    description: "Хрустка картопля з соусом",
    price: 85,
    categoryId: "cat-4",
    available: true,
    preparationTime: 10,
    weight: 150,
  },
  {
    id: "menu-9",
    name: "Овочі гриль",
    description: "Сезонні овочі на грилі",
    price: 95,
    categoryId: "cat-4",
    available: true,
    preparationTime: 12,
    weight: 180,
  },
  {
    id: "menu-10",
    name: "Лимонад домашній",
    description: "Лимон, м'ята, імбир",
    price: 65,
    categoryId: "cat-5",
    available: true,
    preparationTime: 3,
  },
  {
    id: "menu-11",
    name: "Капучіно",
    description: "Еспресо з молочною пінкою",
    price: 55,
    categoryId: "cat-5",
    available: true,
    preparationTime: 3,
  },
  {
    id: "menu-12",
    name: "Чізкейк Нью-Йорк",
    description: "Класичний вершковий чізкейк",
    price: 125,
    categoryId: "cat-6",
    available: true,
    preparationTime: 2,
  },
  {
    id: "menu-13",
    name: "Тірамісу",
    description: "Маскарпоне, савоярді, кава",
    price: 135,
    categoryId: "cat-6",
    available: false,
    preparationTime: 2,
  },
];

// ==========================================
// PRODUCTS (Inventory)
// ==========================================

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Яловичина мармурова",
    sku: "BEEF-001",
    unit: "kg",
    currentStock: 15.5,
    minStock: 5,
    maxStock: 30,
    category: "М'ясо",
    lastUpdated: new Date("2024-01-15"),
  },
  {
    id: "prod-2",
    name: "Лосось філе",
    sku: "FISH-001",
    unit: "kg",
    currentStock: 8.2,
    minStock: 3,
    maxStock: 15,
    category: "Риба",
    expiryDate: new Date("2024-01-20"),
    lastUpdated: new Date("2024-01-14"),
  },
  {
    id: "prod-3",
    name: "Картопля",
    sku: "VEG-001",
    unit: "kg",
    currentStock: 45,
    minStock: 20,
    maxStock: 100,
    category: "Овочі",
    lastUpdated: new Date("2024-01-15"),
  },
  {
    id: "prod-4",
    name: "Салат Романо",
    sku: "VEG-002",
    unit: "kg",
    currentStock: 2.5,
    minStock: 3,
    maxStock: 10,
    category: "Овочі",
    expiryDate: new Date("2024-01-18"),
    lastUpdated: new Date("2024-01-15"),
  },
  {
    id: "prod-5",
    name: "Пармезан",
    sku: "DAIRY-001",
    unit: "kg",
    currentStock: 3.8,
    minStock: 2,
    maxStock: 8,
    category: "Молочні",
    expiryDate: new Date("2024-02-15"),
    lastUpdated: new Date("2024-01-10"),
  },
  {
    id: "prod-6",
    name: "Вершки 33%",
    sku: "DAIRY-002",
    unit: "l",
    currentStock: 5,
    minStock: 3,
    maxStock: 15,
    category: "Молочні",
    expiryDate: new Date("2024-01-22"),
    lastUpdated: new Date("2024-01-14"),
  },
  {
    id: "prod-7",
    name: "Кава зерно",
    sku: "BEV-001",
    unit: "kg",
    currentStock: 4.5,
    minStock: 2,
    maxStock: 10,
    category: "Напої",
    lastUpdated: new Date("2024-01-12"),
  },
  {
    id: "prod-8",
    name: "Оливкова олія",
    sku: "OIL-001",
    unit: "l",
    currentStock: 8,
    minStock: 3,
    maxStock: 20,
    category: "Олії",
    lastUpdated: new Date("2024-01-08"),
  },
];

// ==========================================
// RECIPES
// ==========================================

export const mockRecipes: Recipe[] = [
  {
    id: "recipe-1",
    menuItemId: "menu-1",
    menuItem: mockMenuItems[0],
    ingredients: [
      { productId: "prod-4", product: mockProducts[3], quantity: 0.15, unit: "kg" },
      { productId: "prod-5", product: mockProducts[4], quantity: 0.03, unit: "kg" },
      { productId: "prod-8", product: mockProducts[7], quantity: 0.02, unit: "l" },
    ],
    portionYield: 1,
    costPerPortion: 52.5,
    outputType: "cold" as OutputType,
    servingCourse: 2 as ServingCourse,
  },
  {
    id: "recipe-2",
    menuItemId: "menu-5",
    menuItem: mockMenuItems[4],
    ingredients: [
      { productId: "prod-1", product: mockProducts[0], quantity: 0.3, unit: "kg" },
      { productId: "prod-8", product: mockProducts[7], quantity: 0.01, unit: "l" },
    ],
    portionYield: 1,
    costPerPortion: 185,
    outputType: "kitchen" as OutputType,
    servingCourse: 3 as ServingCourse,
  },
  {
    id: "recipe-3",
    menuItemId: "menu-6",
    menuItem: mockMenuItems[5],
    ingredients: [
      { productId: "prod-2", product: mockProducts[1], quantity: 0.2, unit: "kg" },
      { productId: "prod-8", product: mockProducts[7], quantity: 0.015, unit: "l" },
    ],
    portionYield: 1,
    costPerPortion: 145,
    outputType: "kitchen" as OutputType,
    servingCourse: 3 as ServingCourse,
  },
  {
    id: "recipe-4",
    menuItemId: "menu-11",
    menuItem: mockMenuItems[10],
    ingredients: [
      { productId: "prod-7", product: mockProducts[6], quantity: 0.018, unit: "kg" },
      { productId: "prod-6", product: mockProducts[5], quantity: 0.15, unit: "l" },
    ],
    portionYield: 1,
    costPerPortion: 18,
    outputType: "bar" as OutputType,
    servingCourse: 5 as ServingCourse,
  },
  {
    id: "recipe-5",
    menuItemId: "menu-12",
    menuItem: mockMenuItems[11],
    ingredients: [
      { productId: "prod-6", product: mockProducts[5], quantity: 0.1, unit: "l" },
    ],
    portionYield: 1,
    costPerPortion: 35,
    outputType: "pastry" as OutputType,
    servingCourse: 4 as ServingCourse,
  },
];

// ==========================================
// KITCHEN TICKETS
// ==========================================

export const mockKitchenTickets: KitchenTicket[] = [
  {
    id: "ticket-1",
    orderId: "order-1",
    orderItems: [
      {
        id: "item-1",
        menuItemId: "menu-1",
        menuItem: mockMenuItems[0],
        quantity: 2,
        status: "preparing",
      },
      {
        id: "item-2",
        menuItemId: "menu-5",
        menuItem: mockMenuItems[4],
        quantity: 1,
        status: "preparing",
      },
    ],
    tableNumber: 5,
    status: "in_progress",
    createdAt: new Date(Date.now() - 480000),
    startedAt: new Date(Date.now() - 420000),
    elapsedSeconds: 420,
    priority: "normal",
  },
  {
    id: "ticket-2",
    orderId: "order-2",
    orderItems: [
      {
        id: "item-3",
        menuItemId: "menu-3",
        menuItem: mockMenuItems[2],
        quantity: 1,
        status: "pending",
      },
      {
        id: "item-4",
        menuItemId: "menu-7",
        menuItem: mockMenuItems[6],
        quantity: 2,
        status: "pending",
      },
    ],
    tableNumber: 3,
    status: "new",
    createdAt: new Date(Date.now() - 60000),
    elapsedSeconds: 60,
    priority: "rush",
  },
  {
    id: "ticket-3",
    orderId: "order-3",
    orderItems: [
      {
        id: "item-5",
        menuItemId: "menu-6",
        menuItem: mockMenuItems[5],
        quantity: 1,
        notes: "Без лимона",
        status: "ready",
      },
    ],
    tableNumber: 8,
    status: "ready",
    createdAt: new Date(Date.now() - 900000),
    startedAt: new Date(Date.now() - 840000),
    completedAt: new Date(Date.now() - 120000),
    elapsedSeconds: 720,
    priority: "normal",
  },
];

// ==========================================
// SUPPLIES
// ==========================================

export const mockSupplies: Supply[] = [
  {
    id: "supply-1",
    productId: "prod-1",
    product: mockProducts[0],
    quantity: 10,
    unitPrice: 450,
    totalPrice: 4500,
    supplierId: "supplier-1",
    invoiceNumber: "INV-2024-001",
    receivedAt: new Date("2024-01-10"),
    batchNumber: "BATCH-001",
  },
  {
    id: "supply-2",
    productId: "prod-2",
    product: mockProducts[1],
    quantity: 5,
    unitPrice: 680,
    totalPrice: 3400,
    supplierId: "supplier-2",
    invoiceNumber: "INV-2024-002",
    receivedAt: new Date("2024-01-12"),
    expiryDate: new Date("2024-01-20"),
    batchNumber: "BATCH-002",
  },
];

// ==========================================
// WRITE-OFFS
// ==========================================

export const mockWriteOffs: WriteOff[] = [
  {
    id: "wo-1",
    productId: "prod-4",
    product: mockProducts[3],
    quantity: 0.5,
    reason: "spoiled",
    notes: "Листя пожовкло",
    createdAt: new Date("2024-01-14"),
    createdBy: "user-1",
  },
  {
    id: "wo-2",
    productId: "prod-6",
    product: mockProducts[5],
    quantity: 1,
    reason: "expired",
    createdAt: new Date("2024-01-13"),
    createdBy: "user-2",
  },
];

// ==========================================
// KPI
// ==========================================

export const mockKPIs: KPI[] = [
  {
    id: "kpi-1",
    name: "Виручка сьогодні",
    value: 28450,
    previousValue: 25200,
    unit: "грн",
    trend: "up",
    category: "revenue",
  },
  {
    id: "kpi-2",
    name: "Замовлень сьогодні",
    value: 47,
    previousValue: 42,
    unit: "",
    trend: "up",
    category: "orders",
  },
  {
    id: "kpi-3",
    name: "Середній чек",
    value: 605,
    previousValue: 600,
    unit: "грн",
    trend: "stable",
    category: "revenue",
  },
  {
    id: "kpi-4",
    name: "Списання за тиждень",
    value: 2840,
    previousValue: 3200,
    unit: "грн",
    trend: "down",
    category: "inventory",
  },
  {
    id: "kpi-5",
    name: "Час приготування",
    value: 12.5,
    previousValue: 14.2,
    unit: "хв",
    trend: "down",
    category: "performance",
  },
  {
    id: "kpi-6",
    name: "Товарів на складі",
    value: 156,
    previousValue: 148,
    unit: "",
    trend: "up",
    category: "inventory",
  },
];

// ==========================================
// ALERTS
// ==========================================

export const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    title: "Низький запас",
    message: "Салат Романо: залишок 2.5 кг (мін. 3 кг)",
    severity: "warning",
    category: "inventory",
    createdAt: new Date(Date.now() - 3600000),
    read: false,
    actionUrl: "/storage?product=prod-4",
  },
  {
    id: "alert-2",
    title: "Термін придатності",
    message: "Лосось філе: закінчується 20.01.2024",
    severity: "critical",
    category: "inventory",
    createdAt: new Date(Date.now() - 7200000),
    read: false,
    actionUrl: "/storage?product=prod-2",
  },
  {
    id: "alert-3",
    title: "Нове замовлення",
    message: "Стіл #5: 3 позиції на 755 грн",
    severity: "info",
    category: "orders",
    createdAt: new Date(Date.now() - 300000),
    read: true,
  },
];

// ==========================================
// ACTION LOG
// ==========================================

export const mockActionLogs: ActionLog[] = [
  {
    id: "log-1",
    userId: "user-1",
    userName: "Олена К.",
    action: "Створено замовлення",
    details: "Стіл #5, 3 позиції, 755 грн",
    timestamp: new Date(Date.now() - 300000),
    module: "pos",
  },
  {
    id: "log-2",
    userId: "user-2",
    userName: "Михайло С.",
    action: "Списання товару",
    details: "Салат Романо 0.5 кг - псування",
    timestamp: new Date(Date.now() - 3600000),
    module: "storage",
  },
  {
    id: "log-3",
    userId: "user-3",
    userName: "Андрій П.",
    action: "Замовлення готове",
    details: "Тікет #3, стіл #8",
    timestamp: new Date(Date.now() - 7200000),
    module: "kitchen",
  },
];
