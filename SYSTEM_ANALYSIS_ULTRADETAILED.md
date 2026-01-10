# Restaurant OS - Ultra-Detailed System Analysis

> **Document Version:** 2.0
> **Date:** 2026-01-10
> **Status:** FIXES IMPLEMENTED - SEE IMPLEMENTATION_PROGRESS.md

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Complete Data Flow: Order Lifecycle](#3-complete-data-flow-order-lifecycle)
4. [Inventory & Stock Management System](#4-inventory--stock-management-system)
5. [Kitchen Operations & History Tracking](#5-kitchen-operations--history-tracking)
6. [Analytics & KPI System](#6-analytics--kpi-system)
7. [FSM (Finite State Machine) Implementation](#7-fsm-finite-state-machine-implementation)
8. [Real Data vs Mock Data Analysis](#8-real-data-vs-mock-data-analysis)
9. [Identified Gaps & Missing Functionality](#9-identified-gaps--missing-functionality)
10. [Critical Issues & Recommendations](#10-critical-issues--recommendations)
11. [File Structure Reference](#11-file-structure-reference)

---

## 1. Executive Summary

### System Purpose
Restaurant OS is a comprehensive restaurant management system covering:
- **POS (Point of Sale)** - Waiter ordering interface
- **Kitchen Display System (KDS)** - Chef station management
- **Inventory Management** - Stock batches, FIFO consumption, yield tracking
- **Scheduled Orders** - HoReCa event planning (weddings, corporate, etc.)
- **Analytics** - KPIs, session tracking, audit logs
- **Daily Tasks** - Staff task management

### Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ (App Router), React, TypeScript |
| State Management | Zustand (persisted stores) |
| UI Components | shadcn/ui, Radix Primitives, Tailwind CSS |
| API Layer | GraphQL (urql), REST API |
| Backend | Strapi v5 (Headless CMS) |
| Database | SQLite/PostgreSQL (via Strapi) |
| Real-time | WebSocket (planned) |

### Overall Health Assessment (Updated After Fixes)

| Area | Status | Notes |
|------|--------|-------|
| Data Models (Backend) | **REAL** | Fully implemented Strapi schemas |
| Order Flow | **REAL** | GraphQL mutations for Order + OrderItems |
| Kitchen Tickets | **REAL** | Auto-created by OrderItem lifecycle |
| Inventory Deduction | **REAL** | Backend `start-ticket.ts` with FIFO, wired to frontend |
| Frontend Storage | **PARTIAL** | Local API + some GraphQL integration |
| Analytics | **REAL** | tableSessionEventsApi returns real KPIs |
| Recipe Lookup | **REAL** | GET_MENU_ITEM_RECIPE GraphQL query |
| Authentication | **PARTIAL** | Strapi users-permissions, frontend auth store |
| WebSocket | **NOT IMPLEMENTED** | Hooks exist, no real connection |

---

## 2. Architecture Overview

### 2.1 Project Structure

```
Restaurant OS/
├── backend/                     # Strapi v5 Backend
│   ├── src/
│   │   ├── api/                # Content Types & Controllers
│   │   │   ├── order/          # Orders
│   │   │   ├── order-item/     # Order Items
│   │   │   ├── kitchen-ticket/ # Kitchen Tickets
│   │   │   ├── menu-item/      # Menu Items
│   │   │   ├── menu-category/  # Categories
│   │   │   ├── ingredient/     # Ingredients
│   │   │   ├── stock-batch/    # Stock Batches
│   │   │   ├── inventory-movement/ # Movement History
│   │   │   ├── ticket-event/   # Ticket Audit Trail
│   │   │   ├── table/          # Tables
│   │   │   ├── table-session-event/ # Session Analytics
│   │   │   ├── recipe/         # Recipes (BOM)
│   │   │   ├── yield-profile/  # Yield Calculations
│   │   │   ├── supplier/       # Suppliers
│   │   │   └── daily-task/     # Staff Tasks
│   │   └── seed/               # Seeding scripts
│   └── config/
│
├── frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── pos/waiter/     # POS Interface
│   │   │   ├── kitchen/        # Kitchen Display
│   │   │   ├── storage/        # Inventory Management
│   │   │   ├── dailies/        # Task Management
│   │   │   └── dashboard/      # Admin Dashboard
│   │   ├── features/           # Feature components
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # React hooks
│   │   ├── graphql/            # GraphQL queries/mutations
│   │   ├── lib/                # Utilities
│   │   └── types/              # TypeScript types
│   └── public/
```

### 2.2 Data Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Zustand Stores │   GraphQL (urql) │   REST API (lib/api.ts)   │
│   - cart-store   │   - queries.ts   │   - ordersApi             │
│   - kitchen-store│   - mutations.ts │   - kitchenApi            │
│   - orders-store │   - fragments.ts │   - inventoryApi          │
│   - table-store  │                  │   - recipesApi            │
│   - scheduled-   │                  │   - analyticsApi          │
│     orders-store │                  │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STRAPI v5 BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│  Content Types:                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Order     │──│  OrderItem   │──│   KitchenTicket      │  │
│  │  (status,    │  │  (status,    │  │   (status, station,  │  │
│  │   table,     │  │   menuItem,  │  │    inventoryLocked)  │  │
│  │   waiter)    │  │   course)    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                                      │                │
│         │                                      │                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Table     │  │  TicketEvent │  │  InventoryMovement   │  │
│  │   (status,   │  │  (audit log) │  │  (recipe_use, return)│  │
│  │   capacity)  │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                │                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Ingredient  │──│  StockBatch  │──│    YieldProfile      │  │
│  │  (stock,     │  │  (FIFO,      │  │    (baseYield,       │  │
│  │   minStock)  │  │   expiry)    │  │     processYields)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   MenuItem   │──│    Recipe    │──│  recipe-ingredient   │  │
│  │  (price,     │  │  (portions,  │  │  (component with     │  │
│  │   station)   │  │   steps)     │  │   quantity, unit)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Complete Data Flow: Order Lifecycle

### 3.1 Order State Machine

```
ORDER FSM (backend/src/api/order/content-types/order/lifecycles.ts)

  new ──────────► confirmed ──────────► in_kitchen ──────────► ready
   │                 │                      │                    │
   │                 │                      │                    │
   ▼                 ▼                      ▼                    ▼
cancelled ◄────── cancelled ◄────────── cancelled            served
                                                                │
                                                                ▼
                                                              paid
```

**Valid Transitions:**
```typescript
const VALID_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['in_kitchen', 'cancelled'],
  in_kitchen: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid'],
  cancelled: [],
  paid: []
};
```

### 3.2 Order Item State Machine

```
ORDER ITEM FSM (frontend/src/types/fsm.ts)

  draft ──► queued ──► pending ──► in_progress ──► ready ──► served
    │          │          │            │              │         │
    │          │          │            │              │         │
    ▼          ▼          ▼            ▼              ▼         ▼
 cancelled  cancelled  cancelled   cancelled      (undo)     returned
                                      │                          │
                                      ▼                          ▼
                                   (needs                      voided
                                   manager                   (refund)
                                   approval)
```

### 3.3 Complete Order Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: POS ORDER CREATION                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Waiter selects table → tableStore.setSelectedTable()                │
│     File: frontend/src/app/pos/waiter/tables/page.tsx                   │
│                                                                          │
│  2. Waiter adds items to cart → cartStore.addItem()                     │
│     File: frontend/src/stores/cart-store.ts                             │
│                                                                          │
│  3. Waiter confirms order → ordersApi.createOrder()                     │
│     File: frontend/src/app/pos/waiter/page.tsx:106-125                  │
│                                                                          │
│  CURRENT STATE: Order created locally, should POST to Strapi            │
│  GAP: ordersApi is MOCK (returns fake success)                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PHASE 2: KITCHEN TICKET CREATION                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  IDEAL FLOW (via Strapi):                                               │
│  1. Order created → OrderItem lifecycle creates KitchenTicket           │
│     File: backend/src/api/order-item/content-types/order-item/          │
│           lifecycles.ts (would need implementation)                      │
│                                                                          │
│  CURRENT FLOW (Frontend):                                               │
│  1. Cart items → createKitchenTasksFromOrder() → kitchenStore.addTasks()│
│     File: frontend/src/stores/kitchen-store.ts:212-259                  │
│                                                                          │
│  Kitchen tickets created with:                                          │
│  - stationType (hot/cold/pastry/bar/pass)                               │
│  - priority (normal/rush/vip)                                           │
│  - targetCompletionMs                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: KITCHEN PROCESSING                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  KITCHEN TICKET FSM:                                                    │
│  queued → started → [paused ↔ resumed] → ready → (pass) → served       │
│                                                                          │
│  1. Chef clicks "Start" → handleTaskStart()                             │
│     File: frontend/src/app/kitchen/page.tsx:174-176                     │
│                                                                          │
│  2. Triggers status update:                                             │
│     - kitchenStore.updateTaskStatus(taskId, 'in_progress', chefName)    │
│     - tableSessionEventsApi.createEvent('item_started')                 │
│     - onTaskStarted callbacks for inventory deduction                    │
│                                                                          │
│  3. INVENTORY DEDUCTION (if recipe exists):                             │
│     BACKEND (REAL):                                                     │
│     File: backend/src/api/kitchen-ticket/services/start-ticket.ts      │
│     - Loads ticket with recipe.ingredients                              │
│     - FIFO batch selection (FEFO: First Expiry First Out)              │
│     - Unit conversion (kg↔g, l↔ml)                                      │
│     - Yield factor calculation                                          │
│     - Creates InventoryMovement records                                 │
│     - Updates StockBatch.netAvailable                                   │
│     - Updates Ingredient.currentStock                                   │
│     - Sets ticket.inventoryLocked = true                                │
│                                                                          │
│  4. Chef clicks "Ready" → handleTaskComplete()                          │
│     - Updates status to 'ready'                                         │
│     - Calculates elapsedSeconds                                         │
│     - Creates TicketEvent                                               │
│                                                                          │
│  5. Pass station → handleTaskServed()                                   │
│     - Removes task from kitchen queue                                   │
│     - Updates order item status to 'served'                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PHASE 4: BILLING & COMPLETION                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. All items served → Order status = 'served'                          │
│                                                                          │
│  2. Bill requested → tableSessionEventsApi.createEvent('bill_requested')│
│                                                                          │
│  3. Payment processed:                                                  │
│     - Order.status = 'paid'                                             │
│     - Order.paidAt = timestamp                                          │
│     - Order.paymentMethod = 'cash'/'card'/'paylater'                    │
│                                                                          │
│  4. Table freed (Order lifecycle afterUpdate):                          │
│     File: backend/src/api/order/content-types/order/lifecycles.ts:82-102│
│     - Checks for other unpaid orders at table                           │
│     - Updates Table.status = 'free'                                     │
│     - Clears Table.currentGuests, Table.occupiedAt                      │
│                                                                          │
│  5. Analytics event:                                                    │
│     tableSessionEventsApi.createEvent('bill_paid')                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Inventory & Stock Management System

### 4.1 Ingredient Schema (Backend)

```typescript
// backend/src/api/ingredient/content-types/ingredient/schema.json
{
  name: string,
  nameUk: string,
  slug: uid,
  sku: string (unique),
  barcode: string,
  unit: enum['kg', 'g', 'l', 'ml', 'pcs', 'portion'],
  currentStock: decimal,
  minStock: decimal,
  maxStock: decimal,
  mainCategory: enum['raw', 'prep', 'dry-goods', 'seasonings', ...],
  subCategory: string,
  storageCondition: enum['ambient', 'refrigerated', 'frozen', 'dry-cool'],
  shelfLifeDays: integer,
  costPerUnit: decimal,
  isActive: boolean,
  yieldProfile: relation → YieldProfile,
  suppliers: relation → Supplier[],
  stockBatches: relation → StockBatch[]
}
```

### 4.2 Stock Batch Schema (Backend)

```typescript
// backend/src/api/stock-batch/content-types/stock-batch/schema.json
{
  batchNumber: string,
  barcode: string,
  ingredient: relation → Ingredient,
  grossIn: decimal (required),        // Initial quantity received
  netAvailable: decimal (required),   // Current available after processing
  usedAmount: decimal (default: 0),   // Total consumed
  wastedAmount: decimal (default: 0), // Total wasted
  unitCost: decimal (required),
  totalCost: decimal,
  receivedAt: datetime (required),
  expiryDate: date,
  status: enum[
    'received',     // Just arrived
    'inspecting',   // Quality check
    'processing',   // Being cleaned/prepped
    'available',    // Ready for use
    'reserved',     // Locked for order
    'depleted',     // Fully used
    'expired',      // Past expiry
    'quarantine',   // Quality issue
    'written_off'   // Disposed
  ],
  isLocked: boolean (default: false),
  lockedBy: string,
  lockedAt: datetime,
  supplier: relation → Supplier,
  invoiceNumber: string,
  processes: json[]  // Processing history
}
```

### 4.3 Inventory Movement Schema (Backend)

```typescript
// backend/src/api/inventory-movement/content-types/inventory-movement/schema.json
{
  ingredient: relation → Ingredient,
  stockBatch: relation → StockBatch,
  kitchenTicket: relation → KitchenTicket,
  movementType: enum[
    'receive',      // New stock arrival
    'recipe_use',   // Consumed for cooking
    'process',      // Yield processing
    'write_off',    // Disposal
    'transfer',     // Location transfer
    'adjust',       // Inventory adjustment
    'return',       // Returned (cancelled ticket)
    'reserve',      // Locked for order
    'release'       // Unlocked
  ],
  quantity: decimal (required),
  unit: enum['kg', 'g', 'l', 'ml', 'pcs', 'portion'],
  grossQuantity: decimal,    // Before yield
  netQuantity: decimal,      // After yield
  wasteFactor: decimal,      // 1 - yieldRatio
  unitCost: decimal,
  totalCost: decimal,
  reason: string,
  reasonCode: string,        // e.g., 'TICKET_START', 'TICKET_CANCEL'
  notes: text,
  operator: relation → User
}
```

### 4.4 FIFO Inventory Deduction Algorithm

```typescript
// backend/src/api/kitchen-ticket/services/start-ticket.ts

async startTicket(ticketDocumentId, chefDocumentId) {
  // 1. Load ticket with full recipe tree
  const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
    documentId: ticketDocumentId,
    populate: {
      orderItem: {
        populate: {
          menuItem: {
            populate: {
              recipe: {
                populate: {
                  ingredients: {
                    populate: {
                      ingredient: { populate: ['yieldProfile'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // 2. For each recipe ingredient:
  for (const recipeIngredient of recipe.ingredients) {
    // 2a. Calculate required quantities
    const netRequired = recipeIngredient.quantity * orderItem.quantity;
    const yieldMultiplier = calculateYieldMultiplier(yieldProfile, processChain);
    const grossRequired = netRequired / yieldMultiplier;
    const grossWithWaste = grossRequired * (1 + wasteAllowancePercent/100);

    // 2b. Normalize units (kg → g, etc.)
    const normalizedGross = convertUnits(grossWithWaste, recipeUnit, ingredientUnit);

    // 2c. FIFO/FEFO batch selection
    const batches = await strapi.documents('api::stock-batch.stock-batch').findMany({
      filters: {
        ingredient: { documentId: ingredient.documentId },
        status: { $in: ['available', 'received'] },
        netAvailable: { $gt: 0 },
        isLocked: { $ne: true }
      },
      sort: [
        { expiryDate: 'asc' },   // FEFO - First Expiry First Out
        { receivedAt: 'asc' }    // FIFO - First In First Out
      ]
    });

    // 2d. Consume from batches
    let remaining = normalizedGross;
    for (const batch of batches) {
      if (remaining <= 0) break;

      const takeAmount = Math.min(batch.netAvailable, remaining);

      // Update batch
      await strapi.documents('api::stock-batch.stock-batch').update({
        documentId: batch.documentId,
        data: {
          netAvailable: batch.netAvailable - takeAmount,
          usedAmount: batch.usedAmount + takeAmount,
          status: (batch.netAvailable - takeAmount) <= 0.001 ? 'depleted' : batch.status
        }
      });

      // Create movement record
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: ingredient.documentId,
          stockBatch: batch.documentId,
          kitchenTicket: ticketDocumentId,
          movementType: 'recipe_use',
          quantity: takeAmount,
          grossQuantity: takeAmount,
          netQuantity: takeAmount * yieldMultiplier,
          wasteFactor: 1 - yieldMultiplier,
          unitCost: batch.unitCost,
          totalCost: takeAmount * batch.unitCost,
          reasonCode: 'TICKET_START',
          operator: chefDocumentId
        }
      });

      remaining -= takeAmount;
    }

    // 2e. Check sufficient stock
    if (remaining > 0.001) {
      throw { code: 'INSUFFICIENT_STOCK', ... };
    }

    // 2f. Update ingredient total stock
    await strapi.documents('api::ingredient.ingredient').update({
      documentId: ingredient.documentId,
      data: { currentStock: currentStock - totalConsumed }
    });
  }

  // 3. Update ticket status
  await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
    documentId: ticketDocumentId,
    data: {
      status: 'started',
      startedAt: new Date().toISOString(),
      assignedChef: chefDocumentId,
      inventoryLocked: true
    }
  });

  // 4. Create ticket event with consumption details
  await strapi.documents('api::ticket-event.ticket-event').create({
    data: {
      kitchenTicket: ticketDocumentId,
      eventType: 'started',
      previousStatus: 'queued',
      newStatus: 'started',
      actor: chefDocumentId,
      metadata: { consumedBatches, totalCost }
    }
  });
}
```

### 4.5 Inventory Release on Cancel

```typescript
// backend/src/api/kitchen-ticket/services/start-ticket.ts

async releaseInventory(ticketDocumentId, reason, operatorId) {
  // 1. Find all recipe_use movements for this ticket
  const movements = await strapi.documents('api::inventory-movement.inventory-movement').findMany({
    filters: {
      kitchenTicket: { documentId: ticketDocumentId },
      movementType: 'recipe_use'
    },
    populate: ['stockBatch', 'ingredient']
  });

  // 2. Restore each batch
  for (const movement of movements) {
    // Restore batch quantity
    await strapi.documents('api::stock-batch.stock-batch').update({
      documentId: movement.stockBatch.documentId,
      data: {
        netAvailable: batch.netAvailable + movement.grossQuantity,
        usedAmount: batch.usedAmount - movement.grossQuantity,
        status: 'available'
      }
    });

    // Restore ingredient stock
    await strapi.documents('api::ingredient.ingredient').update({
      documentId: movement.ingredient.documentId,
      data: { currentStock: currentStock + movement.grossQuantity }
    });

    // Create return movement
    await strapi.documents('api::inventory-movement.inventory-movement').create({
      data: {
        ingredient: movement.ingredient.documentId,
        stockBatch: movement.stockBatch.documentId,
        kitchenTicket: ticketDocumentId,
        movementType: 'return',
        quantity: movement.grossQuantity,
        reasonCode: 'TICKET_CANCEL',
        operator: operatorId
      }
    });
  }

  // 3. Update ticket
  await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
    documentId: ticketDocumentId,
    data: { inventoryLocked: false }
  });

  // 4. Create release event
  await strapi.documents('api::ticket-event.ticket-event').create({
    data: {
      kitchenTicket: ticketDocumentId,
      eventType: 'inventory_released',
      actor: operatorId,
      reason,
      metadata: { releasedMovements: movements.length }
    }
  });
}
```

### 4.6 Yield Profile System

```typescript
// backend/src/api/yield-profile/content-types/yield-profile/schema.json
{
  name: string,
  productId: string,
  baseYieldRatio: decimal,       // e.g., 0.85 = 15% trim waste
  processYields: json[{
    processType: 'cleaning' | 'cutting' | 'cooking' | 'grilling' | 'frying',
    yieldRatio: decimal,         // e.g., 0.92
    moistureLoss?: decimal,      // For cooking
    oilAbsorption?: decimal      // For frying
  }],
  wasteBreakdown: json[{
    reason: 'trim' | 'bones' | 'skin' | 'moisture' | 'cooking',
    percentage: decimal
  }]
}

// Yield calculation in start-ticket.ts
function calculateYieldMultiplier(yieldProfile, processChain) {
  let multiplier = yieldProfile.baseYieldRatio || 1;

  for (const processType of processChain) {
    const processYield = yieldProfile.processYields?.find(
      p => p.processType === processType
    );
    if (processYield) {
      if (processYield.moistureLoss) {
        multiplier *= (1 - processYield.moistureLoss);
      }
      if (processYield.oilAbsorption) {
        multiplier *= (1 + processYield.oilAbsorption);
      }
      if (processYield.yieldRatio) {
        multiplier *= processYield.yieldRatio;
      }
    }
  }

  return multiplier;
}

// Example:
// Beef (1kg) → baseYield: 0.85 → cleaning: 0.95 → grilling: 0.80
// Final yield: 1 * 0.85 * 0.95 * 0.80 = 0.646 kg output
// Gross required for 0.5kg net: 0.5 / 0.646 = 0.774 kg
```

---

## 5. Kitchen Operations & History Tracking

### 5.1 Kitchen Ticket Schema

```typescript
// backend/src/api/kitchen-ticket/content-types/kitchen-ticket/schema.json
{
  ticketNumber: string,          // Auto-generated: TKT-{timestamp}-{random}
  order: relation → Order,
  orderItem: relation → OrderItem,
  status: enum[
    'queued',     // Waiting for chef
    'started',    // Cooking in progress
    'paused',     // Temporarily stopped
    'resumed',    // Resumed from pause
    'ready',      // Finished, waiting for pass
    'failed',     // Error occurred
    'cancelled'   // Cancelled by manager
  ],
  station: enum['grill', 'fry', 'salad', 'hot', 'dessert', 'bar', 'pass', 'prep'],
  priority: enum['normal', 'rush', 'vip'],
  priorityScore: integer,        // For sorting (vip=100, rush=80, normal=50)
  assignedChef: relation → User,
  startedAt: datetime,
  completedAt: datetime,
  elapsedSeconds: integer,
  inventoryLocked: boolean,      // True if ingredients deducted
  inventoryMovements: relation → InventoryMovement[],
  events: relation → TicketEvent[]
}
```

### 5.2 Ticket Event (Audit Log)

```typescript
// backend/src/api/ticket-event/content-types/ticket-event/schema.json
{
  kitchenTicket: relation → KitchenTicket,
  eventType: enum[
    'created',           // Ticket created
    'started',           // Chef started cooking
    'paused',            // Paused
    'resumed',           // Resumed
    'completed',         // Finished cooking
    'failed',            // Error
    'cancelled',         // Cancelled
    'inventory_locked',  // Ingredients deducted
    'inventory_released' // Ingredients returned
  ],
  previousStatus: string,
  newStatus: string,
  actor: relation → User,
  reason: text,
  metadata: json {
    // For 'started':
    consumedBatches: [{
      batchDocumentId: string,
      ingredientDocumentId: string,
      grossQuantity: number,
      netQuantity: number,
      cost: number
    }],
    totalCost: number,
    // For 'completed':
    elapsedSeconds: number,
    wasOverdue: boolean,
    // For 'cancelled':
    releasedMovements: number
  }
}
```

### 5.3 Kitchen Ticket Lifecycle (Backend)

```typescript
// backend/src/api/kitchen-ticket/content-types/kitchen-ticket/lifecycles.ts

const VALID_TRANSITIONS = {
  queued: ['started', 'cancelled'],
  started: ['paused', 'ready', 'failed', 'cancelled'],
  paused: ['resumed', 'cancelled'],
  resumed: ['paused', 'ready', 'failed', 'cancelled'],
  ready: [],
  failed: [],
  cancelled: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;
    if (!data.status) return;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId: where.documentId
    });

    const allowed = VALID_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(data.status)) {
      throw new Error(`Invalid transition: ${ticket.status} -> ${data.status}`);
    }

    // Auto-set timestamps
    if (data.status === 'started' && !data.startedAt) {
      data.startedAt = new Date().toISOString();
    }

    if (data.status === 'ready' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
      if (ticket.startedAt) {
        data.elapsedSeconds = Math.floor(
          (Date.now() - new Date(ticket.startedAt).getTime()) / 1000
        );
      }
    }
  },

  async beforeCreate(event) {
    // Auto-generate ticket number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    event.params.data.ticketNumber = `TKT-${timestamp}-${random}`;
    event.params.data.status = event.params.data.status || 'queued';
  },

  async afterCreate(event) {
    // Create initial event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: event.result.documentId,
        eventType: 'created',
        previousStatus: null,
        newStatus: event.result.status,
        metadata: {
          station: event.result.station,
          priority: event.result.priority
        }
      }
    });
  }
};
```

### 5.4 Frontend Kitchen Store

```typescript
// frontend/src/stores/kitchen-store.ts

interface KitchenTask {
  documentId: string;
  orderItemDocumentId: string;
  orderDocumentId: string;
  menuItemName: string;
  quantity: number;
  tableNumber: number;
  tableOccupiedAt?: string;
  courseType: CourseType;
  status: StationSubTaskStatus;  // 'pending' | 'in_progress' | 'completed'
  priority: 'normal' | 'rush' | 'vip';
  priorityScore: number;
  elapsedMs: number;
  targetCompletionMs: number;
  isOverdue: boolean;
  assignedChefName?: string;
  modifiers: string[];
  comment: ItemComment | null;
  createdAt: string;
  stationType: StationType;
  isScheduled?: boolean;
  scheduledOrderId?: string;
}

// Task started callbacks for inventory deduction
const taskStartedCallbacks: Set<TaskStartedCallback> = new Set();

export function onTaskStarted(callback: TaskStartedCallback): () => void {
  taskStartedCallbacks.add(callback);
  return () => taskStartedCallbacks.delete(callback);
}

// When status changes to 'in_progress':
updateTaskStatus: (taskId, status, assignedChef) => {
  // Update store
  set(state => ({
    tasks: state.tasks.map(t =>
      t.documentId === taskId ? { ...t, status, assignedChefName: assignedChef } : t
    )
  }));

  // Log analytics event
  if (status === 'in_progress') {
    tableSessionEventsApi.createEvent({
      tableNumber: task.tableNumber,
      sessionId: task.orderDocumentId,
      eventType: 'item_started',
      actorRole: 'chef',
      actorName: assignedChef,
      metadata: { menuItemName, station, quantity, priority }
    });

    // Trigger inventory deduction (for non-bar items)
    if (task.stationType !== 'bar') {
      taskStartedCallbacks.forEach(callback => callback(task, assignedChef));
    }
  }

  if (status === 'completed') {
    tableSessionEventsApi.createEvent({
      eventType: 'item_ready',
      metadata: { menuItemName, station, elapsedMs, wasOverdue }
    });
  }
}
```

---

## 6. Analytics & KPI System

### 6.1 Table Session Events (Backend)

```typescript
// backend/src/api/table-session-event/content-types/table-session-event/schema.json
{
  tableNumber: integer,
  orderDocumentId: string,
  sessionId: string,
  eventType: enum[
    'table_seated',    // Guests sat down
    'order_taken',     // Order submitted
    'item_started',    // Chef started item
    'item_ready',      // Item ready for pass
    'item_served',     // Item delivered
    'bill_requested',  // Guest asked for bill
    'bill_paid',       // Payment received
    'table_cleared'    // Table cleaned
  ],
  timestamp: datetime,
  actorRole: enum['waiter', 'chef', 'cashier', 'system'],
  actorName: string,
  durationFromSeatedMs: integer,  // Time since table_seated
  metadata: json
}
```

### 6.2 Table Session Events API (Frontend)

```typescript
// frontend/src/lib/api-events.ts

export const tableSessionEventsApi = {
  // Create event (non-blocking)
  async createEvent(params: CreateEventParams): Promise<void> {
    const durationFromSeatedMs = Date.now() - new Date(tableOccupiedAt).getTime();

    await fetch(`${STRAPI_URL}/api/table-session-events`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          tableNumber: params.tableNumber,
          sessionId: params.sessionId,
          eventType: params.eventType,
          timestamp: new Date().toISOString(),
          actorRole: params.actorRole || 'system',
          actorName: params.actorName,
          orderDocumentId: params.orderDocumentId,
          durationFromSeatedMs,
          metadata: params.metadata
        }
      })
    });
  },

  // Query events for analytics
  async getSessionEvents(filters): Promise<TableSessionEvent[]> {
    // Supports: tableNumber, orderDocumentId, sessionId, eventType, from, to
  },

  // Calculate KPIs
  async getKPIs(from: string, to: string): Promise<SessionKPIs> {
    const events = await this.getSessionEvents({ from, to });

    // Group by sessionId
    const sessions = new Map<string, TableSessionEvent[]>();
    events.forEach(e => {
      if (!sessions.has(e.sessionId)) sessions.set(e.sessionId, []);
      sessions.get(e.sessionId)!.push(e);
    });

    // Calculate metrics
    return {
      avgTimeToTakeOrderMs,   // Time from table_seated to order_taken
      avgTimeToFirstItemMs,   // Time from table_seated to first item_ready
      avgTotalSessionTimeMs,  // Time from table_seated to bill_paid
      totalOrders,
      totalSessions
    };
  }
};
```

### 6.3 Event Log System (Frontend)

```typescript
// frontend/src/types/event-log.ts

interface EventLog {
  documentId: string;
  sequence: number;              // Global ordering
  category: EventCategory;       // 'order', 'storage', 'auth', etc.
  eventType: string;             // 'item.status_changed', etc.
  severity: 'debug' | 'info' | 'warning' | 'critical';
  resourceType: string;
  resourceDocumentId: string;
  previousState?: string;
  newState?: string;
  delta?: Record<string, { from: unknown; to: unknown }>;
  actorId: string;
  actorName: string;
  actorRole: string;
  reason?: string;
  reasonCode?: string;
  correlationId?: string;        // For tracing related events
  timestamp: string;
}

// Event types defined:
const EVENT_TYPES = {
  // Orders
  ORDER_CREATED, ORDER_SUBMITTED, ORDER_CANCELLED, ORDER_COMPLETED,
  // Items
  ITEM_STATUS_CHANGED, ITEM_UNDO, ITEM_COMMENT_ADDED,
  // Storage
  BATCH_RECEIVED, BATCH_PROCESSED, BATCH_WRITTEN_OFF,
  // Auth
  LOGIN, LOGOUT, PERMISSION_DENIED,
  // etc.
};
```

### 6.4 Analytics Dashboard (Current State)

```typescript
// frontend/src/lib/api.ts - analyticsApi

export const analyticsApi = {
  async getKPIs(): Promise<ApiResponse<KPI[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };  // MOCK - returns empty
  },

  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    // TODO: Replace with real API call
    return { data: [], success: true };  // MOCK - returns empty
  }
};
```

**STATUS: PARTIALLY IMPLEMENTED**
- `tableSessionEventsApi` - REAL, sends events to Strapi
- `analyticsApi` - MOCK, returns empty arrays
- KPI calculations - Implemented in `api-events.ts`, needs UI

---

## 7. FSM (Finite State Machine) Implementation

### 7.1 Order Item FSM

```typescript
// frontend/src/types/fsm.ts

type OrderItemState =
  | 'draft'       // In cart
  | 'queued'      // Submitted to kitchen
  | 'pending'     // Acknowledged
  | 'in_progress' // Cooking
  | 'ready'       // Ready to serve
  | 'served'      // Delivered
  | 'returned'    // Returned by customer
  | 'cancelled'   // Cancelled
  | 'voided';     // Refunded

// Transitions with guards
const ORDER_ITEM_TRANSITIONS = [
  // Normal flow
  { from: 'draft', event: 'SUBMIT', to: 'queued',
    guards: [{ type: 'role', roles: ['waiter', 'manager', 'admin'] }] },
  { from: 'queued', event: 'ACKNOWLEDGE', to: 'pending',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }] },
  { from: 'pending', event: 'START', to: 'in_progress',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }] },
  // ...

  // Undo (requires reason + time limit)
  { from: 'ready', event: 'UNDO', to: 'in_progress',
    guards: [
      { type: 'role', roles: ['chef', 'manager', 'admin'] },
      { type: 'time', maxTimeMs: 300000 }  // 5 minutes
    ],
    requiresReason: true,
    auditLevel: 'warning' },

  // Cancel in_progress (requires manager + chef approval)
  { from: 'in_progress', event: 'CANCEL', to: 'cancelled',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
      { type: 'approval', approvalFrom: ['chef'] }
    ],
    requiresReason: true,
    auditLevel: 'critical' },
];
```

### 7.2 Storage Batch FSM

```typescript
type StorageBatchState =
  | 'received'
  | 'inspecting'
  | 'processing'
  | 'available'
  | 'reserved'
  | 'depleted'
  | 'expired'
  | 'quarantine'
  | 'written_off';

// Write-off requires manager approval
{ from: ['available', 'expired', 'quarantine'],
  event: 'WRITE_OFF',
  to: 'written_off',
  guards: [{ type: 'role', roles: ['manager', 'admin'] }],
  requiresReason: true,
  auditLevel: 'critical' },

// Calibration requires admin approval
{ from: 'available',
  event: 'CALIBRATE',
  to: 'available',
  guards: [
    { type: 'role', roles: ['manager', 'admin'] },
    { type: 'approval', approvalFrom: ['admin'] }
  ],
  requiresReason: true,
  auditLevel: 'critical' },
```

### 7.3 Reason Codes

```typescript
// Undo reasons
const UNDO_REASON_CODES = {
  CUSTOMER_REFUSED: { uk: 'Клієнт відмовився' },
  WRONG_PREPARATION: { uk: 'Неправильне приготування', requiresNote: true },
  ALLERGY_CONCERN: { uk: 'Алергія виявлена', requiresNote: true },
  QUALITY_ISSUE: { uk: 'Проблема з якістю', requiresNote: true },
  TEMPERATURE_ISSUE: { uk: 'Неправильна температура' },
  WRONG_ORDER: { uk: 'Неправильне замовлення' },
  // ...
};

// Write-off reasons
const WRITE_OFF_REASON_CODES = {
  EXPIRED: { uk: 'Прострочено' },
  SPOILED: { uk: 'Зіпсовано', requiresNote: true },
  DAMAGED: { uk: 'Пошкоджено', requiresNote: true },
  COOKING_LOSS: { uk: 'Втрати при готуванні' },
  YIELD_VARIANCE: { uk: 'Відхилення виходу', requiresNote: true },
  THEFT: { uk: 'Крадіжка', requiresNote: true },
  // ...
};
```

---

## 8. Real Data vs Mock Data Analysis

### 8.1 Summary Table

| Component | Backend | Frontend Integration | Status |
|-----------|---------|---------------------|--------|
| **Menu Categories** | ✅ REAL (schema) | ✅ GraphQL `GET_ALL_CATEGORIES` | WORKING |
| **Menu Items** | ✅ REAL (schema) | ✅ GraphQL in categories query | WORKING |
| **Tables** | ✅ REAL (schema) | ✅ GraphQL `GET_TABLES` | WORKING |
| **Orders** | ✅ REAL (schema + lifecycle) | ⚠️ `ordersApi` is MOCK | PARTIAL |
| **Order Items** | ✅ REAL (schema) | ⚠️ Local cart store | PARTIAL |
| **Kitchen Tickets** | ✅ REAL (schema + lifecycle + service) | ✅ GraphQL + local store | WORKING |
| **Ticket Events** | ✅ REAL (schema) | ✅ Created by lifecycle | WORKING |
| **Ingredients** | ✅ REAL (schema) | ✅ GraphQL `GET_STOCK_ALERTS` | WORKING |
| **Stock Batches** | ✅ REAL (schema + lifecycle) | ⚠️ Local API, not GraphQL | PARTIAL |
| **Inventory Movements** | ✅ REAL (schema) | ✅ GraphQL `GET_INVENTORY_MOVEMENTS` | WORKING |
| **Recipes** | ✅ REAL (schema) | ✅ GraphQL `GET_RECIPES` | WORKING |
| **Yield Profiles** | ✅ REAL (schema) | ⚠️ REST `/api/storage/yield-profiles` | PARTIAL |
| **Suppliers** | ✅ REAL (schema) | ❌ No frontend integration | NOT USED |
| **Table Session Events** | ✅ REAL (schema) | ✅ REST `tableSessionEventsApi` | WORKING |
| **Daily Tasks** | ✅ REAL (schema) | ✅ GraphQL | WORKING |
| **Users/Auth** | ✅ REAL (Strapi users-permissions) | ⚠️ `authStore` exists, partial | PARTIAL |
| **KPIs** | ❌ No schema | ❌ `analyticsApi` returns empty | MOCK |
| **Alerts** | ❌ No schema | ❌ `analyticsApi` returns empty | MOCK |
| **WebSocket** | ❌ Not implemented | ⚠️ Hooks exist, no connection | NOT IMPLEMENTED |

### 8.2 Mock Data Files

```typescript
// frontend/src/mocks/data.ts
// All exports are empty arrays - no mock data used

export const mockCategories: Category[] = [];
export const mockMenuItems: MenuItem[] = [];
export const mockProducts: Product[] = [];
export const mockRecipes: Recipe[] = [];
export const mockKitchenTickets: KitchenTicket[] = [];
export const mockKPIs: KPI[] = [];
export const mockAlerts: Alert[] = [];
export const mockActionLogs: ActionLog[] = [];
```

### 8.3 Frontend API Status

```typescript
// frontend/src/lib/api.ts - ALL MOCK

menuApi.getCategories()      // Returns empty array
menuApi.getMenuItems()       // Returns empty array
ordersApi.createOrder()      // Returns fake order with generated ID
ordersApi.updateOrderStatus() // Returns fake success
kitchenApi.getTickets()      // Returns empty array
inventoryApi.getProducts()   // Returns empty array
recipesApi.getRecipes()      // Returns empty array
analyticsApi.getKPIs()       // Returns empty array
analyticsApi.getAlerts()     // Returns empty array
```

### 8.4 Real GraphQL Integration

```typescript
// frontend/src/graphql/queries.ts - ALL REAL

GET_KITCHEN_QUEUE    // Kitchen tickets with full relations
GET_ALL_CATEGORIES   // Categories with nested menuItems
GET_ACTIVE_ORDERS    // Active orders with items
GET_ORDER_DETAILS    // Full order details
GET_TABLES           // All tables
GET_STOCK_ALERTS     // Low stock ingredients
GET_AVAILABLE_BATCHES // FIFO batches for ingredient
GET_INVENTORY_MOVEMENTS // Movement history
GET_RECIPES          // Recipes with ingredients

// frontend/src/graphql/mutations.ts - ALL REAL

START_KITCHEN_TICKET    // Triggers inventory deduction
COMPLETE_KITCHEN_TICKET
PAUSE_KITCHEN_TICKET
RESUME_KITCHEN_TICKET
CANCEL_KITCHEN_TICKET   // Triggers inventory release
CREATE_ORDER
UPDATE_ORDER_STATUS
CREATE_ORDER_ITEM
UPDATE_TABLE_STATUS
CREATE_STOCK_BATCH
CREATE_INVENTORY_MOVEMENT
UPDATE_INGREDIENT_STOCK
```

---

## 9. Identified Gaps & Missing Functionality

### 9.1 Critical Gaps

| Gap | Impact | Location | Fix Priority |
|-----|--------|----------|--------------|
| **Order creation uses mock API** | Orders not saved to DB | `frontend/src/lib/api.ts` | HIGH |
| **Kitchen tasks created locally** | No backend tickets | `kitchen-store.ts` | HIGH |
| **No WebSocket implementation** | No real-time updates | `use-websocket.ts` | MEDIUM |
| **Analytics API returns empty** | No KPI dashboard | `api.ts:analyticsApi` | MEDIUM |
| **Storage uses local API routes** | Partial backend sync | `use-storage.tsx` | MEDIUM |
| **No recipe lookup in deduction** | Frontend can't get BOM | `use-inventory-deduction.ts:102` | HIGH |
| **Authentication not wired** | No role-based access | `auth-store.ts` | HIGH |

### 9.2 Functional Gaps

#### 9.2.1 Order Creation Flow
```
CURRENT:
Waiter → cartStore.addItem() → ordersApi.createOrder() → FAKE SUCCESS
                                         ↓
                                   Returns mock order

SHOULD BE:
Waiter → cartStore → GraphQL CREATE_ORDER → Strapi Order
                                    ↓
                          → Creates OrderItems
                                    ↓
                          → Creates KitchenTickets (via lifecycle)
```

#### 9.2.2 Kitchen Ticket Creation
```
CURRENT:
Cart items → createKitchenTasksFromOrder() → kitchenStore (local only)

SHOULD BE:
OrderItem created → lifecycle → creates KitchenTicket in Strapi
                                        ↓
                              → GraphQL subscription → kitchen-store
```

#### 9.2.3 Inventory Deduction
```
CURRENT (Frontend - broken):
onTaskStarted → getRecipeForMenuItem() → returns null → NO DEDUCTION
// Because: async function getRecipeForMenuItem() { return null; } // Placeholder

BACKEND (working if called):
startKitchenTicket mutation → start-ticket.ts → FULL FIFO DEDUCTION
// But: Frontend doesn't call the mutation
```

#### 9.2.4 Real-time Updates
```
CURRENT:
useStationEvents hook exists but:
- connectWebSocket() is empty
- No WebSocket server configured
- Uses polling fallback (30s refresh)

SHOULD BE:
Strapi → WebSocket Server → Frontend subscription → instant updates
```

### 9.3 Data Consistency Issues

1. **Local vs Server State**
   - `kitchenStore` persists to localStorage
   - Server state may differ
   - No synchronization mechanism

2. **Order Totals**
   - Calculated client-side in cart
   - Not validated server-side
   - Prices could be stale

3. **Inventory Counts**
   - `Ingredient.currentStock` updated in backend
   - Frontend `StorageProvider` fetches independently
   - Can be out of sync

---

## 10. Critical Issues & Recommendations

### 10.1 Immediate Fixes (Priority 1)

#### Issue 1: Wire Order Creation to Backend

```typescript
// frontend/src/app/pos/waiter/page.tsx

// CURRENT (line 106-125):
const handleConfirmOrder = async () => {
  await ordersApi.createOrder({...}); // MOCK
  clearCart();
};

// FIX:
import { useMutation } from 'urql';
import { CREATE_ORDER, CREATE_ORDER_ITEM } from '@/graphql/mutations';

const handleConfirmOrder = async () => {
  // 1. Create order in Strapi
  const [orderResult] = await createOrderMutation({
    data: {
      table: selectedTable.documentId,
      waiter: currentUser.documentId,
      status: 'new',
      guestCount: selectedTable.currentGuests,
      totalAmount: getTotalAmount()
    }
  });

  // 2. Create order items
  for (const cartItem of cartItems) {
    await createOrderItemMutation({
      data: {
        order: orderResult.data.createOrder.documentId,
        menuItem: cartItem.menuItem.documentId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.menuItem.price,
        totalPrice: cartItem.menuItem.price * cartItem.quantity,
        courseType: cartItem.courseType,
        notes: cartItem.notes
      }
    });
  }

  // 3. Kitchen tickets created automatically by OrderItem lifecycle
  // 4. Clear cart
  clearCart();
};
```

#### Issue 2: Wire Kitchen Start to Backend

```typescript
// frontend/src/app/kitchen/page.tsx

// CURRENT (line 174-176):
const handleTaskStart = (taskDocumentId: string) => {
  updateTaskStatus(taskDocumentId, "in_progress", currentUser.name);
};

// FIX:
import { useMutation } from 'urql';
import { START_KITCHEN_TICKET } from '@/graphql/mutations';

const handleTaskStart = async (taskDocumentId: string) => {
  // 1. Call backend mutation (triggers inventory deduction)
  const [result] = await startTicketMutation({ documentId: taskDocumentId });

  if (result.data?.startKitchenTicket?.success) {
    // 2. Update local store for immediate UI feedback
    updateTaskStatus(taskDocumentId, "in_progress", currentUser.name);

    // 3. Log consumed batches
    console.log('Consumed:', result.data.startKitchenTicket.consumedBatches);
  } else {
    // 4. Handle errors (e.g., insufficient stock)
    showError(result.data?.startKitchenTicket?.error?.message);
  }
};
```

#### Issue 3: Add Recipe Lookup for Frontend Deduction

```typescript
// frontend/src/hooks/use-inventory-deduction.ts

// CURRENT (line 102-110):
async function getRecipeForMenuItem(menuItemId: string) {
  console.log(`[Inventory] Looking up recipe for menu item: ${menuItemId}`);
  return null; // PLACEHOLDER
}

// FIX:
const GET_MENU_ITEM_RECIPE = gql`
  query GetMenuItemRecipe($documentId: ID!) {
    menuItem(documentId: $documentId) {
      recipe {
        documentId
        ingredients {
          ingredient { documentId, name, unit }
          quantity
          unit
          wasteAllowancePercent
          processChain
        }
      }
    }
  }
`;

async function getRecipeForMenuItem(menuItemId: string) {
  const result = await urqlClient.query(GET_MENU_ITEM_RECIPE, {
    documentId: menuItemId
  }).toPromise();

  return result.data?.menuItem?.recipe || null;
}
```

### 10.2 Medium Priority Fixes

#### Issue 4: Implement WebSocket Connection

```typescript
// frontend/src/lib/ws.ts

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1337';

export function connectWebSocket(onMessage: (data: any) => void) {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log('[WS] Connected');
  ws.onmessage = (event) => onMessage(JSON.parse(event.data));
  ws.onerror = (error) => console.error('[WS] Error:', error);
  ws.onclose = () => setTimeout(() => connectWebSocket(onMessage), 5000);

  return ws;
}
```

#### Issue 5: Wire Authentication

```typescript
// frontend/src/stores/auth-store.ts - already exists

// Need to:
// 1. Call Strapi login API
// 2. Store JWT token
// 3. Pass token in all API requests
// 4. Implement role-based guards per FSM
```

### 10.3 Architecture Recommendations

1. **Create OrderItem Lifecycle for Ticket Creation**
   ```typescript
   // backend/src/api/order-item/content-types/order-item/lifecycles.ts
   async afterCreate(event) {
     // Auto-create kitchen ticket when order item created
     const { result } = event;
     await strapi.documents('api::kitchen-ticket.kitchen-ticket').create({
       data: {
         order: result.order.documentId,
         orderItem: result.documentId,
         station: determineStation(result.menuItem),
         status: 'queued',
         priority: 'normal'
       }
     });
   }
   ```

2. **Add GraphQL Subscriptions for Real-time**
   ```typescript
   // Strapi plugin or custom resolver
   // Emit events on ticket status changes
   ```

3. **Implement Server-Side Sessions**
   ```typescript
   // Track table sessions in Strapi, not just events
   // Calculate duration server-side
   ```

---

## 11. File Structure Reference

### 11.1 Backend Key Files

| File | Purpose |
|------|---------|
| `backend/src/api/order/content-types/order/lifecycles.ts` | Order FSM, table release |
| `backend/src/api/kitchen-ticket/content-types/kitchen-ticket/lifecycles.ts` | Ticket FSM, timestamps |
| `backend/src/api/kitchen-ticket/services/start-ticket.ts` | **INVENTORY DEDUCTION** |
| `backend/src/api/stock-batch/content-types/stock-batch/lifecycles.ts` | Batch number generation |
| `backend/src/api/*/content-types/*/schema.json` | All data models |

### 11.2 Frontend Key Files

| File | Purpose |
|------|---------|
| `frontend/src/app/pos/waiter/page.tsx` | POS order creation |
| `frontend/src/app/kitchen/page.tsx` | Kitchen display |
| `frontend/src/stores/kitchen-store.ts` | Kitchen task state |
| `frontend/src/stores/orders-store.ts` | Order management |
| `frontend/src/stores/cart-store.ts` | Shopping cart |
| `frontend/src/stores/scheduled-orders-store.ts` | HoReCa events |
| `frontend/src/hooks/use-inventory-deduction.ts` | Frontend deduction (broken) |
| `frontend/src/hooks/use-storage.tsx` | Storage management |
| `frontend/src/graphql/queries.ts` | All GraphQL queries |
| `frontend/src/graphql/mutations.ts` | All GraphQL mutations |
| `frontend/src/lib/api-events.ts` | Analytics event logging |
| `frontend/src/lib/api.ts` | **MOCK API** |
| `frontend/src/types/fsm.ts` | State machines |
| `frontend/src/types/event-log.ts` | Event log types |

### 11.3 Component Relationships

```
POS Flow:
tables/page.tsx → waiter/page.tsx → menu-grid.tsx → invoice-sidebar.tsx
                        ↓
                   cart-store.ts
                        ↓
                   ordersApi.createOrder() [MOCK]

Kitchen Flow:
kitchen/page.tsx → station-queue.tsx → kitchen-store.ts
        ↓
   use-kitchen-tickets.ts (GraphQL)
        ↓
   updateTaskStatus() → tableSessionEventsApi.createEvent()

Storage Flow:
storage/page.tsx → StorageProvider → use-storage.tsx
        ↓
   /api/storage/batches (Next.js API routes)
        ↓
   Strapi (partial)
```

---

## Document End

**Last Updated:** 2026-01-10
**Analysis Scope:** Full system audit
**Next Steps:** Implement fixes from Section 10
