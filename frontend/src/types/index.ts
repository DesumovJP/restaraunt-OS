// ==========================================
// CORE ENTITIES
// ==========================================

export interface MenuItem {
  id: string;
  documentId?: string;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  categoryDocumentId?: string;
  categorySlug?: string;
  recipeId?: string;
  imageUrl?: string;
  available: boolean;
  preparationTime: number; // minutes
  weight?: number; // weight in grams (display)
  outputType?: OutputType;
  portionSize?: number; // portion size for calculations
  portionUnit?: 'g' | 'ml' | 'pcs';
  portionsPerRecipe?: number;
  ingredients?: RecipeIngredient[];
}

export interface Category {
  id: string;
  documentId?: string;
  slug?: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive?: boolean;
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
  documentId?: string;
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  maxStock?: number;
  costPerUnit?: number;
  category?: string;
  imageUrl?: string;
  expiryDate?: Date;
  lastUpdated?: Date;
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
  productId?: string;
  product: Product;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  notes?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number;
  station?: string;
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
  documentId?: string;
  slug?: string;
  name: string;
  menuItemId?: string;
  menuItem: MenuItem;
  ingredients: RecipeIngredient[];
  steps?: RecipeStep[];
  instructions?: string;
  portionYield?: number;
  portions?: number;
  prepTime?: number;
  cookTime?: number;
  costPerPortion: number;
  outputType: OutputType;
  servingCourse?: ServingCourse;
  isActive?: boolean;
  reservations?: IngredientReservation[];
  // === Margin/Economics (calculated) ===
  sellingPrice?: number;              // From linked menu item
  calculatedCost?: number;            // Sum of ingredient costs
  marginAbsolute?: number;            // sellingPrice - calculatedCost
  marginPercent?: number;             // (marginAbsolute / sellingPrice) * 100
  foodCostPercent?: number;           // (calculatedCost / sellingPrice) * 100
  // === Allergens (derived from ingredients) ===
  allergens?: string[];
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

export type ActionType =
  | "create" | "update" | "delete"
  | "start" | "complete" | "cancel"
  | "receive" | "write_off" | "transfer"
  | "login" | "logout"
  | "approve" | "reject"
  | "assign" | "unassign";

export type EntityType =
  | "order" | "order_item" | "kitchen_ticket"
  | "menu_item" | "menu_category" | "ingredient"
  | "stock_batch" | "inventory_movement" | "recipe"
  | "table" | "reservation" | "scheduled_order"
  | "daily_task" | "user" | "supplier" | "worker_performance";

export interface ActionLog {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  details: string;
  descriptionUk?: string;
  timestamp: Date;
  module: "pos" | "kitchen" | "storage" | "admin" | "reservations" | "system";
  severity?: "info" | "warning" | "critical";
  dataBefore?: Record<string, unknown>;
  dataAfter?: Record<string, unknown>;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
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

// ==========================================
// RE-EXPORTS
// ==========================================

export * from "./delivery";
export * from "./storage";
