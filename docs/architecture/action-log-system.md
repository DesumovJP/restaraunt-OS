# Архітектура системи Журналу Дій (Action Log)

## 1. Огляд

Система Журналу Дій забезпечує повну аудиторську трасу всіх важливих операцій у ресторанній системі. Вона спроектована для:
- **Аудиту та комплаєнсу** - відстеження хто, коли і що змінив
- **Бізнес-аналітики** - аналіз ефективності операцій
- **Діагностики** - швидке виявлення проблем
- **Навчання** - розуміння патернів роботи персоналу

---

## 2. Принципи проектування

### 2.1 Що логувати (Best Practices)

**✅ ЛОГУВАТИ:**
- Фінансові операції (закриття столу, оплата, списання)
- Зміни статусів критичних сутностей (замовлення, бронювання, тікети)
- Скасування та відмови
- Зміни в інвентарі (прийом товару, списання, переміщення)
- Зміни конфігурації (меню, ціни, рецепти)
- Дії персоналу (вхід/вихід на зміну)
- Критичні помилки

**❌ НЕ ЛОГУВАТИ:**
- Проміжні стани (кожен крок приготування)
- Технічні операції (кожен API запит)
- Читання даних (перегляд меню, списків)
- Автоматичні оновлення (heartbeats, sync)
- Успішні рутинні операції без бізнес-значення

### 2.2 Агрегація замість спаму

Замість окремих логів для кожної дрібної операції, система агрегує:
- Усі позиції замовлення → один запис "Замовлення відправлено на кухню"
- Усі операції за столом → один запис "Закриття столу" з повною аналітикою
- Масові зміни → один запис з кількістю змінених об'єктів

---

## 3. Архітектура

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Admin Dashboard │    │   History Page  │    │  Sidebar    │  │
│  │  (Recent 50)     │    │  (Full, Filter) │    │  (Context)  │  │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘  │
│           │                      │                     │          │
│           └──────────────────────┼─────────────────────┘          │
│                                  │                                 │
│                    ┌─────────────▼─────────────┐                  │
│                    │   ActionLogView Component │                  │
│                    │   - LogItem               │                  │
│                    │   - SessionSummary        │                  │
│                    │   - OrdersDetail          │                  │
│                    └─────────────┬─────────────┘                  │
└──────────────────────────────────┼────────────────────────────────┘
                                   │ GraphQL
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND (Strapi)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    GraphQL API Layer                         │ │
│  │  GET_ACTION_HISTORY (with filters, pagination)              │ │
│  │  GET_RECENT_ACTIONS (limit 50, for dashboard)               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                   │                               │
│                                   ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            action-history Collection                         │ │
│  │  - action, entityType, entityId, entityName                 │ │
│  │  - description (EN), descriptionUk (UK)                     │ │
│  │  - dataBefore, dataAfter, changedFields                     │ │
│  │  - metadata (custom business data)                          │ │
│  │  - performedBy, module, severity                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                   ▲                               │
│                                   │                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              logAction() Utility                             │ │
│  │  - Sanitize sensitive data (password, token, secret)        │ │
│  │  - Calculate changed fields                                  │ │
│  │  - Generate Ukrainian descriptions                           │ │
│  │  - Limit JSON size (max 10KB)                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                   ▲                               │
│                                   │                               │
│  ┌────────────────┬───────────────┼───────────────┬────────────┐ │
│  │                │               │               │            │ │
│  ▼                ▼               ▼               ▼            │ │
│ Lifecycle      Controller      Service        Middleware       │ │
│  Hooks         Actions         Methods                         │ │
│  (CRUD)        (Custom)        (Business)                      │ │
│                                                                 │ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Модулі та сутності

### 4.1 Структура модулів

| Модуль | Колір | Іконка | Сутності |
|--------|-------|--------|----------|
| `pos` | Primary Blue | ShoppingCart | order, order_item, table |
| `kitchen` | Warning Orange | UtensilsCrossed | kitchen_ticket |
| `storage` | Info Cyan | Package | ingredient, stock_batch, inventory_movement |
| `admin` | Secondary Gray | Settings | menu_item, menu_category, recipe, user, worker_performance |
| `reservations` | Purple | Calendar | reservation, scheduled_order |
| `system` | Muted Gray | Cog | daily_task, worker_shift |

### 4.2 Типи дій

| Дія | Опис | Severity |
|-----|------|----------|
| `create` | Створення нового об'єкта | info |
| `update` | Оновлення даних | info |
| `delete` | Видалення об'єкта | warning |
| `start` | Початок процесу (зміна, приготування) | info |
| `complete` | Завершення процесу | info |
| `cancel` | Скасування | warning |
| `approve` | Підтвердження | info |
| `reject` | Відхилення | warning |
| `receive` | Прийом (товару на склад) | info |
| `write_off` | Списання | warning |
| `transfer` | Переміщення | info |
| `assign` | Призначення | info |
| `unassign` | Зняття призначення | info |

---

## 5. Матриця логування

### 5.1 POS Module (Торговий зал)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Table** | Створення | ✅ | Зміна конфігурації залу |
| | Зайняття | ❌ | Занадто часто, є в close |
| | Закриття | ✅ | **Ключова метрика** з повною аналітикою |
| | Видалення | ✅ | Зміна конфігурації |
| **Order** | Створення | ❌ | Буде в table close |
| | Статус → confirmed | ❌ | Проміжний стан |
| | Скасування | ✅ | **Критична подія** |
| **Order Item** | Додавання | ❌ | Занадто детально |
| | Скасування/Void | ✅ | Потенційні втрати |

### 5.2 Kitchen Module (Кухня)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Kitchen Ticket** | Створення | ❌ | Автоматично при order |
| | Старт готування | ❌ | Проміжний стан |
| | Завершення | ❌ | Є в table close |
| | Скасування | ✅ | Втрати інгредієнтів |
| | Помилка | ✅ | **Критична подія** |

### 5.3 Storage Module (Склад)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Ingredient** | Створення | ✅ | Новий товар в системі |
| | Оновлення stock | ❌ | Автоматичні зміни |
| | Оновлення даних | ✅ | Ціни, постачальники |
| | Видалення | ✅ | Вилучення зі складу |
| **Stock Batch** | Прийом | ✅ | **Ключова операція** |
| | Списання | ✅ | Втрати, контроль |
| | Закриття партії | ✅ | Закінчення терміну |
| **Inventory Movement** | Будь-яка | ✅ | Аудиторська вимога |

### 5.4 Admin Module (Адміністрування)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Menu Item** | Створення | ✅ | Новий продукт |
| | Зміна ціни | ✅ | **Фінансовий вплив** |
| | Активація/деактивація | ✅ | Доступність |
| | Видалення | ✅ | Архівування |
| **Menu Category** | CRUD | ✅ | Структура меню |
| **Recipe** | Створення/оновлення | ✅ | Собівартість, якість |
| **User** | Створення | ✅ | Новий працівник |
| | Зміна ролі | ✅ | Права доступу |
| | Деактивація | ✅ | Звільнення |

### 5.5 Reservations Module (Бронювання)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Reservation** | Створення | ✅ | Нове бронювання |
| | Підтвердження | ✅ | Зміна статусу |
| | Прибуття гостей | ✅ | Початок обслуговування |
| | Завершення | ✅ | Кінець візиту |
| | Скасування | ✅ | Втрачена можливість |
| | No-show | ✅ | **Проблема** |
| **Scheduled Order** | CRUD | ✅ | Заплановане замовлення |

### 5.6 System Module (Система)

| Сутність | Подія | Логувати? | Причина |
|----------|-------|-----------|---------|
| **Worker Shift** | Clock In | ✅ | Початок роботи |
| | Clock Out | ✅ | Кінець роботи |
| | Bulk Create | ✅ | Планування |
| **Daily Task** | Створення | ✅ | Нове завдання |
| | Виконання | ✅ | Прогрес |
| | Пропуск | ✅ | Проблема |

---

## 6. Структура даних

### 6.1 Основні поля

```typescript
interface ActionHistory {
  // Ідентифікація
  documentId: string;

  // Дія
  action: ActionType;           // create, update, delete, ...
  entityType: EntityType;       // order, table, ingredient, ...
  entityId: string;             // documentId сутності
  entityName?: string;          // Людиночитана назва

  // Опис
  description: string;          // English description
  descriptionUk: string;        // Український опис

  // Зміни
  dataBefore?: JSON;            // Стан до (sanitized, max 10KB)
  dataAfter?: JSON;             // Стан після (sanitized, max 10KB)
  changedFields?: string[];     // ['status', 'price', ...]

  // Метадані
  metadata?: JSON;              // Бізнес-дані для аналітики

  // Виконавець
  performedBy?: User;           // Relation до користувача
  performedByName: string;      // "Олена Коваленко"
  performedByRole?: string;     // "waiter", "chef", ...

  // Класифікація
  module: Module;               // pos, kitchen, storage, ...
  severity: Severity;           // info, warning, critical

  // Технічні
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### 6.2 Приклади metadata

**Table Close (найбільш детальна):**
```json
{
  "session": {
    "startedAt": "2024-01-15T18:30:00Z",
    "endedAt": "2024-01-15T20:45:00Z",
    "durationMinutes": 135,
    "durationFormatted": "2г 15хв",
    "guestCount": 4
  },
  "revenue": {
    "total": 2450.00,
    "ordersCount": 3,
    "itemsCount": 12,
    "averageOrderValue": 816.67,
    "revenuePerMinute": 18.15,
    "tipAmount": 250.00
  },
  "payment": {
    "method": "card",
    "processedAt": "2024-01-15T20:44:30Z"
  },
  "orders": [
    {
      "orderNumber": "ORD-2024-0142",
      "createdAt": "2024-01-15T18:35:00Z",
      "totalAmount": 890.00,
      "items": [
        {
          "name": "Стейк Рібай",
          "quantity": 2,
          "price": 680.00,
          "cookingTimeSeconds": 720,
          "waitTimeSeconds": 45
        }
      ]
    }
  ],
  "closedBy": "Марія Шевченко"
}
```

**Reservation Create:**
```json
{
  "tableNumber": 5,
  "date": "2024-01-20",
  "time": "19:00",
  "guestCount": 6,
  "contactPhone": "+380501234567",
  "confirmationCode": "RES-A7B3",
  "occasion": "birthday"
}
```

**Stock Batch Receive:**
```json
{
  "batchNumber": "BTH-2024-0089",
  "ingredientName": "Яловичина вирізка",
  "quantity": 15.5,
  "unit": "kg",
  "unitCost": 450.00,
  "totalCost": 6975.00,
  "supplier": "М'ясна Гільдія",
  "expiryDate": "2024-01-25"
}
```

---

## 7. Найкращі практики

### 7.1 Для розробників

```typescript
// ✅ Правильно: Агреговане логування
await logAction(strapi, {
  action: 'complete',
  entityType: 'table',
  entityId: table.documentId,
  descriptionUk: `Закрито стіл №${table.number}`,
  metadata: {
    session: { /* повна інформація */ },
    revenue: { /* всі замовлення */ },
    orders: [ /* деталі */ ]
  },
  module: 'pos'
});

// ❌ Неправильно: Окремі логи для кожної дрібниці
// log("Гість сів")
// log("Замовлено воду")
// log("Офіціант підійшов")
// log("Гість попросив меню")
```

### 7.2 Коли додавати нове логування

1. **Фінансовий вплив?** → Логувати
2. **Зміна доступу/прав?** → Логувати
3. **Скасування/помилка?** → Логувати
4. **Аудиторська вимога?** → Логувати
5. **Проміжний стан процесу?** → НЕ логувати
6. **Автоматична операція?** → НЕ логувати (якщо не критична)
7. **Читання даних?** → НЕ логувати

### 7.3 Формат descriptionUk

```
[Дія]: [Об'єкт] [Деталі]

Приклади:
- "Нове бронювання: Іван Петренко (Стіл 5) на 20.01 19:00"
- "Скасовано замовлення: #ORD-2024-0142 (Стіл 7)"
- "Прийом товару: Яловичина вирізка (15.5 кг) від М'ясна Гільдія"
- "Списання: Молоко (2л) - прострочено"
- "Зміна ціни: Стейк Рібай 650₴ → 720₴"
```

---

## 8. Поточний стан реалізації

### 8.1 Повністю реалізовано ✅

| Сутність | Lifecycle | Controller |
|----------|-----------|------------|
| table | ✅ create, update, delete | ✅ close |
| reservation | ✅ create, update, delete | - |
| scheduled_order | ✅ create, update, delete | - |
| ingredient | ✅ create, update, delete | - |
| stock_batch | ✅ create, update, delete | - |
| inventory_movement | ✅ create, update, delete | - |
| daily_task | ✅ create, update, delete | - |
| worker_shift | ✅ create, update, delete | ✅ clockIn, clockOut |
| order | ✅ cancel only | - |
| order_item | ✅ cancel only | - |
| kitchen_ticket | - | ✅ cancel, fail |

### 8.2 Потребує реалізації 🔴

| Сутність | Що потрібно |
|----------|-------------|
| menu_item | create, update (price!), delete |
| menu_category | create, update, delete |
| recipe | create, update, delete |
| user | create, role change, deactivate |
| supplier | create, update, delete |
| worker_performance | create (для KPI звітів) |

---

## 9. API для фронтенду

### 9.1 GraphQL Queries

```graphql
# Повна історія з фільтрами
query GetActionHistory(
  $fromDate: DateTime
  $toDate: DateTime
  $entityType: String
  $action: String
  $module: String
  $limit: Int
  $offset: Int
) {
  actionHistories(
    filters: { ... }
    sort: "createdAt:desc"
    pagination: { limit: $limit, start: $offset }
  ) {
    documentId
    action
    entityType
    entityId
    entityName
    description
    descriptionUk
    metadata
    performedByName
    performedByRole
    module
    severity
    createdAt
  }
}

# Останні дії для дашборду
query GetRecentActions($limit: Int = 50) {
  actionHistories(
    sort: "createdAt:desc"
    pagination: { limit: $limit }
  ) {
    # ... same fields
  }
}
```

### 9.2 Фільтри на UI

- **Період**: Сьогодні / Вчора / Тиждень / Місяць / Custom
- **Модуль**: POS / Кухня / Склад / Адмін / Бронювання / Система
- **Тип дії**: Створення / Оновлення / Скасування / ...
- **Severity**: Всі / Тільки важливі (warning+critical)
- **Пошук**: По імені користувача, назві об'єкта

---

## 10. Метрики та аналітика

Система дозволяє будувати:

- **Операційні метрики**: середній час за столом, revenue per minute
- **Персональні KPI**: скільки столів закрив офіціант, скільки скасувань
- **Проблемні патерни**: часті скасування, no-show бронювань
- **Інвентарні звіти**: списання по причинам, прийоми по постачальниках
- **Аудит**: хто змінював ціни, коли додавали товари

---

*Документ створено: 2024-01-16*
*Версія: 1.0*
