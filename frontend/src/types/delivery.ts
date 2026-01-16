/**
 * Delivery Order Types
 * Types for creating delivery orders (not stored in DB, local state only)
 */

import type { StorageMainCategory, ProductUnit } from "./storage";

/**
 * Item in a delivery order
 */
export interface DeliveryOrderItem {
  /** Local UUID for React keys */
  id: string;
  /** ID of existing ingredient (if selected from existing) */
  ingredientId?: string;
  /** Whether this is a new product to be created */
  isNew: boolean;
  /** Product name */
  name: string;
  /** Ukrainian product name */
  nameUk?: string;
  /** SKU code */
  sku?: string;
  /** Unit of measurement */
  unit: ProductUnit;
  /** Quantity ordered */
  quantity: number;
  /** Cost per unit */
  unitCost: number;
  /** Total cost (quantity * unitCost) */
  totalCost: number;
  /** Main category */
  mainCategory?: StorageMainCategory;
  /** Sub category */
  subCategory?: string;
  /** Notes for this item */
  notes?: string;
}

/**
 * Delivery order (local state, not stored in DB)
 */
export interface DeliveryOrder {
  /** Local UUID */
  id: string;
  /** Selected supplier ID */
  supplierId?: string;
  /** Supplier name for display */
  supplierName?: string;
  /** Supplier email for sending */
  supplierEmail?: string;
  /** Order items */
  items: DeliveryOrderItem[];
  /** Total order amount */
  totalAmount: number;
  /** General notes */
  notes?: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Supplier from GraphQL
 */
export interface DeliverySupplier {
  documentId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

/**
 * Ingredient from GraphQL for selection
 */
export interface DeliveryIngredient {
  documentId: string;
  name: string;
  nameUk?: string;
  sku?: string;
  unit: ProductUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  mainCategory?: StorageMainCategory;
  costPerUnit?: number;
}

/**
 * New product input for creation
 */
export interface NewProductInput {
  name: string;
  nameUk?: string;
  sku?: string;
  unit: ProductUnit;
  mainCategory?: StorageMainCategory;
  subCategory?: string;
  costPerUnit?: number;
  storageCondition?: string;
}
