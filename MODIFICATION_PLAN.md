# Restaurant OS Modification Plan
## Comprehensive Implementation Package

**Version:** 1.0.0
**Date:** 2025-12-21
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Architectural Design Changes](#3-architectural-design-changes)
4. [Data Models and Migrations](#4-data-models-and-migrations)
5. [API Contracts and Endpoints](#5-api-contracts-and-endpoints)
6. [UX/UI Changes and Flows](#6-uxui-changes-and-flows)
7. [Yield Calculation Formulas](#7-yield-calculation-formulas)
8. [Test Cases and Acceptance Criteria](#8-test-cases-and-acceptance-criteria)
9. [Implementation Plan and Risks](#9-implementation-plan-and-risks)

---

## 1. Executive Summary

This document outlines comprehensive modifications to the existing Restaurant OS system, adding:

- **Course-based ordering** (6 courses: Appetizer, Starter, Soup, Main, Dessert, Drink)
- **Table time tracking** with per-course and per-item timers
- **Dish comments** visible to kitchen and waiter with history
- **Bill splitting** (even, by items, mixed)
- **Undo functionality** for completed orders with audit logging
- **Employee profiles** with KPI, shifts, departments, and chat
- **SmartStorage** with yield profiling, batch processing, barcode scanning
- **Precise yield calculations** for raw-to-finished product conversion

**Key Constraints:**
- Use only `documentId` and `slug` in Strapi/backend operations, never `id`
- Maintain backward compatibility with existing data
- Provide rollback scripts for all migrations

---

## 2. Current Architecture Analysis

### 2.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15.1.6, React 18.3.1, TypeScript 5.7.2 |
| State Management | Zustand 5.0.2 (persisted) |
| Styling | Tailwind CSS 3.4.17 + Glassmorphism |
| UI Components | Radix UI (Dialog, Tabs, Toast, etc.) |
| API | Mock REST API (ready for Strapi integration) |
| Real-time | Mock WebSocket (ready for Socket.io) |

### 2.2 Current Module Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  Waiter POS │ Kitchen KDS │   Storage   │   Admin Dashboard       │
│  /pos/waiter│  /pos/chef  │  /storage   │  /dashboard/admin       │
├─────────────┴─────────────┴─────────────┴─────────────────────────┤
│                     Zustand Stores                                │
│  cart-store │ tickets-store │ inventory-store │ table-store       │
├───────────────────────────────────────────────────────────────────┤
│                      API Layer (/src/lib/api.ts)                  │
├───────────────────────────────────────────────────────────────────┤
│                   WebSocket (/src/lib/ws.ts)                      │
└───────────────────────────────────────────────────────────────────┘
```

### 2.3 Existing Data Entities

| Entity | Current Fields | Location |
|--------|---------------|----------|
| Order | id, tableNumber, items, status, createdAt, updatedAt, totalAmount, waiterId | `/src/types/index.ts` |
| OrderItem | id, menuItemId, menuItem, quantity, notes, status | `/src/types/index.ts` |
| KitchenTicket | id, orderId, orderItems, tableNumber, status, station, elapsedSeconds, priority | `/src/types/index.ts` |
| Product | id, name, sku, unit, currentStock, minStock, maxStock, category | `/src/types/index.ts` |

### 2.4 Key Gaps Identified

1. **No course/serving system** - all items treated equally
2. **No table time tracking** - only per-ticket elapsed time
3. **No bill splitting** - single payment only
4. **No undo mechanism** - status changes are final
5. **No employee profiles** - basic user type only
6. **No yield calculations** - raw inventory only
7. **No batch processing** - no semi-finished products

---

## 3. Architectural Design Changes

### 3.1 New Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│  Waiter POS │ Kitchen KDS │SmartStorage │   Profiles  │ Admin Dashboard │
│  + Courses  │ + Courses   │ + Yield     │   (NEW)     │ + Analytics     │
│  + Comments │ + Comments  │ + Batches   │             │                 │
│  + Splitting│ + Undo      │ + Processes │             │                 │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┤
│                          Zustand Stores                                  │
│ cart │ tickets │ inventory │ tables │ profiles (NEW) │ bills (NEW)      │
├─────────────────────────────────────────────────────────────────────────┤
│                    API Layer (Extended)                                  │
│  /orders  │  /storage  │  /profiles  │  /bills  │  /yield              │
├─────────────────────────────────────────────────────────────────────────┤
│                    WebSocket (Extended Events)                           │
│  ticket:* │ table:timer │ comment:new │ split:update │ undo:request     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Module Responsibilities

#### 3.2.1 Order Card Module (Modified)
- **Course sections** with 6 types (appetizer, starter, soup, main, dessert, drink)
- **Per-course grouping** and sequencing
- **Comment attachment** to individual items
- **Course-level timers** for kitchen synchronization

#### 3.2.2 Bill Management Module (New)
- **Split modes**: even, by_items, mixed
- **Participant tracking** with assigned items
- **Tax/tip distribution**
- **Multi-column modal** for large bills

#### 3.2.3 Profile Module (New)
- **Employee profiles**: role, department, shift, status
- **KPI tracking**: targets vs actuals
- **Chat integration**: per-employee thread
- **Shift management**: current/upcoming shifts

#### 3.2.4 SmartStorage Module (Enhanced)
- **Yield profiles** per product
- **Batch processing**: cleaning, boiling, frying, rendering
- **Barcode scanning** with weight input
- **Deep category filtering** with arbitrary depth
- **Export functionality**: CSV/TSV with audit columns
- **Process history** per item

#### 3.2.5 Undo/Audit Module (New)
- **Status rollback** with reason capture
- **Audit logging** for all state changes
- **Role-based visibility** of audit trail

### 3.3 Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────┘

Table Timer ──────────────┬──────────────────────────────────┐
                          │                                  │
                          ▼                                  ▼
              ┌───────────────────┐              ┌───────────────────┐
              │   Waiter POS      │◄────────────►│   Kitchen KDS     │
              │   (Course View)   │   WebSocket  │  (Course Lanes)   │
              └────────┬──────────┘              └─────────┬─────────┘
                       │                                   │
                       │ Order Items                       │ Cooking Events
                       ▼                                   ▼
              ┌───────────────────────────────────────────────────────┐
              │                    ORDER/ITEM STORE                    │
              │   documentId, slug, courseType, comment, status        │
              └────────────────────────┬──────────────────────────────┘
                                       │
                                       │ BOM Lookup
                                       ▼
              ┌───────────────────────────────────────────────────────┐
              │                    RECIPE/BOM                          │
              │   menuItemId → ingredients[] with quantities           │
              └────────────────────────┬──────────────────────────────┘
                                       │
                                       │ Yield-adjusted quantities
                                       ▼
              ┌───────────────────────────────────────────────────────┐
              │                  SMART STORAGE                         │
              │   product → yieldProfile → batch → netAfterProcess     │
              └────────────────────────┬──────────────────────────────┘
                                       │
                                       │ Write-off
                                       ▼
              ┌───────────────────────────────────────────────────────┐
              │                    INVENTORY                           │
              │   currentStock -= netAfterProcess                      │
              │   costPerPortion = FIFO from batches                   │
              └───────────────────────────────────────────────────────┘
```

---

## 4. Data Models and Migrations

### 4.1 Updated Entity Schemas

#### 4.1.1 Order (Extended)

```typescript
// /src/types/order.ts

interface Order {
  // Existing fields
  documentId: string;        // Changed from id
  slug: string;              // NEW: URL-friendly identifier
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  waiterId: string;

  // NEW fields
  tableSessionId: string;    // Links to TableSession
  tableStartAt: string;      // ISO timestamp when table was seated
  tableElapsedMs: number;    // Computed/cached
  splitConfig?: BillSplit;   // Bill splitting configuration
  undoHistory: UndoEntry[];  // Audit trail for undo operations
}

interface OrderItem {
  // Existing fields
  documentId: string;        // Changed from id
  slug: string;              // NEW
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;            // Kept for backward compatibility
  status: OrderItemStatus;

  // NEW fields
  courseType: CourseType;
  courseIndex: number;       // Sequence within course (1, 2, 3...)
  comment?: ItemComment;     // Structured comment
  commentHistory: CommentHistoryEntry[];
  prepStartAt?: string;      // When prep started
  prepElapsedMs: number;
  servedAt?: string;         // When marked as served
  undoRef?: string;          // Reference to previous status for rollback
}

type CourseType =
  | 'appetizer'  // Закуска
  | 'starter'    // Стартер
  | 'soup'       // Суп
  | 'main'       // Основне блюдо
  | 'dessert'    // Десерт
  | 'drink';     // Напій

type OrderItemStatus =
  | 'queued'      // In cart, not yet sent to kitchen
  | 'pending'     // Sent to kitchen, waiting
  | 'in_progress' // Chef started cooking
  | 'ready'       // Ready to serve
  | 'served'      // Delivered to table
  | 'returned';   // Returned (undo from ready/served)

interface ItemComment {
  text: string;
  presets: string[];         // e.g., ["no_lemon", "extra_spicy"]
  visibility: CommentVisibility[];
  createdAt: string;
  createdBy: string;         // Waiter documentId
}

type CommentVisibility = 'chef' | 'waiter' | 'manager';

interface CommentHistoryEntry {
  timestamp: string;
  authorId: string;
  authorName: string;
  value: string;
  presets: string[];
}

interface UndoEntry {
  timestamp: string;
  operatorId: string;
  operatorName: string;
  previousStatus: OrderItemStatus;
  newStatus: OrderItemStatus;
  reason: string;
  itemDocumentId: string;
}
```

#### 4.1.2 Table Session (New)

```typescript
// /src/types/table-session.ts

interface TableSession {
  documentId: string;
  slug: string;
  tableNumber: number;
  startedAt: string;
  endedAt?: string;
  status: TableSessionStatus;
  guestCount: number;
  waiterId: string;
  orders: string[];          // Order documentIds

  // Timing
  elapsedMs: number;
  courseTimings: CourseTimingEntry[];
}

type TableSessionStatus = 'active' | 'billing' | 'closed';

interface CourseTimingEntry {
  courseType: CourseType;
  startedAt?: string;
  completedAt?: string;
  elapsedMs: number;
  itemCount: number;
}
```

#### 4.1.3 Bill Split (New)

```typescript
// /src/types/bill.ts

interface BillSplit {
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

type SplitMode = 'even' | 'by_items' | 'mixed';
type BillStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

interface SplitParticipant {
  personId: string;          // Generated ID for anonymous guests
  name?: string;             // Optional name
  share: number;             // Percentage for even/mixed (0-100)
  assignedItems: AssignedItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

interface AssignedItem {
  itemDocumentId: string;
  itemSlug: string;
  portion: number;           // 0-1, for partial assignment
}

interface SplitTotals {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  unassigned: number;        // Amount not yet assigned
}

type PaymentMethod = 'cash' | 'card' | 'paylater';
```

#### 4.1.4 Employee Profile (New)

```typescript
// /src/types/profile.ts

interface EmployeeProfile {
  documentId: string;
  slug: string;
  userId: string;
  name: string;
  avatar?: string;
  role: UserRole;
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

type UserRole = 'admin' | 'manager' | 'chef' | 'waiter' | 'host' | 'bartender';

type Department =
  | 'kitchen'
  | 'service'
  | 'bar'
  | 'management'
  | 'host';

type EmployeeStatus = 'active' | 'break' | 'offline' | 'vacation' | 'terminated';

interface ContactInfo {
  phone?: string;
  email?: string;
  emergencyContact?: string;
}

interface ShiftAssignment {
  documentId: string;
  date: string;              // YYYY-MM-DD
  startTime: string;         // HH:mm
  endTime: string;
  department: Department;
  station?: KitchenStation;
  status: ShiftStatus;
}

type ShiftStatus = 'scheduled' | 'started' | 'completed' | 'absent' | 'cancelled';

interface KPITarget {
  metric: KPIMetric;
  period: 'daily' | 'weekly' | 'monthly';
  target: number;
  unit: string;
}

interface KPIActual {
  metric: KPIMetric;
  period: string;            // YYYY-MM-DD or YYYY-WW or YYYY-MM
  value: number;
  updatedAt: string;
}

type KPIMetric =
  | 'orders_served'
  | 'average_ticket_time'
  | 'upsell_rate'
  | 'customer_rating'
  | 'dishes_prepared'
  | 'waste_rate';
```

#### 4.1.5 SmartStorage Entities (Enhanced)

```typescript
// /src/types/storage.ts

interface Product {
  // Existing fields (renamed id → documentId)
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

  // NEW fields
  categoryPath: string[];    // ["Meat", "Poultry", "Chicken"]
  barcode?: string;
  grossWeight?: number;      // Weight as purchased
  netWeight?: number;        // Usable weight after initial cleaning
  yieldProfileId?: string;   // Link to YieldProfile
  defaultProcessType?: ProcessType;
  costPerUnit: number;       // Current average cost
  suppliers: string[];       // Supplier documentIds
}

type ProductUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'portion';

interface YieldProfile {
  documentId: string;
  slug: string;
  name: string;              // e.g., "Banana Standard", "Beef Tenderloin"
  productId: string;

  // Base yield ratio (cleaning)
  baseYieldRatio: number;    // 0-1, e.g., 0.67 for banana (2/3 usable)

  // Process-specific ratios
  processYields: ProcessYield[];

  // Waste breakdown
  wasteBreakdown: WasteComponent[];

  createdAt: string;
  updatedAt: string;
}

interface ProcessYield {
  processType: ProcessType;
  yieldRatio: number;        // After this process
  moistureLoss?: number;     // 0-1, for boiling/rendering
  oilAbsorption?: number;    // 0-1, for frying
  temperatureRange?: [number, number];
  timeRange?: [number, number]; // Minutes
  notes?: string;
}

interface WasteComponent {
  name: string;              // e.g., "skin", "bones", "seeds"
  percentage: number;        // 0-1
  disposalType: 'trash' | 'compost' | 'recyclable' | 'stock';
}

type ProcessType =
  | 'cleaning'    // Очистка
  | 'boiling'     // Варка
  | 'frying'      // Вижарка
  | 'rendering'   // Виварка
  | 'baking'      // Випікання
  | 'grilling'    // Гриль
  | 'portioning'; // Порціонування

interface StorageBatch {
  documentId: string;
  slug: string;
  productId: string;
  product: Product;
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
  netAvailable: number;      // After all processes, before usage
  usedAmount: number;        // Used in dishes
  wastedAmount: number;      // Written off
  status: BatchStatus;
}

type BatchStatus = 'received' | 'processing' | 'available' | 'depleted' | 'expired' | 'written_off';

interface BatchProcess {
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
  processTime?: number;      // Minutes

  // Yield validation
  expectedYield: number;
  actualYield: number;
  variancePercent: number;

  notes?: string;
}

interface StorageHistory {
  documentId: string;
  productId: string;
  batchId?: string;

  operationType: StorageOperationType;
  quantity: number;
  unit: ProductUnit;

  // Context
  orderId?: string;          // If used for order
  recipeId?: string;         // If part of recipe
  writeOffReason?: WriteOffReason;

  // Audit
  timestamp: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
}

type StorageOperationType =
  | 'receive'
  | 'clean'
  | 'process'
  | 'use'
  | 'write_off'
  | 'transfer'
  | 'adjust'
  | 'return';

type WriteOffReason =
  | 'expired'
  | 'damaged'
  | 'spoiled'
  | 'theft'
  | 'cooking_loss'
  | 'quality_fail'
  | 'customer_return'
  | 'inventory_adjust'
  | 'other';
```

### 4.2 Localization Keys

```typescript
// /src/lib/i18n/courses.ts

export const COURSE_LABELS: Record<CourseType, Record<string, string>> = {
  appetizer: {
    uk: 'Закуска',
    en: 'Appetizer',
  },
  starter: {
    uk: 'Стартер',
    en: 'Starter',
  },
  soup: {
    uk: 'Суп',
    en: 'Soup',
  },
  main: {
    uk: 'Основне блюдо',
    en: 'Main Course',
  },
  dessert: {
    uk: 'Десерт',
    en: 'Dessert',
  },
  drink: {
    uk: 'Напій',
    en: 'Drink',
  },
};

export const PROCESS_LABELS: Record<ProcessType, Record<string, string>> = {
  cleaning: { uk: 'Очистка', en: 'Cleaning' },
  boiling: { uk: 'Варка', en: 'Boiling' },
  frying: { uk: 'Вижарка', en: 'Frying' },
  rendering: { uk: 'Виварка', en: 'Rendering' },
  baking: { uk: 'Випікання', en: 'Baking' },
  grilling: { uk: 'Гриль', en: 'Grilling' },
  portioning: { uk: 'Порціонування', en: 'Portioning' },
};
```

### 4.3 Migration Scripts

#### 4.3.1 Migration 001: Add Course Fields to Orders

```typescript
// /migrations/001_add_course_fields.ts

export const up = async (strapi: Strapi) => {
  // Add fields to order-item content type
  await strapi.db.connection.schema.alterTable('order_items', (table) => {
    table.string('course_type').defaultTo('main');
    table.integer('course_index').defaultTo(0);
    table.jsonb('comment').nullable();
    table.jsonb('comment_history').defaultTo('[]');
    table.timestamp('prep_start_at').nullable();
    table.bigInteger('prep_elapsed_ms').defaultTo(0);
    table.timestamp('served_at').nullable();
    table.string('undo_ref').nullable();
  });

  // Add indexes for filtering
  await strapi.db.connection.schema.alterTable('order_items', (table) => {
    table.index('course_type');
    table.index('status');
  });

  // Add table session fields to orders
  await strapi.db.connection.schema.alterTable('orders', (table) => {
    table.string('table_session_id').nullable();
    table.timestamp('table_start_at').nullable();
    table.bigInteger('table_elapsed_ms').defaultTo(0);
    table.jsonb('split_config').nullable();
    table.jsonb('undo_history').defaultTo('[]');
  });
};

export const down = async (strapi: Strapi) => {
  await strapi.db.connection.schema.alterTable('order_items', (table) => {
    table.dropColumn('course_type');
    table.dropColumn('course_index');
    table.dropColumn('comment');
    table.dropColumn('comment_history');
    table.dropColumn('prep_start_at');
    table.dropColumn('prep_elapsed_ms');
    table.dropColumn('served_at');
    table.dropColumn('undo_ref');
  });

  await strapi.db.connection.schema.alterTable('orders', (table) => {
    table.dropColumn('table_session_id');
    table.dropColumn('table_start_at');
    table.dropColumn('table_elapsed_ms');
    table.dropColumn('split_config');
    table.dropColumn('undo_history');
  });
};
```

#### 4.3.2 Migration 002: Add SmartStorage Tables

```typescript
// /migrations/002_add_smart_storage.ts

export const up = async (strapi: Strapi) => {
  // Yield Profiles table
  await strapi.db.connection.schema.createTable('yield_profiles', (table) => {
    table.string('document_id').primary();
    table.string('slug').unique().notNullable();
    table.string('name').notNullable();
    table.string('product_id').references('document_id').inTable('products');
    table.decimal('base_yield_ratio', 5, 4).notNullable();
    table.jsonb('process_yields').defaultTo('[]');
    table.jsonb('waste_breakdown').defaultTo('[]');
    table.timestamps(true, true);

    table.index('product_id');
    table.index('slug');
  });

  // Storage Batches table
  await strapi.db.connection.schema.createTable('storage_batches', (table) => {
    table.string('document_id').primary();
    table.string('slug').unique().notNullable();
    table.string('product_id').references('document_id').inTable('products');
    table.string('yield_profile_id').references('document_id').inTable('yield_profiles');
    table.decimal('gross_in', 12, 4).notNullable();
    table.decimal('unit_cost', 12, 4).notNullable();
    table.decimal('total_cost', 12, 4).notNullable();
    table.string('supplier_id').nullable();
    table.string('invoice_number').nullable();
    table.timestamp('received_at').notNullable();
    table.date('expiry_date').nullable();
    table.string('batch_number').nullable();
    table.string('barcode').nullable();
    table.jsonb('processes').defaultTo('[]');
    table.decimal('net_available', 12, 4).notNullable();
    table.decimal('used_amount', 12, 4).defaultTo(0);
    table.decimal('wasted_amount', 12, 4).defaultTo(0);
    table.string('status').defaultTo('received');
    table.timestamps(true, true);

    table.index('product_id');
    table.index('status');
    table.index('expiry_date');
    table.index('barcode');
  });

  // Storage History table
  await strapi.db.connection.schema.createTable('storage_history', (table) => {
    table.string('document_id').primary();
    table.string('product_id').references('document_id').inTable('products');
    table.string('batch_id').references('document_id').inTable('storage_batches').nullable();
    table.string('operation_type').notNullable();
    table.decimal('quantity', 12, 4).notNullable();
    table.string('unit').notNullable();
    table.string('order_id').nullable();
    table.string('recipe_id').nullable();
    table.string('write_off_reason').nullable();
    table.timestamp('timestamp').notNullable();
    table.string('operator_id').notNullable();
    table.string('operator_name').notNullable();
    table.text('notes').nullable();

    table.index('product_id');
    table.index('batch_id');
    table.index('operation_type');
    table.index('timestamp');
  });

  // Add new fields to products
  await strapi.db.connection.schema.alterTable('products', (table) => {
    table.jsonb('category_path').defaultTo('[]');
    table.string('barcode').nullable();
    table.decimal('gross_weight', 12, 4).nullable();
    table.decimal('net_weight', 12, 4).nullable();
    table.string('yield_profile_id').references('document_id').inTable('yield_profiles').nullable();
    table.string('default_process_type').nullable();
    table.decimal('cost_per_unit', 12, 4).defaultTo(0);
    table.jsonb('suppliers').defaultTo('[]');

    table.index('barcode');
    table.index('yield_profile_id');
  });
};

export const down = async (strapi: Strapi) => {
  await strapi.db.connection.schema.dropTable('storage_history');
  await strapi.db.connection.schema.dropTable('storage_batches');
  await strapi.db.connection.schema.dropTable('yield_profiles');

  await strapi.db.connection.schema.alterTable('products', (table) => {
    table.dropColumn('category_path');
    table.dropColumn('barcode');
    table.dropColumn('gross_weight');
    table.dropColumn('net_weight');
    table.dropColumn('yield_profile_id');
    table.dropColumn('default_process_type');
    table.dropColumn('cost_per_unit');
    table.dropColumn('suppliers');
  });
};
```

#### 4.3.3 Migration 003: Add Employee Profiles

```typescript
// /migrations/003_add_employee_profiles.ts

export const up = async (strapi: Strapi) => {
  await strapi.db.connection.schema.createTable('employee_profiles', (table) => {
    table.string('document_id').primary();
    table.string('slug').unique().notNullable();
    table.string('user_id').notNullable();
    table.string('name').notNullable();
    table.string('avatar').nullable();
    table.string('role').notNullable();
    table.string('department').notNullable();
    table.string('status').defaultTo('offline');
    table.jsonb('contact_info').defaultTo('{}');
    table.jsonb('shifts').defaultTo('[]');
    table.jsonb('current_shift').nullable();
    table.decimal('hours_this_week', 8, 2).defaultTo(0);
    table.decimal('hours_this_month', 8, 2).defaultTo(0);
    table.jsonb('kpi_targets').defaultTo('[]');
    table.jsonb('kpi_actuals').defaultTo('[]');
    table.string('chat_thread_id').nullable();
    table.timestamp('last_active_at').nullable();
    table.timestamps(true, true);

    table.index('user_id');
    table.index('role');
    table.index('department');
    table.index('status');
  });

  await strapi.db.connection.schema.createTable('shift_assignments', (table) => {
    table.string('document_id').primary();
    table.string('profile_id').references('document_id').inTable('employee_profiles');
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.string('department').notNullable();
    table.string('station').nullable();
    table.string('status').defaultTo('scheduled');
    table.timestamps(true, true);

    table.index(['profile_id', 'date']);
    table.index('status');
  });
};

export const down = async (strapi: Strapi) => {
  await strapi.db.connection.schema.dropTable('shift_assignments');
  await strapi.db.connection.schema.dropTable('employee_profiles');
};
```

#### 4.3.4 Migration 004: Add Bill Splits

```typescript
// /migrations/004_add_bill_splits.ts

export const up = async (strapi: Strapi) => {
  await strapi.db.connection.schema.createTable('bill_splits', (table) => {
    table.string('document_id').primary();
    table.string('slug').unique().notNullable();
    table.string('order_id').references('document_id').inTable('orders');
    table.string('mode').notNullable();
    table.jsonb('participants').defaultTo('[]');
    table.jsonb('totals').defaultTo('{}');
    table.timestamp('created_at').notNullable();
    table.string('created_by').notNullable();
    table.string('status').defaultTo('draft');

    table.index('order_id');
    table.index('status');
  });
};

export const down = async (strapi: Strapi) => {
  await strapi.db.connection.schema.dropTable('bill_splits');
};
```

---

## 5. API Contracts and Endpoints

### 5.1 Orders API (Extended)

#### PATCH /orders/{documentId}/items/{slug}

Update order item (course, comment, status).

**Request:**
```json
{
  "courseType": "main",
  "courseIndex": 2,
  "comment": {
    "text": "Без лимона, додати перцю",
    "presets": ["no_lemon", "extra_spicy"],
    "visibility": ["chef", "waiter"]
  },
  "status": "in_progress"
}
```

**Response (200):**
```json
{
  "data": {
    "documentId": "item_abc123",
    "slug": "borsch-table-5-001",
    "menuItem": { ... },
    "courseType": "main",
    "courseIndex": 2,
    "comment": {
      "text": "Без лимона, додати перцю",
      "presets": ["no_lemon", "extra_spicy"],
      "visibility": ["chef", "waiter"],
      "createdAt": "2025-12-21T14:30:00Z",
      "createdBy": "waiter_xyz"
    },
    "status": "in_progress",
    "updatedAt": "2025-12-21T14:30:00Z"
  },
  "success": true
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid course type or status |
| 404 | Order or item not found |
| 409 | Status transition not allowed |

#### POST /orders/{documentId}/items/{slug}/undo

Undo item status with reason.

**Request:**
```json
{
  "reason": "Клієнт відмовився від страви",
  "targetStatus": "pending"
}
```

**Response (200):**
```json
{
  "data": {
    "documentId": "item_abc123",
    "status": "pending",
    "undoRef": "undo_xyz789",
    "undoEntry": {
      "timestamp": "2025-12-21T14:35:00Z",
      "operatorId": "waiter_xyz",
      "operatorName": "Олена Петренко",
      "previousStatus": "ready",
      "newStatus": "pending",
      "reason": "Клієнт відмовився від страви"
    }
  },
  "success": true
}
```

#### POST /orders/{documentId}/split

Create or update bill split.

**Request:**
```json
{
  "mode": "by_items",
  "participants": [
    {
      "personId": "guest_1",
      "name": "Гість 1",
      "assignedItems": [
        { "itemDocumentId": "item_abc", "itemSlug": "borsch-001", "portion": 1.0 },
        { "itemDocumentId": "item_def", "itemSlug": "bread-001", "portion": 0.5 }
      ]
    },
    {
      "personId": "guest_2",
      "name": "Гість 2",
      "assignedItems": [
        { "itemDocumentId": "item_ghi", "itemSlug": "steak-001", "portion": 1.0 },
        { "itemDocumentId": "item_def", "itemSlug": "bread-001", "portion": 0.5 }
      ]
    }
  ],
  "tipPercent": 10
}
```

**Response (200):**
```json
{
  "data": {
    "documentId": "split_xyz",
    "slug": "split-order-123",
    "mode": "by_items",
    "participants": [
      {
        "personId": "guest_1",
        "name": "Гість 1",
        "assignedItems": [...],
        "subtotal": 285.00,
        "tax": 28.50,
        "tip": 31.35,
        "total": 344.85
      },
      {
        "personId": "guest_2",
        "name": "Гість 2",
        "assignedItems": [...],
        "subtotal": 485.00,
        "tax": 48.50,
        "tip": 53.35,
        "total": 586.85
      }
    ],
    "totals": {
      "subtotal": 770.00,
      "tax": 77.00,
      "tip": 84.70,
      "total": 931.70,
      "unassigned": 0
    },
    "status": "draft"
  },
  "success": true
}
```

### 5.2 Table Time API

#### GET /tables/{slug}/time

Get table timer and per-course timings.

**Response (200):**
```json
{
  "data": {
    "tableNumber": 5,
    "sessionId": "session_abc",
    "startedAt": "2025-12-21T12:00:00Z",
    "tableElapsedMs": 3600000,
    "status": "active",
    "courseTimings": [
      {
        "courseType": "appetizer",
        "startedAt": "2025-12-21T12:05:00Z",
        "completedAt": "2025-12-21T12:20:00Z",
        "elapsedMs": 900000,
        "itemCount": 3
      },
      {
        "courseType": "main",
        "startedAt": "2025-12-21T12:25:00Z",
        "completedAt": null,
        "elapsedMs": 2100000,
        "itemCount": 4
      }
    ],
    "activeItems": [
      {
        "documentId": "item_xyz",
        "name": "Стейк",
        "prepElapsedMs": 1200000,
        "status": "in_progress"
      }
    ]
  },
  "success": true,
  "cacheControl": "no-cache"
}
```

### 5.3 Comments API

#### POST /orders/{documentId}/items/{slug}/comments

Add comment to item.

**Request:**
```json
{
  "text": "Алергія на горіхи!",
  "presets": ["allergy_warning"],
  "visibility": ["chef", "waiter", "manager"]
}
```

**Response (201):**
```json
{
  "data": {
    "comment": {
      "text": "Алергія на горіхи!",
      "presets": ["allergy_warning"],
      "visibility": ["chef", "waiter", "manager"],
      "createdAt": "2025-12-21T14:30:00Z",
      "createdBy": "waiter_xyz"
    },
    "historyEntry": {
      "timestamp": "2025-12-21T14:30:00Z",
      "authorId": "waiter_xyz",
      "authorName": "Олена Петренко",
      "value": "Алергія на горіхи!",
      "presets": ["allergy_warning"]
    }
  },
  "success": true
}
```

#### GET /orders/{documentId}/items/{slug}/comments

Get comment history.

**Response (200):**
```json
{
  "data": {
    "current": {
      "text": "Алергія на горіхи!",
      "presets": ["allergy_warning"],
      "visibility": ["chef", "waiter", "manager"],
      "createdAt": "2025-12-21T14:30:00Z",
      "createdBy": "waiter_xyz"
    },
    "history": [
      {
        "timestamp": "2025-12-21T14:30:00Z",
        "authorId": "waiter_xyz",
        "authorName": "Олена Петренко",
        "value": "Алергія на горіхи!",
        "presets": ["allergy_warning"]
      },
      {
        "timestamp": "2025-12-21T14:15:00Z",
        "authorId": "waiter_xyz",
        "authorName": "Олена Петренко",
        "value": "Без цибулі",
        "presets": ["no_onion"]
      }
    ]
  },
  "success": true
}
```

### 5.4 SmartStorage API

#### POST /storage/batch

Receive new batch.

**Request:**
```json
{
  "productId": "prod_abc",
  "grossIn": 10.5,
  "unitCost": 120.00,
  "supplierId": "supp_xyz",
  "invoiceNumber": "INV-2025-001",
  "expiryDate": "2025-12-28",
  "batchNumber": "LOT-20251221",
  "barcode": "4820000000123",
  "yieldProfileId": "yield_abc"
}
```

**Response (201):**
```json
{
  "data": {
    "documentId": "batch_xyz",
    "slug": "beef-lot-20251221",
    "productId": "prod_abc",
    "grossIn": 10.5,
    "totalCost": 1260.00,
    "netAvailable": 10.5,
    "status": "received",
    "receivedAt": "2025-12-21T10:00:00Z"
  },
  "success": true
}
```

#### POST /storage/process/cleaning

Process batch with cleaning.

**Request:**
```json
{
  "batchId": "batch_xyz",
  "grossInput": 10.5,
  "notes": "Стандартна очистка"
}
```

**Response (200):**
```json
{
  "data": {
    "process": {
      "documentId": "proc_abc",
      "processType": "cleaning",
      "grossInput": 10.5,
      "netOutput": 7.035,
      "wasteOutput": 3.465,
      "expectedYield": 0.67,
      "actualYield": 0.67,
      "variancePercent": 0,
      "processedAt": "2025-12-21T10:30:00Z",
      "operatorId": "chef_xyz",
      "operatorName": "Іван Коваль"
    },
    "batch": {
      "documentId": "batch_xyz",
      "netAvailable": 7.035,
      "status": "available"
    }
  },
  "success": true
}
```

#### POST /storage/process/boiling

**Request:**
```json
{
  "batchId": "batch_xyz",
  "grossInput": 5.0,
  "processTemp": 100,
  "processTime": 120,
  "notes": "Варка для бульйону"
}
```

**Response (200):**
```json
{
  "data": {
    "process": {
      "documentId": "proc_def",
      "processType": "boiling",
      "grossInput": 5.0,
      "netOutput": 3.5,
      "wasteOutput": 0,
      "moistureLoss": 0.3,
      "expectedYield": 0.70,
      "actualYield": 0.70,
      "variancePercent": 0,
      "processTemp": 100,
      "processTime": 120,
      "processedAt": "2025-12-21T11:00:00Z"
    },
    "batch": {
      "documentId": "batch_xyz",
      "netAvailable": 5.535,
      "status": "available"
    }
  },
  "success": true
}
```

#### POST /storage/process/frying

**Request:**
```json
{
  "batchId": "batch_xyz",
  "grossInput": 2.0,
  "processTemp": 180,
  "processTime": 15,
  "oilUsed": 0.3,
  "notes": "Глибока вижарка"
}
```

**Response (200):**
```json
{
  "data": {
    "process": {
      "documentId": "proc_ghi",
      "processType": "frying",
      "grossInput": 2.0,
      "netOutput": 1.76,
      "wasteOutput": 0,
      "moistureLoss": 0.20,
      "oilAbsorption": 0.08,
      "expectedYield": 0.88,
      "actualYield": 0.88,
      "variancePercent": 0,
      "processTemp": 180,
      "processTime": 15
    }
  },
  "success": true
}
```

#### GET /storage/history

Get storage history with filters.

**Query Parameters:**
- `productId` - Filter by product
- `batchId` - Filter by batch
- `operationType` - Filter by operation type
- `dateFrom` - Start date (ISO)
- `dateTo` - End date (ISO)
- `operatorId` - Filter by operator
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 50)

**Response (200):**
```json
{
  "data": [
    {
      "documentId": "hist_001",
      "productId": "prod_abc",
      "productName": "Яловичина",
      "batchId": "batch_xyz",
      "operationType": "clean",
      "quantity": 3.465,
      "unit": "kg",
      "timestamp": "2025-12-21T10:30:00Z",
      "operatorName": "Іван Коваль",
      "notes": "Стандартна очистка"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  },
  "success": true
}
```

#### GET /storage/export

Export storage data as CSV/TSV.

**Query Parameters:**
- `format` - "csv" or "tsv" (default: csv)
- `type` - "inventory" | "batches" | "history" | "yields"
- `filters` - Same as history endpoint

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="storage-history-2025-12-21.csv"

document_id,product_name,batch_id,operation,quantity,unit,timestamp,operator
hist_001,Яловичина,batch_xyz,clean,3.465,kg,2025-12-21T10:30:00Z,Іван Коваль
...
```

### 5.5 Profiles API

#### GET /profiles/{slug}

Get employee profile.

**Response (200):**
```json
{
  "data": {
    "documentId": "prof_abc",
    "slug": "ivan-koval",
    "name": "Іван Коваль",
    "role": "chef",
    "department": "kitchen",
    "status": "active",
    "currentShift": {
      "date": "2025-12-21",
      "startTime": "08:00",
      "endTime": "16:00",
      "station": "grill"
    },
    "hoursThisWeek": 32.5,
    "kpiActuals": [
      {
        "metric": "dishes_prepared",
        "period": "2025-12-21",
        "value": 47
      },
      {
        "metric": "average_ticket_time",
        "period": "2025-12-21",
        "value": 8.5
      }
    ]
  },
  "success": true
}
```

#### GET /kpi/dashboard

Get KPI dashboard aggregates.

**Query Parameters:**
- `period` - "today" | "week" | "month"
- `department` - Filter by department
- `role` - Filter by role

**Response (200):**
```json
{
  "data": {
    "period": "today",
    "summary": {
      "totalOrders": 127,
      "averageTicketTime": 12.3,
      "totalRevenue": 45680.00,
      "wasteRate": 0.034
    },
    "byDepartment": {
      "kitchen": {
        "dishesCompleted": 342,
        "averageTime": 9.8,
        "staff": 5
      },
      "service": {
        "ordersServed": 127,
        "averageRating": 4.7,
        "staff": 8
      }
    },
    "topPerformers": [
      {
        "profileId": "prof_abc",
        "name": "Іван Коваль",
        "metric": "dishes_prepared",
        "value": 67
      }
    ],
    "alerts": [
      {
        "type": "understaffed",
        "department": "kitchen",
        "message": "Потрібен ще 1 кухар на вечірню зміну"
      }
    ]
  },
  "success": true
}
```

### 5.6 Comment Presets

```json
// GET /config/comment-presets

{
  "data": {
    "modifiers": [
      { "key": "no_salt", "label": { "uk": "Без солі", "en": "No salt" }, "icon": "salt-off" },
      { "key": "no_pepper", "label": { "uk": "Без перцю", "en": "No pepper" }, "icon": "pepper-off" },
      { "key": "no_onion", "label": { "uk": "Без цибулі", "en": "No onion" }, "icon": "onion-off" },
      { "key": "no_garlic", "label": { "uk": "Без часнику", "en": "No garlic" }, "icon": "garlic-off" },
      { "key": "no_lemon", "label": { "uk": "Без лимона", "en": "No lemon" }, "icon": "lemon-off" },
      { "key": "extra_spicy", "label": { "uk": "Гостріше", "en": "Extra spicy" }, "icon": "flame" },
      { "key": "less_spicy", "label": { "uk": "Менш гостро", "en": "Less spicy" }, "icon": "flame-off" },
      { "key": "well_done", "label": { "uk": "Добре просмажити", "en": "Well done" }, "icon": "thermometer-sun" },
      { "key": "rare", "label": { "uk": "Із кров'ю", "en": "Rare" }, "icon": "thermometer-snowflake" }
    ],
    "allergies": [
      { "key": "allergy_nuts", "label": { "uk": "Алергія: горіхи", "en": "Allergy: nuts" }, "severity": "critical", "icon": "alert-triangle" },
      { "key": "allergy_dairy", "label": { "uk": "Алергія: молочне", "en": "Allergy: dairy" }, "severity": "critical", "icon": "alert-triangle" },
      { "key": "allergy_gluten", "label": { "uk": "Алергія: глютен", "en": "Allergy: gluten" }, "severity": "critical", "icon": "alert-triangle" },
      { "key": "allergy_seafood", "label": { "uk": "Алергія: морепродукти", "en": "Allergy: seafood" }, "severity": "critical", "icon": "alert-triangle" }
    ],
    "dietary": [
      { "key": "vegetarian", "label": { "uk": "Вегетаріанське", "en": "Vegetarian" }, "icon": "leaf" },
      { "key": "vegan", "label": { "uk": "Веганське", "en": "Vegan" }, "icon": "vegan" },
      { "key": "halal", "label": { "uk": "Халяль", "en": "Halal" }, "icon": "halal" },
      { "key": "kosher", "label": { "uk": "Кошер", "en": "Kosher" }, "icon": "kosher" }
    ]
  },
  "success": true
}
```

### 5.7 Error Response Format

All error responses follow this format:

```json
{
  "data": null,
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid course type",
    "details": {
      "field": "courseType",
      "received": "invalid",
      "expected": ["appetizer", "starter", "soup", "main", "dessert", "drink"]
    }
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | State conflict (e.g., invalid status transition) |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| INTERNAL_ERROR | 500 | Server error |

---

## 6. UX/UI Changes and Flows

### 6.1 Order Card with Courses

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Замовлення #1234                            Стіл 5 │ ⏱ 00:45:32       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬────────┬─────────┬─────────┬─────────┐          │
│  │ Закуска │ Стартер │  Суп   │ Основне │ Десерт  │  Напій  │          │
│  └────┬────┴─────────┴────────┴────┬────┴─────────┴─────────┘          │
│       ▼                             ▼                                   │
│  ┌──────────────────────────┐ ┌──────────────────────────┐             │
│  │ 🥗 Салат Цезар    ×1    │ │ 🥩 Стейк Рібай     ×1    │             │
│  │ ├ ⏱ 00:08:45            │ │ ├ ⏱ 00:12:30            │             │
│  │ ├ 💬 "Без анчоусів"     │ │ ├ 💬 "Medium rare"       │             │
│  │ └ 🟢 Готово              │ │ └ 🟡 Готується           │             │
│  └──────────────────────────┘ └──────────────────────────┘             │
│                                                                         │
│  ┌──────────────────────────┐                                           │
│  │ 🍷 Червоне вино    ×2    │                                           │
│  │ ├ ⏱ 00:02:15            │                                           │
│  │ └ 🟢 Подано              │                                           │
│  └──────────────────────────┘                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ [+ Додати страву]    [💬 Коментар]    [✂️ Розділити]    [💳 Рахунок]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Course Section Component

```tsx
// /src/features/orders/course-section.tsx

interface CourseSectionProps {
  courseType: CourseType;
  items: OrderItem[];
  courseElapsedMs: number;
  onItemClick: (item: OrderItem) => void;
  onAddComment: (itemId: string) => void;
  onStatusChange: (itemId: string, status: OrderItemStatus) => void;
}

// Visual states:
// - Empty: Dashed border, "+" button to add items
// - Pending: Gray background, timer not started
// - In Progress: Blue pulsing border, active timer
// - Ready: Green background, timer stopped
// - All Served: Collapsed with checkmark
```

### 6.3 Comment Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Коментар до страви                                    [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🥩 Стейк Рібай                                                │
│                                                                 │
│  ┌─── Модифікатори ───────────────────────────────────────────┐ │
│  │ [🚫 Без солі] [🚫 Без перцю] [🌶️ Гостріше] [🔥 Well done] │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Алергії (КРИТИЧНО) ─────────────────────────────────────┐ │
│  │ [⚠️ Горіхи] [⚠️ Молочне] [⚠️ Глютен] [⚠️ Морепродукти]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Додатковий коментар ────────────────────────────────────┐ │
│  │ Medium rare, соус окремо                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  👁️ Видимість: [✓] Кухар  [✓] Офіціант  [ ] Менеджер         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Скасувати]  [💾 Зберегти]         │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Bill Split Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✂️ Розділити рахунок                                            [×]   │
├─────────────────────────────────────────────────────────────────────────┤
│  Режим: ( ) Порівну  (•) За стравами  ( ) Змішаний                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Стіл 5 │ Всього: ₴1,856.00  │  Залишок: ₴0.00                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐│
│  │ 👤 Гість 1           │  │ 👤 Гість 2           │  │ [+ Гість]      ││
│  │ ─────────────────────│  │ ─────────────────────│  │                ││
│  │ 🥗 Салат Цезар  ₴185 │  │ 🥩 Стейк       ₴485  │  │                ││
│  │ 🍷 Вино (1/2)    ₴95 │  │ 🍷 Вино (1/2)   ₴95  │  │                ││
│  │ 🍰 Чізкейк      ₴120 │  │ ☕ Еспресо      ₴65  │  │                ││
│  │ ─────────────────────│  │ ─────────────────────│  │                ││
│  │ Підсумок:       ₴400 │  │ Підсумок:      ₴645  │  │                ││
│  │ Податок (10%):   ₴40 │  │ Податок (10%):  ₴65  │  │                ││
│  │ Чайові (10%):    ₴44 │  │ Чайові (10%):   ₴71  │  │                ││
│  │ ═════════════════════│  │ ═════════════════════│  │                ││
│  │ ВСЬОГО:         ₴484 │  │ ВСЬОГО:        ₴781  │  │                ││
│  │                      │  │                      │  │                ││
│  │ [💵 Готівка]         │  │ [💳 Картка]          │  │                ││
│  │ [✓ Оплачено]         │  │ [ Очікує ]           │  │                ││
│  └──────────────────────┘  └──────────────────────┘  └────────────────┘│
│                                                                         │
│  Перетягніть страви між гостями або клікніть для призначення           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                         [Скасувати]  [📄 Друк чеків]  [✓ Підтвердити]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Kitchen Display with Courses

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🍳 Кухня                              🟢 Online    📅 21.12.2025       │
├─────────────────────────────────────────────────────────────────────────┤
│  [Всі] [Закуски] [Основні] [Десерти]     🔍 Пошук    [Станція: Гриль▼] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─── НОВІ ──────────────┐  ┌─── ГОТУЮТЬСЯ ────────┐  ┌─── ГОТОВО ───┐│
│   │                        │  │                      │  │              ││
│   │ ┌────────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────┐ ││
│   │ │ 🔴 RUSH  Стіл 5    │ │  │ │ Стіл 3           │ │  │ │ Стіл 7   │ ││
│   │ │ #1234 │ 00:02:15   │ │  │ │ #1232 │ 00:08:45 │ │  │ │ #1230    │ ││
│   │ │ ──────────────────│ │  │ │ ─────────────────│ │  │ │ ─────────│ ││
│   │ │ 📦 ОСНОВНІ         │ │  │ │ 📦 ЗАКУСКИ       │ │  │ │ 2× Салат │ ││
│   │ │  2× Стейк Рібай   │ │  │ │  1× Карпачо      │ │  │ │ 1× Суп   │ ││
│   │ │  💬 Medium rare   │ │  │ │ 📦 ОСНОВНІ       │ │  │ │          │ ││
│   │ │  1× Лосось        │ │  │ │  1× Паста        │ │  │ │[Подано ✓]│ ││
│   │ │  💬 ⚠️ Без горіхів│ │  │ │                  │ │  │ └──────────┘ ││
│   │ │ ──────────────────│ │  │ │ [⏸️] [Готово ✓]  │ │  │              ││
│   │ │ [Почати ▶️]        │ │  │ └──────────────────┘ │  │              ││
│   │ └────────────────────┘ │  │                      │  │              ││
│   │                        │  │                      │  │              ││
│   │        (3)             │  │        (2)           │  │     (5)      ││
│   └────────────────────────┘  └──────────────────────┘  └──────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 Середній час: 8.5хв   🔔 2 нових замовлення                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Undo Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  ↩️ Повернути статус                                       [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🥩 Стейк Рібай                                                │
│                                                                 │
│  Поточний статус: 🟢 Готово                                    │
│  Повернути до:    🟡 Готується                                 │
│                                                                 │
│  ┌─── Причина (обов'язково) ──────────────────────────────────┐ │
│  │ [Клієнт відмовився] [Неправильне приготування]             │ │
│  │ [Алергія] [Забруднення] [Інше]                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Додатковий коментар ────────────────────────────────────┐ │
│  │ Клієнт попросив more rare                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⚠️ Ця дія буде записана в аудит-лог                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Скасувати]  [↩️ Повернути]        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 SmartStorage Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📦 SmartStorage                                        📅 21.12.2025   │
├─────────────────────────────────────────────────────────────────────────┤
│  [Запаси] [Партії] [Процеси] [Вихід] [Історія] [Експорт]               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── Фільтри ─────────────────────────────────────────────────────┐   │
│  │ Категорія: [М'ясо ▼] > [Яловичина ▼] > [Вирізка ▼]             │   │
│  │ Процес: [ ] Очистка [✓] Варка [✓] Вижарка [ ] Виварка          │   │
│  │ Статус: [✓] Доступно [✓] Обробка [ ] Вичерпано [ ] Списано     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── KPI ─────────────────────────────────────────────────────────┐   │
│  │  📊 Загальні запаси: 234.5 кг    💰 Вартість: ₴45,680           │   │
│  │  📉 Втрати сьогодні: 12.3 кг (5.2%)    ⚠️ Критичні: 3 позиції  │   │
│  │  🔄 Середній вихід: 67.8%    📦 Партій на обробці: 5            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── Продукти ────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │ 🥩 Яловичина вирізка           Штрихкод: 4820000001234    │ │   │
│  │  │ ───────────────────────────────────────────────────────── │ │   │
│  │  │ Запас: ████████████░░░░ 12.5 / 20 кг     Мін: 5 кг        │ │   │
│  │  │ Вихід: 72% (очистка) → 85% (гриль) = 61.2% загальний      │ │   │
│  │  │ Вартість: ₴450/кг brutto → ₴735/кг netto                  │ │   │
│  │  │ Термін: 5 днів                ⚠️ Замовити скоро            │ │   │
│  │  │                                                            │ │   │
│  │  │ [📊 Історія] [🔬 Процес] [📝 Списати] [📦 Прийняти]        │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── Сканер ──────────────────────────────────────────────────────┐   │
│  │  [📷 Сканувати штрихкод]    або введіть: [____________] [🔍]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Process Batch Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  🔬 Обробка партії                                         [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 Партія: LOT-20251221-001                                   │
│  🥩 Продукт: Яловичина вирізка                                 │
│  📊 Доступно: 10.5 кг                                          │
│                                                                 │
│  ┌─── Тип процесу ────────────────────────────────────────────┐ │
│  │ (•) Очистка  ( ) Варка  ( ) Вижарка  ( ) Виварка          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Параметри ──────────────────────────────────────────────┐ │
│  │ Вхід (brutto):  [10.5  ] кг                                │ │
│  │                                                             │ │
│  │ Очікуваний вихід (за профілем 72%):                        │ │
│  │   Netto:  7.56 кг                                          │ │
│  │   Відходи: 2.94 кг                                         │ │
│  │                                                             │ │
│  │ Фактичний вихід:  [7.60  ] кг   📊 Відхилення: +0.5%       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Відходи ────────────────────────────────────────────────┐ │
│  │ Шкура:   1.2 кг  [🗑️ Сміття]                               │ │
│  │ Жир:     1.0 кг  [♻️ Виварка]                               │ │
│  │ Кістки:  0.74 кг [🍲 На бульйон]                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Примітка: [Стандартна очистка, якість OK________________]     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        [Скасувати]  [✓ Зафіксувати обробку]    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.9 Employee Profile View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👤 Профіль співробітника                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  Іван Коваль                                         │
│  │              │  🍳 Шеф-кухар │ Кухня │ Гриль                        │
│  │    [ФОТО]    │  ───────────────────────                             │
│  │              │  📱 +380 67 123 4567                                 │
│  │   🟢 Active  │  📧 ivan.koval@restaurant.ua                         │
│  └──────────────┘                                                       │
│                                                                         │
│  ┌─── Поточна зміна ──────────────────────────────────────────────┐    │
│  │  📅 21.12.2025   ⏰ 08:00 - 16:00   ⏱️ Відпрацьовано: 6:32     │    │
│  │  📍 Станція: Гриль                                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─── KPI сьогодні ───────────────────────────────────────────────┐    │
│  │  🍽️ Страв приготовано: 47 / 50 (ціль)   ████████████░░ 94%     │    │
│  │  ⏱️ Середній час: 8.5 хв (ціль: 10 хв)  ██████████████ 117%   │    │
│  │  📉 Втрати: 2.3%  (ціль: <5%)           ██████████████ ✓      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─── Години ─────────────────────────────────────────────────────┐    │
│  │  Цей тиждень: 32.5 год    Цей місяць: 156 год                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  [📅 Графік]  [📊 Детальна статистика]  [💬 Чат]  [⚙️ Налаштування]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.10 Accessibility & Performance Guidelines

#### Touch Targets
- Minimum 44×44px for iOS, 48×48px for Android
- 8px minimum spacing between interactive elements

#### Keyboard Navigation
- `Tab` / `Shift+Tab` - navigate between elements
- `Enter` / `Space` - activate buttons
- `Esc` - close modals
- `Arrow keys` - navigate within lists/grids

#### KDS-Specific Hotkeys
| Key | Action |
|-----|--------|
| `1-9` | Select ticket by position |
| `S` | Start cooking selected ticket |
| `D` | Mark selected as done |
| `U` | Undo last action |
| `R` | Refresh tickets |
| `F` | Toggle filter panel |

#### Performance Targets
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Animations: 60fps minimum (use `transform`, `opacity` only)
- KDS refresh: <100ms latency
- Large bill modal: <500ms render for 50+ items

#### Offline Support
```typescript
// /src/lib/offline-queue.ts

interface QueuedAction {
  id: string;
  type: 'order' | 'status' | 'comment' | 'split' | 'process';
  payload: unknown;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

// Conflict resolution strategies:
// - Last-write-wins for status changes
// - Merge for comments (append to history)
// - Server-authoritative for inventory
```

---

## 7. Yield Calculation Formulas

### 7.1 Base Yield Calculation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    YIELD CALCULATION PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────┘

  GROSS INPUT              CLEANING                   NET AFTER CLEAN
  (as received)            (yieldRatio)               (usable weight)
       │                        │                           │
       ▼                        ▼                           ▼
   ┌───────┐              ┌───────────┐              ┌───────────┐
   │ 10 kg │ ────────────►│ × 0.72    │─────────────►│  7.2 kg   │
   └───────┘              └───────────┘              └───────────┘
                               │
                               ▼
                          WASTE: 2.8 kg
                          (skin, bones, fat)


  NET AFTER CLEAN          COOKING                    NET AFTER COOK
  (usable weight)          (process-specific)         (finished product)
       │                        │                           │
       ▼                        ▼                           ▼
   ┌───────┐              ┌───────────┐              ┌───────────┐
   │ 7.2 kg│ ────────────►│ × 0.85    │─────────────►│  6.12 kg  │
   └───────┘              │ (grill)   │              └───────────┘
                          └───────────┘
                               │
                               ▼
                          LOSS: 1.08 kg
                          (moisture evaporation)
```

### 7.2 Formula Definitions

#### 7.2.1 Basic Yield (Cleaning)

```
netOut = grossIn × yieldRatio

where:
  grossIn    = weight as purchased (kg)
  yieldRatio = usable fraction (0-1), e.g., 0.72 for beef tenderloin
  netOut     = usable weight after cleaning (kg)

wasteOut = grossIn - netOut
         = grossIn × (1 - yieldRatio)
```

**Example: Banana**
```
grossIn    = 1.0 kg
yieldRatio = 0.67 (2/3 flesh, 1/3 peel)
netOut     = 1.0 × 0.67 = 0.67 kg
wasteOut   = 1.0 × 0.33 = 0.33 kg (peel)
```

#### 7.2.2 Boiling (Moisture Loss)

```
netAfterBoil = netIn × (1 - moistureLoss)

where:
  netIn        = input weight after cleaning (kg)
  moistureLoss = fraction of weight lost to evaporation (0-1)
  netAfterBoil = output weight after boiling (kg)

Typical moistureLoss values:
  - Vegetables: 0.05 - 0.15
  - Pasta: -0.50 (gains weight from water absorption)
  - Rice: -1.0 (doubles in weight)
  - Meat: 0.20 - 0.35
  - Stock bones: 0.50 - 0.60 (for concentrate)
```

**Example: Beef for Stew**
```
netIn        = 5.0 kg (after cleaning)
moistureLoss = 0.30 (30% moisture loss)
netAfterBoil = 5.0 × (1 - 0.30) = 3.5 kg
```

#### 7.2.3 Frying (Moisture Loss + Oil Absorption)

```
netAfterFry = netIn × (1 - moistureLoss + oilAbsorption)

where:
  netIn         = input weight (kg)
  moistureLoss  = fraction lost to evaporation (0-1)
  oilAbsorption = fraction of oil absorbed (0-1, relative to input)
  netAfterFry   = output weight (kg)

Typical values:
  - Deep fry: moistureLoss = 0.15-0.25, oilAbsorption = 0.08-0.15
  - Pan fry:  moistureLoss = 0.10-0.20, oilAbsorption = 0.03-0.08
  - Stir fry: moistureLoss = 0.05-0.15, oilAbsorption = 0.02-0.05
```

**Example: Deep Fried Chicken**
```
netIn         = 2.0 kg (breaded chicken pieces)
moistureLoss  = 0.20 (20% water evaporation)
oilAbsorption = 0.08 (8% oil absorbed)
netAfterFry   = 2.0 × (1 - 0.20 + 0.08) = 2.0 × 0.88 = 1.76 kg
```

#### 7.2.4 Rendering (Fat Extraction)

```
netAfterRender = grossFat × fatYield

where:
  grossFat  = raw fat input (kg)
  fatYield  = fraction of pure fat extracted (0-1)

Byproducts:
  cracklingsOut = grossFat × cracklingsRatio
  wasteOut      = grossFat - netAfterRender - cracklingsOut

Typical fatYield values:
  - Pork fat: 0.75 - 0.85
  - Beef tallow: 0.70 - 0.80
  - Chicken fat: 0.60 - 0.70
```

**Example: Pork Lard Rendering**
```
grossFat      = 5.0 kg (raw pork fat)
fatYield      = 0.80
cracklingsRatio = 0.10

netAfterRender = 5.0 × 0.80 = 4.0 kg (pure lard)
cracklingsOut  = 5.0 × 0.10 = 0.5 kg (шкварки)
wasteOut       = 5.0 - 4.0 - 0.5 = 0.5 kg
```

### 7.3 Combined Process Chain

```
totalYield = yieldRatio × processYield₁ × processYield₂ × ... × processYieldₙ

where each processYield = (1 - moistureLoss + oilAbsorption) for that process
```

**Example: Beef Tenderloin → Grilled Steak**

```
Step 1: Receiving
  grossIn = 10.0 kg
  cost = ₴450/kg
  totalCost = ₴4,500

Step 2: Cleaning (trimming fat, silver skin)
  yieldRatio = 0.72
  netAfterClean = 10.0 × 0.72 = 7.2 kg
  wasteOut = 2.8 kg (fat, trim → rendered for stock)
  costPerKg = ₴4,500 / 7.2 = ₴625/kg

Step 3: Portioning
  portionSize = 0.3 kg
  portions = 7.2 / 0.3 = 24 portions
  costPerPortion = ₴625 × 0.3 = ₴187.50

Step 4: Grilling
  moistureLoss = 0.15
  netAfterGrill = 0.3 × (1 - 0.15) = 0.255 kg per portion

Final yield:
  totalYield = 0.72 × 0.85 = 0.612 (61.2%)
  netFinal = 10.0 × 0.612 = 6.12 kg
  costPerKgFinal = ₴4,500 / 6.12 = ₴735/kg
```

### 7.4 Variance Tracking

```typescript
// /src/lib/yield-calculator.ts

interface YieldVariance {
  expectedYield: number;
  actualYield: number;
  varianceKg: number;
  variancePercent: number;
  withinTolerance: boolean;
}

function calculateVariance(
  expectedYieldRatio: number,
  grossInput: number,
  actualNetOutput: number,
  tolerancePercent: number = 5
): YieldVariance {
  const expectedNet = grossInput * expectedYieldRatio;
  const actualYieldRatio = actualNetOutput / grossInput;
  const varianceKg = actualNetOutput - expectedNet;
  const variancePercent = ((actualYieldRatio - expectedYieldRatio) / expectedYieldRatio) * 100;

  return {
    expectedYield: expectedYieldRatio,
    actualYield: actualYieldRatio,
    varianceKg,
    variancePercent,
    withinTolerance: Math.abs(variancePercent) <= tolerancePercent
  };
}

// Alert if variance exceeds threshold
function checkYieldAlert(variance: YieldVariance): Alert | null {
  if (!variance.withinTolerance) {
    const direction = variance.variancePercent > 0 ? 'higher' : 'lower';
    return {
      severity: Math.abs(variance.variancePercent) > 10 ? 'critical' : 'warning',
      message: `Yield ${Math.abs(variance.variancePercent).toFixed(1)}% ${direction} than expected`
    };
  }
  return null;
}
```

### 7.5 Cost Impact Calculation

```typescript
// Impact on dish cost when yield changes

interface CostImpact {
  originalCostPerPortion: number;
  adjustedCostPerPortion: number;
  impactPercent: number;
  totalImpactPerBatch: number;
}

function calculateCostImpact(
  batchCost: number,
  expectedYield: number,
  actualYield: number,
  portionSize: number,
  expectedPortions: number
): CostImpact {
  const originalCostPerPortion = batchCost / expectedPortions;

  const actualNetOutput = (batchCost / originalCostPerPortion) * (actualYield / expectedYield);
  const actualPortions = actualNetOutput / portionSize;
  const adjustedCostPerPortion = batchCost / actualPortions;

  return {
    originalCostPerPortion,
    adjustedCostPerPortion,
    impactPercent: ((adjustedCostPerPortion - originalCostPerPortion) / originalCostPerPortion) * 100,
    totalImpactPerBatch: (adjustedCostPerPortion - originalCostPerPortion) * actualPortions
  };
}
```

### 7.6 Yield Profile Examples

```json
// Banana
{
  "documentId": "yield_banana",
  "name": "Banana Standard",
  "baseYieldRatio": 0.67,
  "processYields": [],
  "wasteBreakdown": [
    { "name": "peel", "percentage": 0.33, "disposalType": "compost" }
  ]
}

// Beef Tenderloin
{
  "documentId": "yield_beef_tenderloin",
  "name": "Beef Tenderloin Premium",
  "baseYieldRatio": 0.72,
  "processYields": [
    {
      "processType": "grilling",
      "yieldRatio": 0.85,
      "moistureLoss": 0.15,
      "temperatureRange": [180, 220],
      "timeRange": [8, 15]
    },
    {
      "processType": "boiling",
      "yieldRatio": 0.70,
      "moistureLoss": 0.30,
      "temperatureRange": [95, 100],
      "timeRange": [90, 180]
    }
  ],
  "wasteBreakdown": [
    { "name": "fat", "percentage": 0.15, "disposalType": "stock" },
    { "name": "silver_skin", "percentage": 0.10, "disposalType": "trash" },
    { "name": "trim", "percentage": 0.03, "disposalType": "stock" }
  ]
}

// Chicken Whole
{
  "documentId": "yield_chicken_whole",
  "name": "Chicken Whole",
  "baseYieldRatio": 0.65,
  "processYields": [
    {
      "processType": "frying",
      "yieldRatio": 0.88,
      "moistureLoss": 0.20,
      "oilAbsorption": 0.08,
      "temperatureRange": [160, 180],
      "timeRange": [12, 18]
    },
    {
      "processType": "grilling",
      "yieldRatio": 0.82,
      "moistureLoss": 0.18,
      "temperatureRange": [180, 200],
      "timeRange": [25, 40]
    }
  ],
  "wasteBreakdown": [
    { "name": "bones", "percentage": 0.20, "disposalType": "stock" },
    { "name": "skin", "percentage": 0.10, "disposalType": "recyclable" },
    { "name": "organs", "percentage": 0.05, "disposalType": "trash" }
  ]
}
```

---

## 8. Test Cases and Acceptance Criteria

### 8.1 Order Card with Courses

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| OC-001 | Add item to specific course | Item appears in correct course section | High |
| OC-002 | Reorder items within course | Items maintain new order, courseIndex updated | Medium |
| OC-003 | Move item between courses | Item moves, course timers recalculate | Medium |
| OC-004 | Display 6 course tabs | All tabs visible: Закуска, Стартер, Суп, Основне, Десерт, Напій | High |
| OC-005 | Empty course display | Shows dashed border with "+" add button | Low |
| OC-006 | Course collapse when all served | Course section collapses with checkmark | Medium |

### 8.2 Table Timer

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| TT-001 | Start table timer on first order | Timer begins when first item sent to kitchen | High |
| TT-002 | Per-course timer starts | Each course timer starts when first item in course starts cooking | High |
| TT-003 | Timer sync across roles | Waiter and chef see identical elapsed times (±1 second) | Critical |
| TT-004 | Timer persists on refresh | Timer continues after page refresh | High |
| TT-005 | Timer color coding | Green <10min, Yellow 10-15min, Red >15min | Medium |
| TT-006 | Timer stops on table close | Timer freezes when table session ends | Medium |

### 8.3 Comments

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| CM-001 | Add text comment | Comment saved and visible | High |
| CM-002 | Add preset modifiers | Presets displayed as chips | High |
| CM-003 | Allergy preset highlight | Allergy presets show with warning icon | Critical |
| CM-004 | Comment visibility by role | Chef sees chef-visible comments only | High |
| CM-005 | Comment history | Previous comments shown in expandable history | Medium |
| CM-006 | Edit existing comment | New version added to history, old preserved | Medium |

### 8.4 Bill Splitting

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| BS-001 | Even split 2 people | Total divided equally, rounded to cents | High |
| BS-002 | Even split odd amount | Difference assigned to first person | Medium |
| BS-003 | By items split | Each person gets assigned items total | High |
| BS-004 | Mixed split | Percentage + specific items correctly calculated | Medium |
| BS-005 | Partial item assignment | Item split between people (e.g., shared appetizer) | Medium |
| BS-006 | Tax/tip distribution | Tax and tip proportionally distributed | High |
| BS-007 | Large bill modal | 50+ items render in <500ms, multi-column layout | Medium |
| BS-008 | Drag-drop assignment | Items draggable between person columns | Low |
| BS-009 | Unassigned warning | Warning shown if items not fully assigned | High |

### 8.5 Undo Functionality

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| UN-001 | Undo "Ready" to "In Progress" | Status reverts, audit log created | High |
| UN-002 | Undo "Served" to "Ready" | Status reverts with reason | High |
| UN-003 | Undo requires reason | Cannot undo without selecting/entering reason | High |
| UN-004 | Audit log entry | Timestamp, operator, reason recorded | Critical |
| UN-005 | Undo notification | Kitchen notified of status rollback | Medium |
| UN-006 | Multiple undo on same item | Each undo adds to history | Medium |
| UN-007 | Undo permission check | Only authorized roles can undo | High |

### 8.6 SmartStorage

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| SS-001 | Scan barcode | Product identified, weight input shown | High |
| SS-002 | Unknown barcode | Error message, manual entry option | Medium |
| SS-003 | Deep category filter | Filter by categoryPath with arbitrary depth | High |
| SS-004 | Process batch cleaning | netOut calculated by yieldProfile | Critical |
| SS-005 | Process batch boiling | Moisture loss applied correctly | High |
| SS-006 | Process batch frying | Moisture loss + oil absorption calculated | High |
| SS-007 | Manual yield override | Operator can enter actual yield, variance recorded | Medium |
| SS-008 | Export to CSV | All columns exported with correct encoding | Medium |
| SS-009 | History filter by date | Only records in date range returned | Medium |
| SS-010 | Low stock alert | Alert when stock ≤ minStock | High |
| SS-011 | Expiry warning | Warning when expiry ≤ 7 days | High |

### 8.7 Yield Calculations

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| YC-001 | Basic yield ratio | netOut = grossIn × yieldRatio | Critical |
| YC-002 | Waste calculation | wasteOut = grossIn - netOut | Critical |
| YC-003 | Boiling moisture loss | netAfterBoil = netIn × (1 - moistureLoss) | High |
| YC-004 | Frying with oil | netAfterFry = netIn × (1 - moistureLoss + oilAbsorption) | High |
| YC-005 | Chained processes | Total yield = product of all process yields | High |
| YC-006 | Different suppliers | Same product, different yieldProfile applied correctly | Medium |
| YC-007 | Negative variance alert | Alert when actual < expected by >5% | High |
| YC-008 | Cost per portion update | Recipe cost updates when yield changes | High |
| YC-009 | BOM write-off | Correct netAfterProcess amount deducted from inventory | Critical |

### 8.8 Offline Mode

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| OF-001 | Queue actions offline | Actions stored in localStorage | High |
| OF-002 | Sync on reconnect | Queued actions sent in order | High |
| OF-003 | Conflict detection | Conflicting updates flagged | Medium |
| OF-004 | Last-write-wins merge | Status conflicts resolved by timestamp | Medium |
| OF-005 | Comment merge | Comments appended to history | Medium |
| OF-006 | Offline indicator | UI shows offline status | High |
| OF-007 | Retry failed sync | Failed syncs retried with backoff | Medium |

### 8.9 Performance

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| PF-001 | Large bill render | 50 items render <500ms | High |
| PF-002 | KDS refresh | New tickets appear <100ms | Critical |
| PF-003 | Timer animation | 60fps on all devices | High |
| PF-004 | Storage list scroll | 500 products scroll smoothly | Medium |
| PF-005 | Search response | Results appear <200ms after typing stops | High |

---

## 9. Implementation Plan and Risks

### 9.1 Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                               │
└─────────────────────────────────────────────────────────────────────────┘

Phase 1: Foundation
├── Data model updates (types, stores)
├── API contract definitions
├── Migration scripts (dry-run tested)
└── Core UI components (course tabs, timer display)

Phase 2: Order Management
├── Course sections in order card
├── Item comments with presets
├── Table timer implementation
└── KDS course-aware display

Phase 3: Bill Management
├── Split modal UI
├── Split calculation logic
├── Payment integration
└── Receipt generation

Phase 4: Undo & Audit
├── Status rollback logic
├── Audit log implementation
├── Permission checks
└── Notification system

Phase 5: SmartStorage
├── Yield profiles
├── Batch processing
├── Barcode scanning
├── Deep filters & export

Phase 6: Profiles & KPI
├── Employee profile pages
├── KPI dashboard
├── Shift management
└── Chat integration hooks

Phase 7: Polish & Testing
├── Offline mode
├── Performance optimization
├── Accessibility audit
├── End-to-end testing
```

### 9.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration failure | Medium | Critical | Dry-run on staging, rollback scripts ready |
| Performance degradation with courses | Low | High | Lazy loading, virtualization for large orders |
| Timer sync drift | Medium | Medium | Server-authoritative timestamps, periodic sync |
| Yield variance calculation errors | Low | High | Extensive unit tests, manual override option |
| Offline sync conflicts | Medium | Medium | Clear conflict resolution UI, audit logging |
| UI complexity overwhelming users | Medium | High | Phased rollout, training materials, tooltips |
| Backend API changes | Low | High | Versioned API, backward compatibility layer |

### 9.3 Rollback Strategy

1. **Database rollback**: Each migration has `down` function
2. **Feature flags**: New features behind toggles
3. **Version pinning**: Keep previous frontend version deployable
4. **Data backup**: Pre-migration snapshots

### 9.4 Dependencies

| Feature | Depends On |
|---------|------------|
| Course sections | New order item fields |
| Table timer | TableSession entity |
| Bill split | Order with courses complete |
| Undo | Audit log infrastructure |
| Yield calculations | YieldProfile + Batch entities |
| KPI dashboard | Profile + ActionLog entities |

### 9.5 Deliverables Checklist

- [ ] JSON schemas for all entities
- [ ] API endpoint documentation with examples
- [ ] Migration scripts with rollback
- [ ] UX component specifications
- [ ] Yield calculation formulas with test data
- [ ] Test case matrix
- [ ] Risk mitigation plan
- [ ] Training documentation for staff

---

## Appendix A: JSON Schemas

### A.1 OrderItem Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["documentId", "slug", "menuItemId", "quantity", "status", "courseType"],
  "properties": {
    "documentId": { "type": "string", "pattern": "^item_[a-z0-9]+$" },
    "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "menuItemId": { "type": "string" },
    "menuItem": { "$ref": "#/definitions/MenuItem" },
    "quantity": { "type": "integer", "minimum": 1 },
    "status": {
      "type": "string",
      "enum": ["queued", "pending", "in_progress", "ready", "served", "returned"]
    },
    "courseType": {
      "type": "string",
      "enum": ["appetizer", "starter", "soup", "main", "dessert", "drink"]
    },
    "courseIndex": { "type": "integer", "minimum": 0 },
    "comment": { "$ref": "#/definitions/ItemComment" },
    "commentHistory": {
      "type": "array",
      "items": { "$ref": "#/definitions/CommentHistoryEntry" }
    },
    "prepStartAt": { "type": "string", "format": "date-time" },
    "prepElapsedMs": { "type": "integer", "minimum": 0 },
    "servedAt": { "type": "string", "format": "date-time" },
    "undoRef": { "type": "string" }
  }
}
```

### A.2 YieldProfile Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["documentId", "slug", "name", "productId", "baseYieldRatio"],
  "properties": {
    "documentId": { "type": "string", "pattern": "^yield_[a-z0-9]+$" },
    "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "name": { "type": "string", "minLength": 1 },
    "productId": { "type": "string" },
    "baseYieldRatio": { "type": "number", "minimum": 0, "maximum": 1 },
    "processYields": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["processType", "yieldRatio"],
        "properties": {
          "processType": {
            "type": "string",
            "enum": ["cleaning", "boiling", "frying", "rendering", "baking", "grilling", "portioning"]
          },
          "yieldRatio": { "type": "number", "minimum": 0, "maximum": 2 },
          "moistureLoss": { "type": "number", "minimum": 0, "maximum": 1 },
          "oilAbsorption": { "type": "number", "minimum": 0, "maximum": 1 },
          "temperatureRange": {
            "type": "array",
            "items": { "type": "number" },
            "minItems": 2,
            "maxItems": 2
          },
          "timeRange": {
            "type": "array",
            "items": { "type": "number" },
            "minItems": 2,
            "maxItems": 2
          },
          "notes": { "type": "string" }
        }
      }
    },
    "wasteBreakdown": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "percentage", "disposalType"],
        "properties": {
          "name": { "type": "string" },
          "percentage": { "type": "number", "minimum": 0, "maximum": 1 },
          "disposalType": {
            "type": "string",
            "enum": ["trash", "compost", "recyclable", "stock"]
          }
        }
      }
    }
  }
}
```

### A.3 BillSplit Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["documentId", "slug", "orderId", "mode", "participants", "totals", "status"],
  "properties": {
    "documentId": { "type": "string", "pattern": "^split_[a-z0-9]+$" },
    "slug": { "type": "string" },
    "orderId": { "type": "string" },
    "mode": { "type": "string", "enum": ["even", "by_items", "mixed"] },
    "participants": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["personId", "subtotal", "tax", "tip", "total"],
        "properties": {
          "personId": { "type": "string" },
          "name": { "type": "string" },
          "share": { "type": "number", "minimum": 0, "maximum": 100 },
          "assignedItems": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["itemDocumentId", "itemSlug", "portion"],
              "properties": {
                "itemDocumentId": { "type": "string" },
                "itemSlug": { "type": "string" },
                "portion": { "type": "number", "minimum": 0, "maximum": 1 }
              }
            }
          },
          "subtotal": { "type": "number", "minimum": 0 },
          "tax": { "type": "number", "minimum": 0 },
          "tip": { "type": "number", "minimum": 0 },
          "total": { "type": "number", "minimum": 0 },
          "paymentMethod": { "type": "string", "enum": ["cash", "card", "paylater"] },
          "paidAt": { "type": "string", "format": "date-time" }
        }
      }
    },
    "totals": {
      "type": "object",
      "required": ["subtotal", "tax", "tip", "total", "unassigned"],
      "properties": {
        "subtotal": { "type": "number" },
        "tax": { "type": "number" },
        "tip": { "type": "number" },
        "total": { "type": "number" },
        "unassigned": { "type": "number" }
      }
    },
    "status": { "type": "string", "enum": ["draft", "confirmed", "paid", "cancelled"] }
  }
}
```

---

## Appendix B: Localization Reference

```typescript
// /src/lib/i18n/uk.ts

export const uk = {
  courses: {
    appetizer: 'Закуска',
    starter: 'Стартер',
    soup: 'Суп',
    main: 'Основне блюдо',
    dessert: 'Десерт',
    drink: 'Напій'
  },
  statuses: {
    queued: 'В черзі',
    pending: 'Очікує',
    in_progress: 'Готується',
    ready: 'Готово',
    served: 'Подано',
    returned: 'Повернено'
  },
  processes: {
    cleaning: 'Очистка',
    boiling: 'Варка',
    frying: 'Вижарка',
    rendering: 'Виварка',
    baking: 'Випікання',
    grilling: 'Гриль',
    portioning: 'Порціонування'
  },
  split: {
    even: 'Порівну',
    by_items: 'За стравами',
    mixed: 'Змішаний'
  },
  units: {
    kg: 'кг',
    g: 'г',
    l: 'л',
    ml: 'мл',
    pcs: 'шт',
    portion: 'порція'
  },
  actions: {
    start: 'Почати',
    done: 'Готово',
    serve: 'Подати',
    undo: 'Повернути',
    split: 'Розділити',
    comment: 'Коментар',
    scan: 'Сканувати',
    export: 'Експорт'
  },
  errors: {
    validation_error: 'Помилка валідації',
    not_found: 'Не знайдено',
    conflict: 'Конфлікт стану',
    unauthorized: 'Не авторизовано',
    forbidden: 'Доступ заборонено'
  }
};
```

---

**Document End**

*This specification is subject to review and approval before implementation begins.*
