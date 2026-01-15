# Real-Time Updates System

Restaurant OS використовує **Pusher** для real-time оновлень в production. Це забезпечує надійну доставку повідомлень для кухонного дисплея, оновлення замовлень, алертів інвентаризації тощо.

## Огляд архітектури

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Frontend       │◄────►│    Pusher       │◄────►│    Backend      │
│  (Next.js)      │      │    (Cloud)      │      │    (Strapi)     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
     Subscribe                                         Trigger
     to channels                                       events
```

### Чому Pusher?

1. **Надійність** - 99.99% uptime, автоматичний reconnect
2. **Простота** - Не потрібно підтримувати власний WebSocket сервер
3. **Масштабованість** - Працює з будь-якою кількістю клієнтів
4. **Безкоштовний план** - 200,000 повідомлень/день, 100 з'єднань (достатньо для кількох ресторанів)

## Налаштування

### 1. Створення Pusher акаунту

1. Зайдіть на [pusher.com](https://pusher.com) і створіть безкоштовний акаунт
2. Створіть новий Channels app
3. Виберіть найближчий кластер (для України рекомендується `eu`)
4. Скопіюйте credentials: App ID, Key, Secret, Cluster

### 2. Backend (Railway)

Додайте змінні в Railway Dashboard → Variables:

```env
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=eu
```

### 3. Frontend (Vercel)

Додайте змінні в Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

> **Важливо:** Frontend використовує тільки `KEY` (публічний), `SECRET` зберігається тільки на backend.

### 4. Редеплой

Після додавання змінних:
- Railway автоматично передеплоїть backend
- В Vercel зробіть Redeploy для frontend

## Канали та події

### Канали (Channels)

| Канал | Опис | Приклад |
|-------|------|---------|
| `orders` | Всі події замовлень | Нове замовлення, статус змінено |
| `kitchen` | Кухонний дисплей | Тікети, статуси готовності |
| `inventory` | Інвентаризація | Низький запас, отримання партій |
| `tables` | Всі столи | Зміна статусу столів |
| `alerts` | Системні алерти | SLA warnings, критичні події |
| `table-{N}` | Конкретний стіл | `table-5` - стіл №5 |
| `station-{type}` | Станція кухні | `station-grill` - гриль |

### Події (Events)

#### Замовлення
| Подія | Опис |
|-------|------|
| `order.created` | Нове замовлення створено |
| `order.updated` | Статус замовлення змінено |
| `order.cancelled` | Замовлення скасовано |

#### Кухня
| Подія | Опис |
|-------|------|
| `ticket.created` | Новий тікет на кухню |
| `ticket.status_changed` | Статус тікета змінено |

#### Інвентаризація
| Подія | Опис |
|-------|------|
| `storage.low_stock` | Низький рівень запасу |
| `storage.batch_received` | Отримано нову партію |

## Використання в коді

### Frontend (React Hooks)

```tsx
import { useTableEvents, useKitchenEvents, useStorageEvents } from '@/hooks/use-websocket';

// Підписка на події столу
function TableView({ tableNumber }: { tableNumber: number }) {
  const { isConnected } = useTableEvents(tableNumber, {
    onOrderCreated: (event) => {
      console.log('Нове замовлення:', event.payload);
      refetchOrders();
    },
    onItemStatusChanged: (event) => {
      console.log('Статус змінено:', event.payload);
    },
  });

  return <div>Connected: {isConnected ? '✅' : '❌'}</div>;
}

// Кухонний дисплей
function KitchenDisplay() {
  const { isConnected } = useKitchenEvents({
    onTicketCreated: (event) => {
      playNotificationSound();
      addTicketToQueue(event.payload);
    },
    onTicketStatusChanged: (event) => {
      updateTicketStatus(event.payload);
    },
  });
}

// Алерти інвентаризації
function InventoryAlerts() {
  const { isConnected } = useStorageEvents(undefined, {
    onLowStock: (event) => {
      showAlert(`Низький запас: ${event.payload.ingredientName}`);
    },
  });
}
```

### Backend (Strapi Lifecycle Hooks)

Події автоматично відправляються з lifecycle hooks:

```typescript
// src/api/order/content-types/order/lifecycles.ts
import { emitOrderCreated, isPusherEnabled } from '../../../../utils/pusher';

export default {
  async afterCreate(event) {
    const { result } = event;

    if (isPusherEnabled()) {
      await emitOrderCreated({
        documentId: result.documentId,
        orderNumber: result.orderNumber,
        tableNumber: result.table?.number,
        status: result.status,
      });
    }
  },
};
```

### Ручна відправка подій

```typescript
import { trigger, PUSHER_EVENTS, CHANNELS } from '../utils/pusher';

// Відправити кастомну подію
await trigger(
  [CHANNELS.ALERTS, CHANNELS.KITCHEN],
  PUSHER_EVENTS.TIMER_SLA_WARNING,
  {
    type: 'ticket',
    resourceId: ticketId,
    message: 'Тікет перевищив SLA',
    severity: 'warning',
  }
);
```

## Fallback для розробки

В development режимі (без Pusher credentials) система автоматично використовує локальний WebSocket сервер:

```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

Хуки автоматично перемикаються між Pusher і WebSocket:

```typescript
// Перевірка чи Pusher налаштовано
if (isPusherEnabled()) {
  // Використовуємо Pusher
} else {
  // Fallback на WebSocket
}
```

## Моніторинг

### Pusher Dashboard

1. Зайдіть в [dashboard.pusher.com](https://dashboard.pusher.com)
2. Виберіть ваш app
3. Вкладка **Debug Console** - бачите всі events в реальному часі
4. Вкладка **Stats** - статистика використання

### Логи в Railway

```bash
# Пошук Pusher логів
railway logs | grep Pusher
```

## Ліміти Free плану

| Метрика | Ліміт |
|---------|-------|
| Повідомлення/день | 200,000 |
| Одночасні з'єднання | 100 |
| Канали | Безліміт |
| Розмір повідомлення | 10 KB |

### Оцінка використання

Для одного ресторану:
- ~100 замовлень/день × ~10 events = 1,000 повідомлень
- 5-10 пристроїв (планшети, кухня) = 5-10 з'єднань
- **Висновок:** Free план покриває 10+ ресторанів

## Оновлення на платний план

Якщо потрібно більше:

1. **Startup план** ($49/міс) - 1M повідомлень, 500 з'єднань
2. **Pro план** ($99/міс) - 5M повідомлень, 2000 з'єднань

## Troubleshooting

### Events не приходять

1. Перевірте credentials в Railway/Vercel
2. Перевірте Debug Console в Pusher Dashboard
3. Переконайтесь що backend передеплоєний після додавання змінних

### "Pusher is not configured" в логах

Це нормально якщо Pusher credentials не задані. Система працюватиме без real-time оновлень.

### Connection failed

1. Перевірте `NEXT_PUBLIC_PUSHER_CLUSTER` - має відповідати кластеру в dashboard
2. Перевірте firewall/CORS налаштування

## Файлова структура

```
backend/
├── src/utils/pusher.ts          # Pusher service utility
├── src/api/order/.../lifecycles.ts      # Order events
├── src/api/kitchen-ticket/.../lifecycles.ts  # Ticket events
└── src/api/ingredient/.../lifecycles.ts # Inventory events

frontend/
├── src/hooks/use-pusher.ts      # Pusher React hooks
├── src/hooks/use-websocket.ts   # WebSocket hooks (with Pusher fallback)
└── src/lib/websocket-events.ts  # Event type definitions
```

## Додаткові ресурси

- [Pusher Channels Docs](https://pusher.com/docs/channels)
- [Pusher JavaScript Client](https://github.com/pusher/pusher-js)
- [Pusher Server Libraries](https://pusher.com/docs/channels/server_api/overview)
