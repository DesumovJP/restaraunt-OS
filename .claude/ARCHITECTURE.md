# Restaurant OS - Архітектура системи

> **Версія:** 4.1
> **Дата оновлення:** 2026-01-11
> **Статус:** Production Ready
> **Останні зміни:** Фаза 7 завершено - Backend enums та lifecycle helpers

---

## Зміст

1. [Технологічний стек](#1-технологічний-стек)
2. [Архітектура даних](#2-архітектура-даних)
3. [Потоки даних](#3-потоки-даних)
4. [FSM (Finite State Machine)](#4-fsm-finite-state-machine)
5. [Інвентаризація та FIFO/FEFO](#5-інвентаризація-та-fifofefo)
6. [Аналітика та KPI](#6-аналітика-та-kpi)
7. [Правила розробки](#7-правила-розробки)
8. [Прогрес імплементації](#8-прогрес-імплементації)
9. [Kitchen Timer Architecture](#9-kitchen-timer-architecture)
10. [Action History System](#10-action-history-system)
11. [Worker Shifts System](#11-worker-shifts-system)
12. [Конфігураційні файли](#12-конфігураційні-файли)
13. [Storage Hooks](#13-storage-hooks)
14. [Component Architecture](#14-component-architecture)
15. [GraphQL Organization](#15-graphql-organization)
16. [Types Organization](#16-types-organization)
17. [Backend Utilities](#17-backend-utilities)

---

## 1. Технологічний стек

| Компонент | Технологія |
|-----------|------------|
| Frontend | Next.js 15+ (App Router), React 18, TypeScript |
| State Management | Zustand (persisted stores) |
| UI Components | shadcn/ui, Radix Primitives, Tailwind CSS |
| API Layer | GraphQL (urql), REST API |
| Backend | Strapi v5 (Headless CMS) |
| Database | PostgreSQL |
| Real-time | Planned: WebSocket |

### Головні принципи
- **GraphQL** як основний протокол для CRUD операцій
- **REST** дозволено лише для healthcheck, webhooks
- Використовуємо **documentId/slug**, не числовий id
- Всі бізнес-операції виконуються **транзакційно** з аудитом

---

## 2. Архітектура даних

### 2.1 Структура проєкту

```
Restaurant OS/
├── backend/                     # Strapi v5 Backend
│   ├── src/
│   │   ├── api/                # Content Types & Controllers
│   │   │   ├── order/          # Замовлення
│   │   │   ├── order-item/     # Позиції замовлення
│   │   │   ├── kitchen-ticket/ # Кухонні тікети
│   │   │   ├── menu-item/      # Позиції меню
│   │   │   ├── menu-category/  # Категорії
│   │   │   ├── ingredient/     # Інгредієнти
│   │   │   ├── stock-batch/    # Партії товарів
│   │   │   ├── inventory-movement/ # Рухи інвентарю
│   │   │   ├── ticket-event/   # Аудит тікетів
│   │   │   ├── table/          # Столи
│   │   │   ├── table-session-event/ # Аналітика сесій
│   │   │   ├── recipe/         # Рецепти
│   │   │   ├── yield-profile/  # Yield розрахунки
│   │   │   ├── supplier/       # Постачальники
│   │   │   ├── daily-task/     # Завдання персоналу
│   │   │   ├── scheduled-order/ # Заплановані замовлення
│   │   │   ├── reservation/    # Бронювання
│   │   │   ├── worker-performance/ # KPI працівників
│   │   │   ├── worker-shift/     # Зміни працівників
│   │   │   └── action-history/ # Історія дій
│   │   └── utils/
│   │       ├── action-logger.ts    # Логування дій
│   │       ├── enums.ts            # Централізовані enum'и
│   │       └── lifecycle-helpers.ts # Factory для lifecycle hooks
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

### 2.2 Основні сутності

| Entity | Призначення | Ключові поля |
|--------|-------------|--------------|
| **Order** | Замовлення | orderNumber, status, table, waiter, items[], tickets[] |
| **OrderItem** | Позиція замовлення | order, menuItem, quantity, status, courseType |
| **KitchenTicket** | Кухонний тікет | ticketNumber, station, status, inventoryLocked, assignedChef |
| **MenuItem** | Позиція меню | name, price, recipe, station, portionSize |
| **Recipe** | Рецепт | ingredients[], steps[], portions |
| **Ingredient** | Інгредієнт | name, unit, currentStock, minStock |
| **StockBatch** | Партія товару | ingredient, netAvailable, expiryDate, status |
| **InventoryMovement** | Рух інвентарю | ingredient, stockBatch, movementType, grossQuantity |
| **TicketEvent** | Аудит тікетів | kitchenTicket, eventType, metadata |
| **TableSessionEvent** | Аналітика сесій | tableNumber, sessionId, eventType, durationFromSeatedMs |
| **ActionHistory** | Історія всіх дій | action, entityType, dataBefore, dataAfter, performedBy |
| **WorkerShift** | Зміни працівників | worker, date, startTime, endTime, status, actualMinutes |

### 2.3 Діаграма зв'язків

```
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│    Order     │──│  OrderItem   │──│   KitchenTicket      │
│  (status,    │  │  (status,    │  │   (status, station,  │
│   table,     │  │   menuItem,  │  │    inventoryLocked)  │
│   waiter)    │  │   course)    │  │                      │
└──────────────┘  └──────────────┘  └──────────────────────┘
       │                                      │
       │                                      │
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│    Table     │  │  TicketEvent │  │  InventoryMovement   │
│   (status,   │  │  (audit log) │  │  (recipe_use, return)│
│   capacity)  │  │              │  │                      │
└──────────────┘  └──────────────┘  └──────────────────────┘
                                             │
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  Ingredient  │──│  StockBatch  │──│    YieldProfile      │
│  (stock,     │  │  (FIFO,      │  │    (baseYield,       │
│   minStock)  │  │   expiry)    │  │     processYields)   │
└──────────────┘  └──────────────┘  └──────────────────────┘
```

---

## 3. Потоки даних

### 3.1 Створення замовлення (POS → Kitchen)

```
POS Frontend → Backend → Storage
    │
    ├─ 1. createOrder(GraphQL) → Order in Strapi
    │     └─ orderNumber генерація
    │
    ├─ 2. addOrderItem(GraphQL) × N → OrderItems
    │     └─ АВТО: KitchenTicket (lifecycle afterCreate)
    │
    └─ 3. updateOrderStatus('confirmed')
          └─ tableSessionEventsApi.createEvent('order_taken')
```

### 3.2 Обробка на кухні (Kitchen Processing)

```
Kitchen Display
    │
    ├─ "Почати" → startTicket(REST)
    │     ├─ FIFO/FEFO batch selection
    │     ├─ Yield calculation
    │     ├─ Batch consumption
    │     ├─ InventoryMovement creation
    │     └─ inventoryLocked = true
    │
    ├─ "Готово" → complete(REST)
    │     ├─ elapsedSeconds calculation
    │     └─ TicketEvent creation
    │
    └─ "Скасувати" → cancel(REST)
          ├─ releaseInventory()
          └─ Return movements
```

### 3.3 Повний цикл замовлення

```
new → confirmed → in_kitchen → ready → served → paid
  ↘      ↘           ↘          ↘       ↘
   cancelled ←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

---

## 4. FSM (Finite State Machine)

### Order Status

```typescript
const VALID_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['in_kitchen', 'cancelled'],
  in_kitchen: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid', 'cancelled'],
  paid: [],
  cancelled: []
};
```

### OrderItem Status

```
draft → queued → pending → in_progress → ready → served
  │       │        │           │           │        │
  ▼       ▼        ▼           ▼           ▼        ▼
cancelled cancelled cancelled cancelled (undo) returned/voided
```

### KitchenTicket Status

```
queued → started → ready → served
           ↓ ↑
         paused ↔ resumed
           ↓
    failed / cancelled
```

### StockBatch Status

```
received → available → in_use → depleted
              ↓
           expired / damaged → written_off
```

---

## 5. Інвентаризація та FIFO/FEFO

### 5.1 Алгоритм списання (start-ticket.ts)

```typescript
async startTicket(ticketDocumentId, chefDocumentId) {
  // 1. Завантаження тікету з рецептом
  const ticket = await loadTicketWithRecipe(ticketDocumentId);

  // 2. Для кожного інгредієнта:
  for (const recipeIngredient of recipe.ingredients) {
    // 2a. Розрахунок кількості
    const netRequired = recipeIngredient.quantity * orderItem.quantity;
    const yieldMultiplier = calculateYieldMultiplier(yieldProfile, processChain);
    const grossRequired = netRequired / yieldMultiplier;

    // 2b. Конвертація одиниць
    const normalizedGross = convertUnits(grossRequired, recipeUnit, ingredientUnit);

    // 2c. FIFO/FEFO вибір партій
    const batches = await strapi.documents('api::stock-batch.stock-batch').findMany({
      filters: {
        ingredient: { documentId: ingredient.documentId },
        status: { $in: ['available', 'received'] },
        netAvailable: { $gt: 0 },
        isLocked: { $ne: true }
      },
      sort: [
        { expiryDate: 'asc' },   // FEFO - спочатку ті, що закінчуються раніше
        { receivedAt: 'asc' }    // FIFO - потім старіші за датою отримання
      ]
    });

    // 2d. Споживання з партій
    let remaining = normalizedGross;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const takeAmount = Math.min(batch.netAvailable, remaining);

      // Оновлення партії
      await updateBatch(batch.documentId, {
        netAvailable: batch.netAvailable - takeAmount,
        usedAmount: batch.usedAmount + takeAmount
      });

      // Створення InventoryMovement
      await createInventoryMovement({
        movementType: 'recipe_use',
        quantity: takeAmount,
        reasonCode: 'TICKET_START'
      });

      remaining -= takeAmount;
    }

    // 2e. Перевірка достатності
    if (remaining > 0.001) {
      throw { code: 'INSUFFICIENT_STOCK', ... };
    }
  }

  // 3. Оновлення тікету
  await updateTicket(ticketDocumentId, {
    status: 'started',
    inventoryLocked: true
  });
}
```

### 5.2 Конвертація одиниць

```typescript
const UNIT_CONVERSIONS = {
  kg: { g: 1000, kg: 1 },
  g: { kg: 0.001, g: 1 },
  l: { ml: 1000, l: 1 },
  ml: { l: 0.001, ml: 1 },
  pcs: { pcs: 1, portion: 1 },
  portion: { portion: 1, pcs: 1 },
};
```

### 5.3 Yield Profile розрахунок

```typescript
function calculateYieldMultiplier(yieldProfile, processChain) {
  let multiplier = yieldProfile.baseYieldRatio || 1;

  for (const processType of processChain) {
    const processYield = yieldProfile.processYields?.find(p => p.processType === processType);
    if (processYield) {
      if (processYield.moistureLoss) multiplier *= (1 - processYield.moistureLoss);
      if (processYield.oilAbsorption) multiplier *= (1 + processYield.oilAbsorption);
      if (processYield.yieldRatio) multiplier *= processYield.yieldRatio;
    }
  }
  return multiplier;
}

// Приклад:
// Яловичина (1kg) → baseYield: 0.85 → cleaning: 0.95 → grilling: 0.80
// Фінальний вихід: 1 * 0.85 * 0.95 * 0.80 = 0.646 kg
```

---

## 6. Аналітика та KPI

### 6.1 Table Session Events

```typescript
type TableSessionEventType =
  | 'table_seated'      // Гості сіли за стіл
  | 'order_taken'       // Замовлення прийнято
  | 'item_started'      // Страва почала готуватись
  | 'item_ready'        // Страва готова
  | 'item_served'       // Страва подана
  | 'bill_requested'    // Рахунок запитано
  | 'bill_paid'         // Рахунок оплачено
  | 'table_cleared';    // Стіл звільнено
```

### 6.2 KPI Метрики

| KPI | Опис | Розрахунок |
|-----|------|------------|
| Prep time | Час приготування | ready_at − started_at |
| Queue time | Час в черзі | started_at − created_at |
| Service time | Час обслуговування | served_at − ready_at |
| Total session | Повний час сесії | bill_paid - table_seated |
| Efficiency score | Ефективність працівника | estimated_time / actual_time |

### 6.3 Worker Performance

```typescript
interface WorkerPerformance {
  worker: User;
  date: Date;
  tasksCompleted: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  ticketsCompleted: number;
  avgTicketTimeSeconds: number;
  efficiencyScore: number;  // >100% = faster than expected
  department: 'management' | 'kitchen' | 'service' | 'bar' | 'none';
}
```

---

## 7. Правила розробки

### 7.1 Frontend

**Next.js / React:**
- App Router, без pages/ та getInitialProps
- Server Components для первинного рендеру
- Suspense, useTransition, useOptimistic
- dynamic() для lazy loading

**Стан та дані:**
- Zustand для всіх бізнес-даних
- persist для auth/profile
- Заборонено прямі fetch у компонентах
- GraphQL запити в окремих файлах

**UI продуктивність:**
- Анімації: лише transform/opacity
- Заборонено анімувати box-shadow
- GPU-оптимізації: will-change, translate3d
- Design tokens - централізовано

### 7.2 Backend

**Strapi v5:**
- GraphQL як основний протокол
- documentId/slug, не числовий id
- populate для зв'язків
- Lifecycle hooks для автоматизації

**Транзакційність:**
- StartTicket - атомарне списання
- inventory_locked запобігає повторному списанню
- Rollback при помилках

### 7.3 Error Handling

```typescript
const fetchWithRetry = async (fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

### 7.4 Color Token Mapping

| Hardcoded | Token |
|-----------|-------|
| `#1A1A1A`, `#111111` | `text-foreground` |
| `#666666` | `text-muted-foreground` |
| `#E8E2DD`, `#E2E8F0` | `border-border` |
| `#F1EDE9`, `#F8FAFC` | `bg-muted` |
| `#4A7C4E`, `#059669` | `text-success` / `bg-success` |
| `#E11D48` | `text-error` / `bg-error` |
| `#F59E0B`, `#D97706` | `text-warning` / `bg-warning` |

---

## 8. Прогрес імплементації

### Completed Features

| Feature | Status | Files |
|---------|--------|-------|
| Order Creation Flow | DONE | `order-confirm-dialog.tsx`, GraphQL hooks |
| Kitchen Ticket Start | DONE | `kitchen/page.tsx`, `start-ticket.ts` |
| FIFO Inventory Deduction | DONE | `start-ticket.ts` service |
| Recipe Lookup | DONE | `GET_MENU_ITEM_RECIPE` query |
| Analytics/KPIs | DONE | `tableSessionEventsApi` |
| Stock Batches | DONE | GraphQL + fallback |
| Scheduled Orders | DONE | Backend schema + hooks |
| Reservations | DONE | Full schema + UI |
| Portions + Weight | DONE | `portionSize`, `portionUnit`, `portionsPerRecipe` |
| Worker KPI | DONE | `worker-performance` content type |
| Supply Form | DONE | `supply-form.tsx` |
| Write-off Form | DONE | `write-off-form.tsx` |
| Expense Reports | DONE | `storage/reports/page.tsx` |
| Action History | DONE | Full audit logging system |
| Worker Shifts | DONE | `worker-shift` content type, calendar UI |

### System URLs

| Service | URL |
|---------|-----|
| Backend (Strapi) | http://localhost:1337 |
| Frontend (Next.js) | http://localhost:3000 |
| Storage Reports | http://localhost:3000/storage/reports |
| Admin Dashboard | http://localhost:3000/dashboard/admin |
| Schedule Management | http://localhost:3000/dashboard/admin/schedule |
| Action History | http://localhost:3000/dashboard/admin/history |
| Worker Profile | http://localhost:3000/dashboard/profile |

---

## 9. Kitchen Timer Architecture

### Timer Phases

```
   ORDER       QUEUE        COOKING         READY         SERVED
   CREATED     WAITING      IN PROGRESS     WAITING       COMPLETED
      |           |             |              |              |
      v           v             v              v              v
   ---|-----------|-------------|--------------|--------------|---> time
      ^           ^             ^              ^              ^
      |           |             |              |              |
   createdAt   startedAt    completedAt    servedAt      (end)

   |<--queueMs-->|<--cookMs-->|<--pickupMs-->|
   |<-----------------totalMs---------------->|
```

### Timer Fields

| Phase | Start | End | Duration Field |
|-------|-------|-----|----------------|
| Queue | createdAt | startedAt | queueMs |
| Cook | startedAt | completedAt | cookMs / prepElapsedMs |
| Pickup | completedAt | servedAt | pickupMs |
| Total | createdAt | servedAt | totalMs |

### Visual Indicators

| Timer State | Text Color | Background |
|-------------|------------|------------|
| Normal | gray | none |
| Warning (80%) | yellow/orange | light yellow |
| Overdue | red, bold | light red |

---

## 10. Action History System

### 10.1 Content Type (action-history)

```typescript
interface ActionHistory {
  action: 'create' | 'update' | 'delete' | 'start' | 'complete' | 'cancel' |
          'receive' | 'write_off' | 'transfer' | 'login' | 'logout' |
          'approve' | 'reject' | 'assign' | 'unassign';
  entityType: 'order' | 'order_item' | 'kitchen_ticket' | 'menu_item' |
              'menu_category' | 'ingredient' | 'stock_batch' |
              'inventory_movement' | 'recipe' | 'table' | 'reservation' |
              'scheduled_order' | 'daily_task' | 'user' | 'supplier' |
              'worker_performance';
  entityId: string;
  entityName?: string;
  description: string;
  descriptionUk?: string;
  dataBefore?: object;
  dataAfter?: object;
  changedFields?: string[];
  metadata?: object;  // Детальна інформація про операцію
  performedBy?: User;
  performedByName?: string;
  performedByRole?: string;
  ipAddress?: string;
  userAgent?: string;
  module: 'pos' | 'kitchen' | 'storage' | 'admin' | 'reservations' | 'system';
  severity: 'info' | 'warning' | 'critical';
}
```

### 10.2 Automatic Logging via Lifecycles

Entities with automatic logging:

| Entity | Module | Actions | Lifecycle File |
|--------|--------|---------|----------------|
| `order` | pos | create, update, delete | `order/lifecycles.ts` |
| `order-item` | pos | create, update, cancel, delete | `order-item/lifecycles.ts` |
| `kitchen-ticket` | kitchen | start, complete, cancel, serve | `kitchen-ticket/lifecycles.ts` |
| `stock-batch` | storage | receive, write_off, delete | `stock-batch/lifecycles.ts` |
| `menu-item` | admin | create, update, delete | `menu-item/lifecycles.ts` |
| `menu-category` | admin | create, update, delete | `menu-category/lifecycles.ts` |
| `ingredient` | storage | create, update, delete | `ingredient/lifecycles.ts` |
| `inventory-movement` | storage | create, update, delete | `inventory-movement/lifecycles.ts` |
| `reservation` | reservations | create, update, approve, cancel, delete | `reservation/lifecycles.ts` |
| `daily-task` | admin | create, start, complete, cancel, update, delete | `daily-task/lifecycles.ts` |
| `scheduled-order` | reservations | create, update, approve, start, complete, cancel, delete | `scheduled-order/lifecycles.ts` |
| `recipe` | admin | create, update, delete | `recipe/lifecycles.ts` |
| `table` | pos | create, update, delete | `table/lifecycles.ts` |
| `supplier` | storage | create, update, delete | `supplier/lifecycles.ts` |

**Action Logger Utility** (`backend/src/utils/action-logger.ts`):
- `logAction()` - основна функція логування
- `createActionLoggerLifecycles()` - хелпер для створення стандартних lifecycle hooks
- Автоматична генерація українських описів
- Редакція чутливих полів (password, token, secret)
- Обмеження розміру JSON (10KB max)

### 10.3 Детальне логування кухонних операцій

#### Start Ticket (Списання інвентарю)

При старті тікету (`start-ticket.ts:480-575`) записується:

```typescript
metadata: {
  // Тікет
  ticketNumber: string;
  station: string;

  // Замовлення
  orderNumber: string;
  orderId: string;
  tableNumber: number;

  // Страва
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;

  // Списані інгредієнти (агреговано)
  ingredientsUsed: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;

  // Деталі списання з партій (FIFO/FEFO)
  consumptionDetails: Array<{
    ingredient: string;
    batch: string;
    quantity: number;
    unit: string;
    cost: number;
    expiryDate: string;
    stockBefore: number;
    stockAfter: number;
  }>;

  // Підсумки
  totalIngredients: number;
  totalBatchesUsed: number;
  totalCost: number;
  processingTimeMs: number;
  chefId: string;
}
```

#### Complete Ticket (Завершення приготування)

```typescript
metadata: {
  ticketNumber: string;
  menuItemName: string;
  orderNumber: string;
  tableNumber: number;
  cookingTimeSeconds: number;
  cookingTimeFormatted: string;  // "5м 30с"
  startedAt: string;
  completedAt: string;
  orderReady: boolean;  // Чи всі страви замовлення готові
}
```

#### Serve Ticket (Подача страви)

```typescript
metadata: {
  ticketNumber: string;
  menuItemName: string;
  orderNumber: string;
  tableNumber: number;

  // Хронометраж
  timings: {
    queueTimeSeconds: number;     // Час в черзі
    cookingTimeSeconds: number;   // Час приготування
    pickupWaitSeconds: number;    // Час очікування видачі
    totalTimeSeconds: number;     // Загальний час
  };
  timingsFormatted: {
    queueTime: string;    // "2м"
    cookingTime: string;  // "5м 30с"
    pickupWait: string;   // "1м 15с"
    totalTime: string;    // "8м 45с"
  };

  // Мітки часу
  timestamps: {
    createdAt: string;
    startedAt: string;
    completedAt: string;
    servedAt: string;
  };

  orderServed: boolean;  // Чи все замовлення подано
}
```

#### Inventory Release (Скасування/Провал)

```typescript
metadata: {
  ticketId: string;
  reason: string;
  movementsReversed: number;
  batchesRestored: number;
  ingredientsRestored: number;
  totalQuantityRestored: number;
  releasedItems: Array<{
    ingredientName: string;
    batchNumber: string;
    quantity: number;
    unit: string;
  }>;
}
```

### 10.4 Frontend - Сторінка історії дій

**URL:** `/dashboard/admin/history`

**Файл:** `frontend/src/app/dashboard/admin/history/page.tsx`

**Можливості:**
- Фільтри: дата, модуль, тип сутності, дія, важливість
- Акордеони з детальною інформацією:
  - **Start**: таблиця інгредієнтів, списання з партій, собівартість
  - **Complete/Serve**: хронометраж (4 карточки), мітки часу
  - **Cancel/Fail**: причина, повернуті продукти
- Кольорове кодування: info (синій), warning (жовтий), critical (червоний)
- Пагінація по 50 записів

### 10.5 GraphQL Queries

```graphql
query GetActionHistory(
  $fromDate: DateTime
  $toDate: DateTime
  $entityType: String
  $action: String
  $module: String
  $severity: String
  $limit: Int
  $offset: Int
) {
  actionHistories(
    filters: {
      createdAt: { gte: $fromDate, lte: $toDate }
      entityType: { eq: $entityType }
      action: { eq: $action }
      module: { eq: $module }
      severity: { eq: $severity }
    }
    sort: ["createdAt:desc"]
    pagination: { limit: $limit, start: $offset }
  ) {
    documentId
    action
    entityType
    entityId
    entityName
    description
    descriptionUk
    dataBefore
    dataAfter
    changedFields
    metadata      # Детальна інформація
    module
    severity
    performedByName
    performedByRole
    createdAt
    performedBy {
      documentId
      username
      firstName
      lastName
    }
  }
}
```

---

## PostgreSQL конфігурація

```javascript
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'mydb'),
      user: env('DATABASE_USERNAME', 'myuser'),
      password: env('DATABASE_PASSWORD', 'mypassword'),
      ssl: env.bool('DATABASE_SSL', true)
        ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) }
        : false,
    },
    pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
  },
});
```

---

## RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| **Waiter** | Create Order/OrderItem, Read MenuItem/Recipe, Update Order.status → served |
| **Chef** | Update KitchenTicket.status, Read Recipe/Ingredients, Trigger StartTicket |
| **Manager** | Full CRUD on MenuItem/Recipe/Ingredient/StockBatch, Read analytics, Approve recipes |
| **System** | Access to InventoryMovement and transactional operations |

---

## Checklist для Production

- [ ] Всі контент-типи і зв'язки створені
- [ ] unit_primary і conversion для кожного Ingredient
- [ ] Рецепти: статуси/версії, waste_factor заповнено
- [ ] StartTicket: атомарне списання, заборона повторного дебету
- [ ] Валідації: нелогічні переходи статусів блокуються
- [ ] Persisted queries: для критичних маршрутів
- [ ] JWT: ротація, короткий TTL
- [ ] CORS: allowlist, без wildcard у проді
- [ ] pg_dump: щоденно, DR тест пройдено
- [ ] Design tokens: є, без інлайн стилів
- [ ] Action History: lifecycle hooks для всіх сутностей

---

## 11. Worker Shifts System

### 11.1 Content Type (worker-shift)

```typescript
interface WorkerShift {
  worker: User;                     // Працівник
  date: Date;                       // Дата зміни
  startTime: Time;                  // Запланований початок (HH:MM)
  endTime: Time;                    // Запланований кінець
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'split';
  status: 'scheduled' | 'started' | 'completed' | 'missed' | 'cancelled';

  // Фактичний час
  actualStartTime?: Time;           // Clock-in час
  actualEndTime?: Time;             // Clock-out час

  // Тривалості (хвилини)
  scheduledMinutes: number;         // Запланована тривалість
  actualMinutes?: number;           // Фактично відпрацьовано
  overtimeMinutes?: number;         // Понаднормові
  breakMinutes?: number;            // Час перерви

  // Оплата
  hourlyRate?: Decimal;             // Ставка за годину
  totalPay?: Decimal;               // Загальна оплата
  overtimePay?: Decimal;            // Оплата понаднормових

  // Додатково
  station?: string;                 // Робоча станція
  notes?: string;                   // Примітки менеджера
  clockInNote?: string;             // Примітка при clock-in
  clockOutNote?: string;            // Примітка при clock-out
  createdBy?: User;                 // Хто створив зміну
}
```

### 11.2 FSM статусів зміни

```
scheduled → started → completed
     ↓         ↓
  missed    cancelled

Transitions:
- scheduled → started: clock-in
- started → completed: clock-out
- scheduled → missed: автоматично (якщо не почато вчасно)
- * → cancelled: скасування менеджером
```

### 11.3 Backend Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| POST | `/worker-shifts/:documentId/clock-in` | clockIn | Початок зміни |
| POST | `/worker-shifts/:documentId/clock-out` | clockOut | Завершення зміни |
| GET | `/worker-shifts/my-shifts` | myShifts | Зміни поточного працівника |
| GET | `/worker-shifts/stats/:workerId` | workerStats | Статистика працівника |
| POST | `/worker-shifts/bulk` | bulkCreate | Масове створення змін |
| GET | `/worker-shifts/team-schedule` | teamSchedule | Розклад команди |

### 11.4 Controller Methods

#### Clock In

```typescript
async clockIn(ctx) {
  const { documentId } = ctx.params;
  const { note } = ctx.request.body || {};
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  const shift = await strapi.documents('api::worker-shift.worker-shift')
    .findOne({ documentId, populate: ['worker'] });

  // Validation: scheduled status, correct date
  if (shift.status !== 'scheduled') throw error;

  const updated = await strapi.documents('api::worker-shift.worker-shift')
    .update({
      documentId,
      data: {
        status: 'started',
        actualStartTime: currentTime,
        clockInNote: note
      }
    });

  // Log action
  await logAction(strapi, { action: 'start', entityType: 'worker_performance', ... });
}
```

#### Clock Out

```typescript
async clockOut(ctx) {
  const { documentId } = ctx.params;
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  const shift = await strapi.documents('api::worker-shift.worker-shift')
    .findOne({ documentId, populate: ['worker'] });

  // Validation: started status
  if (shift.status !== 'started') throw error;

  // Calculate actual minutes
  const startParts = shift.actualStartTime.split(':');
  const endParts = currentTime.split(':');
  const actualMinutes = calculateMinutes(startParts, endParts);
  const overtimeMinutes = Math.max(0, actualMinutes - shift.scheduledMinutes);

  // Calculate pay
  const hourlyRate = shift.hourlyRate || 0;
  const totalPay = (actualMinutes / 60) * hourlyRate;
  const overtimePay = (overtimeMinutes / 60) * hourlyRate * 1.5;

  await strapi.documents('api::worker-shift.worker-shift')
    .update({
      documentId,
      data: {
        status: 'completed',
        actualEndTime: currentTime,
        actualMinutes,
        overtimeMinutes,
        totalPay,
        overtimePay,
        clockOutNote: note
      }
    });
}
```

#### Worker Stats

```typescript
async workerStats(ctx) {
  const { workerId } = ctx.params;
  const { fromDate, toDate } = ctx.query;

  const shifts = await strapi.documents('api::worker-shift.worker-shift')
    .findMany({
      filters: {
        worker: { documentId: workerId },
        date: { $gte: fromDate, $lte: toDate }
      },
      sort: [{ date: 'desc' }]
    });

  return {
    totalShifts: shifts.length,
    completedShifts: shifts.filter(s => s.status === 'completed').length,
    totalScheduledMinutes: sum(shifts, 'scheduledMinutes'),
    totalActualMinutes: sum(shifts, 'actualMinutes'),
    totalOvertimeMinutes: sum(shifts, 'overtimeMinutes'),
    attendanceRate: completedShifts / totalShifts * 100,
    punctualityRate: calculatePunctuality(shifts),
    totalPay: sum(shifts, 'totalPay')
  };
}
```

### 11.5 GraphQL Queries

```graphql
# Зміни працівника
query GetWorkerShifts($workerId: ID!, $fromDate: Date!, $toDate: Date!) {
  workerShifts(
    filters: {
      worker: { documentId: { eq: $workerId } }
      date: { gte: $fromDate, lte: $toDate }
    }
    sort: ["date:asc", "startTime:asc"]
  ) {
    documentId
    date
    startTime
    endTime
    shiftType
    status
    actualStartTime
    actualEndTime
    scheduledMinutes
    actualMinutes
    overtimeMinutes
    station
    notes
    worker {
      documentId
      username
      firstName
      lastName
    }
  }
}

# Розклад команди на тиждень
query GetTeamSchedule($fromDate: Date!, $toDate: Date!) {
  workerShifts(
    filters: { date: { gte: $fromDate, lte: $toDate } }
    sort: ["date:asc", "startTime:asc"]
  ) {
    documentId
    date
    startTime
    endTime
    shiftType
    status
    worker {
      documentId
      firstName
      lastName
      department
    }
  }
}

# Всі працівники
query GetAllWorkers {
  usersPermissionsUsers(
    filters: { systemRole: { in: ["chef", "waiter", "bartender", "manager"] } }
  ) {
    documentId
    username
    firstName
    lastName
    department
    station
    systemRole
    avatarUrl
  }
}
```

### 11.6 Frontend Pages

#### Worker Profile (`/dashboard/profile`)

**Файл:** `frontend/src/app/dashboard/profile/page.tsx`

**Компоненти:**
- Статистика: карточки з годинами, понаднормовими, виконаними змінами
- Календар: тижневий/місячний вигляд
- Clock-in/Clock-out кнопки для поточної зміни
- Список найближчих змін

**Статистичні карточки:**
- Заплановано годин (scheduledHours)
- Відпрацьовано (actualHours)
- Понаднормові (overtimeHours)
- Виконано змін (completedShifts)

#### Schedule Management (`/dashboard/admin/schedule`)

**Файл:** `frontend/src/app/dashboard/admin/schedule/page.tsx`

**Можливості:**
- Тижневий вигляд з працівниками по рядках
- Дні тижня по колонках
- Відображення змін з кольоровим кодуванням за типом
- Фільтр по відділу
- Діалог додавання нової зміни:
  - Вибір працівника
  - Дата, час початку/кінця
  - Тип зміни
  - Примітки

### 11.7 Кольорове кодування змін

| Тип зміни | Колір | CSS |
|-----------|-------|-----|
| morning | Блакитний | `bg-blue-100 text-blue-800` |
| afternoon | Зелений | `bg-green-100 text-green-800` |
| evening | Фіолетовий | `bg-purple-100 text-purple-800` |
| night | Сірий | `bg-gray-100 text-gray-800` |
| split | Жовтий | `bg-yellow-100 text-yellow-800` |

| Статус | Індикатор |
|--------|-----------|
| scheduled | Звичайний |
| started | Зелена точка |
| completed | Галочка |
| missed | Червоний фон |
| cancelled | Закреслено |

### 11.8 Lifecycle Hooks

```typescript
// worker-shift/content-types/worker-shift/lifecycles.ts

export default {
  async afterCreate(event) {
    await logAction(strapi, {
      action: 'create',
      entityType: 'worker_performance',
      entityName: `Shift ${result.date}`,
      description: `Created shift for ${result.date}`,
      module: 'admin'
    });
  },

  async afterUpdate(event) {
    // Skip if logged by controller (clock-in/clock-out)
    if (result.status === 'started' || result.status === 'completed') {
      return;
    }

    await logAction(strapi, {
      action: result.status === 'cancelled' ? 'cancel' : 'update',
      entityType: 'worker_performance',
      module: 'admin'
    });
  },

  async afterDelete(event) {
    await logAction(strapi, {
      action: 'delete',
      entityType: 'worker_performance',
      severity: 'warning'
    });
  }
};
```

### 11.9 Інтеграція з Worker Performance

Система змін інтегрується з KPI працівників:

```
WorkerShift (зміни)          WorkerPerformance (KPI)
      │                              │
      │ clock-in/out                 │ tasksCompleted
      │ actualMinutes                │ ticketsCompleted
      │ punctuality                  │ avgTicketTime
      │                              │ efficiencyScore
      └──────────┬───────────────────┘
                 │
           Admin Dashboard
           (WorkerPerformanceTable)
```

**Метрики:**
- **Attendance Rate** = Completed Shifts / Total Shifts × 100%
- **Punctuality Rate** = On-time Clock-ins / Total Clock-ins × 100%
- **Hours Worked** = Σ actualMinutes / 60
- **Overtime Hours** = Σ overtimeMinutes / 60

---

## 12. Конфігураційні файли

> **Фаза 1 рефакторингу:** Централізація всіх конфігурацій та утиліт

### 12.1 Структура директорії config

```
frontend/src/lib/
├── config/                    # Централізовані конфігурації
│   ├── index.ts              # Re-exports
│   ├── station-config.ts     # Конфігурації станцій кухні
│   ├── action-type-config.ts # Іконки та кольори для дій
│   └── i18n-labels.ts        # Українські переклади
└── formatters.ts             # Утиліти форматування
```

### 12.2 Station Configuration

**Файл:** `frontend/src/lib/config/station-config.ts`

```typescript
// Типи станцій: hot | cold | pastry | bar | pass
export const STATION_DISPLAY_CONFIGS: Record<StationType, StationDisplayConfig>
export const STATION_CAPACITY_CONFIGS: StationCapacityConfig[]
export const ACTIVE_COOKING_STATIONS: StationType[] // без pass
export const ALL_STATION_TYPES: StationType[]

// Хелпери
export function getStationConfig(type: StationType): StationDisplayConfig
export function getStationCapacity(type: StationType): number
```

**Використання:**
- `app/kitchen/page.tsx` - налаштування ємності станцій
- `features/kitchen/station-queue.tsx` - відображення станцій

### 12.3 Action Type Configuration

**Файл:** `frontend/src/lib/config/action-type-config.ts`

```typescript
// Типи
export type ActionType = 'create' | 'update' | 'delete' | 'start' | ...
export type ModuleType = 'pos' | 'kitchen' | 'storage' | 'admin' | ...
export type SeverityType = 'info' | 'warning' | 'critical'
export type EntityType = 'order' | 'kitchen_ticket' | 'stock_batch' | ...

// Конфігурації
export const ACTION_ICONS: Record<string, LucideIcon>
export const MODULE_COLORS: Record<string, string>
export const SEVERITY_COLORS: Record<string, string>
export const ACTION_BG_COLORS: Record<string, string>

// Хелпери
export function getActionIcon(action: string): LucideIcon
export function getActionBgColor(action: string): string
export function getModuleColor(module: string): string
export function getSeverityColor(severity: string): string
```

**Використання:**
- `app/dashboard/admin/history/page.tsx` - сторінка історії дій

### 12.4 Internationalization Labels

**Файл:** `frontend/src/lib/config/i18n-labels.ts`

```typescript
// Константи
export const ACTION_LABELS_UK: Record<string, string>
export const ENTITY_LABELS_UK: Record<string, string>
export const MODULE_LABELS_UK: Record<string, string>
export const SEVERITY_LABELS_UK: Record<string, string>

// Хелпери
export function getActionLabelUk(action: string): string
export function getEntityLabelUk(entityType: string): string
export function getModuleLabelUk(module: string): string
export function getSeverityLabelUk(severity: string): string
```

### 12.5 Formatters

**Файл:** `frontend/src/lib/formatters.ts`

```typescript
// Час та тривалість
export function formatDurationMs(ms: number): string           // "5:30"
export function formatDurationSeconds(seconds: number): string  // "5м 30с"
export function formatDurationMsHuman(ms: number): string       // "1г 30хв"
export function formatTableSessionTime(occupiedAt: string): string

// Дати
export function formatDateTime(dateStr: string): string         // "01.01.2024, 12:30:45"
export function formatDate(dateStr: string): string             // "01.01.2024"
export function formatTime(dateStr: string): string             // "12:30:45"
export function formatTimeAgo(dateStr: string): string          // "5 хв тому"
export function formatCurrentTime(): string                     // "12:30"

// Числа
export function formatCurrency(amount: number): string          // "₴123.45"
export function formatQuantity(quantity: number, unit: string): string
export function formatWeight(grams: number): string             // "1.5 кг"
```

**Використання:**
- Всі компоненти, що відображають час, тривалість, валюту
- Замінює дубльовані локальні функції форматування

### 12.6 Принципи використання

1. **Імпорт з index.ts:**
   ```typescript
   import { STATION_DISPLAY_CONFIGS, getStationConfig } from '@/lib/config'
   ```

2. **Або прямий імпорт:**
   ```typescript
   import { formatCurrency, formatDateTime } from '@/lib/formatters'
   ```

3. **Не дублювати константи в компонентах** - завжди використовувати централізовані файли

4. **Розширення:** Для нових конфігурацій додавати в відповідний файл або створювати новий в `lib/config/`

---

## 13. Storage Hooks

> **Фаза 2 рефакторингу:** Уніфіковані hooks для роботи зі складом

### 13.1 Структура hooks

```
frontend/src/hooks/
├── use-batches-data.ts      # Дані партій
├── use-storage-history.ts   # Історія операцій
├── use-category-filter.ts   # Фільтрація категорій
└── use-inventory-deduction.ts # Списання інвентаря (існуючий)
```

### 13.2 useBatchesData

**Файл:** `frontend/src/hooks/use-batches-data.ts`

```typescript
// Типи
export type BatchSortField = "product" | "received" | "expiry" | "quantity" | "cost" | "status";
export type SortOrder = "asc" | "desc";

// Інтерфейси
export interface BatchFilters {
  status: BatchStatus | "all";
  search: string;
}

export interface UseBatchesDataReturn {
  batches: StorageBatch[];
  filteredBatches: StorageBatch[];
  todaysSummary: TodaysSummary;
  statusCounts: StatusCounts;
  filters: BatchFilters;
  sort: BatchSort;
  isLoading: boolean;
  error: Error | null;
  setStatusFilter: (status: BatchStatus | "all") => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: BatchSortField) => void;
  refetch: () => void;
}

// Використання
const {
  filteredBatches,
  todaysSummary,
  statusCounts,
  setStatusFilter,
  setSearchQuery,
} = useBatchesData();
```

**Особливості:**
- GraphQL як основне джерело з fallback на mock дані
- Автоматичне сортування та фільтрація
- Підрахунок статусів та підсумків

### 13.3 useStorageHistory

**Файл:** `frontend/src/hooks/use-storage-history.ts`

```typescript
export interface UseStorageHistoryReturn {
  entries: StorageHistoryEntry[];
  filteredEntries: StorageHistoryEntry[];
  groupedEntries: GroupedEntries;  // Згруповано по даті
  operationCounts: OperationCounts;
  filters: HistoryFilters;
  setOperationFilter: (op: StorageOperationType | "all") => void;
  setSearchQuery: (query: string) => void;
  refresh: () => void;
}

// Використання
const {
  groupedEntries,
  operationCounts,
  setOperationFilter,
} = useStorageHistory({ limit: 100, pollInterval: 10000 });
```

**Особливості:**
- Автоматичне групування по датах (Сьогодні/Вчора/...)
- Polling кожні 10 секунд
- Фільтрація по типу операції та пошук

### 13.4 useCategoryFilter

**Файл:** `frontend/src/hooks/use-category-filter.ts`

```typescript
export interface UseCategoryFilterReturn {
  mainCategory: StorageMainCategory | null;
  subCategory: StorageSubCategory | null;
  hasActiveFilter: boolean;
  categoryTree: CategoryTree;
  currentSubCategories: SubCategory[];
  handleMainCategoryClick: (category: StorageMainCategory) => void;
  handleSubCategoryClick: (subCategory: StorageSubCategory) => void;
  clearFilters: () => void;
  getTotalCount: (counts: CategoryCounts) => number;
}

// Використання
const {
  mainCategory,
  subCategory,
  handleMainCategoryClick,
  clearFilters,
} = useCategoryFilter();
```

**Особливості:**
- Ієрархічний вибір (головна → підкатегорія)
- Toggle логіка для вибору/скасування
- Хелпери для підрахунку кількості

### 13.5 Storage Configuration

**Файл:** `frontend/src/lib/config/storage-config.ts`

```typescript
// Конфігурації
export const BATCH_STATUS_CONFIG: Record<BatchStatus, BatchStatusConfig>
export const OPERATION_TYPE_CONFIG: Record<StorageOperationType, OperationTypeConfig>
export const CATEGORY_ICONS: Record<string, LucideIcon>
export const OPERATOR_ROLE_LABELS: Record<string, string>

// Хелпери
export function getBatchStatusConfig(status: BatchStatus): BatchStatusConfig
export function getOperationConfig(operationType: StorageOperationType): OperationTypeConfig
export function getDaysUntilExpiry(expiryDate: string): number | null
export function getFreshnessColor(daysUntilExpiry: number): string
export function isExpiringSoon(expiryDate: string): boolean
export function getBatchUsagePercent(grossIn, usedAmount, wastedAmount): number
```

### 13.6 Міграція з дублікатів

**Замість:**
```typescript
// Старий підхід - окремі компоненти
import { BatchesList } from "@/features/storage/batches-list";
import { BatchesListOptimized } from "@/features/storage/batches-list-optimized";
```

**Використовувати:**
```typescript
// Новий підхід - уніфікований hook + конфіг
import { useBatchesData } from "@/hooks/use-batches-data";
import { BATCH_STATUS_CONFIG, getBatchUsagePercent } from "@/lib/config/storage-config";

function BatchesList({ viewMode = "cards" }) {
  const { filteredBatches, statusCounts, setStatusFilter } = useBatchesData();
  // Render based on viewMode
}
```

### 13.7 Переваги нової архітектури

1. **Розділення логіки та UI** - hooks містять бізнес-логіку, компоненти тільки рендеринг
2. **Перевикористання** - один hook для різних view modes (cards/table/accordion)
3. **Тестування** - легше тестувати hooks окремо від UI
4. **Консистентність** - єдиний джерело правди для конфігурацій

---

## 14. Component Architecture

### 14.1 Принципи розбиття компонентів

Великі компоненти (>500 LOC) розбиваються на:
1. **Config файл** - типи, інтерфейси, константи, utility functions
2. **Sub-components** - окремі UI компоненти в папці `components/`
3. **Головний компонент** - контейнер, що оркеструє sub-components

### 14.2 Planned Orders Module ✅

**Структура (завершено):**
```
features/orders/
├── planned-orders-view.tsx          # Головний компонент (442 LOC, зменшено з 1586)
└── components/
    └── planned-orders/
        ├── index.ts                 # Re-exports всіх модулів
        ├── types.ts                 # PlannedOrder, PlannedOrderItem, props interfaces
        ├── config.ts                # EVENT_TYPES, SEATING_AREAS, TIME_SLOTS, etc.
        ├── utils.ts                 # Date helpers, convertToPlannedOrder, calculateDayStats
        ├── order-card.tsx           # Картка замовлення з розгортанням (~300 LOC)
        ├── view-dialog.tsx          # Діалог перегляду деталей (~150 LOC)
        └── create-dialog.tsx        # Багатовкладковий діалог створення (~400 LOC)
```

**Типи (`types.ts`):**
```typescript
export interface PlannedOrder { ... }
export interface PlannedOrderItem { ... }
export interface PlannedOrdersViewProps { variant: "kitchen" | "waiter"; className?: string }
export interface OrderCardProps { order; variant; isExpanded; onToggleExpand; ... }
export interface ViewDialogProps { order: PlannedOrder | null; open; onOpenChange }
export interface CreateDialogProps { open; onOpenChange; selectedDate; onSuccess }
export interface CreateOrderFormData { eventType; eventName; tableNumber; guestCount; ... }
```

**Конфігурації (`config.ts`):**
```typescript
export const EVENT_TYPES: Record<EventType, EventTypeConfig>
export const SEATING_AREAS: Record<SeatingArea, string>
export const MENU_PRESETS: Record<MenuPreset, string>
export const PAYMENT_STATUSES: Record<PaymentStatus, PaymentStatusConfig>
export const TIME_SLOTS: TimeSlot[]
export const PREP_MINUTES_BY_EVENT: Record<EventType, number>
```

**Утиліти (`utils.ts`):**
```typescript
export function isSameDay(date1: Date, date2: Date): boolean
export function formatDateFull(date: Date): string
export function generateAvailableDates(days: number): Date[]
export function calculatePrepTime(eventType: EventType, serviceTime: string): string
export function getTimeDisplay(date: Date): { time: string; relative: string; isOverdue: boolean }
export function convertToPlannedOrder(order: ScheduledOrder): PlannedOrder
export function calculateDayStats(orders: PlannedOrder[]): DayStats
```

### 14.3 Kitchen Module ✅

**Структура (завершено):**
```
features/kitchen/
├── station-queue.tsx               # Головний компонент (467 LOC, зменшено з 1466)
├── station-queue-config.ts         # Типи, константи, утиліти
├── hooks/
│   ├── index.ts                    # Експорти
│   └── use-task-timers.ts          # Shared timer hooks
└── components/
    ├── index.ts                    # Загальні експорти
    ├── table-session-timer.tsx     # Legacy export (backward compat)
    └── station-queue/              # Модульна структура
        ├── index.ts                # Module re-exports
        ├── types.ts                # StationTask, TableTaskGroup, props (~130 LOC)
        ├── utils.ts                # Grouping, formatting, timer helpers (~140 LOC)
        ├── table-session-timer.tsx # Таймер сесії столу (~50 LOC)
        ├── task-item-row.tsx       # Рядок задачі в групі (~210 LOC)
        ├── table-group-card.tsx    # Картка групи по столу (~170 LOC)
        ├── task-card.tsx           # Standalone картка задачі (~240 LOC)
        └── all-kitchen-table-card.tsx # Картка для AllKitchenView (~175 LOC)
```

**Типи (`station-queue/types.ts`):**
```typescript
export interface StationTask { ... }
export interface StationQueueProps { ... }
export interface TableTaskGroup { tableNumber; tasks; orderType; occupiedAt }
export interface TableTaskGroupWithStation extends TableTaskGroup { station }
export interface TaskCardProps { task; variant; onComplete; onBump; showStation; ... }
export interface TaskItemRowProps { task; variant; isFirst; onComplete; onBump }
export interface TableGroupCardProps { group; variant; onComplete; onBump }
export interface AllKitchenTableCardProps { group; onComplete; onBump }
```

**Утиліти (`station-queue/utils.ts`):**
```typescript
// Константи таймерів
export const QUEUE_THRESHOLDS = { warningMs: 5*60*1000, overdueMs: 10*60*1000 }
export const PICKUP_THRESHOLDS = { warningMs: 60*1000, overdueMs: 2*60*1000 }
export const TABLE_SESSION_THRESHOLDS = { longMs: 45*60*1000, criticalMs: 60*60*1000 }

// Функції групування
export function groupTasksByTable(tasks: StationTask[]): TableTaskGroup[]
export function groupTasksByTableWithStation(tasks: StationTask[]): TableTaskGroupWithStation[]
export function formatTableTime(occupiedAt: string): string
export function getTimerColorClass(elapsed, warning, overdue): string
```

**Shared Hooks (`hooks/use-task-timers.ts`):**
```typescript
export function useTaskTimers({ task, isActive, isCompleted }): TaskTimerState
export function useGroupPickupTimer(tasks, isCompleted): PickupTimerState
```

### 14.4 Admin History Module ✅

**Структура:**
```
features/admin/
├── history/
│   ├── index.ts                     # Module exports
│   ├── history-config.ts            # Types, interfaces, utilities ✅
│   └── components/
│       ├── index.ts                 # Component exports ✅
│       ├── history-filters.tsx      # Блок фільтрів ✅
│       ├── history-card.tsx         # Картка дії з розгортанням ✅
│       └── action-detail-views.tsx  # Спеціалізовані views ✅
```

**Config файл (`history-config.ts`):**
```typescript
// Типи
export interface ActionHistoryItem { ... }
export interface FilterState { ... }
export interface IngredientUsed { ... }
export interface ConsumptionDetail { ... }
export interface TimingData { ... }
export interface ReleasedItem { ... }

// Утиліти
export function getDefaultFilters(): FilterState
export function buildQueryVariables(filters, page, pageSize): Record<string, unknown>
export function getDetailViewType(item): "kitchen_start" | "kitchen_timing" | "inventory_release" | "generic"
```

**Detail Views (`action-detail-views.tsx`):**
```typescript
// Specialized views for different action types
export function KitchenTicketStartDetails({ metadata })   // Inventory consumption
export function KitchenTicketTimingDetails({ metadata })  // Timing chronology
export function InventoryReleaseDetails({ metadata })     // Release on cancel
export function GenericMetadata({ metadata })             // Fallback view
```

### 14.5 Патерн імпорту

**Рекомендований підхід (модульна структура):**
```typescript
// Всі exports з одного модуля
import {
  // Types
  type PlannedOrder,
  type PlannedOrderItem,
  type PlannedOrdersViewProps,
  // Config
  EVENT_TYPES,
  TIME_SLOTS,
  // Utils
  convertToPlannedOrder,
  isSameDay,
  formatDateFull,
  calculateDayStats,
  // Components
  OrderCard,
  CreateDialog,
  ViewDialog,
} from "./components/planned-orders";

// Головний компонент - чистий контейнер
export function PlannedOrdersView({ variant, className }: PlannedOrdersViewProps) {
  // State management
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

  // Data via hooks
  const { orders } = useScheduledOrders({ fromDate, toDate });

  // Render via sub-components
  return (
    <div>
      {groupedOrders.map((group) => (
        <div key={group.label}>
          {group.orders.map((order) => (
            <OrderCard key={order.id} order={order} variant={variant} />
          ))}
        </div>
      ))}
      <ViewDialog order={viewingOrder} open={!!viewOrderId} />
      <CreateDialog open={isCreateDialogOpen} selectedDate={selectedDate} />
    </div>
  );
}
```

**Патерн для kitchen module:**
```typescript
import {
  type StationTask,
  type TableTaskGroup,
  groupTasksByTable,
  groupTasksByTableWithStation,
  TaskCard,
  TableGroupCard,
  AllKitchenTableCard,
} from "./components/station-queue";
```

### 14.6 Прогрес рефакторингу компонентів

| Компонент | Початковий LOC | Фінальний LOC | Зменшення | Статус |
|-----------|----------------|---------------|-----------|--------|
| planned-orders-view.tsx | 1586 | 442 | **72%** | ✅ Повний split |
| station-queue.tsx | 1466 | 467 | **68%** | ✅ Повний split |
| history/page.tsx | 963 | ~190 | **80%** | ✅ Full split |
| queries.ts | 1084 | ~20 (re-export) | **98%** | ✅ Split по 8 доменах |
| extended.ts | 926 | ~25 (re-export) | **97%** | ✅ Split по 7 доменах |
| lifecycle files (5) | ~490 | ~80 | **84%** | ✅ Backend helpers |

**Загальне зменшення:** ~5,500 LOC → ~1,200 LOC у головних файлах (модульна структура)

### 14.7 Нові файли (Phase 3)

**Orders Module - `features/orders/components/planned-orders/`:**
- `index.ts` - Re-exports ✅
- `types.ts` (~130 LOC) - Інтерфейси PlannedOrder, props ✅
- `config.ts` (~100 LOC) - EVENT_TYPES, TIME_SLOTS, etc. ✅
- `utils.ts` (~160 LOC) - Date helpers, converters ✅
- `order-card.tsx` (~300 LOC) - Картка з розгортанням ✅
- `view-dialog.tsx` (~150 LOC) - Діалог перегляду ✅
- `create-dialog.tsx` (~400 LOC) - Діалог створення ✅

**Kitchen Module - `features/kitchen/components/station-queue/`:**
- `index.ts` - Re-exports ✅
- `types.ts` (~130 LOC) - StationTask, TableTaskGroup, props ✅
- `utils.ts` (~140 LOC) - Grouping, timer helpers ✅
- `table-session-timer.tsx` (~50 LOC) - Таймер сесії ✅
- `task-item-row.tsx` (~210 LOC) - Рядок задачі в групі ✅
- `table-group-card.tsx` (~170 LOC) - Картка групи по столу ✅
- `task-card.tsx` (~240 LOC) - Standalone картка ✅
- `all-kitchen-table-card.tsx` (~175 LOC) - AllKitchenView картка ✅

**Kitchen Module - інші:**
- `features/kitchen/station-queue-config.ts` (~280 LOC) ✅
- `features/kitchen/hooks/use-task-timers.ts` (~170 LOC) ✅
- `features/kitchen/hooks/index.ts` ✅
- `features/kitchen/components/index.ts` - Updated exports ✅

**Admin History Module:**
- `features/admin/history/history-config.ts` (~155 LOC) ✅
- `features/admin/history/components/action-detail-views.tsx` (~340 LOC) ✅
- `features/admin/history/components/history-filters.tsx` (~85 LOC) ✅
- `features/admin/history/components/history-card.tsx` (~175 LOC) ✅
- `features/admin/history/components/index.ts` ✅
- `features/admin/history/index.ts` ✅

---

## 15. GraphQL Organization

### 15.1 Структура

GraphQL queries організовані по доменах для кращої навігації та maintenance:

```
frontend/src/graphql/
├── queries/                    # Domain-specific queries
│   ├── index.ts               # Re-exports all queries
│   ├── kitchen.ts             # Kitchen queue queries
│   ├── menu.ts                # Categories, recipes
│   ├── orders.ts              # Orders, tables
│   ├── storage.ts             # Batches, ingredients, suppliers
│   ├── scheduled-orders.ts    # Planned orders/events
│   ├── reservations.ts        # Table reservations
│   ├── workers.ts             # Performance, shifts
│   └── admin.ts               # Action history
├── mutations.ts               # All mutations (unified)
├── fragments.ts               # Reusable fragments
├── daily-tasks.ts             # Daily tasks (queries + mutations)
└── queries.ts                 # Re-export for backward compatibility
```

### 15.2 Доменні файли

| Файл | Queries | Опис |
|------|---------|------|
| `kitchen.ts` | GET_KITCHEN_QUEUE | Черга кухні по станціях |
| `menu.ts` | GET_ALL_CATEGORIES, GET_RECIPES, GET_MENU_ITEM_RECIPE | Меню та рецепти |
| `orders.ts` | GET_ACTIVE_ORDERS, GET_ORDER_DETAILS, GET_TABLES | Замовлення та столи |
| `storage.ts` | GET_STOCK_ALERTS, GET_ALL_INGREDIENTS, GET_ALL_SUPPLIERS, GET_AVAILABLE_BATCHES, GET_INVENTORY_MOVEMENTS, GET_ALL_STOCK_BATCHES, GET_TODAYS_BATCHES | Склад та інвентар |
| `scheduled-orders.ts` | GET_SCHEDULED_ORDERS, GET_SCHEDULED_ORDER, GET_ORDERS_READY_TO_ACTIVATE | Заплановані замовлення |
| `reservations.ts` | GET_RESERVATIONS_FOR_DATE, GET_RESERVATIONS_FOR_TABLE, GET_UPCOMING_RESERVATIONS | Бронювання |
| `workers.ts` | GET_WORKER_PERFORMANCE, GET_TEAM_PERFORMANCE, GET_ALL_WORKERS_PERFORMANCE, GET_WORKER_SHIFTS, GET_TEAM_SCHEDULE, GET_TODAYS_SHIFTS, GET_ALL_WORKERS | Персонал |
| `admin.ts` | GET_ACTION_HISTORY, GET_ACTION_HISTORY_COUNT, GET_RECENT_ACTIONS | Історія дій |

### 15.3 Патерн імпорту

**Рекомендований підхід (domain-specific):**
```typescript
// Імпорт з конкретного домену
import { GET_KITCHEN_QUEUE } from "@/graphql/queries/kitchen";
import { GET_ACTIVE_ORDERS, GET_TABLES } from "@/graphql/queries/orders";
import { GET_ALL_STOCK_BATCHES } from "@/graphql/queries/storage";
```

**Backward-compatible підхід:**
```typescript
// Старий стиль - все ще працює
import { GET_KITCHEN_QUEUE, GET_TABLES } from "@/graphql/queries";
```

### 15.4 Нові файли (Phase 4)

- `graphql/queries/index.ts` - Re-exports всіх queries
- `graphql/queries/kitchen.ts` (~50 LOC)
- `graphql/queries/menu.ts` (~110 LOC)
- `graphql/queries/orders.ts` (~130 LOC)
- `graphql/queries/storage.ts` (~200 LOC)
- `graphql/queries/scheduled-orders.ts` (~120 LOC)
- `graphql/queries/reservations.ts` (~80 LOC)
- `graphql/queries/workers.ts` (~230 LOC)
- `graphql/queries/admin.ts` (~80 LOC)

---

## 16. Types Organization

### 16.1 Структура

TypeScript типи організовані по доменах для кращої типобезпеки та навігації:

```
frontend/src/types/
├── index.ts              # Strapi entity types (MenuItem, Order, etc.)
├── extended.ts           # Re-export for backward compatibility
├── orders.ts             # Order, OrderItem, Course, Table, Scheduling
├── comments.ts           # Item comments and presets
├── billing.ts            # Bill splitting, payments
├── employees.ts          # Employee profiles, shifts, KPI
├── storage.ts            # Storage categories, batches, products, yield
├── websocket.ts          # WebSocket event types
├── api.ts                # API responses, offline queue
└── fsm.ts                # FSM transitions (existing)
```

### 16.2 Доменні файли

| Файл | Exports | Опис |
|------|---------|------|
| `orders.ts` | CourseType, OrderItemStatus, ExtendedOrderItem, ExtendedOrder, TableSession, ScheduleStatus, COURSE_ORDER, COURSE_LABELS, STATUS_LABELS, UNDO_REASONS | Замовлення та курси |
| `comments.ts` | CommentVisibility, ItemComment, CommentHistoryEntry, CommentPreset, COMMENT_PRESETS | Коментарі до позицій |
| `billing.ts` | SplitMode, BillStatus, PaymentMethod, SplitParticipant, BillSplit | Розбиття рахунків |
| `employees.ts` | ExtendedUserRole, Department, EmployeeStatus, ShiftStatus, EmployeeProfile, KPIDashboard | Персонал та KPI |
| `storage.ts` | StorageMainCategory, StorageSubCategory, StorageCondition, ProductUnit, ProcessType, BatchStatus, StorageBatch, ExtendedProduct, YieldProfile, buildCategoryTree() | Склад та інвентар |
| `websocket.ts` | ExtendedWSEventType, ExtendedWSEvent | Real-time події |
| `api.ts` | ApiError, ExtendedApiResponse, QueuedAction | API та offline |

### 16.3 Патерн імпорту

**Рекомендований підхід (domain-specific):**
```typescript
// Імпорт з конкретного домену
import { CourseType, ExtendedOrder } from "@/types/orders";
import { StorageBatch, BatchStatus } from "@/types/storage";
import { EmployeeProfile, Department } from "@/types/employees";
```

**Backward-compatible підхід:**
```typescript
// Старий стиль - все ще працює
import { CourseType, StorageBatch } from "@/types/extended";
```

### 16.4 Нові файли (Phase 5)

- `types/orders.ts` (~175 LOC)
- `types/comments.ts` (~115 LOC)
- `types/billing.ts` (~50 LOC)
- `types/employees.ts` (~125 LOC)
- `types/storage.ts` (~435 LOC)
- `types/websocket.ts` (~25 LOC)
- `types/api.ts` (~35 LOC)

---

## 17. Backend Utilities

### 17.1 Структура

Backend utilities централізовані в директорії `utils/`:

```
backend/src/utils/
├── action-logger.ts      # Логування дій (base)
├── enums.ts              # Централізовані enum визначення
└── lifecycle-helpers.ts  # Factory functions для lifecycle hooks
```

### 17.2 Centralized Enums

**Файл:** `backend/src/utils/enums.ts`

Центральний файл з усіма enum константами та TypeScript типами.

**Категорії enum'ів:**

| Категорія | Константи | Опис |
|-----------|-----------|------|
| Stations | KITCHEN_STATIONS, EXTENDED_STATIONS, SHIFT_STATIONS | Станції кухні |
| Departments | DEPARTMENTS, EXTENDED_DEPARTMENTS | Відділи персоналу |
| Units | UNITS, PORTION_UNITS | Одиниці виміру |
| Output | OUTPUT_TYPES, COURSE_TYPES | Типи виходу та курси |
| Statuses | ORDER_STATUSES, TICKET_STATUSES, BATCH_STATUSES, etc. | FSM стани |
| Priorities | TASK_PRIORITIES, TICKET_PRIORITIES | Рівні пріоритету |
| Actions | ACTION_TYPES, MODULES, SEVERITY_LEVELS | Логування дій |
| Roles | SYSTEM_ROLES, ACTOR_ROLES | Ролі користувачів |
| Events | TICKET_EVENT_TYPES, TABLE_SESSION_EVENT_TYPES | Типи подій |
| Reservations | OCCASIONS, RESERVATION_SOURCES, EVENT_TYPES | Бронювання |

**Експорти:**
```typescript
// Arrays as const
export const KITCHEN_STATIONS = ['grill', 'fry', 'salad', ...] as const;

// Types derived from arrays
export type KitchenStation = (typeof KITCHEN_STATIONS)[number];

// Ukrainian labels
export const STATION_LABELS_UK: Record<ExtendedStation, string>;

// Helper functions
export function isValidEnum<T>(value: string, enumArray: T): boolean;
export function getEnumOptions<T>(enumArray: T, labels?): Array<{value, label}>;
```

### 17.3 Lifecycle Helpers

**Файл:** `backend/src/utils/lifecycle-helpers.ts`

Factory functions для створення Strapi lifecycle hooks з автоматичним логуванням.

**Основна функція:**
```typescript
export function createEnhancedLifecycles(options: {
  entityType: string;           // Entity type for logging
  apiName?: string;             // API path (defaults to entityType)
  module: Module;               // Module category
  getEntityName?: NameGetter;   // Extract entity name
  populate?: PopulateConfig;    // Relations to populate
  getMetadata?: MetadataExtractor;      // Extract metadata
  getUpdateMetadata?: UpdateMetadataExtractor;
  getDeleteMetadata?: MetadataExtractor;
  deleteSeverity?: SeverityLevel;
  skipActions?: Array<'create' | 'update' | 'delete'>;
}): LifecycleHooks;
```

**Хелпери по модулях:**
```typescript
// Module-specific shortcuts
export function createSimpleLifecycles(entityType, module);
export function createStorageLifecycles(entityType, options?);
export function createAdminLifecycles(entityType, options?);
export function createKitchenLifecycles(entityType, options?);
export function createReservationsLifecycles(entityType, options?);
```

**Готові metadata extractors:**
```typescript
export function extractContactMetadata(entity);    // Suppliers, contacts
export function extractRecipeMetadata(entity);     // Recipes
export function extractMenuItemMetadata(entity);   // Menu items
export function extractReservationMetadata(entity); // Reservations
export function extractScheduledOrderMetadata(entity);
export function extractDailyTaskMetadata(entity);
```

### 17.4 Використання Lifecycle Helpers

**Простий випадок:**
```typescript
// ingredient/lifecycles.ts
import { createStorageLifecycles } from '../../../../utils/lifecycle-helpers';

export default createStorageLifecycles('ingredient');
```

**З custom metadata:**
```typescript
// supplier/lifecycles.ts
import {
  createStorageLifecycles,
  extractContactMetadata,
} from '../../../../utils/lifecycle-helpers';

export default createStorageLifecycles('supplier', {
  getMetadata: (entity) => ({
    ...extractContactMetadata(entity),
    taxId: entity.taxId,
  }),
  getUpdateMetadata: (original, updated) => ({
    ...extractContactMetadata(updated),
    wasActive: original?.isActive,
  }),
});
```

**З populate:**
```typescript
// recipe/lifecycles.ts
import {
  createAdminLifecycles,
  extractRecipeMetadata,
} from '../../../../utils/lifecycle-helpers';

export default createAdminLifecycles('recipe', {
  populate: ['ingredients', 'steps'],
  getMetadata: extractRecipeMetadata,
});
```

**З різним apiName:**
```typescript
// menu-item/lifecycles.ts
import { createAdminLifecycles } from '../../../../utils/lifecycle-helpers';

export default createAdminLifecycles('menu_item', {
  apiName: 'menu-item', // Strapi API uses hyphen, logging uses underscore
});
```

### 17.5 Оптимізовані Lifecycle Files

| Файл | До | Після | Зменшення |
|------|-----|-------|-----------|
| ingredient/lifecycles.ts | 83 LOC | 8 LOC | 90% |
| supplier/lifecycles.ts | 103 LOC | 20 LOC | 81% |
| recipe/lifecycles.ts | 120 LOC | 18 LOC | 85% |
| menu-item/lifecycles.ts | 83 LOC | 10 LOC | 88% |
| menu-category/lifecycles.ts | 101 LOC | 24 LOC | 76% |

**Файли з кастомною логікою (не оптимізовані):**
- `reservation/lifecycles.ts` - статус-based actions
- `scheduled-order/lifecycles.ts` - складна логіка подій
- `inventory-movement/lifecycles.ts` - custom action mapping
- `kitchen-ticket/lifecycles.ts` - FSM логіка
- `stock-batch/lifecycles.ts` - FSM логіка
- `order/lifecycles.ts` - FSM логіка

### 17.6 Нові файли (Phase 7)

- `backend/src/utils/enums.ts` (~580 LOC) - централізовані enum'и
- `backend/src/utils/lifecycle-helpers.ts` (~350 LOC) - factory functions
