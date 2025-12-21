// ==========================================
// CORE ENTITIES
// ==========================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  available: boolean;
  preparationTime: number; // minutes
  weight?: number; // weight in grams
  ingredients?: RecipeIngredient[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

// ==========================================
// ORDER MANAGEMENT
// ==========================================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: OrderStatus;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number;
  waiterId: string;
}

// ==========================================
// KITCHEN TICKETS
// ==========================================

export type TicketStatus =
  | "new"
  | "in_progress"
  | "ready";

export type KitchenStation = "all" | "grill" | "fry" | "salad" | "dessert";

export interface KitchenTicket {
  id: string;
  orderId: string;
  orderItems: OrderItem[];
  tableNumber: number;
  status: TicketStatus;
  station?: KitchenStation;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  elapsedSeconds: number;
  priority: "normal" | "rush";
}

// ==========================================
// INVENTORY & STORAGE
// ==========================================

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: "kg" | "g" | "l" | "ml" | "pcs";
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  imageUrl?: string;
  expiryDate?: Date;
  lastUpdated: Date;
}

export interface Supply {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
  invoiceNumber?: string;
  receivedAt: Date;
  expiryDate?: Date;
  batchNumber?: string;
}

export type WriteOffReason =
  | "expired"
  | "damaged"
  | "spoiled"
  | "theft"
  | "cooking_loss"
  | "other";

export interface WriteOff {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  reason: WriteOffReason;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

// ==========================================
// RECIPES
// ==========================================

export type OutputType = "kitchen" | "bar" | "pastry" | "cold";

export type ServingCourse = 1 | 2 | 3 | 4 | 5;

export interface RecipeIngredient {
  productId: string;
  product: Product;
  quantity: number;
  unit: string;
}

export interface IngredientReservation {
  recipeId: string;
  portions: number;
  reservedAt: Date;
  reservedBy: string;
  expiresAt: Date;
  ingredients: {
    productId: string;
    quantity: number;
  }[];
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  ingredients: RecipeIngredient[];
  instructions?: string;
  portionYield: number;
  costPerPortion: number;
  outputType: OutputType;
  servingCourse: ServingCourse;
  reservations?: IngredientReservation[];
}

// ==========================================
// ANALYTICS & KPI
// ==========================================

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  category: "revenue" | "orders" | "inventory" | "performance";
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: "inventory" | "orders" | "system";
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

export interface ActionLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  module: "pos" | "kitchen" | "storage" | "admin";
}

// ==========================================
// USER & AUTH
// ==========================================

export type UserRole = "admin" | "waiter" | "chef" | "manager";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// ==========================================
// CART (Client-side only)
// ==========================================

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  tableNumber: number | null;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==========================================
// WEBSOCKET EVENTS
// ==========================================

export type WSEventType =
  | "ticket:new"
  | "ticket:update"
  | "order:update"
  | "inventory:low"
  | "alert:new";

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: Date;
}
