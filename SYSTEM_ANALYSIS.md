# Restaurant OS - Системний Аналіз

## Зміст
1. [Загальний огляд потоку даних](#1-загальний-огляд-потоку-даних)
2. [Замовлення → Кухня](#2-замовлення--кухня)
3. [Кухня → Списання інгредієнтів](#3-кухня--списання-інгредієнтів)
4. [Аналітика та події](#4-аналітика-та-події)
5. [Структура даних](#5-структура-даних)
6. [Детальний аналіз кожної дії](#6-детальний-аналіз-кожної-дії)

---

## 1. Загальний огляд потоку даних

```
POS Frontend                    Backend                         Storage
    │                             │                               │
    ├─ useCreateOrder() ────────→ CREATE_ORDER ──────────────────→│
    │                             ├─ orderNumber генерація        │
    │                             │                               │
    ├─ useAddOrderItem() ───────→ CREATE_ORDER_ITEM              │
    │                             │                               │
    │                             └─ АВТО: KitchenTicket ────────→│
    │                                 ├─ ticketNumber             │
    │                                 ├─ station                  │
    │                                 └─ TicketEvent              │
    │                                                             │
    │   KITCHEN DISPLAY                                           │
    │         │                                                   │
    │         ├─ "Почати" ──────→ startTicket() ─────────────────→│
    │         │                   ├─ FIFO/FEFO selection          │
    │         │                   ├─ Yield calculation            │
    │         │                   ├─ Batch consumption            │
    │         │                   ├─ InventoryMovement            │
    │         │                   └─ inventoryLocked=true         │
    │         │                                                   │
    │         ├─ "Готово" ──────→ complete() ────────────────────→│
    │         │                   ├─ elapsedSeconds               │
    │         │                   └─ TicketEvent                  │
    │         │                                                   │
    │         └─ "Скасувати" ───→ cancel() ──────────────────────→│
    │                             ├─ releaseInventory()           │
    │                             └─ Return movements             │
    │                                                             │
    └─ Analytics Events ────────→ TableSessionEvent ─────────────→│
```

---

## 2. Замовлення → Кухня

### 2.1 Створення замовлення (Frontend)

**Файл:** `frontend/src/hooks/use-graphql-orders.ts`

```typescript
// Створення замовлення
export function useCreateOrder() {
  const createOrder = async (data: {
    table: string;
    waiter?: string;
    guestCount?: number;
    notes?: string;
  }) => {
    const result = await executeMutation({
      data: {
        ...data,
        status: 'new',
        totalAmount: 0,
        taxAmount: 0,
      },
    });
    return result.data?.createOrder;
  };
}

// Додавання позиції
export function useAddOrderItem() {
  const addItem = async (data: {
    order: string;
    menuItem: string;
    quantity: number;
    courseType?: string;
    notes?: string;
    modifiers?: object;
  }) => {
    const result = await executeMutation({
      data: {
        ...data,
        status: 'pending',
        unitPrice: menuItem.price,
        totalPrice: menuItem.price * quantity,
      },
    });
  };
}
```

### 2.2 Backend Lifecycles

**Файл:** `backend/src/api/order/content-types/order/lifecycles.ts`

```typescript
// FSM для статусів замовлення
const VALID_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['in_kitchen', 'cancelled'],
  in_kitchen: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid', 'cancelled'],
  paid: [],
  cancelled: []
};

// Автогенерація номера замовлення
afterCreate(event) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const orderNumber = `ORD-${date}-${random}`;
}
```

### 2.3 Автостворення Kitchen Ticket

**Файл:** `backend/src/api/order-item/content-types/order-item/lifecycles.ts`

```typescript
// Маппінг outputType → station
const OUTPUT_TO_STATION = {
  kitchen: 'hot',
  bar: 'bar',
  pastry: 'dessert',
  cold: 'salad',
};

async afterCreate(event) {
  const { result } = event;

  // Завантаження menuItem для визначення станції
  const orderItem = await strapi.documents('api::order-item.order-item').findOne({
    documentId: result.documentId,
    populate: ['menuItem', 'order']
  });

  const station = menuItem.primaryStation || OUTPUT_TO_STATION[menuItem.outputType] || 'hot';

  // Створення тікету
  const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').create({
    data: {
      ticketNumber: `TKT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      order: order.documentId,
      orderItem: result.documentId,
      status: 'queued',
      station: station,
      priority: 'normal',
      priorityScore: 50,
      inventoryLocked: false,
    }
  });

  // Створення події
  await strapi.documents('api::ticket-event.ticket-event').create({
    data: {
      kitchenTicket: ticket.documentId,
      eventType: 'created',
      previousStatus: null,
      newStatus: 'queued',
      metadata: { station, menuItemName: menuItem.name, quantity: orderItem.quantity }
    }
  });
}
```

---

## 3. Кухня → Списання інгредієнтів

### 3.1 Start Ticket Service (Основний сервіс)

**Файл:** `backend/src/api/kitchen-ticket/services/start-ticket.ts`

#### Конвертація одиниць виміру
```typescript
const UNIT_CONVERSIONS = {
  kg: { g: 1000, kg: 1 },
  g: { kg: 0.001, g: 1 },
  l: { ml: 1000, l: 1 },
  ml: { l: 0.001, ml: 1 },
  pcs: { pcs: 1, portion: 1 },
  portion: { portion: 1, pcs: 1 },
};

function convertUnits(value: number, from: string, to: string): number {
  if (from === to) return value;
  const conversions = UNIT_CONVERSIONS[from];
  if (!conversions || !conversions[to]) {
    throw new Error(`Cannot convert from ${from} to ${to}`);
  }
  return value * conversions[to];
}
```

#### Yield Profile розрахунок
```typescript
function calculateYieldMultiplier(yieldProfile: any, processChain: string[]): number {
  if (!yieldProfile) return 1;
  let multiplier = yieldProfile.baseYieldRatio || 1;

  for (const processType of processChain) {
    const processYield = yieldProfile.processYields?.find(
      (p: any) => p.processType === processType
    );
    if (processYield) {
      // Втрата вологи (зменшує вагу)
      if (processYield.moistureLoss !== undefined) {
        multiplier *= (1 - processYield.moistureLoss);
      }
      // Поглинання олії (збільшує вагу)
      if (processYield.oilAbsorption !== undefined) {
        multiplier *= (1 + processYield.oilAbsorption);
      }
      // Прямий коефіцієнт виходу
      if (processYield.yieldRatio !== undefined) {
        multiplier *= processYield.yieldRatio;
      }
    }
  }
  return multiplier;
}
```

#### FIFO/FEFO вибір партій
```typescript
// Вибір партій: FEFO (First Expiry First Out) + FIFO (First In First Out)
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
  ],
  populate: ['ingredient']
});
```

#### Споживання партій
```typescript
for (const batch of batches) {
  if (remaining <= 0) break;

  const takeAmount = Math.min(batch.netAvailable, remaining);

  // Оновлення партії
  await strapi.documents('api::stock-batch.stock-batch').update({
    documentId: batch.documentId,
    data: {
      netAvailable: batch.netAvailable - takeAmount,
      usedAmount: (batch.usedAmount || 0) + takeAmount,
      status: (batch.netAvailable - takeAmount) <= 0.001 ? 'depleted' : batch.status
    }
  });

  const netQuantity = takeAmount * yieldMultiplier;
  const cost = takeAmount * (batch.unitCost || 0);

  // Створення руху інвентарю
  await strapi.documents('api::inventory-movement.inventory-movement').create({
    data: {
      ingredient: ingredient.documentId,
      stockBatch: batch.documentId,
      kitchenTicket: ticketDocumentId,
      movementType: 'recipe_use',
      quantity: takeAmount,
      unit: ingredientUnit,
      grossQuantity: takeAmount,
      netQuantity,
      wasteFactor: 1 - yieldMultiplier,
      unitCost: batch.unitCost || 0,
      totalCost: cost,
      reason: 'recipe_use',
      reasonCode: 'TICKET_START',
      operator: chefDocumentId
    }
  });

  remaining -= takeAmount;
}
```

#### Перевірка достатності запасів
```typescript
if (remaining > 0.001) {
  throw {
    code: 'INSUFFICIENT_STOCK',
    message: `Insufficient stock for ingredient: ${ingredient.name}`,
    details: {
      ingredientId: ingredient.documentId,
      ingredientName: ingredient.name,
      required: normalizedGross,
      available: normalizedGross - remaining,
      shortfall: remaining,
      unit: ingredientUnit
    }
  };
}
```

### 3.2 Release Inventory (Rollback)

```typescript
async releaseInventory(ticketDocumentId: string, reason: string, operatorId?: string) {
  // 1. Знаходимо всі movements для цього тікету
  const movements = await strapi.documents('api::inventory-movement.inventory-movement').findMany({
    filters: {
      kitchenTicket: { documentId: ticketDocumentId },
      movementType: 'recipe_use'
    },
    populate: ['stockBatch', 'ingredient']
  });

  // 2. Відновлюємо кожну партію
  for (const movement of movements) {
    if (movement.stockBatch) {
      await strapi.documents('api::stock-batch.stock-batch').update({
        documentId: movement.stockBatch.documentId,
        data: {
          netAvailable: batch.netAvailable + movement.grossQuantity,
          usedAmount: Math.max(0, batch.usedAmount - movement.grossQuantity),
          status: 'available'
        }
      });
    }

    // 3. Відновлюємо запас інгредієнта
    if (movement.ingredient) {
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: movement.ingredient.documentId,
        data: {
          currentStock: ingredient.currentStock + movement.grossQuantity
        }
      });
    }

    // 4. Створюємо return movement
    await strapi.documents('api::inventory-movement.inventory-movement').create({
      data: {
        ingredient: movement.ingredient?.documentId,
        stockBatch: movement.stockBatch?.documentId,
        kitchenTicket: ticketDocumentId,
        movementType: 'return',
        quantity: movement.grossQuantity,
        unit: movement.unit,
        reason,
        reasonCode: 'TICKET_CANCEL',
        notes: `Returned from ticket cancellation`,
        operator: operatorId
      }
    });
  }

  // 5. Знімаємо блокування з тікету
  await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
    documentId: ticketDocumentId,
    data: { inventoryLocked: false }
  });
}
```

---

## 4. Аналітика та події

### 4.1 Frontend Events API

**Файл:** `frontend/src/lib/api-events.ts`

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

async createEvent(params: CreateEventParams): Promise<void> {
  const now = Date.now();
  const seatedAt = params.tableOccupiedAt
    ? new Date(params.tableOccupiedAt).getTime()
    : now;
  const durationFromSeatedMs = now - seatedAt;

  await fetch(`${STRAPI_URL}/api/table-session-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
        metadata: params.metadata,
      },
    }),
  });
}
```

### 4.2 KPI Розрахунки

```typescript
async getKPIs(from: string, to: string): Promise<SessionKPIs> {
  const events = await this.getSessionEvents({ from, to });

  // Групування за sessionId
  const sessions = new Map<string, TableSessionEvent[]>();
  events.forEach((event) => {
    if (!sessions.has(event.sessionId)) {
      sessions.set(event.sessionId, []);
    }
    sessions.get(event.sessionId)!.push(event);
  });

  // Розрахунок середніх значень
  let totalTimeToOrder = 0, orderCount = 0;
  let totalTimeToFirstItem = 0, firstItemCount = 0;
  let totalSessionTime = 0, completedSessions = 0;

  sessions.forEach((sessionEvents) => {
    const orderTaken = sessionEvents.find(e => e.eventType === 'order_taken');
    const firstItemReady = sessionEvents.find(e => e.eventType === 'item_ready');
    const billPaid = sessionEvents.find(e => e.eventType === 'bill_paid');

    if (orderTaken?.durationFromSeatedMs) {
      totalTimeToOrder += orderTaken.durationFromSeatedMs;
      orderCount++;
    }
    if (firstItemReady?.durationFromSeatedMs) {
      totalTimeToFirstItem += firstItemReady.durationFromSeatedMs;
      firstItemCount++;
    }
    if (billPaid?.durationFromSeatedMs) {
      totalSessionTime += billPaid.durationFromSeatedMs;
      completedSessions++;
    }
  });

  return {
    avgTimeToTakeOrderMs: orderCount > 0 ? Math.round(totalTimeToOrder / orderCount) : 0,
    avgTimeToFirstItemMs: firstItemCount > 0 ? Math.round(totalTimeToFirstItem / firstItemCount) : 0,
    avgTotalSessionTimeMs: completedSessions > 0 ? Math.round(totalSessionTime / completedSessions) : 0,
    totalOrders: orderCount,
    totalSessions: sessions.size,
  };
}
```

---

## 5. Структура даних

### 5.1 Основні сутності

| Entity | Ключові поля | Призначення |
|--------|-------------|-------------|
| **Order** | orderNumber, status, table, waiter, items[], tickets[] | Замовлення клієнта |
| **OrderItem** | order, menuItem, quantity, status, courseType | Позиція замовлення |
| **KitchenTicket** | ticketNumber, station, status, inventoryLocked, assignedChef | Тікет на кухню |
| **InventoryMovement** | ingredient, stockBatch, movementType, grossQuantity, netQuantity | Рух інгредієнтів |
| **StockBatch** | ingredient, netAvailable, usedAmount, expiryDate, status | Партія товару |
| **TicketEvent** | kitchenTicket, eventType, metadata | Історія тікетів |
| **TableSessionEvent** | tableNumber, sessionId, eventType, durationFromSeatedMs | Аналітика сесій |

### 5.2 Статуси

**Order Status Flow:**
```
new → confirmed → in_kitchen → ready → served → paid
  ↘      ↘           ↘          ↘       ↘
   cancelled ←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

**OrderItem Status Flow:**
```
draft → pending → queued → in_progress → ready → served
                    ↘          ↘           ↘
                  cancelled ← voided ←←←←←←←
```

**KitchenTicket Status Flow:**
```
queued → started → ready
           ↓ ↑
         paused ↔ resumed
           ↓
    failed / cancelled
```

**StockBatch Status Flow:**
```
received → available → in_use → depleted
              ↓
           expired / damaged → written_off
```

---

## 6. Детальний аналіз кожної дії

### 6.1 POS → Створення замовлення

#### Компоненти
| Файл | Функція | Статус |
|------|---------|--------|
| `frontend/src/app/pos/waiter/page.tsx` | Головна POS сторінка | ⚠️ Використовує застарілу заглушку |
| `frontend/src/features/pos/invoice-sidebar.tsx` | Кошик та підтвердження | ✅ Правильно |
| `frontend/src/features/orders/order-confirm-dialog.tsx` | Діалог підтвердження | ✅ Використовує GraphQL |
| `frontend/src/hooks/use-graphql-orders.ts` | GraphQL хуки | ✅ Правильно |
| `frontend/src/lib/api.ts` | REST API заглушки | ⚠️ ЗАГЛУШКИ |

#### Потік даних при підтвердженні замовлення

```
InvoiceSidebar → OrderConfirmDialog.handleConfirm()
    │
    ├─ 1. createOrder({ table, guestCount, notes })
    │     └─ GraphQL: CREATE_ORDER → Strapi → order.documentId, orderNumber
    │
    ├─ 2. For each cartItem:
    │     addOrderItem({ order, menuItem, quantity, unitPrice, courseType })
    │     └─ GraphQL: CREATE_ORDER_ITEM → Strapi → orderItem.documentId
    │     └─ Backend lifecycle: afterCreate → AUTO-CREATE KitchenTicket
    │
    ├─ 3. updateOrderStatus(orderId, 'confirmed')
    │     └─ GraphQL: UPDATE_ORDER_STATUS
    │
    ├─ 4. createKitchenTasksFromOrder() → Local kitchen store (тимчасово)
    │
    ├─ 5. Bar items → storageHistoryApi.addEntry() (локальне логування)
    │
    ├─ 6. tableSessionEventsApi.createEvent({ eventType: 'order_taken' })
    │     └─ REST: POST /api/table-session-events
    │
    └─ 7. clearCart() + redirect
```

#### ⚠️ ПРОБЛЕМА: Застаріла заглушка

**Файл:** `frontend/src/app/pos/waiter/page.tsx:106-125`

```typescript
// ЦЕ НЕ ПРАЦЮЄ - заглушка!
const handleConfirmOrder = async () => {
  await ordersApi.createOrder({...}); // ordersApi - ЗАГЛУШКА
  clearCart();
};
```

**Файл:** `frontend/src/lib/api.ts:53-67`

```typescript
// ordersApi.createOrder - НЕ робить реального API виклику!
async createOrder(order): Promise<ApiResponse<Order>> {
  // TODO: Replace with real API call ← Ніколи не було замінено!
  const newOrder: Order = {
    ...order,
    id: `order-${Date.now()}`, // Фейковий ID
    createdAt: new Date(),
  };
  return { data: newOrder, success: true };
}
```

**РІШЕННЯ:** Замість `ordersApi.createOrder()` використовувати `useCreateOrder()` з `use-graphql-orders.ts`

---

### 6.2 Кухня → Обробка тікетів

#### ⚠️ КРИТИЧНА ПРОБЛЕМА: REST vs GraphQL mismatch

**Frontend очікує GraphQL мутації:**
```typescript
// frontend/src/graphql/mutations.ts
export const START_KITCHEN_TICKET = gql`
  mutation StartKitchenTicket($documentId: ID!) {
    startKitchenTicket(documentId: $documentId) { ... }
  }
`;
```

**Backend має REST ендпоінти:**
```typescript
// backend/src/api/kitchen-ticket/routes/custom-routes.ts
{
  method: 'POST',
  path: '/kitchen-tickets/:documentId/start',
  handler: 'kitchen-ticket.start'
}
```

**Результат:** Frontend GraphQL мутації НЕ ПРАЦЮВАТИМУТЬ, бо на бекенді немає відповідних GraphQL резолверів!

#### Необхідні дії

**Варіант 1: Створити GraphQL extensions на бекенді**
```
backend/src/extensions/graphql/resolvers/kitchen-ticket.ts
```

**Варіант 2: Переписати frontend хуки на REST**
```typescript
// Замість useMutation(START_KITCHEN_TICKET)
const startTicket = async (documentId: string) => {
  const response = await fetch(`/api/kitchen-tickets/${documentId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};
```

---

### 6.3 Інвентар → FIFO/FEFO списання

#### Компоненти (Backend - ПРАЦЮЄ)

| Файл | Функція | Статус |
|------|---------|--------|
| `backend/src/api/kitchen-ticket/services/start-ticket.ts` | startTicket() | ✅ Повноцінна реалізація |
| `backend/src/api/kitchen-ticket/services/start-ticket.ts` | releaseInventory() | ✅ Rollback при скасуванні |
| `backend/src/api/kitchen-ticket/controllers/kitchen-ticket.ts` | REST контролер | ✅ |

#### Алгоритм startTicket()

```
1. Завантаження тікету + рецепт + інгредієнти
    │
2. Для кожного інгредієнта:
    │
    ├─ calculateYieldMultiplier(yieldProfile, processChain)
    │   └─ moistureLoss, oilAbsorption, yieldRatio
    │
    ├─ Розрахунок кількості:
    │   netRequired = recipe.quantity × orderItem.quantity
    │   grossRequired = netRequired / yieldMultiplier
    │   grossWithWaste = grossRequired × (1 + wasteAllowance)
    │
    ├─ convertUnits(grossWithWaste, recipeUnit, ingredientUnit)
    │
    ├─ FIFO/FEFO вибір партій:
    │   sort: [expiryDate: ASC, receivedAt: ASC]
    │   filter: status IN ['available', 'received'], netAvailable > 0, isLocked = false
    │
    ├─ Споживання партій:
    │   └─ batch.netAvailable -= takeAmount
    │   └─ batch.usedAmount += takeAmount
    │   └─ CREATE InventoryMovement (type: 'recipe_use')
    │
    └─ UPDATE ingredient.currentStock -= totalConsumed
    │
3. UPDATE ticket: status='started', inventoryLocked=true
    │
4. CREATE TicketEvent (type: 'started', metadata: consumedBatches)
```

---

### 6.4 Storage → Партії товарів

#### Компоненти

| Файл | Функція | Статус |
|------|---------|--------|
| `frontend/src/hooks/use-graphql-stock.ts` | GraphQL хуки | ✅ |
| `frontend/src/features/storage/batches-list-optimized.tsx` | UI список партій | ✅ з fallback |
| `frontend/src/graphql/queries.ts` | GET_ALL_STOCK_BATCHES | ✅ |

#### Потік даних

```
batches-list-optimized.tsx
    │
    ├─ useStockBatches() → GraphQL: GET_ALL_STOCK_BATCHES
    │   └─ Fallback: MOCK_BATCHES (якщо GraphQL fail)
    │
    ├─ useTodaysBatches() → GraphQL: GET_TODAYS_BATCHES
    │   └─ Для summary strip
    │
    └─ useCreateStockBatch() → GraphQL: CREATE_STOCK_BATCH
```

---

### 6.5 Бронювання столиків

#### Компоненти

| Файл | Функція | Статус |
|------|---------|--------|
| `frontend/src/features/reservations/reservation-dialog.tsx` | Діалог бронювання | ✅ |
| `frontend/src/features/reservations/reservations-list.tsx` | Список бронювань | ✅ |
| `frontend/src/hooks/use-graphql-scheduled-orders.ts` | GraphQL хуки | ✅ |
| `backend/src/api/reservation/` | Backend схема | ✅ (потрібен npm run develop) |

#### Потік даних

```
ReservationDialog
    │
    ├─ Вибір дати (14 днів вперед)
    ├─ Вибір часу (time slots)
    ├─ Вибір столу
    ├─ Контактні дані
    │
    └─ useCreateReservation()
        └─ GraphQL: CREATE_RESERVATION → Backend → confirmationCode
```

---

### 6.6 Аналітика

#### Компоненти

| Файл | Функція | Статус |
|------|---------|--------|
| `frontend/src/lib/api-events.ts` | tableSessionEventsApi | ✅ |
| `frontend/src/stores/kitchen-store.ts` | updateTaskStatus() logging | ✅ |
| `backend/src/api/table-session-event/` | Backend схема | ✅ |
| `backend/src/api/ticket-event/` | Kitchen events | ✅ |

#### Події що логуються

```
Frontend Events (TableSessionEvent):
├─ table_seated      → Гості сіли
├─ order_taken       → Замовлення прийнято (time from seated)
├─ item_started      → Страва почала готуватись
├─ item_ready        → Страва готова
├─ item_served       → Страва подана
├─ bill_requested    → Рахунок запитано
├─ bill_paid         → Рахунок оплачено
└─ table_cleared     → Стіл звільнено

Backend Events (TicketEvent):
├─ created           → Тікет створено (auto from OrderItem)
├─ started           → Тікет запущено + consumedBatches
├─ completed         → Тікет завершено + elapsedSeconds
├─ paused            → Пауза
├─ resumed           → Відновлення
├─ cancelled         → Скасування + inventory release
├─ failed            → Помилка + inventory release
└─ inventory_released → Повернення інвентарю
```

---

## 7. Зведена таблиця проблем

| # | Проблема | Критичність | Файл | Статус |
|---|----------|-------------|------|--------|
| 1 | `ordersApi.createOrder()` - заглушка | 🟡 Середня | `lib/api.ts` | ⚠️ Не використовується в основному flow |
| 2 | Kitchen GraphQL mutations не існують на бекенді | 🔴 Висока | `use-graphql-kitchen.ts` | ✅ **ВИПРАВЛЕНО** - переписано на REST |
| 3 | Backend schemas потребують реєстрації | 🟡 Середня | `backend/src/api/` | ⚠️ Запустити `npm run develop` |
| 4 | Локальний kitchen store vs GraphQL | 🟡 Середня | `kitchen-store.ts` | ⚠️ Backend lifecycle створює тікети |

### Виправлення #2: Kitchen Hooks → REST

**Файл:** `frontend/src/hooks/use-graphql-kitchen.ts`

Замість GraphQL мутацій тепер використовуються REST ендпоінти:

```typescript
// Раніше (НЕ ПРАЦЮВАЛО):
const [{ fetching }, executeMutation] = useMutation(START_KITCHEN_TICKET);

// Тепер (ПРАЦЮЄ):
async function kitchenTicketAction(documentId, action) {
  const response = await fetch(
    `${STRAPI_URL}/api/kitchen-tickets/${documentId}/${action}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );
  return response.json();
}
```

**Маппінг:**
| Hook | REST Endpoint |
|------|---------------|
| `useStartTicket()` | `POST /api/kitchen-tickets/:id/start` |
| `useCompleteTicket()` | `POST /api/kitchen-tickets/:id/complete` |
| `usePauseTicket()` | `POST /api/kitchen-tickets/:id/pause` |
| `useResumeTicket()` | `POST /api/kitchen-tickets/:id/resume` |
| `useCancelTicket()` | `POST /api/kitchen-tickets/:id/cancel` |
| `useFailTicket()` | `POST /api/kitchen-tickets/:id/fail` |

---

## 8. Рекомендації

### Пріоритет 1 (Критичний) ✅ ВИКОНАНО
- [x] ~~Створити GraphQL extensions для kitchen ticket операцій~~
- [x] **Переписати frontend kitchen хуки на REST** — Виконано!
  - Файл: `frontend/src/hooks/use-graphql-kitchen.ts`
  - Всі хуки тепер використовують REST endpoints

### Пріоритет 2 (Важливий)
- [ ] Запустити бекенд для реєстрації нових схем (`npm run develop`)
- [ ] Протестувати повний flow від замовлення до списання

### Пріоритет 3 (Покращення)
- [ ] Видалити застарілі заглушки з `lib/api.ts`
- [ ] Додати WebSocket для real-time оновлень на кухні
- [ ] Додати retry logic для REST/GraphQL операцій

---

## 9. Логування системи ✅ ДОДАНО

### 9.1 Frontend Logging

#### Файл: `frontend/src/hooks/use-graphql-kitchen.ts`

```typescript
// Кольорове логування в консолі браузера
const LOG_COLORS = {
  info: 'color: #3B82F6',     // blue
  success: 'color: #10B981',  // green
  error: 'color: #EF4444',    // red
  warn: 'color: #F59E0B',     // amber
  action: 'color: #8B5CF6',   // purple
};

// Приклад виводу:
// [Kitchen] [10:23:45.123] → START ticket { ticketId: 'abc123', action: 'start' }
// [Kitchen] [10:23:45.456] ✓ START completed { ticketId: 'abc123', duration: 333ms }
```

**Логуються:**
- Всі REST запити до kitchen ticket endpoints
- Час виконання запитів (duration)
- Статус тікету після операції
- Помилки з детальним контекстом

#### Файл: `frontend/src/hooks/use-graphql-orders.ts`

```typescript
// Логування GraphQL мутацій
// [Orders] [10:23:45.123] → CREATE_ORDER { tableId: 'table1', guestCount: 4 }
// [Orders] [10:23:45.789] ✓ CREATE_ORDER completed { orderId: 'ord123', orderNumber: 'ORD-20260110-1234' }
```

**Логуються:**
- CREATE_ORDER з параметрами
- CREATE_ORDER_ITEM з деталями позиції
- UPDATE_ORDER_STATUS з новим статусом
- Час виконання кожної операції

### 9.2 Backend Logging

#### Файл: `backend/src/api/kitchen-ticket/controllers/kitchen-ticket.ts`

```typescript
// Структуроване логування на сервері
const LOG_PREFIX = '[KitchenTicket]';

// Приклад виводу:
// [KitchenTicket] → START ticket requested { timestamp: '2026-01-10T10:23:45.123Z', ticketId: 'abc123', user: 'chef1' }
// [KitchenTicket] ✓ START completed { timestamp: '...', ticketId: 'abc123', duration: 150, consumedBatches: 3 }
```

**Логуються всі операції:**
| Операція | Логується |
|----------|-----------|
| start | ticketId, user, duration, consumedBatches, totalCost |
| complete | ticketId, duration, elapsedSeconds, orderReady |
| pause | ticketId, reason, duration |
| resume | ticketId, duration |
| cancel | ticketId, reason, inventoryReleased, duration |
| fail | ticketId, reason, inventoryReleased, duration |

#### Файл: `backend/src/api/kitchen-ticket/services/start-ticket.ts`

```typescript
const LOG_PREFIX = '[Inventory]';

// Детальне логування списання інгредієнтів:
// [Inventory] → Starting ticket deduction process { ticketId: 'abc123' }
// [Inventory]   Processing 5 ingredients (qty: 2) { ingredientCount: 5, orderQuantity: 2 }
// [Inventory]   ✓ Куряче філе: 0.400 kg { consumed: 0.4, batchesUsed: 1 }
// [Inventory]   ✓ Оливкова олія: 0.050 l { consumed: 0.05, batchesUsed: 1 }
// [Inventory] ✓ Ticket started with inventory deduction { duration: 234, totalCost: '45.50' }
```

**Логуються:**
- Завантаження тікету з рецептом
- Кожен інгредієнт окремо з кількістю
- FIFO/FEFO вибір партій (debug mode)
- Споживання з кожної партії (debug mode)
- Insufficient stock помилки з деталями
- Повернення інвентарю при скасуванні

### 9.3 Debug Mode

Для детального логування в development:

```bash
# Backend
NODE_ENV=development npm run develop
```

В debug mode логуються:
- Кожна партія що перевіряється
- Точна кількість взята з кожної партії
- Оновлення залишків партій

### 9.4 Консольні команди для аналізу

```javascript
// В браузері - фільтр логів:
// Відкрити DevTools → Console → Filter: "[Kitchen]" або "[Orders]"

// На бекенді - grep логів:
// tail -f logs/strapi.log | grep "\[Inventory\]"
// tail -f logs/strapi.log | grep "\[KitchenTicket\]"
```

